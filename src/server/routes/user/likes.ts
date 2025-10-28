import { db } from "@/lib/database/prisma/client";
import { NotificationService } from "@/features/notifications/service";
import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { validator } from "hono-openapi/zod";
import { z } from "zod";
import { authMiddleware } from "../../middleware/auth";

export const likesRouter = new Hono()
	.use(authMiddleware)
	// User likes
	.post(
		"/:userId/like",
		validator("param", z.object({ userId: z.string() })),
		describeRoute({
			summary: "Like user",
			tags: ["Likes"],
		}),
		async (c) => {
			try {
				const user = c.get("user");
				const { userId } = c.req.valid("param");

				// 不能点赞自己
				if (userId === user.id) {
					return c.json({ error: "Cannot like yourself" }, 400);
				}

				// 检查目标用户是否存在且公开
				const targetUser = await db.user.findFirst({
					where: {
						id: userId,
						profilePublic: true,
					},
				});

				if (!targetUser) {
					return c.json({ error: "User not found" }, 404);
				}

				// 检查是否已经点赞
				const existingLike = await db.userLike.findUnique({
					where: {
						userId_likedUserId: {
							userId: user.id,
							likedUserId: userId,
						},
					},
				});

				if (existingLike) {
					return c.json({ error: "Already liked" }, 409);
				}

				// 创建点赞
				await db.userLike.create({
					data: {
						userId: user.id,
						likedUserId: userId,
					},
				});

				// 创建通知
				try {
					await NotificationService.notifyUserLiked(
						userId,
						user.id,
						user.name,
					);
				} catch (notificationError) {
					console.error(
						"Error creating like notification:",
						notificationError,
					);
				}

				return c.json({ success: true });
			} catch (error) {
				console.error("Error liking user:", error);
				return c.json({ error: "Internal server error" }, 500);
			}
		},
	)
	.delete(
		"/:userId/like",
		validator("param", z.object({ userId: z.string() })),
		describeRoute({
			summary: "Remove user like",
			tags: ["Likes"],
		}),
		async (c) => {
			try {
				const user = c.get("user");
				const { userId } = c.req.valid("param");

				// 删除点赞
				await db.userLike.deleteMany({
					where: {
						userId: user.id,
						likedUserId: userId,
					},
				});

				return c.json({ success: true });
			} catch (error) {
				console.error("Error removing like:", error);
				return c.json({ error: "Internal server error" }, 500);
			}
		},
	)
	// Get user likes
	.get(
		"/likes",
		validator(
			"query",
			z.object({
				page: z
					.string()
					.transform((val) => Number.parseInt(val) || 1)
					.optional(),
				limit: z
					.string()
					.transform((val) => Number.parseInt(val) || 20)
					.optional(),
			}),
		),
		describeRoute({
			summary: "Get user likes",
			tags: ["Likes"],
		}),
		async (c) => {
			try {
				const user = c.get("user");
				const params = c.req.valid("query");
				const page = params.page || 1;
				const limit = params.limit || 20;
				const offset = (page - 1) * limit;

				// 获取用户点赞的用户列表
				const likesQuery = db.userLike.findMany({
					where: {
						userId: user.id,
						likedUser: {
							profilePublic: true,
						},
					},
					include: {
						likedUser: {
							select: {
								id: true,
								name: true,
								username: true,
								image: true,
								bio: true,
								region: true,
								userRoleString: true,
								skills: true,
								createdAt: true,
							},
						},
					},
					orderBy: {
						createdAt: "desc",
					},
					skip: offset,
					take: limit,
				});

				// 获取总数用于分页
				const totalQuery = db.userLike.count({
					where: {
						userId: user.id,
						likedUser: {
							profilePublic: true,
						},
					},
				});

				const [likes, total] = await Promise.all([
					likesQuery,
					totalQuery,
				]);

				const processedUsers = likes.map((like) => ({
					...like.likedUser,
					likeDate: like.createdAt,
				}));

				return c.json({
					success: true,
					data: {
						users: processedUsers,
						pagination: {
							page,
							limit,
							total,
							totalPages: Math.ceil(total / limit),
						},
					},
				});
			} catch (error) {
				console.error("Error fetching likes:", error);
				return c.json({ error: "Internal server error" }, 500);
			}
		},
	);
