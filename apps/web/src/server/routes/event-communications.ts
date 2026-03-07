import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { authMiddleware } from "@/server/middleware/auth";
import type { Session } from "@community/lib-server/auth";
import {
	createEventCommunication,
	getEventCommunications,
	getCommunicationRecords,
	canSendCommunication,
	getEventCommunicationRecipients,
	retryFailedCommunicationRecords,
	batchUpdateCommunicationRecords,
	updateCommunicationStats,
} from "@community/lib-server/database/prisma/queries/event-communications";
import { getEventById } from "@community/lib-server/database/prisma/queries/events";
import { BatchCommunicationService } from "@community/lib-server/services/communication-service";
import {
	parseCommunicationContent,
	serializeCommunicationContent,
} from "@community/lib-server/services/event-communication-content";
import {
	COMMUNICATION_RECIPIENT_SCOPE,
	type CommunicationRecipientScope,
} from "@community/lib-server/services/event-communication-recipients";
import { db } from "@community/lib-server/database";
import { getBaseUrl } from "@community/lib-shared/utils";

// 通信配置常量
const COMMUNICATION_LIMITS = {
	MAX_PER_EVENT: 8,
} as const;

const COMMUNICATION_RECIPIENT_SCOPE_VALUES = [
	COMMUNICATION_RECIPIENT_SCOPE.ALL,
	COMMUNICATION_RECIPIENT_SCOPE.APPROVED_ONLY,
	COMMUNICATION_RECIPIENT_SCOPE.UNCHECKED_IN_ONLY,
	COMMUNICATION_RECIPIENT_SCOPE.SELECTED,
] as const satisfies readonly CommunicationRecipientScope[];

