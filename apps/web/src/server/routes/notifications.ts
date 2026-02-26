import { db } from "@community/lib-server/database/prisma/client";
import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { validator } from "hono-openapi/zod";
import { z } from "zod";
import { authMiddleware } from "../middleware/auth";

const notificationsRouter = new Hono()
	.use(authMiddleware)
	.get(
		"/",
		validator(
			"query",
			z.object({
				page: z.string().default("1").transform(Number),
				limit: z.string().default("20").transform(Number),
				type: z
					.enum([
						"PROJECT_COMMENT",
						"PROJECT_LIKE",
						"PROJECT_STATUS_UPDATE",
						"PROJECT_COLLABORATION_INVITE",
						"PROJECT_VIEW_MILESTONE",
						"ORGANIZATION_MEMBER_APPLICATION",
						"ORGANIZATION_APPLICATION_RESULT",
						"ORGANIZATION_ROLE_CHANGE",
						"ORGANIZATION_ANNOUNCEMENT",
						"ORGANIZATION_MEMBER_REMOVED",
						"ORGANIZATION_MEMBER_JOINED",
						"EVENT_REGISTRATION_RESULT",
						"EVENT_TIME_CHANGE",
						"EVENT_CANCELLED",
						"EVENT_REMINDER",
						"EVENT_CHECKIN_OPEN",
						"EVENT_NEW_REGISTRATION",
						"EVENT_CAPACITY_WARNING",
						"EVENT_PHOTO_UPLOADED",
						"ACCOUNT_SECURITY",
						"ACCOUNT_BANNED",
						"SYSTEM_ANNOUNCEMENT",
						"ACHIEVEMENT_UNLOCKED",
						"DAILY_REWARD",
						"USER_BOOKMARKED",
						"PRIVATE_MESSAGE",
						"PROFILE_VIEW_MILESTONE",
					])
					.optional(),
				read: z.enum(["true", "false"]).optional(),
			}),
		),
		describeRoute({
			summary: "Get user notifications",
			tags: ["Notifications"],
		}),
		async (c) => {
			try {
				const user = c.get("user");
				const { page, limit, type, read } = c.req.valid("query");

				const skip = (page - 1) * limit;

				const where: any = {
					userId: user.id,
				};

				if (type) {
					where.type = type;
				}

				if (read !== undefined) {
					where.read = read === "true";
				}

				const [notifications, total] = await Promise.all([
					db.notification.findMany({
						where,
						include: {
							relatedUser: {
								select: {
									id: true,
									name: true,
									image: true,
									username: true,
								},
							},
						},
						orderBy: {
							createdAt: "desc",
						},
						skip,
						take: limit,
					}),
					db.notification.count({ where }),
				]);

				return c.json({
					success: true,
					data: {
						notifications,
						pagination: {
							page,
							limit,
							total,
							totalPages: Math.ceil(total / limit),
						},
					},
				});
			} catch (error) {
				console.error("Error fetching notifications:", error);
				return c.json({ error: "Internal server error" }, 500);
			}
		},
	)
	.get(
		"/unread-count",
		describeRoute({
			summary: "Get unread notifications count",
			tags: ["Notifications"],
		}),
		async (c) => {
			try {
				const user = c.get("user");

				const count = await db.notification.count({
					where: {
						userId: user.id,
						read: false,
					},
				});

				return c.json({
					success: true,
					data: { unreadCount: count },
				});
			} catch (error) {
				console.error("Error fetching unread count:", error);
				return c.json({ error: "Internal server error" }, 500);
			}
		},
	)
	.post(
		"/:id/read",
		validator("param", z.object({ id: z.string() })),
		describeRoute({
			summary: "Mark notification as read",
			tags: ["Notifications"],
		}),
		async (c) => {
			try {
				const user = c.get("user");
				const { id } = c.req.valid("param");

				// 验证通知属于当前用户
				const notification = await db.notification.findFirst({
					where: {
						id,
						userId: user.id,
					},
				});

				if (!notification) {
					return c.json({ error: "Notification not found" }, 404);
				}

				await db.notification.update({
					where: { id },
					data: {
						read: true,
						readAt: new Date(),
					},
				});

				return c.json({ success: true });
			} catch (error) {
				console.error("Error marking notification as read:", error);
				return c.json({ error: "Internal server error" }, 500);
			}
		},
	)
	.put(
		"/read-all",
		describeRoute({
			summary: "Mark all notifications as read",
			tags: ["Notifications"],
		}),
		async (c) => {
			try {
				const user = c.get("user");

				await db.notification.updateMany({
					where: {
						userId: user.id,
						read: false,
					},
					data: {
						read: true,
						readAt: new Date(),
					},
				});

				return c.json({ success: true });
			} catch (error) {
				console.error(
					"Error marking all notifications as read:",
					error,
				);
				return c.json({ error: "Internal server error" }, 500);
			}
		},
	)
	.get(
		"/preferences",
		describeRoute({
			summary: "Get notification preferences",
			tags: ["Notifications"],
		}),
		async (c) => {
			try {
				const user = c.get("user");

				let preferences = await db.notificationPreference.findUnique({
					where: {
						userId: user.id,
					},
				});

				// 如果用户没有偏好设置，创建默认设置
				if (!preferences) {
					preferences = await db.notificationPreference.create({
						data: {
							userId: user.id,
						},
					});
				}

				return c.json({
					success: true,
					data: preferences,
				});
			} catch (error) {
				console.error(
					"Error fetching notification preferences:",
					error,
				);
				return c.json({ error: "Internal server error" }, 500);
			}
		},
	)
	.put(
		"/preferences",
		validator(
			"json",
			z.object({
				projectCommentEmail: z.boolean().optional(),
				projectCommentPush: z.boolean().optional(),
				projectLikeEmail: z.boolean().optional(),
				projectLikePush: z.boolean().optional(),
				organizationEmail: z.boolean().optional(),
				organizationPush: z.boolean().optional(),
				eventEmail: z.boolean().optional(),
				eventPush: z.boolean().optional(),
				eventReminderEmail: z.boolean().optional(),
				systemEmail: z.boolean().optional(),
				systemPush: z.boolean().optional(),
				socialEmail: z.boolean().optional(),
				socialPush: z.boolean().optional(),
			}),
		),
		describeRoute({
			summary: "Update notification preferences",
			tags: ["Notifications"],
		}),
		async (c) => {
			try {
				const user = c.get("user");
				const preferences = c.req.valid("json");

				const updatedPreferences =
					await db.notificationPreference.upsert({
						where: {
							userId: user.id,
						},
						update: preferences,
						create: {
							userId: user.id,
							...preferences,
						},
					});

				return c.json({
					success: true,
					data: updatedPreferences,
				});
			} catch (error) {
				console.error(
					"Error updating notification preferences:",
					error,
				);
				return c.json({ error: "Internal server error" }, 500);
			}
		},
	)
	.delete(
		"/:id",
		validator("param", z.object({ id: z.string() })),
		describeRoute({
			summary: "Delete notification",
			tags: ["Notifications"],
		}),
		async (c) => {
			try {
				const user = c.get("user");
				const { id } = c.req.valid("param");

				// 验证通知属于当前用户
				const notification = await db.notification.findFirst({
					where: {
						id,
						userId: user.id,
					},
				});

				if (!notification) {
					return c.json({ error: "Notification not found" }, 404);
				}

				await db.notification.delete({
					where: { id },
				});

				return c.json({ success: true });
			} catch (error) {
				console.error("Error deleting notification:", error);
				return c.json({ error: "Internal server error" }, 500);
			}
		},
	);

export default notificationsRouter;
