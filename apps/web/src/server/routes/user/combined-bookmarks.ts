import { db } from "@community/lib-server/database/prisma/client";
import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { authMiddleware } from "../../middleware/auth";

export const bookmarksRouter = new Hono().use(authMiddleware).get(
	"/bookmarks",
	describeRoute({
		summary: "Get all user bookmarks (events and projects)",
		tags: ["User"],
	}),
	async (c) => {
		try {
			const user = c.get("user");

			// 获取用户收藏的活动和项目
			const [eventBookmarks, projectBookmarks] = await Promise.all([
				db.eventBookmark.findMany({
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
				}),
				db.projectBookmark.findMany({
					where: {
						userId: user.id,
					},
					include: {
						project: {
							select: {
								id: true,
								title: true,
								subtitle: true,
								description: true,
								url: true,
								screenshots: true,
								projectTags: true,
								stage: true,
								featured: true,
								viewCount: true,
								likeCount: true,
								commentCount: true,
								createdAt: true,
								updatedAt: true,
								user: {
									select: {
										id: true,
										name: true,
										username: true,
										image: true,
									},
								},
							},
						},
					},
					orderBy: {
						createdAt: "desc",
					},
				}),
			]);

			return c.json({
				success: true,
				data: {
					events: eventBookmarks
						.filter((bookmark) => (bookmark as any).event)
						.map((bookmark) => ({
							...(bookmark as any).event,
							bookmarkDate: bookmark.createdAt,
						})),
					projects: projectBookmarks
						.filter((bookmark) => bookmark.project)
						.map((bookmark) => ({
							...bookmark.project,
							bookmarkDate: bookmark.createdAt,
						})),
				},
			});
		} catch (error) {
			console.error("Error fetching user bookmarks:", error);
			return c.json({ error: "Internal server error" }, 500);
		}
	},
);
