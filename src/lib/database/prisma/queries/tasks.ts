import { db } from "../client";
import type { TaskCategory, TaskStatus, TaskPriority } from "@prisma/client";

// 任务查询选项
export interface TaskQueryOptions {
	category?: TaskCategory;
	status?: TaskStatus;
	priority?: TaskPriority;
	organizationId?: string;
	publisherId?: string;
	assigneeId?: string;
	featured?: boolean;
	limit?: number;
	offset?: number;
	search?: string;
}

// 获取任务列表
export async function getTasks(options: TaskQueryOptions = {}) {
	const {
		category,
		status,
		priority,
		organizationId,
		publisherId,
		assigneeId,
		featured,
		limit = 20,
		offset = 0,
		search,
	} = options;

	const where: any = {};

	if (category) {
		where.category = category;
	}
	if (status) {
		where.status = status;
	}
	if (priority) {
		where.priority = priority;
	}

	// 处理组织ID：null表示全局任务，"null"字符串也应该被视为null
	if (organizationId !== undefined) {
		if (organizationId === null || organizationId === "null") {
			where.organizationId = null;
		} else {
			where.organizationId = organizationId;
		}
	}

	if (publisherId) {
		where.publisherId = publisherId;
	}
	if (assigneeId) {
		where.assigneeId = assigneeId;
	}
	if (featured !== undefined) {
		where.featured = featured;
	}

	if (search) {
		where.OR = [
			{ title: { contains: search, mode: "insensitive" } },
			{ description: { contains: search, mode: "insensitive" } },
		];
	}

	return await db.communityTask.findMany({
		where,
		include: {
			publisher: {
				select: {
					id: true,
					name: true,
					image: true,
					username: true,
				},
			},
			assignee: {
				select: {
					id: true,
					name: true,
					image: true,
					username: true,
				},
			},
			organization: {
				select: {
					id: true,
					name: true,
					slug: true,
				},
			},
		},
		orderBy: [
			{ featured: "desc" },
			{ priority: "desc" },
			{ createdAt: "desc" },
		],
		take: limit,
		skip: offset,
	});
}

// 获取任务详情
export async function getTaskById(id: string) {
	return await db.communityTask.findUnique({
		where: { id },
		include: {
			publisher: {
				select: {
					id: true,
					name: true,
					image: true,
					username: true,
					role: true,
				},
			},
			assignee: {
				select: {
					id: true,
					name: true,
					image: true,
					username: true,
				},
			},
			organization: {
				select: {
					id: true,
					name: true,
					slug: true,
				},
			},
		},
	});
}

// 创建任务
export async function createTask(data: {
	title: string;
	description: string;
	category: TaskCategory;
	cpReward: number;
	publisherId: string;
	organizationId?: string;
	isUserTask: boolean;
	deadline?: Date;
	tags?: string[];
	priority?: TaskPriority;
	featured?: boolean;
}) {
	return await db.communityTask.create({
		data,
		include: {
			publisher: {
				select: {
					id: true,
					name: true,
					image: true,
					username: true,
				},
			},
		},
	});
}

// 更新任务
export async function updateTask(
	id: string,
	data: {
		title?: string;
		description?: string;
		category?: TaskCategory;
		cpReward?: number;
		deadline?: Date;
		tags?: string[];
		priority?: TaskPriority;
		featured?: boolean;
	},
) {
	return await db.communityTask.update({
		where: { id },
		data,
	});
}

// 认领任务
export async function claimTask(taskId: string, assigneeId: string) {
	return await db.communityTask.update({
		where: {
			id: taskId,
			status: "PUBLISHED", // 只能认领已发布的任务
			assigneeId: null, // 确保任务未被认领
		},
		data: {
			status: "CLAIMED",
			assigneeId,
			claimedAt: new Date(),
		},
	});
}

// 提交任务
export async function submitTask(
	taskId: string,
	submissionData: {
		submissionNote?: string;
		evidenceUrls?: string[];
	},
) {
	return await db.communityTask.update({
		where: {
			id: taskId,
			status: "CLAIMED", // 只能提交已认领的任务
		},
		data: {
			status: "SUBMITTED",
			submittedAt: new Date(),
			submissionNote: submissionData.submissionNote,
			evidenceUrls: submissionData.evidenceUrls || [],
		},
	});
}

// 审核任务
export async function reviewTask(
	taskId: string,
	reviewData: {
		status: "COMPLETED" | "REJECTED";
		reviewNote?: string;
	},
) {
	const { status, reviewNote } = reviewData;

	return await db.communityTask.update({
		where: {
			id: taskId,
			status: "SUBMITTED", // 只能审核已提交的任务
		},
		data: {
			status,
			reviewedAt: new Date(),
			reviewNote,
		},
		include: {
			publisher: true,
			assignee: true,
		},
	});
}

// 取消任务
export async function cancelTask(taskId: string, publisherId: string) {
	return await db.communityTask.update({
		where: {
			id: taskId,
			publisherId, // 只有发布者可以取消任务
			status: {
				in: ["PUBLISHED", "CLAIMED"], // 只能取消未完成的任务
			},
		},
		data: {
			status: "CANCELLED",
		},
	});
}

// 获取任务统计
export async function getTaskStats(organizationId?: string | null) {
	const where: any = {};

	// 处理组织ID过滤
	if (organizationId !== undefined) {
		if (organizationId === null || organizationId === "null") {
			where.organizationId = null;
		} else {
			where.organizationId = organizationId;
		}
	}

	const [total, published, claimed, completed, rejected] = await Promise.all([
		db.communityTask.count({ where }),
		db.communityTask.count({ where: { ...where, status: "PUBLISHED" } }),
		db.communityTask.count({ where: { ...where, status: "CLAIMED" } }),
		db.communityTask.count({ where: { ...where, status: "COMPLETED" } }),
		db.communityTask.count({ where: { ...where, status: "REJECTED" } }),
	]);

	return {
		total,
		published,
		claimed,
		completed,
		rejected,
		completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
	};
}

// 获取用户任务统计
export async function getUserTaskStats(userId: string) {
	const [publishedCount, assignedCount, completedCount] = await Promise.all([
		db.communityTask.count({ where: { publisherId: userId } }),
		db.communityTask.count({ where: { assigneeId: userId } }),
		db.communityTask.count({
			where: { assigneeId: userId, status: "COMPLETED" },
		}),
	]);

	return {
		published: publishedCount,
		assigned: assignedCount,
		completed: completedCount,
	};
}

// 删除任务（只有发布者可以删除未认领的任务）
export async function deleteTask(taskId: string, publisherId: string) {
	return await db.communityTask.delete({
		where: {
			id: taskId,
			publisherId,
			status: "PUBLISHED", // 只能删除未认领的任务
			assigneeId: null,
		},
	});
}

// 获取精选任务
export async function getFeaturedTasks(
	limit = 6,
	organizationId?: string | null,
) {
	const where: any = {
		featured: true,
		status: "PUBLISHED",
	};

	// 处理组织ID过滤
	if (organizationId !== undefined) {
		if (organizationId === null || organizationId === "null") {
			where.organizationId = null;
		} else {
			where.organizationId = organizationId;
		}
	}

	return await db.communityTask.findMany({
		where,
		include: {
			publisher: {
				select: {
					id: true,
					name: true,
					image: true,
					username: true,
				},
			},
			organization: {
				select: {
					id: true,
					name: true,
					slug: true,
				},
			},
		},
		orderBy: {
			createdAt: "desc",
		},
		take: limit,
	});
}
