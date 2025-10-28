import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { authMiddleware } from "@/server/middleware/auth";
import type { Session } from "@/lib/auth";
import {
	createEventCommunication,
	getEventCommunications,
	getCommunicationRecords,
	canSendCommunication,
	retryFailedCommunicationRecords,
	batchUpdateCommunicationRecords,
	updateCommunicationStats,
} from "@/lib/database/prisma/queries/event-communications";
import { getEventById } from "@/lib/database/prisma/queries/events";
import { BatchCommunicationService } from "@/lib/services/communication-service";
import { db } from "@/lib/database";

// 通信配置常量
const COMMUNICATION_LIMITS = {
	MAX_PER_EVENT: 8,
} as const;

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

			// 只有活动组织者或管理员可以查看
			if (event.organizerId !== user.id) {
				const isAdmin = await db.eventAdmin.findFirst({
					where: {
						eventId,
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

			const limitInfo = await canSendCommunication(eventId);
			return c.json({ data: limitInfo });
		} catch (error) {
			console.error("获取通信限制信息失败:", error);
			return c.json({ error: "获取通信限制信息失败" }, 500);
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

				if (event.organizerId !== user.id) {
					const isAdmin = await db.eventAdmin.findFirst({
						where: {
							eventId,
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

				const result = await getEventCommunications(eventId, {
					page,
					limit,
				});
				return c.json({ data: result });
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
				scheduledAt: z
					.string()
					.optional()
					.transform((val) => (val ? new Date(val) : undefined)),
			}),
		),
		async (c) => {
			const eventId = c.req.param("eventId");
			const user = c.get("user");
			const { type, subject, content, scheduledAt } = c.req.valid("json");

			try {
				// 检查用户权限
				const event = await getEventById(eventId);
				if (!event) {
					return c.json({ error: "活动不存在" }, 404);
				}

				if (event.organizerId !== user.id) {
					const isAdmin = await db.eventAdmin.findFirst({
						where: {
							eventId,
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
					await canSendCommunication(eventId);
				if (!canSend) {
					return c.json(
						{
							error: `已达到该活动的最大通信次数限制（${COMMUNICATION_LIMITS.MAX_PER_EVENT}次），剩余次数：${remainingCount}`,
						},
						400,
					);
				}

				// 创建通信记录
				const communication = await createEventCommunication({
					eventId,
					sentBy: user.id,
					type,
					subject,
					content,
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
					validRecipients: communication.validRecipientsCount,
					skippedRecipients: communication.unverifiedUsersCount,
					virtualEmailCount: communication.virtualEmailCount ?? 0,
					missingEmailCount: communication.missingEmailCount ?? 0,
				};

				let warning: string | null = null;
				if (communication.unverifiedUsersCount > 0) {
					if (type === "EMAIL") {
						warning = `注意：有 ${communication.unverifiedUsersCount} 个用户缺少有效邮箱或使用虚拟邮箱（@wechat.app），已自动跳过`;
					} else {
						warning = `注意：有 ${communication.unverifiedUsersCount} 个用户因为手机号未验证或缺失而无法收到消息`;
					}
				}

				return c.json({
					data: communication,
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

				if (event.organizerId !== user.id) {
					const isAdmin = await db.eventAdmin.findFirst({
						where: {
							eventId,
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

			if (event.organizerId !== user.id) {
				const isAdmin = await db.eventAdmin.findFirst({
					where: {
						eventId,
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
			console.log("没有待发送的记录");
			return;
		}

		// 准备发送数据
		const sendData = {
			type: communication.type,
			records: communication.records.map((record) => ({
				recordId: record.id,
				recipientEmail: record.recipientEmail || undefined,
				recipientPhone: record.recipientPhone || undefined,
				recipientName: record.recipient.name,
			})),
			subject: communication.subject,
			content: communication.content,
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

		console.log(
			`通信发送完成: ${result.summary.success}/${result.summary.total} 成功`,
		);
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
		const sendData = {
			type: records[0].communication.type,
			records: records.map((record) => ({
				recordId: record.id,
				recipientEmail: record.recipientEmail || undefined,
				recipientPhone: record.recipientPhone || undefined,
				recipientName: record.recipient.name,
			})),
			subject: records[0].communication.subject,
			content: records[0].communication.content,
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

		console.log(
			`重试发送完成: ${result.summary.success}/${result.summary.total} 成功`,
		);
	} catch (error) {
		console.error("处理重试发送失败:", error);
	}
}

export default app;