const app = new Hono<{
	Variables: {
		session: Session["session"];
		user: Session["user"];
	};
}>()
	.basePath("/event-communications")
	// 获取活动通信限制信息
	.get("/:eventId/limit", authMiddleware, async (c) => {
		const eventId = c.req.param("eventId");
		const user = c.get("user");

		try {
			// 检查用户是否有权限查看该活动的通信信息
			const event = await getEventById(eventId);
			if (!event) {
				return c.json({ error: "活动不存在" }, 404);
			}
			const canonicalEventId = event.id;

			// 只有活动组织者或管理员可以查看
			if (event.organizerId !== user.id) {
				const isAdmin = await db.eventAdmin.findFirst({
					where: {
						eventId: canonicalEventId,
						userId: user.id,
						status: "ACCEPTED",
						OR: [
							{ canEditEvent: true },
							{ canManageRegistrations: true },
						],
					},
				});

				if (!isAdmin) {
					return c.json({ error: "无权限查看此活动的通信信息" }, 403);
				}
			}

			const limitInfo = await canSendCommunication(canonicalEventId);
			return c.json({ data: limitInfo });
		} catch (error) {
			console.error("获取通信限制信息失败:", error);
			return c.json({ error: "获取通信限制信息失败" }, 500);
		}
	})
	.get("/:eventId/recipients", authMiddleware, async (c) => {
		const eventId = c.req.param("eventId");
		const user = c.get("user");

		try {
			const event = await getEventById(eventId);
			if (!event) {
				return c.json({ error: "活动不存在" }, 404);
			}
			const canonicalEventId = event.id;

			if (event.organizerId !== user.id) {
				const isAdmin = await db.eventAdmin.findFirst({
					where: {
						eventId: canonicalEventId,
						userId: user.id,
						status: "ACCEPTED",
						OR: [
							{ canEditEvent: true },
							{ canManageRegistrations: true },
						],
					},
				});

				if (!isAdmin) {
					return c.json(
						{ error: "无权限查看此活动的参与者信息" },
						403,
					);
				}
			}

			const recipients =
				await getEventCommunicationRecipients(canonicalEventId);
			return c.json({
				data: {
					recipients,
				},
			});
		} catch (error) {
			console.error("获取活动参与者列表失败:", error);
			return c.json({ error: "获取活动参与者列表失败" }, 500);
		}
	})
	// 获取活动通信历史
	.get(
		"/:eventId",
		authMiddleware,
		zValidator(
			"query",
			z.object({
				page: z
					.string()
					.optional()
					.transform((val) => (val ? Number.parseInt(val) : 1)),
				limit: z
					.string()
					.optional()
					.transform((val) => (val ? Number.parseInt(val) : 20)),
			}),
		),
		async (c) => {
			const eventId = c.req.param("eventId");
			const user = c.get("user");
			const { page, limit } = c.req.valid("query");

			try {
				// 检查用户权限
				const event = await getEventById(eventId);
				if (!event) {
					return c.json({ error: "活动不存在" }, 404);
				}
				const canonicalEventId = event.id;

				if (event.organizerId !== user.id) {
					const isAdmin = await db.eventAdmin.findFirst({
						where: {
							eventId: canonicalEventId,
							userId: user.id,
							status: "ACCEPTED",
							OR: [
								{ canEditEvent: true },
								{ canManageRegistrations: true },
							],
						},
					});

					if (!isAdmin) {
						return c.json(
							{ error: "无权限查看此活动的通信记录" },
							403,
						);
					}
				}

				const result = await getEventCommunications(canonicalEventId, {
					page,
					limit,
				});
				return c.json({
					data: {
						...result,
						communications: result.communications.map(
							(communication) => {
								const parsedContent = parseCommunicationContent(
									communication.content,
								);

								return {
									...communication,
									content: parsedContent.content,
									imageUrl: parsedContent.imageUrl,
								};
							},
						),
					},
				});
			} catch (error) {
				console.error("获取通信历史失败:", error);
				return c.json({ error: "获取通信历史失败" }, 500);
			}
		},
	)
	// 发送新的通信
	.post(
		"/:eventId/send",
		authMiddleware,
		zValidator(
			"json",
			z.object({
				type: z.enum(["EMAIL", "SMS"]),
				subject: z
					.string()
					.min(1, "主题不能为空")
					.max(200, "主题最长200字符"),
				content: z
					.string()
					.min(1, "内容不能为空")
					.max(2000, "内容最长2000字符"),
				imageUrl: z
					.string()
					.url("图片地址格式不正确")
					.max(1000, "图片地址过长")
					.optional(),
				recipientScope: z
					.enum(COMMUNICATION_RECIPIENT_SCOPE_VALUES)
					.default(COMMUNICATION_RECIPIENT_SCOPE.ALL),
				selectedRecipientIds: z
					.array(z.string().min(1))
					.max(1000, "选择人数过多")
					.optional(),
				scheduledAt: z
					.string()
					.optional()
					.transform((val) => (val ? new Date(val) : undefined)),
			}),
		),
		async (c) => {
			const eventId = c.req.param("eventId");
			const user = c.get("user");
			const {
				type,
				subject,
				content,
				imageUrl,
				recipientScope,
				selectedRecipientIds,
				scheduledAt,
			} = c.req.valid("json");

			try {
				// 检查用户权限
				const event = await getEventById(eventId);
				if (!event) {
					return c.json({ error: "活动不存在" }, 404);
				}
				const canonicalEventId = event.id;

				if (event.organizerId !== user.id) {
					const isAdmin = await db.eventAdmin.findFirst({
						where: {
							eventId: canonicalEventId,
							userId: user.id,
							status: "ACCEPTED",
							OR: [
								{ canEditEvent: true },
								{ canManageRegistrations: true },
							],
						},
					});

					if (!isAdmin) {
						return c.json({ error: "无权限发送此活动的通信" }, 403);
					}
				}

				// 检查是否可以发送
				const { canSend, remainingCount } =
					await canSendCommunication(canonicalEventId);
				if (!canSend) {
					return c.json(
						{
							error: `已达到该活动的最大通信次数限制（${COMMUNICATION_LIMITS.MAX_PER_EVENT}次），剩余次数：${remainingCount}`,
						},
						400,
					);
				}

				// 创建通信记录
				const serializedContent = serializeCommunicationContent({
					content,
					imageUrl,
				});

				if (
					recipientScope === COMMUNICATION_RECIPIENT_SCOPE.SELECTED &&
					(!selectedRecipientIds || selectedRecipientIds.length === 0)
				) {
					return c.json({ error: "请选择至少 1 位参与者" }, 400);
				}

				const communication = await createEventCommunication({
					eventId: canonicalEventId,
					sentBy: user.id,
					type,
					subject,
					content: serializedContent,
					recipientScope,
					selectedRecipientIds,
					scheduledAt,
				});

				// 如果是立即发送，启动发送流程
				if (!scheduledAt) {
					// 异步处理发送，不阻塞响应
					processCommunicationSending(communication.id).catch(
						(error) => {
							console.error("处理通信发送失败:", error);
						},
					);
				}

				const stats = {
					totalRegistrations: communication.totalRegistrations,
					scopeEligibleCount: communication.scopeEligibleCount,
					scopeExcludedCount: communication.scopeExcludedCount,
					unmatchedSelectedCount:
						communication.unmatchedSelectedCount,
					validRecipients: communication.validRecipientsCount,
					skippedRecipients: communication.unverifiedUsersCount,
					virtualEmailCount: communication.virtualEmailCount ?? 0,
					missingEmailCount: communication.missingEmailCount ?? 0,
				};

				let warning: string | null = null;
				if ((communication.unmatchedSelectedCount ?? 0) > 0) {
					warning = `注意：有 ${communication.unmatchedSelectedCount} 位已选择参与者不在本活动可发送名单中，已自动跳过`;
				}
				if (communication.unverifiedUsersCount > 0) {
					if (type === "EMAIL") {
						const emailWarning = `注意：有 ${communication.unverifiedUsersCount} 个用户缺少有效邮箱或使用虚拟邮箱（@wechat.app），已自动跳过`;
						warning = warning
							? `${warning}；${emailWarning}`
							: emailWarning;
					} else {
						const smsWarning = `注意：有 ${communication.unverifiedUsersCount} 个用户因为手机号未验证或缺失而无法收到消息`;
						warning = warning
							? `${warning}；${smsWarning}`
							: smsWarning;
					}
				}

				return c.json({
					data: {
						...communication,
						content,
						imageUrl,
						recipientScope,
						selectedRecipientIds,
					},
					message: scheduledAt ? "通信已计划发送" : "通信发送已启动",
					stats,
					warning,
				});
			} catch (error) {
				console.error("发送通信失败:", error);
				if (error instanceof Error) {
					return c.json({ error: error.message }, 400);
				}
				return c.json({ error: "发送通信失败" }, 500);
			}
		},
	)
	// 获取通信详细发送记录
	.get(
		"/:eventId/:communicationId/records",
		authMiddleware,
		zValidator(
			"query",
			z.object({
				page: z
					.string()
					.optional()
					.transform((val) => (val ? Number.parseInt(val) : 1)),
				limit: z
					.string()
					.optional()
					.transform((val) => (val ? Number.parseInt(val) : 50)),
			}),
		),
		async (c) => {
			const eventId = c.req.param("eventId");
			const communicationId = c.req.param("communicationId");
			const user = c.get("user");
			const { page, limit } = c.req.valid("query");

			try {
				// 检查用户权限
				const event = await getEventById(eventId);
				if (!event) {
					return c.json({ error: "活动不存在" }, 404);
				}
				const canonicalEventId = event.id;

				if (event.organizerId !== user.id) {
					const isAdmin = await db.eventAdmin.findFirst({
						where: {
							eventId: canonicalEventId,
							userId: user.id,
							status: "ACCEPTED",
							OR: [
								{ canEditEvent: true },
								{ canManageRegistrations: true },
							],
						},
					});

					if (!isAdmin) {
						return c.json(
							{ error: "无权限查看此活动的通信记录" },
							403,
						);
					}
				}

				const result = await getCommunicationRecords(communicationId, {
					page,
					limit,
				});
				return c.json({ data: result });
			} catch (error) {
				console.error("获取通信记录失败:", error);
				return c.json({ error: "获取通信记录失败" }, 500);
			}
		},
	)
	// 重试失败的通信记录
	.post("/:eventId/:communicationId/retry", authMiddleware, async (c) => {
		const eventId = c.req.param("eventId");
		const communicationId = c.req.param("communicationId");
		const user = c.get("user");

		try {
			// 检查用户权限
			const event = await getEventById(eventId);
			if (!event) {
				return c.json({ error: "活动不存在" }, 404);
			}
			const canonicalEventId = event.id;

			if (event.organizerId !== user.id) {
				const isAdmin = await db.eventAdmin.findFirst({
					where: {
						eventId: canonicalEventId,
						userId: user.id,
						status: "ACCEPTED",
						OR: [
							{ canEditEvent: true },
							{ canManageRegistrations: true },
						],
					},
				});

				if (!isAdmin) {
					return c.json({ error: "无权限重试此活动的通信" }, 403);
				}
			}

			const failedRecords =
				await retryFailedCommunicationRecords(communicationId);

			if (failedRecords.length === 0) {
				return c.json({ message: "没有需要重试的失败记录" });
			}

			// 异步处理重试发送
			processRetryRecords(failedRecords).catch((error) => {
				console.error("处理重试发送失败:", error);
			});

			return c.json({
				message: `已开始重试 ${failedRecords.length} 条失败记录`,
				data: { retryCount: failedRecords.length },
			});
		} catch (error) {
			console.error("重试通信失败:", error);
			if (error instanceof Error) {
				return c.json({ error: error.message }, 400);
			}
			return c.json({ error: "重试通信失败" }, 500);
		}
	});

