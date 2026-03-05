import { auth } from "@community/lib-server/auth";
import {
	deleteEventRegistration,
	getEventById,
	getEventRegistration,
	getEventRegistrations,
	getRegistrationByUserAndEvent,
	findEventInviteByCode,
	registerForEvent,
	updateEventRegistration,
} from "@community/lib-server/database";
import { db } from "@community/lib-server/database/prisma";
import { NotificationService } from "@/features/notifications/service";
import { canManageEvent } from "@/features/permissions/events";
import { sendEventReviewNotificationSMS } from "@community/lib-server/sms/tencent-sms";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";

const readCookieValue = (
	cookieHeader: string | null,
	name: string,
): string | undefined => {
	if (!cookieHeader) return undefined;

	const pairs = cookieHeader.split(";");
	for (const pair of pairs) {
		const trimmed = pair.trim();
		if (!trimmed) continue;
		const separatorIndex = trimmed.indexOf("=");
		if (separatorIndex === -1) continue;
		const key = trimmed.slice(0, separatorIndex).trim();
		if (key !== name) continue;
		const value = trimmed.slice(separatorIndex + 1);
		try {
			return decodeURIComponent(value);
		} catch {
			return value;
		}
	}
	return undefined;
};

const registerSchema = z.object({
	note: z.string().optional(),
	ticketTypeId: z.string().optional(), // 添加票种支持
	projectId: z.string().optional(), // 添加作品关联支持
	inviteCode: z.string().optional(),
	allowDigitalCardDisplay: z.boolean().optional(), // 数字名片展示同意
	answers: z
		.array(
			z.object({
				questionId: z.string(),
				answer: z.string(),
			}),
		)
		.default([]),
});

const updateRegistrationSchema = z.object({
	status: z.enum([
		"PENDING_PAYMENT",
		"PENDING",
		"APPROVED",
		"WAITLISTED",
		"REJECTED",
		"CANCELLED",
	]),
	reviewNote: z.string().optional(),
});

const getRegistrationsSchema = z.object({
	status: z
		.enum([
			"PENDING_PAYMENT",
			"PENDING",
			"APPROVED",
			"WAITLISTED",
			"REJECTED",
			"CANCELLED",
		])
		.optional(),
	page: z
		.string()
		.transform((val) => Number.parseInt(val) || 1)
		.optional(),
	limit: z
		.string()
		.transform((val) => Number.parseInt(val) || 50)
		.optional(),
});

const app = new Hono();

