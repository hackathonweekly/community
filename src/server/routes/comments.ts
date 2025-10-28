import { Hono } from "hono";
import { auth } from "@/lib/auth/auth";
import { CommentQueries } from "@/lib/database/prisma/queries/comments";
import { NotificationService } from "@/features/notifications/service";
import { SystemConfigService } from "@/config/service";
import { db } from "@/lib/database/prisma/client";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { CommentEntityType, CommentStatus } from "@prisma/client";
import { ContentType, createContentValidator } from "@/lib/content-moderation";
import { canUserDoAction, RestrictedAction } from "@/features/permissions";
import { getVisitorRestrictionsConfig } from "@/config/visitor-restrictions";

const app = new Hono();

// Validation schemas
const createCommentSchema = z.object({
	content: z.string().min(1).max(2000),
	entityType: z.nativeEnum(CommentEntityType),
	entityId: z.string(),
	parentId: z.string().optional(),
	replyToId: z.string().optional(),
});

const updateCommentSchema = z.object({
	content: z.string().min(1).max(2000).optional(),
	status: z.nativeEnum(CommentStatus).optional(),
});

const validateCommentContent = createContentValidator({
	content: { type: ContentType.COMMENT_CONTENT, skipIfEmpty: false },
});

const commentQuerySchema = z.object({
	page: z.string().transform(Number).default("1"),
	limit: z.string().transform(Number).default("20"),
	orderBy: z.enum(["createdAt", "likeCount"]).default("createdAt"),
	orderDirection: z.enum(["asc", "desc"]).default("desc"),
});

// 检查评论功能是否开启
async function checkCommentEnabled() {
	const isEnabled = await SystemConfigService.get("comments.enabled", true);
	if (!isEnabled) {
		throw new Error("评论功能已关闭");
	}
}

// 获取实体评论列表
app.get(
	"/entity/:entityType/:entityId",
	zValidator("query", commentQuerySchema),
	async (c) => {
		try {
			await checkCommentEnabled();

			const { entityType, entityId } = c.req.param();
			const { page, limit, orderBy, orderDirection } =
				c.req.valid("query");

			if (
				!Object.values(CommentEntityType).includes(
					entityType as CommentEntityType,
				)
			) {
				return c.json({ error: "无效的实体类型" }, 400);
			}

			const result = await CommentQueries.getComments({
				entityType: entityType as CommentEntityType,
				entityId,
				page,
				limit,
				orderBy,
				orderDirection,
			});

			// 如果用户已登录，检查点赞状态
			const session = await auth.api.getSession({
				headers: c.req.raw.headers,
			});
			if (session?.user?.id) {
				const commentIds = result.comments.map((comment) => comment.id);
				if (commentIds.length > 0) {
					const { db } = await import("@/lib/database/prisma/client");
					const likes = await db.commentLike.findMany({
						where: {
							userId: session.user.id,
							commentId: { in: commentIds },
						},
						select: { commentId: true },
					});
					const likedCommentIds = new Set(
						likes.map((like) => like.commentId),
					);

					result.comments = result.comments.map((comment) => ({
						...comment,
						isLikedByUser: likedCommentIds.has(comment.id),
					}));
				}
			}

			return c.json(result);
		} catch (error) {
			console.error("获取评论列表失败:", error);
			return c.json({ error: "获取评论列表失败" }, 500);
		}
	},
);

// 获取单个评论及其回复
app.get("/:commentId", zValidator("query", commentQuerySchema), async (c) => {
	try {
		await checkCommentEnabled();

		const { commentId } = c.req.param();
		const { page, limit } = c.req.valid("query");

		const session = await auth.api.getSession({
			headers: c.req.raw.headers,
		});

		const result = await CommentQueries.getCommentWithReplies(
			commentId,
			session?.user?.id,
			page,
			limit,
		);

		if (!result) {
			return c.json({ error: "评论不存在" }, 404);
		}

		return c.json(result);
	} catch (error) {
		console.error("获取评论详情失败:", error);
		return c.json({ error: "获取评论详情失败" }, 500);
	}
});

