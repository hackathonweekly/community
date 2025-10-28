import { db } from "@/lib/database/prisma/client";
import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { validator } from "hono-openapi/zod";
import { z } from "zod";
import { authMiddleware } from "../../middleware/auth";

export const eventBookmarksRouter = new Hono()
	.use(authMiddleware)
	.get(
		"/event-bookmarks",
		describeRoute({
			summary: "Get user event bookmarks",
			tags: ["User"],
		}),
		async (c) => {
			try {
				const user = c.get("user");

				// 获取用户收藏的活动
				const bookmarks = await db.eventBookmark.findMany({
					where: {
						userId: user.id,
					},
					include: {
						event: {
							select: {
								id: true,
								title: true,
								richContent: true,
								type: true,
								status: true,
								startTime: true,
								endTime: true,
								isOnline: true,
								address: true,
								coverImage: true,
								tags: true,
								featured: true,
								viewCount: true,
								organizerId: true,
								organizationId: true,
								createdAt: true,
								organizer: {
									select: {
										id: true,
										name: true,
										username: true,
										image: true,
									},
								},
								organization: {
									select: {
										id: true,
										name: true,
										slug: true,
										logo: true,
									},
								},
								_count: {
									select: {
										registrations: true,
									},
								},
							},
						},
					},
					orderBy: {
						createdAt: "desc",
					},
				});

				return c.json({ bookmarks });
			} catch (error) {
				console.error("Error fetching event bookmarks:", error);
				return c.json({ error: "Internal server error" }, 500);
			}
		},
	)
	.post(
		"/events/:eventId/bookmark",
		validator("param", z.object({ eventId: z.string() })),
		describeRoute({
			summary: "Bookmark event",
			tags: ["User"],
		}),
		async (c) => {
			try {
				const user = c.get("user");
				const { eventId } = c.req.valid("param");

				// 检查活动是否存在且是公开的
				const event = await db.event.findFirst({
					where: {
						id: eventId,
						status: "PUBLISHED",
					},
				});

				if (!event) {
					return c.json({ error: "Event not found" }, 404);
				}

				// 检查是否已经收藏
				const existingBookmark = await db.eventBookmark.findUnique({
					where: {
						userId_eventId: {
							userId: user.id,
							eventId: eventId,
						},
					},
				});

				if (existingBookmark) {
					return c.json({ error: "Already bookmarked" }, 409);
				}

				// 创建收藏
				await db.eventBookmark.create({
					data: {
						userId: user.id,
						eventId: eventId,
					},
				});

				// 如果需要，可以创建通知给活动组织者
				// try {
				// 	await NotificationService.notifyEventBookmarked(
				// 		event.organizerId,
				// 		user.id,
				// 		user.name,
				// 		event.title,
				// 	);
				// } catch (notificationError) {
				// 	console.error(
				// 		"Error creating bookmark notification:",
				// 		notificationError,
				// 	);
				// }

				return c.json({ success: true });
			} catch (error) {
				console.error("Error bookmarking event:", error);
				return c.json({ error: "Internal server error" }, 500);
			}
		},
	)
	.delete(
		"/events/:eventId/bookmark",
		validator("param", z.object({ eventId: z.string() })),
		describeRoute({
			summary: "Remove event bookmark",
			tags: ["User"],
		}),
		async (c) => {
			try {
				const user = c.get("user");
				const { eventId } = c.req.valid("param");

				// 删除收藏
				await db.eventBookmark.deleteMany({
					where: {
						userId: user.id,
						eventId: eventId,
					},
				});

				return c.json({ success: true });
			} catch (error) {
				console.error("Error removing event bookmark:", error);
				return c.json({ error: "Internal server error" }, 500);
			}
		},
	)
	.get(
		"/events/:eventId/bookmark-status",
		validator("param", z.object({ eventId: z.string() })),
		describeRoute({
			summary: "Check if event is bookmarked",
			tags: ["User"],
		}),
		async (c) => {
			try {
				const user = c.get("user");
				const { eventId } = c.req.valid("param");

				const bookmark = await db.eventBookmark.findUnique({
					where: {
						userId_eventId: {
							userId: user.id,
							eventId: eventId,
						},
					},
				});

				return c.json({ bookmarked: !!bookmark });
			} catch (error) {
				console.error("Error checking bookmark status:", error);
				return c.json({ error: "Internal server error" }, 500);
			}
		},
	);