// POST /api/events/:eventId/register - Register for event
app.post(
	"/:eventId/register",
	zValidator("json", registerSchema),
	async (c) => {
		try {
			const session = await auth.api.getSession({
				headers: c.req.raw.headers,
			});

			if (!session) {
				return c.json(
					{
						success: false,
						error: "Authentication required",
					},
					401,
				);
			}

			const eventId = c.req.param("eventId");
			const {
				note,
				ticketTypeId,
				projectId,
				answers,
				inviteCode,
				allowDigitalCardDisplay,
			} = c.req.valid("json");

			// Validate eventId format
			if (!eventId || typeof eventId !== "string") {
				return c.json(
					{
						success: false,
						error: "Invalid event ID",
					},
					400,
				);
			}

			// Check if event exists and is valid for registration
			const event = await getEventById(eventId);
			if (!event) {
				return c.json(
					{
						success: false,
						error: "Event not found",
					},
					404,
				);
			}

			// Check if event is published
			if (event.status !== "PUBLISHED") {
				return c.json(
					{
						success: false,
						error: "Event is not available for registration",
					},
					400,
				);
			}

			// Check if registration is open (for hackathon events)
			if (event.type === "HACKATHON" && !event.registrationOpen) {
				return c.json(
					{
						success: false,
						error: "Registration is closed",
					},
					400,
				);
			}

			// Optional: Also check deadline if set
			if (
				event.registrationDeadline &&
				new Date() > event.registrationDeadline
			) {
				return c.json(
					{
						success: false,
						error: "Registration deadline has passed",
					},
					400,
				);
			}

			// Check if event is external
			if (event.isExternalEvent) {
				return c.json(
					{
						success: false,
						error: "This is an external event. Please register on the external platform.",
					},
					400,
				);
			}

			// Project submission is now optional

			// If project is provided, verify user owns the project
			if (projectId) {
				const project = await db.project.findUnique({
					where: {
						id: projectId,
						userId: session.user.id, // Ensure user owns the project
					},
				});

				if (!project) {
					return c.json(
						{
							success: false,
							error: "Project not found or you don't have permission to use it",
						},
						400,
					);
				}
			}

			const inviteCodeFromBody = inviteCode?.trim() || undefined;
			const inviteCodeFromCookie =
				readCookieValue(
					c.req.raw.headers.get("cookie"),
					`event-invite-${eventId}`,
				)?.trim() || undefined;
			const inviteCodeCandidate =
				inviteCodeFromBody ?? inviteCodeFromCookie;

			let inviteId: string | undefined;
			if (inviteCodeCandidate) {
				const invite = await findEventInviteByCode(
					eventId,
					inviteCodeCandidate,
				);
				if (invite) {
					inviteId = invite.id;
				}
			}

			// Use the updated registerForEvent function with ticket type support
			const registration = await registerForEvent({
				eventId,
				userId: session.user.id,
				ticketTypeId,
				inviteId,
				answers,
				allowDigitalCardDisplay,
			});

			// If project is provided, create project submission record (only if event requires it)
			if (projectId && registration && event.requireProjectSubmission) {
				// Check if project submission already exists to avoid unique constraint violation
				const existingSubmission =
					await db.eventProjectSubmission.findUnique({
						where: {
							eventId_projectId: {
								eventId,
								projectId,
							},
						},
					});

				if (!existingSubmission) {
					// Get project details for submission
					const project = await db.project.findUnique({
						where: { id: projectId },
						select: { title: true, description: true },
					});

					if (project) {
						await db.eventProjectSubmission.create({
							data: {
								eventId,
								projectId,
								userId: session.user.id,
								submissionType: "DEMO_PROJECT", // Use existing enum value for registration-based submissions
								title: project.title,
								description:
									project.description || "作品注册提交",
								status: "SUBMITTED",
								projectSnapshot: {}, // Empty snapshot for registration-based submissions
							},
						});
					}
				}
			}

			return c.json({
				success: true,
				data: registration,
				message:
					registration?.status === "PENDING"
						? "Registration submitted for approval"
						: "Registration confirmed",
			});
		} catch (error: any) {
			console.error("Error registering for event:", error);

			// Handle specific error cases
			if (error.message?.includes("already registered")) {
				return c.json(
					{
						success: false,
						error: "You are already registered for this event",
					},
					409,
				);
			}

			if (
				error.message?.includes("full") ||
				error.message?.includes("sold out")
			) {
				return c.json(
					{
						success: false,
						error: error.message,
					},
					409,
				);
			}

			if (error.message?.includes("deadline")) {
				return c.json(
					{
						success: false,
						error: error.message,
					},
					400,
				);
			}

			return c.json(
				{
					success: false,
					error: error.message || "Failed to register for event",
				},
				500,
			);
		}
	},
);

