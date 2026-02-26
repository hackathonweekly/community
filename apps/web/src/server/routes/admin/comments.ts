import { Hono } from "hono";
import { auth } from "@community/lib-server/auth/auth";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { CommentQueries } from "@community/lib-server/database/prisma/queries/comments";
import { SystemConfigService } from "@community/lib-server/system-config/service";
import { CommentStatus, CommentEntityType } from "@prisma/client";

const app = new Hono();

// 验证超级管理员权限
async function requireSuperAdmin(c: any) {
	const session = await auth.api.getSession({ headers: c.req.raw.headers });
	if (!session?.user?.id) {
		return c.json({ error: "请先登录" }, 401);
	}

	// 检查是否是超级管理员（这里需要根据你的作品实际权限系统调整）
	const { db } = await import("@community/lib-server/database/prisma/client");
	const user = await db.user.findUnique({
		where: { id: session.user.id },
		select: { role: true },
	});

	if (user?.role !== "super_admin") {
		return c.json({ error: "权限不足" }, 403);
	}

	return session;
}

// 验证 schemas
const batchUpdateSchema = z.object({
	commentIds: z.array(z.string()),
	status: z.nativeEnum(CommentStatus),
});

const batchDeleteSchema = z.object({
	commentIds: z.array(z.string()),
});

const configUpdateSchema = z.object({
	enabled: z.boolean().optional(),
	requireApproval: z.boolean().optional(),
	maxLength: z.number().min(1).max(10000).optional(),
	allowAnonymous: z.boolean().optional(),
	rateLimit: z.number().min(1).max(1000).optional(),
});

const commentFilterSchema = z.object({
	page: z.string().default("1").transform(Number),
	limit: z.string().default("20").transform(Number),
	status: z.nativeEnum(CommentStatus).optional(),
	entityType: z.nativeEnum(CommentEntityType).optional(),
	isDeleted: z
		.enum(["true", "false"])
		.transform((val) => val === "true")
		.optional(),
	userId: z.string().optional(),
	search: z.string().optional(),
});

// 获取评论列表（管理员视图）
app.get("/", zValidator("query", commentFilterSchema), async (c) => {
	const session = await requireSuperAdmin(c);
	if (session.status) {
		return session; // 权限检查失败
	}

	try {
		const query = c.req.valid("query");
		const { page, limit, search, ...filters } = query;

		const result = await CommentQueries.getCommentsForAdmin({
			filters,
			page,
			limit,
			orderBy: "createdAt",
			orderDirection: "desc",
		});

		return c.json(result);
	} catch (error) {
		console.error("获取评论列表失败:", error);
		return c.json({ error: "获取评论列表失败" }, 500);
	}
});

// 获取评论统计
app.get("/stats", async (c) => {
	const session = await requireSuperAdmin(c);
	if (session.status) {
		return session;
	}

	try {
		const { db } = await import(
			"@community/lib-server/database/prisma/client"
		);

		const [total, active, hidden, reviewing, rejected, deleted] =
			await Promise.all([
				db.comment.count(),
				db.comment.count({
					where: { status: "ACTIVE", isDeleted: false },
				}),
				db.comment.count({
					where: { status: "HIDDEN", isDeleted: false },
				}),
				db.comment.count({
					where: { status: "REVIEWING", isDeleted: false },
				}),
				db.comment.count({
					where: { status: "REJECTED", isDeleted: false },
				}),
				db.comment.count({ where: { isDeleted: true } }),
			]);

		return c.json({
			total,
			active,
			hidden,
			reviewing,
			rejected,
			deleted,
		});
	} catch (error) {
		console.error("获取统计数据失败:", error);
		return c.json({ error: "获取统计数据失败" }, 500);
	}
});

// 批量更新评论状态
app.post("/batch-update", zValidator("json", batchUpdateSchema), async (c) => {
	const session = await requireSuperAdmin(c);
	if (session.status) {
		return session;
	}

	try {
		const { commentIds, status } = c.req.valid("json");

		await CommentQueries.batchUpdateStatus(commentIds, status);

		// 记录管理员操作日志
		const { db } = await import(
			"@community/lib-server/database/prisma/client"
		);
		await db.adminLog.create({
			data: {
				adminId: session.user.id,
				action: "BATCH_UPDATE_COMMENTS",
				targetType: "comment",
				targetId: commentIds.join(","),
				details: {
					commentIds,
					newStatus: status,
					timestamp: new Date().toISOString(),
				},
			},
		});

		return c.json({ success: true });
	} catch (error) {
		console.error("批量更新失败:", error);
		return c.json({ error: "批量更新失败" }, 500);
	}
});