// 处理通信发送的异步函数
async function processCommunicationSending(communicationId: string) {
	try {
		// 获取通信记录和待发送的记录
		const communication = await db.eventCommunication.findUnique({
			where: { id: communicationId },
			include: {
				event: {
					select: {
						id: true,
						title: true,
						organizer: {
							select: {
								email: true,
							},
						},
					},
				},
				sender: {
					select: {
						name: true,
					},
				},
				records: {
					where: { status: "PENDING" },
					include: {
						recipient: {
							select: {
								id: true,
								name: true,
								email: true,
								phoneNumber: true,
							},
						},
					},
				},
			},
		});

		if (!communication) {
			throw new Error("通信记录不存在");
		}

		if (communication.records.length === 0) {
			return;
		}

		const parsedContent = parseCommunicationContent(communication.content);

		// 准备发送数据
		const sendData = {
			type: communication.type,
			records: communication.records.map((record) => ({
				recordId: record.id,
				recipientEmail: record.recipientEmail || undefined,
				recipientPhone: record.recipientPhone || undefined,
				recipientName: record.recipient.name,
			})),
			subject: `【${communication.event.title}】${communication.subject}`,
			content: parsedContent.content,
			imageUrl: parsedContent.imageUrl,
			senderName: communication.sender.name || "活动组织者",
			eventTitle: communication.event.title,
			eventUrl: `${getBaseUrl()}/events/${communication.event.id}`,
			organizerEmail: communication.event.organizer.email || undefined,
		};

		// 批量发送
		const result = await BatchCommunicationService.sendBatch(sendData);

		// 更新发送结果
		const updates = result.results.map((r) => ({
			recordId: r.recordId,
			status: r.success ? ("SENT" as const) : ("FAILED" as const),
			errorMessage: r.error,
			externalMessageId: r.messageId,
		}));

		await batchUpdateCommunicationRecords(communicationId, updates);

		// 更新通信主记录的统计数据
		await updateCommunicationStats(communicationId);
	} catch (error) {
		console.error("处理通信发送失败:", error);

		// 更新通信状态为失败
		await db.eventCommunication.update({
			where: { id: communicationId },
			data: { status: "FAILED" },
		});
	}
}