// DELETE /api/events/:eventId/register - Cancel registration
app.delete("/:eventId/register", async (c) => {
	try {
		const session = await auth.api.getSession({
			headers: c.req.raw.headers,
		});

		if (!session) {
			return c.json(
				{
					success: false,
					error: "Authentication required",
				},
				401,
			);
		}

		const eventId = c.req.param("eventId");

		// Check if event exists and get organizer info
		const event = await getEventById(eventId);
		if (!event) {
			return c.json(
				{
					success: false,
					error: "Event not found",
				},
				404,
			);
		}

		// Check if registration exists
		const registration = await getEventRegistration(
			event.id,
			session.user.id,
		);
		if (!registration) {
			return c.json(
				{
					success: false,
					error: "You are not registered for this event",
				},
				400,
			);
		}

		if (registration.orderId) {
			return c.json(
				{
					success: false,
					error: "该报名包含支付订单，请先取消订单。",
				},
				400,
			);
		}

		await deleteEventRegistration(event.id, session.user.id);
		await clearEventVotesForUser(event.id, session.user.id);

		return c.json({
			success: true,
			message: "Registration cancelled successfully",
		});
	} catch (error: any) {
		console.error("Error cancelling registration:", error);

		const message =
			typeof error?.message === "string"
				? error.message
				: "Failed to cancel registration";

		if (message.includes("Paid registrations")) {
			return c.json(
				{
					success: false,
					error: "该报名包含支付订单，请先取消订单。",
				},
				400,
			);
		}

		if (message.includes("already cancelled")) {
			return c.json(
				{
					success: false,
					error: "该报名已取消或无需重复取消。",
				},
				409,
			);
		}

		return c.json(
			{
				success: false,
				error: message,
			},
			500,
		);
	}
});

// GET /api/events/:eventId/registrations - Get event registrations (organizers only)
app.get(
	"/:eventId/registrations",
	zValidator("query", getRegistrationsSchema),
	async (c) => {
		try {
			const session = await auth.api.getSession({
				headers: c.req.raw.headers,
			});

			if (!session) {
				return c.json(
					{
						success: false,
						error: "Authentication required",
					},
					401,
				);
			}

			const eventId = c.req.param("eventId");
			const params = c.req.valid("query");

			// Validate eventId format
			if (!eventId || typeof eventId !== "string") {
				return c.json(
					{
						success: false,
						error: "Invalid event ID",
					},
					400,
				);
			}

			// Check if event exists
			const event = await getEventById(eventId);
			if (!event) {
				return c.json(
					{
						success: false,
						error: "Event not found",
					},
					404,
				);
			}

			// Use secure permission check
			const hasPermission = await canManageEvent(
				eventId,
				session.user.id,
			);

			if (!hasPermission) {
				return c.json(
					{
						success: false,
						error: "Not authorized to view registrations",
					},
					403,
				);
			}

			// Use event.id (CUID) for database queries
			const result = await getEventRegistrations(event.id, params);

			return c.json({
				success: true,
				data: result,
			});
		} catch (error: any) {
			console.error("Error fetching registrations:", error);
			return c.json(
				{
					success: false,
					error: error.message || "Failed to fetch registrations",
				},
				500,
			);
		}
	},
);

