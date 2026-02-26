import { auth } from "@community/lib-server/auth";
import { db } from "@community/lib-server/database/prisma/client";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";

const userSearchSchema = z.object({
	query: z.string().min(2, "Search query must be at least 2 characters"),
	limit: z
		.string()
		.optional()
		.default("10")
		.transform((val) => Number.parseInt(val)),
});

const app = new Hono();

// GET /api/users/search - 搜索用户（需要认证）
app.get("/search", zValidator("query", userSearchSchema), async (c) => {
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

		const { query, limit } = c.req.valid("query");

		// 搜索用户名、姓名或手机号
		const users = await db.user.findMany({
			where: {
				OR: [
					{
						name: {
							contains: query,
							mode: "insensitive",
						},
					},
					{
						username: {
							contains: query,
							mode: "insensitive",
						},
					},
					{
						phoneNumber: {
							contains: query,
						},
					},
				],
			},
			select: {
				id: true,
				name: true,
				username: true,
				image: true,
				userRoleString: true,
				membershipLevel: true,
				currentWorkOn: true,
			},
			take: Math.min(limit, 50), // 最多返回50个结果
		});

		return c.json({
			success: true,
			data: users,
		});
	} catch (error) {
		console.error("Error searching users:", error);
		return c.json(
			{
				success: false,
				error: "Failed to search users",
			},
			500,
		);
	}
});

export { app as usersRouter };