// 处理重试记录的异步函数
async function processRetryRecords(records: any[]) {
	if (records.length === 0) return;

	const communicationId = records[0].communicationId;

	try {
		const parsedContent = parseCommunicationContent(
			records[0].communication.content,
		);

		const sendData = {
			type: records[0].communication.type,
			records: records.map((record) => ({
				recordId: record.id,
				recipientEmail: record.recipientEmail || undefined,
				recipientPhone: record.recipientPhone || undefined,
				recipientName: record.recipient.name,
			})),
			subject: `【${records[0].communication.event.title}】${records[0].communication.subject}`,
			content: parsedContent.content,
			imageUrl: parsedContent.imageUrl,
			senderName: records[0].communication.sender?.name || "活动组织者",
			eventTitle: records[0].communication.event.title,
			eventUrl: `${getBaseUrl()}/events/${records[0].communication.event.id}`,
			organizerEmail:
				records[0].communication.event.organizer?.email || undefined,
		};

		const result = await BatchCommunicationService.sendBatch(sendData);

		const updates = result.results.map((r) => ({
			recordId: r.recordId,
			status: r.success ? ("SENT" as const) : ("FAILED" as const),
			errorMessage: r.error,
			externalMessageId: r.messageId,
		}));

		await batchUpdateCommunicationRecords(communicationId, updates);
		await updateCommunicationStats(communicationId);
	} catch (error) {
		console.error("处理重试发送失败:", error);
	}
}

export default app;
