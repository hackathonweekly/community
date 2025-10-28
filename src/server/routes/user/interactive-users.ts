import { auth } from "@/lib/auth";
import { db } from "@/lib/database";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";

const getInteractiveUsersSchema = z.object({
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

// GET /api/user/interactive-users - 获取与当前用户有互动的用户
app.get("/", zValidator("query", getInteractiveUsersSchema), async (c) => {
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

		// 查找与当前用户参加过相同活动的其他用户
		// 通过 EventRegistration 表找到共同参加过活动的用户
		const interactiveUsersQuery = db.user.findMany({
			where: {
				AND: [
					// 不包括自己
					{ id: { not: session.user.id } },
					// 必须有公开的个人资料
					{ profilePublic: true },
					// 通过活动注册表关联，找到参加过相同活动的用户
					{
						eventRegistrations: {
							some: {
								event: {
									registrations: {
										some: {
											userId: session.user.id,
											status: "APPROVED",
										},
									},
								},
								status: "APPROVED",
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
				// 获取共同参加的活动数量
				eventRegistrations: {
					where: {
						status: "APPROVED",
						event: {
							registrations: {
								some: {
									userId: session.user.id,
									status: "APPROVED",
								},
							},
						},
					},
					select: {
						id: true,
						event: {
							select: {
								id: true,
								title: true,
							},
						},
					},
				},
			},
			orderBy: {
				createdAt: "desc", // 按最新加入时间排序
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
						eventRegistrations: {
							some: {
								event: {
									registrations: {
										some: {
											userId: session.user.id,
											status: "APPROVED",
										},
									},
								},
								status: "APPROVED",
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
			interactiveUsersQuery,
			totalQuery,
		]);

		// 处理用户数据，添加共同活动信息
		const processedUsers = users.map((user) => ({
			...user,
			commonEventsCount: user.eventRegistrations.length,
			commonEvents: user.eventRegistrations.map((reg) => reg.event),
			// 移除 eventRegistrations 避免返回过多数据
			eventRegistrations: undefined,
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
				search: search || null,
			},
		});
	} catch (error) {
		console.error("Error fetching interactive users:", error);
		return c.json(
			{
				success: false,
				error: "Failed to fetch interactive users",
			},
			500,
		);
	}
});

export default app;