// 创建评论
app.post("/", zValidator("json", createCommentSchema), async (c) => {
	try {
		await checkCommentEnabled();

		const session = await auth.api.getSession({
			headers: c.req.raw.headers,
		});
		if (!session?.user?.id) {
			return c.json({ error: "请先登录" }, 401);
		}

		// Check L0 user (VISITOR) permissions
		const user = await db.user.findUnique({
			where: { id: session.user.id },
			select: { membershipLevel: true },
		});

		if (!user) {
			return c.json({ error: "用户不存在" }, 404);
		}

		const restrictions = await getVisitorRestrictionsConfig();
		const membership = { membershipLevel: user.membershipLevel };
		const { allowed, reason } = canUserDoAction(
			membership,
			RestrictedAction.CREATE_COMMENT,
			restrictions,
		);

		if (!allowed) {
			return c.json(
				{
					error:
						reason ??
						"发表评论需要成为共创伙伴，请联系社区负责人！",
				},
				403,
			);
		}

		const data = c.req.valid("json");

		// 检查是否为回复评论，验证父评论存在
		if (data.parentId) {
			const parentComment = await db.comment.findUnique({
				where: { id: data.parentId },
				select: {
					id: true,
					userId: true,
					entityType: true,
					entityId: true,
				},
			});

			if (!parentComment) {
				return c.json({ error: "父评论不存在" }, 400);
			}

			// 验证是在同一个实体下回复
			if (
				parentComment.entityType !== data.entityType ||
				parentComment.entityId !== data.entityId
			) {
				return c.json({ error: "无法跨实体回复评论" }, 400);
			}
		}

		// 内容安全审核
		const commentModeration = await validateCommentContent({
			content: data.content,
		});

		if (!commentModeration.isValid) {
			console.warn("Comment content moderation failed:", {
				userId: session.user.id,
				entityType: data.entityType,
				entityId: data.entityId,
				errors: commentModeration.errors,
				result: commentModeration.results.content,
			});
			return c.json(
				{
					error: "内容审核未通过",
					details: commentModeration.errors,
				},
				400,
			);
		}

		const comment = await CommentQueries.create({
			...data,
			userId: session.user.id,
		});

		// 发送通知
		try {
			if (data.parentId) {
				// 回复通知
				const { db } = await import("@/lib/database/prisma/client");
				const parentComment = await db.comment.findUnique({
					where: { id: data.parentId },
					select: { userId: true },
				});

				if (parentComment) {
					// 获取实体标题用于通知
					const entityTitle = await getEntityTitle(
						data.entityType,
						data.entityId,
					);

					await NotificationService.notifyCommentReply(
						data.parentId,
						parentComment.userId,
						session.user.id,
						session.user.name,
						data.entityType,
						data.entityId,
						entityTitle,
					);
				}
			}
		} catch (notificationError) {
			console.error("发送评论通知失败:", notificationError);
			// 不影响评论创建，继续执行
		}

		return c.json(comment);
	} catch (error) {
		console.error("创建评论失败:", error);
		return c.json({ error: "创建评论失败" }, 500);
	}
});

// 更新评论
app.put("/:commentId", zValidator("json", updateCommentSchema), async (c) => {
	try {
		const session = await auth.api.getSession({
			headers: c.req.raw.headers,
		});
		if (!session?.user?.id) {
			return c.json({ error: "请先登录" }, 401);
		}

		const { commentId } = c.req.param();
		const data = c.req.valid("json");

		// 检查权限
		const canManage = await CommentQueries.canUserManageComment(
			commentId,
			session.user.id,
		);
		if (!canManage) {
			return c.json({ error: "无权限操作此评论" }, 403);
		}

		if (data.content !== undefined) {
			const commentModeration = await validateCommentContent({
				content: data.content,
			});

			if (!commentModeration.isValid) {
				console.warn("Comment update moderation failed:", {
					commentId,
					userId: session.user.id,
					errors: commentModeration.errors,
					result: commentModeration.results.content,
				});
				return c.json(
					{
						error: "内容审核未通过",
						details: commentModeration.errors,
					},
					400,
				);
			}
		}

		const updatedComment = await CommentQueries.update(commentId, data);
		return c.json(updatedComment);
	} catch (error) {
		console.error("更新评论失败:", error);
		return c.json({ error: "更新评论失败" }, 500);
	}
});

