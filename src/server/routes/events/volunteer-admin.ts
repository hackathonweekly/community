import { auth } from "@/lib/auth";
import { db } from "@/lib/database";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import { ContributionType, NotificationType } from "@prisma/client";

const approveVolunteerSchema = z.object({
	volunteerRegistrationId: z.string(),
	approved: z.boolean(),
	note: z.string().optional(),
});

const completeVolunteerWorkSchema = z.object({
	volunteerRegistrationId: z.string(),
	completed: z.boolean(),
});

const app = new Hono()
	.post("/approve", zValidator("json", approveVolunteerSchema), async (c) => {
		const session = await auth.api.getSession({
			headers: c.req.raw.headers,
		});

		if (!session?.user?.id) {
			return c.json({ error: "Unauthorized" }, 401);
		}

		const user = session.user;

		const { volunteerRegistrationId, approved, note } = await c.req.json();
		const eventId = c.req.param("eventId");

		try {
			// 验证活动权限 - 只有活动组织者或组织管理员可以审核
			const event = await db.event.findUnique({
				where: { id: eventId },
				select: {
					id: true,
					title: true,
					organizerId: true,
					organizationId: true,
				},
			});

			if (!event) {
				return c.json({ error: "活动不存在" }, 404);
			}

			// 检查权限：组织者或组织管理员
			let hasPermission = event.organizerId === user.id;

			if (!hasPermission && event.organizationId) {
				const membership = await db.member.findUnique({
					where: {
						organizationId_userId: {
							organizationId: event.organizationId,
							userId: user.id,
						},
					},
				});
				hasPermission = Boolean(
					membership &&
						(membership.role === "owner" ||
							membership.role === "admin"),
				);
			}

			if (!hasPermission) {
				return c.json({ error: "无权限审核志愿者申请" }, 403);
			}

			// 获取志愿者申请详情
			const registration = await db.eventVolunteerRegistration.findUnique(
				{
					where: { id: volunteerRegistrationId },
					include: {
						user: {
							select: {
								id: true,
								name: true,
								email: true,
							},
						},
						eventVolunteerRole: {
							include: {
								volunteerRole: true,
							},
						},
					},
				},
			);

			if (!registration) {
				return c.json({ error: "志愿者申请不存在" }, 404);
			}

			if (registration.eventId !== eventId) {
				return c.json({ error: "申请与活动不匹配" }, 400);
			}

			// 更新申请状态
			const updatedRegistration =
				await db.eventVolunteerRegistration.update({
					where: { id: volunteerRegistrationId },
					data: {
						status: approved ? "APPROVED" : "REJECTED",
						approvedAt: approved ? new Date() : null,
						approvedBy: approved ? user.id : null,
						rejectedAt: approved ? null : new Date(),
						rejectedBy: approved ? null : user.id,
					},
					include: {
						user: {
							select: {
								id: true,
								name: true,
								email: true,
							},
						},
						eventVolunteerRole: {
							include: {
								volunteerRole: true,
							},
						},
					},
				});

			// 发送通知给申请者
			await db.notification.create({
				data: {
					userId: registration.user.id,
					type: NotificationType.EVENT_REGISTRATION_RESULT,
					title: approved ? "志愿者申请通过" : "志愿者申请被拒绝",
					content: approved
						? `您申请成为活动「${event.title}」的${registration.eventVolunteerRole.volunteerRole.name}已通过审核`
						: `您申请成为活动「${event.title}」的${registration.eventVolunteerRole.volunteerRole.name}被拒绝${note ? `，原因：${note}` : ""}`,
					metadata: {
						eventId: eventId,
						volunteerRegistrationId: volunteerRegistrationId,
						volunteerRoleName:
							registration.eventVolunteerRole.volunteerRole.name,
						approved: approved,
						note: note,
					},
					actionUrl: `/zh/events/${eventId}`,
					relatedUserId: user.id,
				},
			});

			return c.json({
				success: true,
				message: approved ? "志愿者申请已通过" : "志愿者申请已拒绝",
				data: updatedRegistration,
			});
		} catch (error) {
			console.error("审核志愿者申请失败:", error);
			return c.json({ error: "审核失败，请稍后重试" }, 500);
		}
	})
	.post(
		"/complete",
		zValidator("json", completeVolunteerWorkSchema),
		async (c) => {
			const session = await auth.api.getSession({
				headers: c.req.raw.headers,
			});

			if (!session?.user?.id) {
				return c.json({ error: "Unauthorized" }, 401);
			}

			const user = session.user;

			const { volunteerRegistrationId, completed } = await c.req.json();
			const eventId = c.req.param("eventId");

			try {
				// 验证活动权限
				const event = await db.event.findUnique({
					where: { id: eventId },
					select: {
						id: true,
						title: true,
						organizerId: true,
						organizationId: true,
						endTime: true,
					},
				});

				if (!event) {
					return c.json({ error: "活动不存在" }, 404);
				}

				// 检查权限：组织者或组织管理员
				let hasPermission = event.organizerId === user.id;

				if (!hasPermission && event.organizationId) {
					const membership = await db.member.findUnique({
						where: {
							organizationId_userId: {
								organizationId: event.organizationId,
								userId: user.id,
							},
						},
					});
					hasPermission = Boolean(
						membership &&
							(membership.role === "owner" ||
								membership.role === "admin"),
					);
				}

				if (!hasPermission) {
					return c.json({ error: "无权限管理志愿者完成状态" }, 403);
				}

				// 获取志愿者申请详情
				const registration =
					await db.eventVolunteerRegistration.findUnique({
						where: { id: volunteerRegistrationId },
						include: {
							user: {
								select: {
									id: true,
									name: true,
									email: true,
									cpValue: true,
								},
							},
							eventVolunteerRole: {
								include: {
									volunteerRole: true,
								},
							},
						},
					});

				if (!registration) {
					return c.json({ error: "志愿者申请不存在" }, 404);
				}

				if (registration.status !== "APPROVED") {
					return c.json(
						{ error: "只有已通过的志愿者才能标记完成状态" },
						400,
					);
				}

				// 使用事务处理完成状态和积分发放
				const result = await db.$transaction(async (tx) => {
					// 更新完成状态
					const updatedRegistration =
						await tx.eventVolunteerRegistration.update({
							where: { id: volunteerRegistrationId },
							data: {
								completed: completed,
								completedAt: completed ? new Date() : null,
								cpAwarded:
									completed && !registration.cpAwarded
										? true
										: registration.cpAwarded,
							},
							include: {
								user: {
									select: {
										id: true,
										name: true,
										email: true,
										cpValue: true,
									},
								},
								eventVolunteerRole: {
									include: {
										volunteerRole: true,
									},
								},
							},
						});

					// 如果标记为完成且之前未发放积分，则发放积分
					if (
						completed &&
						!registration.cpAwarded &&
						registration.eventVolunteerRole.volunteerRole.cpPoints >
							0
					) {
						// 更新用户积分
						await tx.user.update({
							where: { id: registration.user.id },
							data: {
								cpValue: {
									increment:
										registration.eventVolunteerRole
											.volunteerRole.cpPoints,
								},
							},
						});

						// 记录贡献
						await tx.contribution.create({
							data: {
								userId: registration.user.id,
								type: ContributionType.VOLUNTEER_SERVICE,
								category: "志愿者服务",
								description: `担任活动「${event.title}」的${registration.eventVolunteerRole.volunteerRole.name}`,
								cpValue:
									registration.eventVolunteerRole
										.volunteerRole.cpPoints,
								sourceId: eventId,
								sourceType: "EVENT_VOLUNTEER",
								isAutomatic: true,
								status: "APPROVED",
								organizationId: event.organizationId,
							},
						});

						// 发送通知
						await tx.notification.create({
							data: {
								userId: registration.user.id,
								type: NotificationType.ACHIEVEMENT_UNLOCKED,
								title: "志愿者积分奖励",
								content: `恭喜！您完成了活动「${event.title}」的${registration.eventVolunteerRole.volunteerRole.name}工作，获得了 ${registration.eventVolunteerRole.volunteerRole.cpPoints} 积分奖励`,
								metadata: {
									eventId: eventId,
									volunteerRegistrationId:
										volunteerRegistrationId,
									volunteerRoleName:
										registration.eventVolunteerRole
											.volunteerRole.name,
									cpPoints:
										registration.eventVolunteerRole
											.volunteerRole.cpPoints,
								},
								actionUrl: `/zh/events/${eventId}`,
								relatedUserId: user.id,
							},
						});
					}

					return updatedRegistration;
				});

				return c.json({
					success: true,
					message: completed
						? `志愿者工作已标记为完成${registration.eventVolunteerRole.volunteerRole.cpPoints > 0 && !registration.cpAwarded ? `，已发放 ${registration.eventVolunteerRole.volunteerRole.cpPoints} 积分奖励` : ""}`
						: "志愿者工作已取消完成标记",
					data: result,
				});
			} catch (error) {
				console.error("标记志愿者完成状态失败:", error);
				return c.json({ error: "操作失败，请稍后重试" }, 500);
			}
		},
	);

export default app;