// DELETE /api/events/:eventId/registrations/:userId - Cancel registration by organizer
app.delete(
	"/:eventId/registrations/:userId",
	zValidator(
		"json",
		z.object({
			reason: z.string().min(1, "Cancellation reason is required"),
		}),
	),
	async (c) => {
		try {
			const session = await auth.api.getSession({
				headers: c.req.raw.headers,
			});

			if (!session) {
				return c.json(
					{
						success: false,
						error: "Authentication required",
					},
					401,
				);
			}

			const eventId = c.req.param("eventId");
			const userId = c.req.param("userId");
			const { reason } = c.req.valid("json");

			// Validate parameters
			if (!eventId || typeof eventId !== "string") {
				return c.json(
					{
						success: false,
						error: "Invalid event ID",
					},
					400,
				);
			}

			if (!userId || typeof userId !== "string") {
				return c.json(
					{
						success: false,
						error: "Invalid user ID",
					},
					400,
				);
			}

			// Check if event exists
			const event = await getEventById(eventId);
			if (!event) {
				return c.json(
					{
						success: false,
						error: "Event not found",
					},
					404,
				);
			}

			// Use secure permission check
			const hasPermission = await canManageEvent(
				eventId,
				session.user.id,
			);

			if (!hasPermission) {
				return c.json(
					{
						success: false,
						error: "Not authorized to cancel registrations",
					},
					403,
				);
			}

			// Check if registration exists
			const registration = await getEventRegistration(event.id, userId);
			if (!registration) {
				return c.json(
					{
						success: false,
						error: "Registration not found",
					},
					404,
				);
			}

			// Update registration status to CANCELLED
			const updatedRegistration = await updateEventRegistration(
				event.id,
				userId,
				{
					status: "CANCELLED",
					reviewedBy: session.user.id,
					reviewNote: `报名被取消：${reason}`,
				},
			);

			await clearEventVotesForUser(event.id, userId);

			// 发送取消通知给用户
			try {
				await NotificationService.createNotification({
					userId,
					type: "EVENT_CANCELLED",
					title: "活动报名被取消",
					content: `您的活动 "${event.title}" 报名已被取消。原因：${reason}`,
					metadata: {
						eventId: event.id,
						eventTitle: event.title,
						cancellationReason: reason,
					},
					priority: "HIGH",
				});

				// 如果用户有手机号，也发送短信通知
				if (updatedRegistration.user.phoneNumber) {
					await sendEventReviewNotificationSMS(
						updatedRegistration.user.phoneNumber,
						"",
						"REJECTED",
					);
				}
			} catch (notificationError) {
				console.error(
					"Error sending cancellation notification:",
					notificationError,
				);
				// 通知发送失败不影响取消流程
			}

			return c.json({
				success: true,
				data: updatedRegistration,
				message: "Registration cancelled successfully",
			});
		} catch (error: any) {
			console.error("Error cancelling registration:", error);

			const message =
				typeof error?.message === "string"
					? error.message
					: "Failed to cancel registration";

			if (message.includes("already cancelled")) {
				return c.json(
					{
						success: false,
						error: "该报名已取消或无需重复取消。",
					},
					409,
				);
			}

			return c.json(
				{
					success: false,
					error: message,
				},
				500,
			);
		}
	},
);

// PUT /api/events/:eventId/registrations/:userId - Update registration status (organizers only)
app.put(
	"/:eventId/registrations/:userId",
	zValidator("json", updateRegistrationSchema),
	async (c) => {
		try {
			const session = await auth.api.getSession({
				headers: c.req.raw.headers,
			});

			if (!session) {
				return c.json(
					{
						success: false,
						error: "Authentication required",
					},
					401,
				);
			}

			const eventId = c.req.param("eventId");
			const userId = c.req.param("userId");
			const { status, reviewNote } = c.req.valid("json");

			// Validate parameters
			if (!eventId || typeof eventId !== "string") {
				return c.json(
					{
						success: false,
						error: "Invalid event ID",
					},
					400,
				);
			}

			if (!userId || typeof userId !== "string") {
				return c.json(
					{
						success: false,
						error: "Invalid user ID",
					},
					400,
				);
			}

			// Check if event exists
			const event = await getEventById(eventId);
			if (!event) {
				return c.json(
					{
						success: false,
						error: "Event not found",
					},
					404,
				);
			}

			// Use secure permission check
			const hasPermission = await canManageEvent(
				eventId,
				session.user.id,
			);

			if (!hasPermission) {
				return c.json(
					{
						success: false,
						error: "Not authorized to update registrations",
					},
					403,
				);
			}

			// Check if registration exists
			const registration = await getEventRegistration(event.id, userId);
			if (!registration) {
				return c.json(
					{
						success: false,
						error: "Registration not found",
					},
					404,
				);
			}

			const updatedRegistration = await updateEventRegistration(
				event.id,
				userId,
				{
					status,
					reviewedBy: session.user.id,
					reviewNote,
				},
			);

			// 检查原始状态，只有从PENDING状态审核到APPROVED或REJECTED才发送短信通知
			const needsSMSNotification =
				registration.status === "PENDING" &&
				(status === "APPROVED" || status === "REJECTED") &&
				updatedRegistration.user.phoneNumber;

			if (needsSMSNotification && updatedRegistration.user.phoneNumber) {
				try {
					const smsStatus =
						status === "APPROVED" ? "APPROVED" : "REJECTED";
					const smsResult = await sendEventReviewNotificationSMS(
						updatedRegistration.user.phoneNumber,
						"", // 空字符串，不会被使用
						smsStatus,
					);

					if (smsResult.success) {
						// SMS sent successfully
					} else {
						console.warn(
							`Failed to send SMS notification: ${smsResult.message}`,
						);
					}
				} catch (smsError) {
					// 短信发送失败不影响审核流程，只记录错误
					console.error("Error sending SMS notification:", smsError);
				}
			}

			// 发送站内通知
			try {
				await NotificationService.notifyEventRegistrationResult(
					updatedRegistration.userId,
					event.id,
					event.title,
					status === "APPROVED",
				);
			} catch (notificationError) {
				console.error(
					"Error sending event registration notification:",
					notificationError,
				);
				// 通知发送失败不影响审核流程
			}

			return c.json({
				success: true,
				data: updatedRegistration,
				message: `Registration ${status.toLowerCase()} successfully`,
			});
		} catch (error: any) {
			console.error("Error updating registration:", error);

			const message =
				typeof error?.message === "string"
					? error.message
					: "Failed to update registration";

			if (message.toLowerCase().includes("sold out")) {
				return c.json(
					{
						success: false,
						error: message,
					},
					409,
				);
			}

			return c.json(
				{
					success: false,
					error: message,
				},
				500,
			);
		}
	},
);