// 批量删除评论
app.post("/batch-delete", zValidator("json", batchDeleteSchema), async (c) => {
	const session = await requireSuperAdmin(c);
	if (session.status) {
		return session;
	}

	try {
		const { commentIds } = c.req.valid("json");

		// 软删除评论
		const { db } = await import(
			"@community/lib-server/database/prisma/client"
		);
		await db.comment.updateMany({
			where: { id: { in: commentIds } },
			data: {
				isDeleted: true,
				deletedAt: new Date(),
				deletedBy: session.user.id,
			},
		});

		// 记录管理员操作日志
		await db.adminLog.create({
			data: {
				adminId: session.user.id,
				action: "BATCH_DELETE_COMMENTS",
				targetType: "comment",
				targetId: commentIds.join(","),
				details: {
					commentIds,
					timestamp: new Date().toISOString(),
				},
			},
		});

		return c.json({ success: true });
	} catch (error) {
		console.error("批量删除失败:", error);
		return c.json({ error: "批量删除失败" }, 500);
	}
});

// 获取评论系统配置
app.get("/config", async (c) => {
	const session = await requireSuperAdmin(c);
	if (session.status) {
		return session;
	}

	try {
		const config = await SystemConfigService.getCommentConfig();
		return c.json(config);
	} catch (error) {
		console.error("获取配置失败:", error);
		return c.json({ error: "获取配置失败" }, 500);
	}
});

// 更新评论系统配置
app.post("/config", zValidator("json", configUpdateSchema), async (c) => {
	const session = await requireSuperAdmin(c);
	if (session.status) {
		return session;
	}

	try {
		const config = c.req.valid("json");

		await SystemConfigService.setCommentConfig(config, session.user.id);

		// 记录管理员操作日志
		const { db } = await import(
			"@community/lib-server/database/prisma/client"
		);
		await db.adminLog.create({
			data: {
				adminId: session.user.id,
				action: "UPDATE_COMMENT_CONFIG",
				targetType: "system_config",
				targetId: "comment_config",
				details: {
					config,
					timestamp: new Date().toISOString(),
				},
			},
		});

		return c.json({ success: true });
	} catch (error) {
		console.error("更新配置失败:", error);
		return c.json({ error: "更新配置失败" }, 500);
	}
});

// 获取单个评论详情（管理员视图）
app.get("/:commentId", async (c) => {
	const session = await requireSuperAdmin(c);
	if (session.status) {
		return session;
	}

	try {
		const { commentId } = c.req.param();

		const { db } = await import(
			"@community/lib-server/database/prisma/client"
		);
		const comment = await db.comment.findUnique({
			where: { id: commentId },
			include: {
				user: {
					select: {
						id: true,
						name: true,
						username: true,
						email: true,
						image: true,
					},
				},
				deleter: {
					select: {
						id: true,
						name: true,
						username: true,
					},
				},
				_count: {
					select: {
						likes: true,
						replies: true,
					},
				},
			},
		});

		if (!comment) {
			return c.json({ error: "评论不存在" }, 404);
		}

		return c.json(comment);
	} catch (error) {
		console.error("获取评论详情失败:", error);
		return c.json({ error: "获取评论详情失败" }, 500);
	}
});

// 更新单个评论状态
app.put(
	"/:commentId/status",
	zValidator(
		"json",
		z.object({
			status: z.nativeEnum(CommentStatus),
		}),
	),
	async (c) => {
		const session = await requireSuperAdmin(c);
		if (session.status) {
			return session;
		}

		try {
			const { commentId } = c.req.param();
			const { status } = c.req.valid("json");

			const updatedComment = await CommentQueries.update(commentId, {
				status,
			});

			// 记录管理员操作日志
			const { db } = await import(
				"@community/lib-server/database/prisma/client"
			);
			await db.adminLog.create({
				data: {
					adminId: session.user.id,
					action: "UPDATE_COMMENT_STATUS",
					targetType: "comment",
					targetId: commentId,
					details: {
						commentId,
						newStatus: status,
						timestamp: new Date().toISOString(),
					},
				},
			});

			return c.json(updatedComment);
		} catch (error) {
			console.error("更新评论状态失败:", error);
			return c.json({ error: "更新评论状态失败" }, 500);
		}
	},
);

// 删除单个评论
app.delete("/:commentId", async (c) => {
	const session = await requireSuperAdmin(c);
	if (session.status) {
		return session;
	}

	try {
		const { commentId } = c.req.param();

		await CommentQueries.softDelete(commentId, session.user.id);

		// 记录管理员操作日志
		const { db } = await import(
			"@community/lib-server/database/prisma/client"
		);
		await db.adminLog.create({
			data: {
				adminId: session.user.id,
				action: "DELETE_COMMENT",
				targetType: "comment",
				targetId: commentId,
				details: {
					commentId,
					timestamp: new Date().toISOString(),
				},
			},
		});

		return c.json({ success: true });
	} catch (error) {
		console.error("删除评论失败:", error);
		return c.json({ error: "删除评论失败" }, 500);
	}
});

export default app;
