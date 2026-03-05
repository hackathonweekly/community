import { auth } from "@community/lib-server/auth";
import { db } from "@community/lib-server/database";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";

const getFollowedUsersExcludingMutualSchema = z.object({
	page: z
		.string()
		.transform((val) => Number.parseInt(val) || 1)
		.optional(),
	limit: z
		.string()
		.transform((val) => Number.parseInt(val) || 20)
		.optional(),
	search: z.string().optional(),
});

const app = new Hono();

// GET /api/user/followed-users-excluding-mutual - 获取我关注的用户（排除互关好友）
app.get(
	"/",
	zValidator("query", getFollowedUsersExcludingMutualSchema),
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

			const params = c.req.valid("query");
			const page = params.page || 1;
			const limit = params.limit || 20;
			const search = params.search?.trim();
			const offset = (page - 1) * limit;

			// 查找我关注的用户，但排除互关好友
			// 我关注了他们，但他们没有关注我
			const followedUsersQuery = db.user.findMany({
				where: {
					AND: [
						// 不包括自己
						{ id: { not: session.user.id } },
						// 必须有公开的个人资料
						{ profilePublic: true },
						// 我关注了他们
						{
							followers: {
								some: {
									followerId: session.user.id,
								},
							},
						},
						// 他们没有关注我（排除互关好友）
						{
							following: {
								none: {
									followingId: session.user.id,
								},
							},
						},
						// 如果有搜索条件
						...(search
							? [
									{
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
									},
								]
							: []),
					],
				},
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
					githubUrl: true,
					twitterUrl: true,
					websiteUrl: true,
					wechatId: true,
					email: true,
					showEmail: true,
					showWechat: true,
					profilePublic: true,
					skills: true,
					createdAt: true,
				},
				orderBy: {
					createdAt: "desc",
				},
				skip: offset,
				take: limit,
			});

			// 获取总数用于分页
			const totalQuery = db.user.count({
				where: {
					AND: [
						{ id: { not: session.user.id } },
						{ profilePublic: true },
						{
							followers: {
								some: {
									followerId: session.user.id,
								},
							},
						},
						{
							following: {
								none: {
									followingId: session.user.id,
								},
							},
						},
						...(search
							? [
									{
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
									},
								]
							: []),
					],
				},
			});

			const [users, total] = await Promise.all([
				followedUsersQuery,
				totalQuery,
			]);

			return c.json({
				success: true,
				data: {
					users,
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
			console.error(
				"Error fetching followed users excluding mutual:",
				error,
			);
			return c.json(
				{
					success: false,
					error: "Failed to fetch followed users",
				},
				500,
			);
		}
	},
);

export default app;