// 删除评论
app.delete("/:commentId", async (c) => {
	try {
		const session = await auth.api.getSession({
			headers: c.req.raw.headers,
		});
		if (!session?.user?.id) {
			return c.json({ error: "请先登录" }, 401);
		}

		const { commentId } = c.req.param();

		// 检查权限
		const canManage = await CommentQueries.canUserManageComment(
			commentId,
			session.user.id,
		);
		if (!canManage) {
			return c.json({ error: "无权限删除此评论" }, 403);
		}

		await CommentQueries.softDelete(commentId, session.user.id);
		return c.json({ success: true });
	} catch (error) {
		console.error("删除评论失败:", error);
		return c.json({ error: "删除评论失败" }, 500);
	}
});

// 点赞/取消点赞评论
app.post("/:commentId/like", async (c) => {
	try {
		await checkCommentEnabled();

		const session = await auth.api.getSession({
			headers: c.req.raw.headers,
		});
		if (!session?.user?.id) {
			return c.json({ error: "请先登录" }, 401);
		}

		const { commentId } = c.req.param();
		const result = await CommentQueries.toggleLike(
			commentId,
			session.user.id,
		);

		// 发送点赞通知
		if (result.liked) {
			try {
				const { db } = await import("@/lib/database/prisma/client");
				const comment = await db.comment.findUnique({
					where: { id: commentId },
					select: {
						userId: true,
						entityType: true,
						entityId: true,
					},
				});

				if (comment && comment.userId !== session.user.id) {
					const entityTitle = await getEntityTitle(
						comment.entityType,
						comment.entityId,
					);

					await NotificationService.notifyCommentLike(
						commentId,
						comment.userId,
						session.user.id,
						session.user.name,
						comment.entityType,
						comment.entityId,
						entityTitle,
					);
				}
			} catch (notificationError) {
				console.error("发送点赞通知失败:", notificationError);
				// 不影响点赞操作
			}
		}

		return c.json(result);
	} catch (error) {
		console.error("点赞操作失败:", error);
		return c.json({ error: "点赞操作失败" }, 500);
	}
});

// 获取实体评论统计
app.get("/stats/:entityType/:entityId", async (c) => {
	try {
		const { entityType, entityId } = c.req.param();

		if (
			!Object.values(CommentEntityType).includes(
				entityType as CommentEntityType,
			)
		) {
			return c.json({ error: "无效的实体类型" }, 400);
		}

		const stats = await CommentQueries.getEntityCommentStats(
			entityType as CommentEntityType,
			entityId,
		);

		return c.json(stats);
	} catch (error) {
		console.error("获取评论统计失败:", error);
		return c.json({ error: "获取评论统计失败" }, 500);
	}
});

// 获取用户评论历史
app.get("/user/:userId", zValidator("query", commentQuerySchema), async (c) => {
	try {
		const { userId } = c.req.param();
		const { page, limit } = c.req.valid("query");

		const session = await auth.api.getSession({
			headers: c.req.raw.headers,
		});
		const includeDeleted = session?.user?.id === userId; // 只有本人可以看到已删除的评论

		const result = await CommentQueries.getUserComments(
			userId,
			page,
			limit,
			includeDeleted,
		);
		return c.json(result);
	} catch (error) {
		console.error("获取用户评论失败:", error);
		return c.json({ error: "获取用户评论失败" }, 500);
	}
});

// 辅助函数：获取实体标题
async function getEntityTitle(
	entityType: CommentEntityType,
	entityId: string,
): Promise<string> {
	const { db } = await import("@/lib/database/prisma/client");

	try {
		switch (entityType) {
			case "PROJECT": {
				const project = await db.project.findUnique({
					where: { id: entityId },
					select: { title: true },
				});
				return project?.title || "未知作品";
			}

			case "EVENT": {
				const event = await db.event.findUnique({
					where: { id: entityId },
					select: { title: true },
				});
				return event?.title || "未知活动";
			}

			case "TASK": {
				const task = await db.communityTask.findUnique({
					where: { id: entityId },
					select: { title: true },
				});
				return task?.title || "未知任务";
			}

			default:
				return "未知内容";
		}
	} catch (error) {
		console.error("获取实体标题失败:", error);
		return "未知内容";
	}
}

export default app;
