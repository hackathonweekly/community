import { auth } from "@community/lib-server/auth";
import { db } from "@community/lib-server/database";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import { NotificationType } from "@prisma/client";

const volunteerApplicationSchema = z.object({
	eventVolunteerRoleId: z.string(),
	note: z.string().min(1, "请填写申请说明"),
});

const app = new Hono()
	.post(
		"/apply",
		zValidator("json", volunteerApplicationSchema),
		async (c) => {
			const session = await auth.api.getSession({
				headers: c.req.raw.headers,
			});

			if (!session?.user?.id) {
				return c.json({ error: "Unauthorized" }, 401);
			}

			const user = session.user;

			const { eventVolunteerRoleId, note } = await c.req.json();
			const eventId = c.req.param("eventId");

			if (!eventId) {
				return c.json({ error: "Event ID is required" }, 400);
			}

			try {
				// 检查活动是否存在并获取活动信息
				const event = await db.event.findUnique({
					where: { id: eventId },
					select: {
						id: true,
						title: true,
						status: true,
						endTime: true,
						organizerId: true,
					},
				});

				if (!event) {
					return c.json({ error: "活动不存在" }, 404);
				}

				// 检查活动状态
				if (event.status !== "PUBLISHED") {
					return c.json(
						{ error: "活动尚未发布，无法申请志愿者" },
						400,
					);
				}

				// 检查活动是否已结束
				if (new Date(event.endTime) < new Date()) {
					return c.json({ error: "活动已结束，无法申请志愿者" }, 400);
				}

				// 检查志愿者角色是否存在
				const eventVolunteerRole =
					await db.eventVolunteerRole.findUnique({
						where: { id: eventVolunteerRoleId },
						include: {
							volunteerRole: true,
							registrations: {
								where: { status: "APPROVED" },
							},
						},
					});

				if (!eventVolunteerRole) {
					return c.json({ error: "志愿者角色不存在" }, 404);
				}

				// 检查是否已达到招募上限
				if (
					eventVolunteerRole.registrations.length >=
					eventVolunteerRole.recruitCount
				) {
					return c.json({ error: "该志愿者角色已满员" }, 400);
				}

				// 检查用户是否已经申请过这个角色
				const existingApplication =
					await db.eventVolunteerRegistration.findFirst({
						where: {
							eventId: eventId,
							userId: user.id,
							eventVolunteerRoleId: eventVolunteerRoleId,
						},
					});

				if (existingApplication) {
					if (existingApplication.status === "APPLIED") {
						return c.json(
							{ error: "您已经申请过这个志愿者角色，请等待审核" },
							400,
						);
					}
					if (existingApplication.status === "APPROVED") {
						return c.json(
							{ error: "您已经是这个志愿者角色了" },
							400,
						);
					}
					if (existingApplication.status === "REJECTED") {
						// 确定新状态：根据是否需要审批来决定
						const newStatus = eventVolunteerRole.requireApproval
							? "APPLIED"
							: "APPROVED";

						// 更新现有申请而不是创建新的
						await db.eventVolunteerRegistration.update({
							where: { id: existingApplication.id },
							data: {
								status: newStatus,
								appliedAt: new Date(),
								note: note,
								approvedAt:
									newStatus === "APPROVED"
										? new Date()
										: null,
								approvedBy:
									newStatus === "APPROVED"
										? event.organizerId
										: null,
								rejectedAt: null,
								rejectedBy: null,
							},
						});

						const successMessage =
							eventVolunteerRole.requireApproval
								? "志愿者申请已重新提交，等待审核"
								: "恭喜！您已成功成为志愿者，请查看活动联系方式";

						return c.json({
							success: true,
							message: successMessage,
						});
					}
				}

				// 确定申请状态：根据是否需要审批来决定
				const initialStatus = eventVolunteerRole.requireApproval
					? "APPLIED"
					: "APPROVED";

				// 创建志愿者申请
				const registration = await db.eventVolunteerRegistration.create(
					{
						data: {
							eventId: eventId,
							userId: user.id,
							eventVolunteerRoleId: eventVolunteerRoleId,
							status: initialStatus,
							note: note,
							approvedAt:
								initialStatus === "APPROVED"
									? new Date()
									: undefined,
							approvedBy:
								initialStatus === "APPROVED"
									? event.organizerId
									: undefined,
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
					},
				);

				// 如果需要审批，发送通知给活动组织者
				if (eventVolunteerRole.requireApproval) {
					await db.notification.create({
						data: {
							userId: event.organizerId,
							type: NotificationType.EVENT_NEW_REGISTRATION, // 复用现有通知类型
							title: "新的志愿者申请",
							content: `${user.name} 申请成为活动「${event.title}」的${eventVolunteerRole.volunteerRole.name}`,
							metadata: {
								eventId: eventId,
								volunteerRegistrationId: registration.id,
								volunteerRoleName:
									eventVolunteerRole.volunteerRole.name,
							},
							actionUrl: `/events/${eventId}/manage`,
							relatedUserId: user.id,
						},
					});
				}

				const successMessage = eventVolunteerRole.requireApproval
					? "志愿者申请已提交，请等待活动组织者审核"
					: "恭喜！您已成功成为志愿者，请查看活动联系方式";

				return c.json({
					success: true,
					message: successMessage,
					data: {
						registrationId: registration.id,
						requireApproval: eventVolunteerRole.requireApproval,
					},
				});
			} catch (error) {
				console.error("志愿者申请失败:", error);
				return c.json({ error: "申请失败，请稍后重试" }, 500);
			}
		},
	)
	.delete("/cancel", async (c) => {
		const session = await auth.api.getSession({
			headers: c.req.raw.headers,
		});

		if (!session?.user?.id) {
			return c.json({ error: "Unauthorized" }, 401);
		}

		const user = session.user;

		const eventId = c.req.param("eventId");
		const { eventVolunteerRoleId } = await c.req.json();

		if (!eventId) {
			return c.json({ error: "Event ID is required" }, 400);
		}

		try {
			// 查找用户的志愿者申请
			const registration = await db.eventVolunteerRegistration.findFirst({
				where: {
					eventId: eventId,
					userId: user.id,
					eventVolunteerRoleId: eventVolunteerRoleId,
				},
			});

			if (!registration) {
				return c.json({ error: "未找到志愿者申请记录" }, 404);
			}

			if (registration.status === "CANCELLED") {
				return c.json({ error: "申请已经取消" }, 400);
			}

			// 更新申请状态为取消
			await db.eventVolunteerRegistration.update({
				where: { id: registration.id },
				data: {
					status: "CANCELLED",
				},
			});

			return c.json({
				success: true,
				message: "志愿者申请已取消",
			});
		} catch (error) {
			console.error("取消志愿者申请失败:", error);
			return c.json({ error: "取消申请失败，请稍后重试" }, 500);
		}
	});

export default app;
