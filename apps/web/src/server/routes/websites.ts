import { db } from "@community/lib-server/database/prisma/client";
import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { validator } from "hono-openapi/zod";
import { z } from "zod";
import { authMiddleware } from "../middleware/auth";

const createWebsiteSchema = z.object({
	name: z.string().min(1, "Website name is required").max(100),
	url: z.string().url("Invalid URL"),
	description: z.string().max(500).optional(),
	category: z.string().max(50).optional(),
	tags: z.array(z.string()).max(10).default([]),
	organizationId: z.string().optional(),
});

export const websitesRouter = new Hono()
	// Public routes
	.get(
		"/",
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
				category: z.string().optional(),
				search: z.string().optional(),
			}),
		),
		describeRoute({
			summary: "Get public websites",
			tags: ["Websites"],
		}),
		async (c) => {
			try {
				const params = c.req.valid("query");
				const page = params.page || 1;
				const limit = Math.min(params.limit || 20, 100);
				const offset = (page - 1) * limit;

				const where: any = {
					isApproved: true,
				};

				if (params.category) {
					where.category = params.category;
				}

				if (params.search) {
					where.OR = [
						{
							name: {
								contains: params.search,
								mode: "insensitive" as const,
							},
						},
						{
							description: {
								contains: params.search,
								mode: "insensitive" as const,
							},
						},
						{
							tags: {
								hasSome: [params.search],
							},
						},
					];
				}

				const [websites, total] = await Promise.all([
					db.website.findMany({
						where,
						include: {
							submitter: {
								select: {
									id: true,
									name: true,
									username: true,
									image: true,
								},
							},
							_count: {
								select: {
									likes: true,
								},
							},
						},
						orderBy: [{ likeCount: "desc" }, { createdAt: "desc" }],
						skip: offset,
						take: limit,
					}),
					db.website.count({ where }),
				]);

				return c.json({
					success: true,
					data: {
						websites,
						pagination: {
							page,
							limit,
							total,
							totalPages: Math.ceil(total / limit),
						},
					},
				});
			} catch (error) {
				console.error("Error fetching websites:", error);
				return c.json({ error: "Internal server error" }, 500);
			}
		},
	)
	// Protected routes
	.use(authMiddleware)
	.post(
		"/",
		validator("json", createWebsiteSchema),
		describeRoute({
			summary: "Submit website",
			tags: ["Websites"],
		}),
		async (c) => {
			try {
				const user = c.get("user");
				const data = c.req.valid("json");

				// Check if URL already exists
				const existingWebsite = await db.website.findFirst({
					where: { url: data.url },
				});

				if (existingWebsite) {
					return c.json({ error: "Website already exists" }, 409);
				}

				const website = await db.website.create({
					data: {
						...data,
						submittedBy: user.id,
					},
					include: {
						submitter: {
							select: {
								id: true,
								name: true,
								username: true,
								image: true,
							},
						},
					},
				});

				return c.json({
					success: true,
					data: website,
				});
			} catch (error) {
				console.error("Error submitting website:", error);
				return c.json({ error: "Internal server error" }, 500);
			}
		},
	)
	// Like website
	.post(
		"/:websiteId/like",
		validator("param", z.object({ websiteId: z.string() })),
		describeRoute({
			summary: "Like website",
			tags: ["Websites", "Likes"],
		}),
		async (c) => {
			try {
				const user = c.get("user");
				const { websiteId } = c.req.valid("param");

				// 检查网站是否存在且已批准
				const website = await db.website.findFirst({
					where: {
						id: websiteId,
						isApproved: true,
					},
				});

				if (!website) {
					return c.json({ error: "Website not found" }, 404);
				}

				// 检查是否已经点赞
				const existingLike = await db.websiteLike.findUnique({
					where: {
						userId_websiteId: {
							userId: user.id,
							websiteId,
						},
					},
				});

				if (existingLike) {
					return c.json({ error: "Already liked" }, 409);
				}

				// 创建点赞并更新计数
				await db.$transaction([
					db.websiteLike.create({
						data: {
							userId: user.id,
							websiteId,
						},
					}),
					db.website.update({
						where: { id: websiteId },
						data: { likeCount: { increment: 1 } },
					}),
				]);

				return c.json({ success: true });
			} catch (error) {
				console.error("Error liking website:", error);
				return c.json({ error: "Internal server error" }, 500);
			}
		},
	)
	// Remove website like
	.delete(
		"/:websiteId/like",
		validator("param", z.object({ websiteId: z.string() })),
		describeRoute({
			summary: "Remove website like",
			tags: ["Websites", "Likes"],
		}),
		async (c) => {
			try {
				const user = c.get("user");
				const { websiteId } = c.req.valid("param");

				// 检查是否存在点赞记录
				const existingLike = await db.websiteLike.findUnique({
					where: {
						userId_websiteId: {
							userId: user.id,
							websiteId,
						},
					},
				});

				if (!existingLike) {
					return c.json({ success: true }); // 已经没有点赞了
				}

				// 删除点赞并更新计数
				await db.$transaction([
					db.websiteLike.delete({
						where: {
							userId_websiteId: {
								userId: user.id,
								websiteId,
							},
						},
					}),
					db.website.update({
						where: { id: websiteId },
						data: { likeCount: { decrement: 1 } },
					}),
				]);

				return c.json({ success: true });
			} catch (error) {
				console.error("Error removing website like:", error);
				return c.json({ error: "Internal server error" }, 500);
			}
		},
	)
	// Record website click
	.post(
		"/:websiteId/click",
		validator("param", z.object({ websiteId: z.string() })),
		describeRoute({
			summary: "Record website click",
			tags: ["Websites"],
		}),
		async (c) => {
			try {
				const { websiteId } = c.req.valid("param");

				// 更新点击计数（无需认证，任何人都可以点击）
				await db.website.update({
					where: { id: websiteId, isApproved: true },
					data: { clickCount: { increment: 1 } },
				});

				return c.json({ success: true });
			} catch (error) {
				console.error("Error recording website click:", error);
				return c.json({ error: "Internal server error" }, 500);
			}
		},
	);
