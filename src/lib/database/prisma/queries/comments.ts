import { db } from "@/lib/database/prisma/client";
import type { CommentEntityType, CommentStatus } from "@prisma/client";

export interface CreateCommentInput {
	content: string;
	userId: string;
	entityType: CommentEntityType;
	entityId: string;
	parentId?: string;
	replyToId?: string;
}

export interface UpdateCommentInput {
	content?: string;
	status?: CommentStatus;
}

export interface CommentFilters {
	entityType?: CommentEntityType;
	entityId?: string;
	userId?: string;
	status?: CommentStatus;
	parentId?: string | null;
}

/**
 * 创建评论
 */
export async function createComment(input: CreateCommentInput) {
	return db.$transaction(async (tx) => {
		// 创建评论
		const comment = await tx.comment.create({
			data: {
				content: input.content,
				userId: input.userId,
				entityType: input.entityType,
				entityId: input.entityId,
				parentId: input.parentId,
				replyToId: input.replyToId,
			},
			include: {
				user: {
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
						replies: true,
					},
				},
			},
		});

		// 如果是回复，更新父评论的回复数
		if (input.parentId) {
			await tx.comment.update({
				where: { id: input.parentId },
				data: {
					replyCount: {
						increment: 1,
					},
				},
			});
		}

		return comment;
	});
}

/**
 * 获取评论列表
 */
export async function getComments({
	entityType,
	entityId,
	parentId = null,
	page = 1,
	limit = 20,
	orderBy = "createdAt",
	orderDirection = "desc",
}: {
	entityType: CommentEntityType;
	entityId: string;
	parentId?: string | null;
	page?: number;
	limit?: number;
	orderBy?: "createdAt" | "likeCount";
	orderDirection?: "asc" | "desc";
}) {
	const offset = (page - 1) * limit;

	const [comments, total] = await Promise.all([
		db.comment.findMany({
			where: {
				entityType,
				entityId,
				parentId,
				status: "ACTIVE",
				isDeleted: false,
			},
			include: {
				user: {
					select: {
						id: true,
						name: true,
						username: true,
						image: true,
					},
				},
				replyTo: {
					include: {
						user: {
							select: {
								id: true,
								name: true,
								username: true,
							},
						},
					},
				},
				_count: {
					select: {
						likes: true,
						replies: true,
					},
				},
			},
			orderBy: {
				[orderBy]: orderDirection,
			},
			skip: offset,
			take: limit,
		}),
		db.comment.count({
			where: {
				entityType,
				entityId,
				parentId,
				status: "ACTIVE",
				isDeleted: false,
			},
		}),
	]);

	return {
		comments,
		pagination: {
			page,
			limit,
			total,
			totalPages: Math.ceil(total / limit),
		},
	};
}

/**
 * 获取单个评论及其回复
 */
