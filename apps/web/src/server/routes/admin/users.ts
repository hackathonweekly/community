import { countAllUsers, getUsers } from "@community/lib-server/database";
import { db } from "@community/lib-server/database";
import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { validator } from "hono-openapi/zod";
import { z } from "zod";
import { adminMiddleware } from "../../middleware/admin";

export const userRouter = new Hono()
	.basePath("/users")
	.use(adminMiddleware)
	.get(
		"/",
		validator(
			"query",
			z.object({
				query: z.string().optional(),
				limit: z.string().optional().default("10").transform(Number),
				offset: z.string().optional().default("0").transform(Number),
			}),
		),
		describeRoute({
			summary: "Get all users",
			tags: ["Administration"],
		}),
		async (c) => {
			const { query, limit, offset } = c.req.valid("query");

			const users = await getUsers({
				limit,
				offset,
				query,
			});

			const total = await countAllUsers();

			return c.json({ users, total });
		},
	)
	.get(
		"/search",
		validator(
			"query",
			z.object({
				q: z.string().min(1, "搜索关键词不能为空"),
			}),
		),
		describeRoute({
			summary: "Search users for admin level management",
			tags: ["Administration"],
		}),
		async (c) => {
			const { q } = c.req.valid("query");

			try {
				// 搜索用户：支持用户名、邮箱、用户ID
				const users = await db.user.findMany({
					where: {
						OR: [
							{
								name: {
									contains: q,
									mode: "insensitive",
								},
							},
							{
								username: {
									contains: q,
									mode: "insensitive",
								},
							},
							{
								email: {
									contains: q,
									mode: "insensitive",
								},
							},
							{
								id: {
									equals: q,
								},
							},
						],
					},
					select: {
						id: true,
						name: true,
						username: true,
						email: true,
						membershipLevel: true,
					},
					take: 20, // 限制搜索结果数量
					orderBy: {
						createdAt: "desc",
					},
				});

				return c.json({
					success: true,
					users,
				});
			} catch (error) {
				console.error("搜索用户失败:", error);
				return c.json(
					{
						success: false,
						error: "搜索失败",
					},
					500,
				);
			}
		},
	);
