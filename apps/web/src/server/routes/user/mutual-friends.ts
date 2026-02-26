import { auth } from "@community/lib-server/auth";
import { db } from "@community/lib-server/database";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";

const getMutualFriendsSchema = z.object({
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

// GET /api/user/mutual-friends - 获取互关好友（互相关注的用户）
app.get("/", zValidator("query", getMutualFriendsSchema), async (c) => {
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

		// 查找互相关注的用户（互关好友）- 优化版本
		// 使用更高效的查询结构，减少字段选择
		const mutualFriendsQuery = db.user.findMany({
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
					// 他们也关注了我
					{
						following: {
							some: {
								followingId: session.user.id,
							},
						},
					},
					// 如果有搜索条件，简化搜索逻辑
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
										// 移除复杂的skills搜索，提高性能
									],
								},
							]
						: []),
				],
			},
			select: {
				// 只选择最必要的字段
				id: true,
				name: true,
				username: true,
				image: true,
				bio: true,
				userRoleString: true,
				region: true,
				showEmail: true,
				showWechat: true,
				profilePublic: true,
				createdAt: true,
			},
			orderBy: {
				createdAt: "desc",
			},
			skip: offset,
			take: limit,
		});

		// 获取总数用于分页 - 使用相同的优化逻辑
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
							some: {
								followingId: session.user.id,
							},
						},
					},
					// 简化搜索条件，与主查询保持一致
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
									],
								},
							]
						: []),
				],
			},
		});

		const [users, total] = await Promise.all([
			mutualFriendsQuery,
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
		console.error("Error fetching mutual friends:", error);
		return c.json(
			{
				success: false,
				error: "Failed to fetch mutual friends",
			},
			500,
		);
	}
});

export default app;
