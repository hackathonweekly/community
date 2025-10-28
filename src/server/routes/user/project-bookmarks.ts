import { db } from "@/lib/database/prisma/client";
import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { validator } from "hono-openapi/zod";
import { z } from "zod";
import { authMiddleware } from "../../middleware/auth";

export const projectBookmarksRouter = new Hono().use(authMiddleware).get(
	"/project-bookmarks",
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
		summary: "Get user project bookmarks",
		tags: ["User"],
	}),
	async (c) => {
		try {
			const user = c.get("user");
			const params = c.req.valid("query");
			const page = params.page || 1;
			const limit = params.limit || 20;
			const offset = (page - 1) * limit;

			// 获取用户收藏的项目
			const bookmarksQuery = db.projectBookmark.findMany({
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
				skip: offset,
				take: limit,
			});

			// 获取总数用于分页
			const totalQuery = db.projectBookmark.count({
				where: {
					userId: user.id,
				},
			});

			const [bookmarks, total] = await Promise.all([
				bookmarksQuery,
				totalQuery,
			]);

			// 处理项目数据
			const processedProjects = bookmarks
				.filter((bookmark) => bookmark.project) // 过滤掉没有关联项目的收藏
				.map((bookmark) => ({
					...bookmark.project,
					bookmarkDate: bookmark.createdAt,
				}));

			return c.json({
				success: true,
				data: {
					projects: processedProjects,
					pagination: {
						page,
						limit,
						total,
						totalPages: Math.ceil(total / limit),
					},
				},
			});
		} catch (error) {
			console.error("Error fetching project bookmarks:", error);
			return c.json({ error: "Internal server error" }, 500);
		}
	},
);