export async function getCommentWithReplies(
	commentId: string,
	currentUserId?: string,
	repliesPage = 1,
	repliesLimit = 10,
) {
	const comment = await db.comment.findUnique({
		where: { id: commentId, isDeleted: false },
		include: {
			user: {
				select: {
					id: true,
					name: true,
					username: true,
					image: true,
				},
			},
			replyTo: {
				include: {
					user: {
						select: {
							id: true,
							name: true,
							username: true,
						},
					},
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
		return null;
	}

	// 获取回复
	const repliesOffset = (repliesPage - 1) * repliesLimit;
	const [replies, repliesTotal] = await Promise.all([
		db.comment.findMany({
			where: {
				parentId: commentId,
				status: "ACTIVE",
				isDeleted: false,
			},
			include: {
				user: {
					select: {
						id: true,
						name: true,
						username: true,
						image: true,
					},
				},
				replyTo: {
					include: {
						user: {
							select: {
								id: true,
								name: true,
								username: true,
							},
						},
					},
				},
				_count: {
					select: {
						likes: true,
						replies: true,
					},
				},
			},
			orderBy: { createdAt: "asc" },
			skip: repliesOffset,
			take: repliesLimit,
		}),
		db.comment.count({
			where: {
				parentId: commentId,
				status: "ACTIVE",
				isDeleted: false,
			},
		}),
	]);

	// 检查当前用户是否点赞了评论和回复
	let userLikes: string[] = [];
	if (currentUserId) {
		const commentIds = [commentId, ...replies.map((r) => r.id)];
		const likes = await db.commentLike.findMany({
			where: {
				userId: currentUserId,
				commentId: { in: commentIds },
			},
			select: { commentId: true },
		});
		userLikes = likes.map((like) => like.commentId);
	}

	return {
		comment: {
			...comment,
			isLikedByUser: userLikes.includes(commentId),
		},
		replies: replies.map((reply) => ({
			...reply,
			isLikedByUser: userLikes.includes(reply.id),
		})),
		repliesPagination: {
			page: repliesPage,
			limit: repliesLimit,
			total: repliesTotal,
			totalPages: Math.ceil(repliesTotal / repliesLimit),
		},
	};
}

/**
 * 更新评论
 */
export async function updateComment(
	commentId: string,
	input: UpdateCommentInput,
) {
	return db.comment.update({
		where: { id: commentId },
		data: {
			...input,
			updatedAt: new Date(),
		},
		include: {
			user: {
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
					replies: true,
				},
			},
		},
	});
}

/**
 * 软删除评论
 */
export async function softDeleteComment(commentId: string, deletedBy: string) {
	return db.comment.update({
		where: { id: commentId },
		data: {
			isDeleted: true,
			deletedAt: new Date(),
			deletedBy,
		},
	});
}

/**
 * 点赞/取消点赞评论
 */
export async function toggleCommentLike(commentId: string, userId: string) {
	return db.$transaction(async (tx) => {
		// 检查是否已经点赞
		const existingLike = await tx.commentLike.findUnique({
			where: {
				commentId_userId: {
					commentId,
					userId,
				},
			},
		});

		if (existingLike) {
			// 取消点赞
			await tx.commentLike.delete({
				where: { id: existingLike.id },
			});

			await tx.comment.update({
				where: { id: commentId },
				data: {
					likeCount: {
						decrement: 1,
					},
				},
			});

			return { liked: false };
		}

		// 点赞
		await tx.commentLike.create({
			data: {
				commentId,
				userId,
			},
		});

		await tx.comment.update({
			where: { id: commentId },
			data: {
				likeCount: {
					increment: 1,
				},
			},
		});

		return { liked: true };
	});
}

/**
 * 检查用户是否可以操作评论
 */
export async function canUserManageComment(
	commentId: string,
	userId: string,
): Promise<boolean> {
	const comment = await db.comment.findUnique({
		where: { id: commentId },
		select: { userId: true },
	});

	if (!comment) {
		return false;
	}
	return comment.userId === userId;
}

/**
 * 获取实体的评论统计
 */
export async function getEntityCommentStats(
	entityType: CommentEntityType,
	entityId: string,
) {
	const [totalComments, topLevelComments] = await Promise.all([
		db.comment.count({
			where: {
				entityType,
				entityId,
				status: "ACTIVE",
				isDeleted: false,
			},
		}),
		db.comment.count({
			where: {
				entityType,
				entityId,
				parentId: null,
				status: "ACTIVE",
				isDeleted: false,
			},
		}),
	]);

	return {
		totalComments,
		topLevelComments,
		replies: totalComments - topLevelComments,
	};
}

/**
 * 管理员查询 - 获取所有评论（包括隐藏/删除的）
 */
export async function getCommentsForAdmin({
	filters,
	page = 1,
	limit = 20,
	orderBy = "createdAt",
	orderDirection = "desc",
}: {
	filters?: CommentFilters;
	page?: number;
	limit?: number;
	orderBy?: string;
	orderDirection?: "asc" | "desc";
}) {
	const offset = (page - 1) * limit;

	const where = filters ? { ...filters } : {};

	const [comments, total] = await Promise.all([
		db.comment.findMany({
			where,
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
			orderBy: {
				[orderBy]: orderDirection,
			},
			skip: offset,
			take: limit,
		}),
		db.comment.count({ where }),
	]);

	return {
		comments,
		pagination: {
			page,
			limit,
			total,
			totalPages: Math.ceil(total / limit),
		},
	};
}

/**
 * 批量更新评论状态
 */
export async function batchUpdateCommentStatus(
	commentIds: string[],
	status: CommentStatus,
) {
	return db.comment.updateMany({
		where: {
			id: { in: commentIds },
		},
		data: {
			status,
			updatedAt: new Date(),
		},
	});
}

/**
 * 获取用户的评论历史
 */
export async function getUserComments(
	userId: string,
	page = 1,
	limit = 20,
	includeDeleted = false,
) {
	const offset = (page - 1) * limit;

	const where: any = { userId };
	if (!includeDeleted) {
		where.isDeleted = false;
		where.status = "ACTIVE";
	}

	const [comments, total] = await Promise.all([
		db.comment.findMany({
			where,
			include: {
				_count: {
					select: {
						likes: true,
						replies: true,
					},
				},
			},
			orderBy: { createdAt: "desc" },
			skip: offset,
			take: limit,
		}),
		db.comment.count({ where }),
	]);

	return {
		comments,
		pagination: {
			page,
			limit,
			total,
			totalPages: Math.ceil(total / limit),
		},
	};
}

// 保持向后兼容的类形式导出
export const CommentQueries = {
	create: createComment,
	getComments,
	getCommentWithReplies,
	update: updateComment,
	softDelete: softDeleteComment,
	toggleLike: toggleCommentLike,
	canUserManageComment,
	getEntityCommentStats,
	getCommentsForAdmin,
	batchUpdateStatus: batchUpdateCommentStatus,
	getUserComments,
};
