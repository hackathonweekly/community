import { db } from "@community/lib-server/database/prisma/client";
import { NotificationService } from "@/features/notifications/service";
import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { validator } from "hono-openapi/zod";
import { z } from "zod";
import { authMiddleware } from "../../middleware/auth";

export const followsRouter = new Hono()
	.use(authMiddleware)
	.get(
		"/following",
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
				search: z.string().optional(),
			}),
		),
		describeRoute({
			summary: "Get user following list",
			tags: ["User"],
		}),
		async (c) => {
			try {
				const user = c.get("user");
				const params = c.req.valid("query");
				const page = params.page || 1;
				const limit = params.limit || 20;
				const search = params.search?.trim();
				const offset = (page - 1) * limit;

				// 构建搜索条件
				const searchCondition = search
					? {
							OR: [
								{
									name: {
										contains: search,
										mode: "insensitive" as const,
									},
								},
								{
									bio: {
										contains: search,
										mode: "insensitive" as const,
									},
								},
								{
									skills: {
										hasSome: [search],
									},
								},
							],
						}
					: undefined;

				// 获取用户关注的名片
				const followingQuery = db.userFollow.findMany({
					where: {
						followerId: user.id,
						following: {
							AND: [
								{ profilePublic: true },
								...(searchCondition ? [searchCondition] : []),
							],
						},
					},
					include: {
						following: {
							select: {
								id: true,
								name: true,
								username: true,
								image: true,
								bio: true,
								region: true,
								userRoleString: true,
								currentWorkOn: true,
								lifeStatus: true,
								profileViews: true,
								cpValue: true,
								profilePublic: true,
								githubUrl: true,
								twitterUrl: true,
								websiteUrl: true,
								wechatId: true,
								wechatQrCode: true,
								email: true,
								showEmail: true,
								showWechat: true,
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
				const totalQuery = db.userFollow.count({
					where: {
						followerId: user.id,
						following: {
							AND: [
								{ profilePublic: true },
								...(searchCondition ? [searchCondition] : []),
							],
						},
					},
				});

				const [following, total] = await Promise.all([
					followingQuery,
					totalQuery,
				]);

				// 检查互相关注状态
				const processedUsers = await Promise.all(
					following.map(async (follow) => {
						// 检查对方是否也关注了我
						const isMutualFollow = await db.userFollow.findUnique({
							where: {
								followerId_followingId: {
									followerId: follow.followingId,
									followingId: user.id,
								},
							},
						});

						return {
							...follow.following,
							followDate: follow.createdAt,
							isMutualFollow: !!isMutualFollow,
							// 只有互相关注时才显示微信信息
							wechatId:
								isMutualFollow && follow.following.showWechat
									? follow.following.wechatId
									: null,
							wechatQrCode:
								isMutualFollow && follow.following.showWechat
									? follow.following.wechatQrCode
									: null,
							email:
								isMutualFollow && follow.following.showEmail
									? follow.following.email
									: null,
						};
					}),
				);

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
						search: search || null,
					},
				});
			} catch (error) {
				console.error("Error fetching following:", error);
				return c.json({ error: "Internal server error" }, 500);
			}
		},
	)
	.get(
		"/followers",
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
				search: z.string().optional(),
			}),
		),
		describeRoute({
			summary: "Get users who follow me",
			tags: ["User"],
		}),
		async (c) => {
			try {
				const user = c.get("user");
				const params = c.req.valid("query");
				const page = params.page || 1;
				const limit = params.limit || 20;
				const search = params.search?.trim();
				const offset = (page - 1) * limit;

				// 构建搜索条件
				const searchCondition = search
					? {
							OR: [
								{
									name: {
										contains: search,
										mode: "insensitive" as const,
									},
								},
								{
									bio: {
										contains: search,
										mode: "insensitive" as const,
									},
								},
								{
									skills: {
										hasSome: [search],
									},
								},
							],
						}
					: undefined;

				// 获取关注了当前用户的用户列表
				const followersQuery = db.userFollow.findMany({
					where: {
						followingId: user.id,
						follower: {
							AND: [
								{ profilePublic: true },
								...(searchCondition ? [searchCondition] : []),
							],
						},
					},
					include: {
						follower: {
							select: {
								id: true,
								name: true,
								username: true,
								image: true,
								bio: true,
								region: true,
								userRoleString: true,
								githubUrl: true,
								twitterUrl: true,
								websiteUrl: true,
								wechatId: true,
								wechatQrCode: true,
								email: true,
								showEmail: true,
								showWechat: true,
								profilePublic: true,
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
				const totalQuery = db.userFollow.count({
					where: {
						followingId: user.id,
						follower: {
							AND: [
								{ profilePublic: true },
								...(searchCondition ? [searchCondition] : []),
							],
						},
					},
				});

				const [followers, total] = await Promise.all([
					followersQuery,
					totalQuery,
				]);

				// 检查互相关注状态
				const processedUsers = await Promise.all(
					followers.map(async (follow) => {
						// 检查我是否也关注了对方
						const isMutualFollow = await db.userFollow.findUnique({
							where: {
								followerId_followingId: {
									followerId: user.id,
									followingId: follow.followerId,
								},
							},
						});

						return {
							...follow.follower,
							followDate: follow.createdAt,
							isMutualFollow: !!isMutualFollow,
							// 只有互相关注时才显示微信信息
							wechatId:
								isMutualFollow && follow.follower.showWechat
									? follow.follower.wechatId
									: null,
							wechatQrCode:
								isMutualFollow && follow.follower.showWechat
									? follow.follower.wechatQrCode
									: null,
							email:
								isMutualFollow && follow.follower.showEmail
									? follow.follower.email
									: null,
						};
					}),
				);

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
						search: search || null,
					},
				});
			} catch (error) {
				console.error("Error fetching followers:", error);
				return c.json({ error: "Internal server error" }, 500);
			}
		},
	)
	.post(
		"/:userId/follow",
		validator("param", z.object({ userId: z.string() })),
		describeRoute({
			summary: "Follow user",
			tags: ["User"],
		}),
		async (c) => {
			try {
				const user = c.get("user");
				const { userId } = c.req.valid("param");

				// 不能关注自己
				if (userId === user.id) {
					return c.json({ error: "Cannot follow yourself" }, 400);
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

				// 检查是否已经关注
				const existingFollow = await db.userFollow.findUnique({
					where: {
						followerId_followingId: {
							followerId: user.id,
							followingId: userId,
						},
					},
				});

				if (existingFollow) {
					return c.json({ error: "Already following" }, 409);
				}

				// 创建关注
				await db.userFollow.create({
					data: {
						followerId: user.id,
						followingId: userId,
					},
				});

				// 创建通知
				try {
					await NotificationService.notifyUserFollowed(
						userId,
						user.id,
						user.name,
					);
				} catch (notificationError) {
					console.error(
						"Error creating follow notification:",
						notificationError,
					);
					// 不影响主要功能，继续执行
				}

				return c.json({ success: true });
			} catch (error) {
				console.error("Error following user:", error);
				return c.json({ error: "Internal server error" }, 500);
			}
		},
	)
	.delete(
		"/:userId/follow",
		validator("param", z.object({ userId: z.string() })),
		describeRoute({
			summary: "Unfollow user",
			tags: ["User"],
		}),
		async (c) => {
			try {
				const user = c.get("user");
				const { userId } = c.req.valid("param");

				// 删除关注
				await db.userFollow.deleteMany({
					where: {
						followerId: user.id,
						followingId: userId,
					},
				});

				return c.json({ success: true });
			} catch (error) {
				console.error("Error unfollowing user:", error);
				return c.json({ error: "Internal server error" }, 500);
			}
		},
	);