// GET /api/events/:eventId/registrations/export - Export event registrations (organizers only)
app.get(
	"/:eventId/registrations/export",
	zValidator("query", getRegistrationsSchema),
	async (c) => {
		try {
			const session = await auth.api.getSession({
				headers: c.req.raw.headers,
			});

			if (!session) {
				return c.json(
					{
						success: false,
						error: "Authentication required",
					},
					401,
				);
			}

			const eventId = c.req.param("eventId");
			const params = c.req.valid("query");

			// Validate eventId format
			if (!eventId || typeof eventId !== "string") {
				return c.json(
					{
						success: false,
						error: "Invalid event ID",
					},
					400,
				);
			}

			// Check if event exists
			const event = await getEventById(eventId);
			if (!event) {
				return c.json(
					{
						success: false,
						error: "Event not found",
					},
					404,
				);
			}

			// Use secure permission check
			const hasPermission = await canManageEvent(
				eventId,
				session.user.id,
			);

			if (!hasPermission) {
				return c.json(
					{
						success: false,
						error: "Not authorized to export registrations",
					},
					403,
				);
			}

			// 优化导出查询 - 减少数据传输和处理时间
			const [registrations, projectSubmissions] = await Promise.all([
				// 获取报名信息 - 精简字段选择
				db.eventRegistration.findMany({
					where: {
						eventId: event.id,
						...(params.status && { status: params.status }),
					},
					select: {
						id: true,
						status: true,
						registeredAt: true,
						allowDigitalCardDisplay: true,
						userId: true,
						ticketTypeId: true,
						user: {
							select: {
								// 核心字段
								id: true,
								name: true,
								email: true,
								username: true,
								userRoleString: true,
								phoneNumber: true,
								wechatId: true,
								// 简介信息
								currentWorkOn: true,
								region: true,
								bio: true,
								skills: true,
								lifeStatus: true,
								whatICanOffer: true,
								whatIAmLookingFor: true,
								// 等级信息
								membershipLevel: true,
								cpValue: true,
							},
						},
						ticketType: {
							select: {
								id: true,
								name: true,
								price: true,
							},
						},
						answers: {
							select: {
								answer: true,
								questionId: true,
							},
							orderBy: {
								question: {
									order: "asc",
								},
							},
						},
					},
					orderBy: {
						registeredAt: "asc",
					},
					take: 1000, // Export limit
				}),
				// 并行获取项目提交信息（如果需要）
				event.requireProjectSubmission
					? db.eventProjectSubmission.findMany({
							where: {
								eventId: event.id,
								// 只获取有报名记录的用户的项目
								user: {
									eventRegistrations: {
										some: {
											eventId: event.id,
											...(params.status && {
												status: params.status,
											}),
										},
									},
								},
							},
							select: {
								userId: true,
								title: true,
								description: true,
								demoUrl: true,
								sourceCode: true,
								status: true,
								judgeScore: true,
								audienceScore: true,
								finalScore: true,
								project: {
									select: {
										id: true,
										title: true,
										description: true,
										url: true,
										stage: true,
									},
								},
							},
						})
					: Promise.resolve([]),
			]);

			// 创建高效的查找映射
			const userProjectSubmissionMap = new Map(
				projectSubmissions.map((submission) => [
					submission.userId,
					submission,
				]),
			);

			// Convert to CSV format
			const headers = [
				"姓名/Name",
				"邮箱/Email",
				"手机号/Phone",
				"微信号/WeChat",
				"状态/Status",
				"报名时间/Registered At",
				"用户名/Username",
				"用户角色/User Role",
				"正在做什么/Current Work",
				"城市/City",
				"个人简介/Bio",
				"技能/Skills",
				"当前状态/Life Status",
				"能提供什么/Can Offer",
				"在寻找什么/Looking For",
				"成员身份/Membership Level",
				"积分/ CP Value",
				"票种名称/Ticket Type",
				"票种价格/Ticket Price",
				"数字名片同意/Digital Card Consent",
			];

			// 如果活动要求作品提交，添加作品相关列
			if (event.requireProjectSubmission) {
				headers.push(
					"作品标题/Project Title",
					"作品描述/Project Description",
					"作品链接/Project URL",
					"作品阶段/Project Stage",
					"提交标题/Submission Title",
					"提交描述/Submission Description",
					"演示链接/Demo URL",
					"源码链接/Source Code",
					"提交状态/Submission Status",
					"评委评分/Judge Score",
					"观众评分/Audience Score",
					"最终得分/Final Score",
				);
			}

			// 预处理问题映射以提高性能
			const questionMap = new Map(
				event.questions.map((q) => [q.id, q.question]),
			);
			const sortedQuestions = event.questions.sort(
				(a, b) => a.order - b.order,
			);
			const questionHeaders = sortedQuestions.map((q) => q.question);
			headers.push(...questionHeaders);

			// 优化的 CSV 值转义函数
			const escapeCsvValue = (
				value: string | number | null | undefined,
			): string => {
				if (value === null || value === undefined) return '""';
				const str = value.toString();
				if (
					str.includes('"') ||
					str.includes(",") ||
					str.includes("\n")
				) {
					return `"${str.replace(/"/g, '""')}"`;
				}
				return str;
			};

			// Escape headers as well
			const escapedHeaders = headers.map((header) =>
				escapeCsvValue(header),
			);
			const csvRows = [escapedHeaders.join(",")];

			for (const registration of registrations) {
				const projectSubmission = userProjectSubmissionMap.get(
					registration.userId,
				);

				const row = [
					escapeCsvValue(registration.user.name),
					escapeCsvValue(registration.user.email),
					escapeCsvValue(registration.user.phoneNumber),
					escapeCsvValue(registration.user.wechatId),
					escapeCsvValue(registration.status),
					escapeCsvValue(
						new Date(registration.registeredAt)
							.toISOString()
							.split("T")[0],
					),
					escapeCsvValue(registration.user.username),
					escapeCsvValue(registration.user.userRoleString),
					escapeCsvValue(registration.user.currentWorkOn),
					escapeCsvValue(registration.user.region),
					escapeCsvValue(registration.user.bio),
					escapeCsvValue(registration.user.skills?.join(", ")),
					escapeCsvValue(registration.user.lifeStatus),
					escapeCsvValue(registration.user.whatICanOffer),
					escapeCsvValue(registration.user.whatIAmLookingFor),
					escapeCsvValue(registration.user.membershipLevel),
					escapeCsvValue(registration.user.cpValue?.toString()),
					escapeCsvValue(registration.ticketType?.name),
					escapeCsvValue(registration.ticketType?.price?.toString()),
					escapeCsvValue(
						registration.allowDigitalCardDisplay === true
							? "是/Yes"
							: registration.allowDigitalCardDisplay === false
								? "否/No"
								: "",
					),
				];

				// 如果活动要求作品提交，添加作品相关数据
				if (event.requireProjectSubmission) {
					row.push(
						escapeCsvValue(projectSubmission?.project?.title),
						escapeCsvValue(projectSubmission?.project?.description),
						escapeCsvValue(projectSubmission?.project?.url),
						escapeCsvValue(projectSubmission?.project?.stage),
						escapeCsvValue(projectSubmission?.title),
						escapeCsvValue(projectSubmission?.description),
						escapeCsvValue(projectSubmission?.demoUrl),
						escapeCsvValue(projectSubmission?.sourceCode),
						escapeCsvValue(projectSubmission?.status),
						escapeCsvValue(
							projectSubmission?.judgeScore?.toString(),
						),
						escapeCsvValue(
							projectSubmission?.audienceScore?.toString(),
						),
						escapeCsvValue(
							projectSubmission?.finalScore?.toString(),
						),
					);
				}

				// 预处理答案映射以提高循环性能
				const answerMap = new Map(
					registration.answers.map((a) => [a.questionId, a.answer]),
				);

				// 优化的答案处理 - 避免重复查找
				for (const question of sortedQuestions) {
					const answer = answerMap.get(question.id);
					row.push(escapeCsvValue(answer));
				}

				csvRows.push(row.join(","));
			}

			const csvContent = csvRows.join("\n");

			// Set CSV headers with UTF-8 encoding for Chinese characters
			c.header("Content-Type", "text/csv; charset=utf-8");
			c.header(
				"Content-Disposition",
				`attachment; filename="${encodeURIComponent(event.title)}-registrations.csv"`,
			);

			// Use UTF-8 BOM to ensure proper encoding for Chinese characters
			const utf8BOM = "\uFEFF";
			const csvWithBOM = utf8BOM + csvContent;

			// Convert to Uint8Array to handle UTF-8 encoding properly
			const encoder = new TextEncoder();
			const csvBytes = encoder.encode(csvWithBOM);

			return new Response(csvBytes, {
				headers: {
					"Content-Type": "text/csv; charset=utf-8",
					"Content-Disposition": `attachment; filename="${encodeURIComponent(event.title)}-registrations.csv"`,
				},
			});
		} catch (error: any) {
			console.error("Error exporting registrations:", error);
			return c.json(
				{
					success: false,
					error: error.message || "Failed to export registrations",
				},
				500,
			);
		}
	},
);

// GET /api/events/:eventId/registration - Get current user's registration status
app.get("/:eventId/registration", async (c) => {
	try {
		const session = await auth.api.getSession({
			headers: c.req.raw.headers,
		});

		if (!session) {
			return c.json({
				success: true,
				data: null,
			});
		}

		const eventId = c.req.param("eventId");
		const registration = await getRegistrationByUserAndEvent(
			session.user.id,
			eventId,
		);

		return c.json({
			success: true,
			data: registration,
		});
	} catch (error) {
		console.error("Error fetching registration:", error);
		return c.json(
			{
				success: false,
				error: "Failed to fetch registration",
			},
			500,
		);
	}
});

export default app;

async function clearEventVotesForUser(eventId: string, userId: string) {
	await db.projectVote.deleteMany({
		where: {
			eventId,
			userId,
		},
	});
}
