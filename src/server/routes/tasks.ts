import {
	ContentType,
	createContentValidator,
	validateSingleContent,
} from "@/lib/content-moderation";
import { auth } from "@/lib/auth";
import { AdminPermission, hasPermission } from "@/lib/auth/permissions";
import { db } from "@/lib/database/prisma/client";
import {
	cancelTask,
	claimTask,
	createTask,
	deleteTask,
	getFeaturedTasks,
	getTaskById,
	getTaskStats,
	getTasks,
	getUserTaskStats,
	reviewTask,
	submitTask,
	updateTask,
} from "@/lib/database/prisma/queries/tasks";
import { getUserById } from "@/lib/database/prisma/queries/users";
import { zValidator } from "@hono/zod-validator";
import { TaskCategory, TaskPriority, TaskStatus } from "@prisma/client";
import { Hono } from "hono";
import { z } from "zod";

// 创建任务的验证Schema
const createTaskSchema = z.object({
	title: z
		.string()
		.min(1, "任务标题不能为空")
		.max(100, "标题长度不能超过100字符"),
	description: z
		.string()
		.min(10, "任务描述至少10个字符")
		.max(2000, "描述长度不能超过2000字符"),
	category: z.nativeEnum(TaskCategory),
	cpReward: z
		.number()
		.min(1, "CP奖励必须大于0")
		.max(1000, "单个任务CP奖励不能超过1000"),
	organizationId: z.string().optional(),
	deadline: z
		.string()
		.transform((val) => new Date(val))
		.optional(),
	tags: z.array(z.string()).max(10, "标签数量不能超过10个").default([]),
	priority: z.nativeEnum(TaskPriority).default(TaskPriority.NORMAL),
});

// 更新任务的验证Schema
const updateTaskSchema = createTaskSchema.partial();

// 提交任务的验证Schema
const submitTaskSchema = z.object({
	submissionNote: z
		.string()
		.min(10, "提交说明至少10个字符")
		.max(1000, "提交说明不能超过1000字符"),
	evidenceUrls: z
		.array(z.string().url("请提供有效的URL链接"))
		.max(10, "证据链接不能超过10个")
		.default([]),
});

// 审核任务的验证Schema
const reviewTaskSchema = z.object({
	status: z.enum(["COMPLETED", "REJECTED"]),
	reviewNote: z.string().max(500, "审核备注不能超过500字符").optional(),
});

const validateTaskContent = createContentValidator({
	title: { type: ContentType.TASK_TITLE },
	description: { type: ContentType.TASK_DESCRIPTION },
});

const validateTaskSubmissionNote = (submissionNote?: string) =>
	validateSingleContent(submissionNote, ContentType.TASK_SUBMISSION_NOTE, {
		skipIfEmpty: false,
	});

const validateTaskReviewNote = (reviewNote?: string | null) =>
	validateSingleContent(reviewNote, ContentType.TASK_REVIEW_NOTE, {
		skipIfEmpty: true,
	});

export const tasksRouter = new Hono()
	// Test endpoint - 测试端点 (公开)
	.get("/test", async (c) => {
		console.log("===== TEST ENDPOINT HIT =====");
		console.log(
			"Headers:",
			Object.fromEntries(c.req.raw.headers.entries()),
		);
		return c.json({
			message: "Tasks API is working!",
			timestamp: new Date().toISOString(),
			route: "test endpoint",
		});
	})

	// GET /tasks - 获取任务列表 (公开)
	.get("/", async (c) => {
		console.log("===== TASKS LIST ENDPOINT HIT =====");
		try {
			const {
				category,
				status,
				priority,
				organizationId,
				publisherId,
				assigneeId,
				featured,
				limit = "20",
				offset = "0",
				search,
			} = c.req.query();

			console.log("About to call getTasks...");
			const tasks = await getTasks({
				category: category as TaskCategory,
				status: status as TaskStatus,
				priority: priority as TaskPriority,
				organizationId,
				publisherId,
				assigneeId,
				featured: featured === "true",
				limit: Number.parseInt(limit),
				offset: Number.parseInt(offset),
				search,
			});

			console.log(
				"getTasks successful, returning:",
				tasks.length,
				"tasks",
			);
			return c.json({ tasks });
		} catch (error) {
			console.error("Error in /tasks endpoint:", error);
			return c.json(
				{ error: "Internal server error", details: String(error) },
				500,
			);
		}
	})

	// GET /tasks/admin - 管理员获取任务列表 (需要管理员权限)
	.get("/admin", async (c) => {
		try {
			const session = await auth.api.getSession({
				headers: c.req.raw.headers,
			});

			if (!session?.user) {
				return c.json({ error: "Unauthorized" }, 401);
			}

			// 检查是否为管理员
			const hasAdminPermission = hasPermission(
				session.user,
				AdminPermission.MANAGE_SYSTEM,
			);

			if (!hasAdminPermission) {
				return c.json({ error: "Insufficient permissions" }, 403);
			}

			const {
				category,
				status,
				priority,
				organizationId,
				publisherId,
				assigneeId,
				featured,
				limit = "50",
				offset = "0",
				search,
			} = c.req.query();

			const tasks = await getTasks({
				category: category as TaskCategory,
				status: status as TaskStatus,
				priority: priority as TaskPriority,
				organizationId,
				publisherId,
				assigneeId,
				featured: featured === "true",
				limit: Number.parseInt(limit),
				offset: Number.parseInt(offset),
				search,
			});

			return c.json({ tasks });
		} catch (error) {
			console.error("Error fetching admin tasks:", error);
			return c.json({ error: "Internal server error" }, 500);
		}
	})

	// GET /tasks/featured - 获取精选任务 (公开)
	.get("/featured", async (c) => {
		try {
			const { limit = "6", organizationId } = c.req.query();
			const tasks = await getFeaturedTasks(
				Number.parseInt(limit),
				organizationId,
			);
			return c.json({ tasks });
		} catch (error) {
			console.error("Error fetching featured tasks:", error);
			return c.json({ error: "Internal server error" }, 500);
		}
	})

	// GET /tasks/stats - 获取任务统计 (公开)
	.get("/stats", async (c) => {
		try {
			const { organizationId } = c.req.query();
			const stats = await getTaskStats(organizationId);
			return c.json({ stats });
		} catch (error) {
			console.error("Error fetching task stats:", error);
			return c.json({ error: "Internal server error" }, 500);
		}
	})

	// GET /tasks/:id - 获取任务详情 (公开)
	.get("/:id", async (c) => {
		try {
			const taskId = c.req.param("id");
			const task = await getTaskById(taskId);

			if (!task) {
				return c.json({ error: "Task not found" }, 404);
			}

			return c.json({ task });
		} catch (error) {
			console.error("Error fetching task:", error);
			return c.json({ error: "Internal server error" }, 500);
		}
	})

	// GET /tasks/mine - 获取我的任务 (需要认证)
	.get("/mine", async (c) => {
		try {
			const session = await auth.api.getSession({
				headers: c.req.raw.headers,
			});

			if (!session?.user) {
				return c.json({ error: "Unauthorized" }, 401);
			}

			const { type = "all" } = c.req.query();
			let tasks:
				| Awaited<ReturnType<typeof getTasks>>
				| {
						published: Awaited<ReturnType<typeof getTasks>>;
						assigned: Awaited<ReturnType<typeof getTasks>>;
				  };

			if (type === "published") {
				tasks = await getTasks({ publisherId: session.user.id });
			} else if (type === "assigned") {
				tasks = await getTasks({ assigneeId: session.user.id });
			} else {
				// 获取用户发布和认领的所有任务
				const [publishedTasks, assignedTasks] = await Promise.all([
					getTasks({ publisherId: session.user.id }),
					getTasks({ assigneeId: session.user.id }),
				]);
				tasks = { published: publishedTasks, assigned: assignedTasks };
			}

			const userStats = await getUserTaskStats(session.user.id);

			return c.json({ tasks, stats: userStats });
		} catch (error) {
			console.error("Error fetching user tasks:", error);
			return c.json({ error: "Internal server error" }, 500);
		}
	})

	// POST /tasks - 创建任务 (需要认证)
	.post("/", zValidator("json", createTaskSchema), async (c) => {
		try {
			const session = await auth.api.getSession({
				headers: c.req.raw.headers,
			});

			if (!session?.user) {
				return c.json({ error: "Unauthorized" }, 401);
			}

			const data = c.req.valid("json");

			const moderation = await validateTaskContent({
				title: data.title,
				description: data.description,
			});

			if (!moderation.isValid) {
				console.warn("Task creation moderation failed", {
					userId: session.user.id,
					errors: moderation.errors,
					results: moderation.results,
				});

				return c.json(
					{
						error: "任务信息未通过内容审核",
						details: moderation.errors,
					},
					400,
				);
			}

			// 检查是否是管理员发布的官方任务
			const isAdminTask = hasPermission(
				session.user,
				AdminPermission.MANAGE_SYSTEM,
			);

			// 如果是普通用户发布任务，需要检查CP余额
			if (!isAdminTask) {
				const user = await getUserById(session.user.id);
				if (!user || user.cpValue < data.cpReward) {
					return c.json(
						{
							error: "CP余额不足",
							required: data.cpReward,
							available: user?.cpValue || 0,
						},
						400,
					);
				}

				// 扣除用户CP余额（发布任务时预扣）
				await db.user.update({
					where: { id: session.user.id },
					data: { cpValue: { decrement: data.cpReward } },
				});
			}

			const task = await createTask({
				...data,
				publisherId: session.user.id,
				isUserTask: !isAdminTask,
			});

			return c.json({ task }, 201);
		} catch (error) {
			console.error("Error creating task:", error);
			return c.json({ error: "Internal server error" }, 500);
		}
	})

	// PUT /tasks/:id - 更新任务
	.put("/:id", zValidator("json", updateTaskSchema), async (c) => {
		try {
			const session = await auth.api.getSession({
				headers: c.req.raw.headers,
			});

			if (!session?.user) {
				return c.json({ error: "Unauthorized" }, 401);
			}

			const taskId = c.req.param("id");
			const data = c.req.valid("json");

			// 检查任务是否存在以及用户权限
			const existingTask = await getTaskById(taskId);
			if (!existingTask) {
				return c.json({ error: "Task not found" }, 404);
			}

			// 只有任务发布者或管理员可以更新任务
			const isPublisher = existingTask.publisherId === session.user.id;
			const isAdmin = hasPermission(
				session.user,
				AdminPermission.MANAGE_SYSTEM,
			);

			if (!isPublisher && !isAdmin) {
				return c.json({ error: "Permission denied" }, 403);
			}

			// 只能更新未认领的任务
			if (existingTask.status !== TaskStatus.PUBLISHED) {
				return c.json({ error: "只能更新未认领的任务" }, 400);
			}

			const moderation = await validateTaskContent({
				title: data.title,
				description: data.description,
			});

			if (!moderation.isValid) {
				console.warn("Task update moderation failed", {
					userId: session.user.id,
					taskId,
					errors: moderation.errors,
					results: moderation.results,
				});

				return c.json(
					{
						error: "任务信息未通过内容审核",
						details: moderation.errors,
					},
					400,
				);
			}

			const task = await updateTask(taskId, data);
			return c.json({ task });
		} catch (error) {
			console.error("Error updating task:", error);
			return c.json({ error: "Internal server error" }, 500);
		}
	})

	// PATCH /tasks/:id/admin - 管理员更新任务状态 (需要管理员权限)
	.patch("/:id/admin", async (c) => {
		try {
			const session = await auth.api.getSession({
				headers: c.req.raw.headers,
			});

			if (!session?.user) {
				return c.json({ error: "Unauthorized" }, 401);
			}

			// 检查是否为管理员
			const hasAdminPermission = hasPermission(
				session.user,
				AdminPermission.MANAGE_SYSTEM,
			);

			if (!hasAdminPermission) {
				return c.json({ error: "Insufficient permissions" }, 403);
			}

			const taskId = c.req.param("id");
			const { status } = await c.req.json();

			// 验证状态值
			if (!Object.values(TaskStatus).includes(status)) {
				return c.json({ error: "Invalid status" }, 400);
			}

			// 检查任务是否存在
			const existingTask = await getTaskById(taskId);
			if (!existingTask) {
				return c.json({ error: "Task not found" }, 404);
			}

			// 使用管理员权限直接更新任务状态
			const task = await db.communityTask.update({
				where: { id: taskId },
				data: { status: status as TaskStatus },
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
			});
			return c.json({ task });
		} catch (error) {
			console.error("Error updating task status:", error);
			return c.json({ error: "Internal server error" }, 500);
		}
	})

	// POST /tasks/:id/claim - 认领任务
	.post("/:id/claim", async (c) => {
		try {
			const session = await auth.api.getSession({
				headers: c.req.raw.headers,
			});

			if (!session?.user) {
				return c.json({ error: "Unauthorized" }, 401);
			}

			const taskId = c.req.param("id");

			// 检查任务是否存在
			const existingTask = await getTaskById(taskId);
			if (!existingTask) {
				return c.json({ error: "Task not found" }, 404);
			}

			// 不能认领自己发布的任务
			if (existingTask.publisherId === session.user.id) {
				return c.json({ error: "不能认领自己发布的任务" }, 400);
			}

			const task = await claimTask(taskId, session.user.id);
			return c.json({ task });
		} catch (error) {
			console.error("Error claiming task:", error);
			if (
				error &&
				typeof error === "object" &&
				"code" in error &&
				error.code === "P2025"
			) {
				return c.json({ error: "任务不存在或已被认领" }, 400);
			}
			return c.json({ error: "Internal server error" }, 500);
		}
	})

	// POST /tasks/:id/submit - 提交任务
	.post("/:id/submit", zValidator("json", submitTaskSchema), async (c) => {
		try {
			console.log("=== SUBMIT TASK REQUEST ===");
			console.log("Task ID:", c.req.param("id"));

			const session = await auth.api.getSession({
				headers: c.req.raw.headers,
			});

			if (!session?.user) {
				console.log("Unauthorized: No session");
				return c.json({ error: "Unauthorized" }, 401);
			}

			console.log("User ID:", session.user.id);

			const taskId = c.req.param("id");

			// 验证请求数据
			let data: z.infer<typeof submitTaskSchema>;
			try {
				data = c.req.valid("json");
				console.log("Request data:", data);
			} catch (validationError) {
				console.log("Validation error:", validationError);
				return c.json(
					{
						error: "请求数据格式错误，请检查提交说明是否至少10个字符，证据链接是否为有效URL",
					},
					400,
				);
			}

			// 检查任务是否存在以及用户是否是认领者
			const existingTask = await getTaskById(taskId);
			if (!existingTask) {
				console.log("Task not found:", taskId);
				return c.json({ error: "Task not found" }, 404);
			}

			console.log("Existing task assigneeId:", existingTask.assigneeId);
			console.log("Current user ID:", session.user.id);

			if (existingTask.assigneeId !== session.user.id) {
				console.log("Permission denied: User is not assignee");
				return c.json({ error: "只有任务认领者可以提交任务" }, 403);
			}

			const moderation = await validateTaskSubmissionNote(
				data.submissionNote,
			);

			if (!moderation.isValid) {
				console.warn("Task submission moderation failed", {
					userId: session.user.id,
					taskId,
					error: moderation.error,
					result: moderation.result,
				});

				return c.json(
					{
						error: "提交说明未通过内容审核",
						details: {
							submissionNote:
								moderation.error ?? "内容审核未通过",
						},
					},
					400,
				);
			}

			const task = await submitTask(taskId, data);
			console.log("Task submitted successfully");
			return c.json({ task });
		} catch (error) {
			console.error("Error submitting task:", error);
			return c.json({ error: "Internal server error" }, 500);
		}
	})

	// POST /tasks/:id/review - 审核任务
	.post("/:id/review", zValidator("json", reviewTaskSchema), async (c) => {
		try {
			const session = await auth.api.getSession({
				headers: c.req.raw.headers,
			});

			if (!session?.user) {
				return c.json({ error: "Unauthorized" }, 401);
			}

			const taskId = c.req.param("id");
			const data = c.req.valid("json");

			// 检查任务是否存在以及用户是否是发布者
			const existingTask = await getTaskById(taskId);
			if (!existingTask) {
				return c.json({ error: "Task not found" }, 404);
			}

			if (existingTask.publisherId !== session.user.id) {
				return c.json({ error: "只有任务发布者可以审核任务" }, 403);
			}

			const moderation = await validateTaskReviewNote(data.reviewNote);

			if (!moderation.isValid) {
				console.warn("Task review moderation failed", {
					userId: session.user.id,
					taskId,
					reviewStatus: data.status,
					error: moderation.error,
					result: moderation.result,
				});

				return c.json(
					{
						error: "审核备注未通过内容审核",
						details: {
							reviewNote: moderation.error ?? "内容审核未通过",
						},
					},
					400,
				);
			}

			const task = await reviewTask(taskId, data);

			// 如果审核通过，给认领者发放CP奖励
			if (data.status === TaskStatus.COMPLETED && task.assignee) {
				await db.user.update({
					where: { id: task.assignee.id },
					data: { cpValue: { increment: task.cpReward } },
				});

				// 记录贡献
				await db.contribution.create({
					data: {
						userId: task.assignee.id,
						type: "OTHER" as any,
						category: "任务完成",
						description: `完成任务：${task.title}`,
						cpValue: task.cpReward,
						sourceId: task.id,
						sourceType: "community_task",
						isAutomatic: true,
						status: "APPROVED" as any,
					},
				});
			}

			// 如果审核被拒，返还发布者的CP（如果是用户任务）
			if (data.status === TaskStatus.REJECTED && task.isUserTask) {
				await db.user.update({
					where: { id: task.publisherId },
					data: { cpValue: { increment: task.cpReward } },
				});
			}

			return c.json({ task });
		} catch (error) {
			console.error("Error reviewing task:", error);
			return c.json({ error: "Internal server error" }, 500);
		}
	})

	// POST /tasks/:id/cancel - 取消任务
	.post("/:id/cancel", async (c) => {
		try {
			const session = await auth.api.getSession({
				headers: c.req.raw.headers,
			});

			if (!session?.user) {
				return c.json({ error: "Unauthorized" }, 401);
			}

			const taskId = c.req.param("id");
			const task = await cancelTask(taskId, session.user.id);

			// 如果是用户任务，返还CP
			if (task.isUserTask) {
				await db.user.update({
					where: { id: session.user.id },
					data: { cpValue: { increment: task.cpReward } },
				});
			}

			return c.json({ task });
		} catch (error) {
			console.error("Error canceling task:", error);
			return c.json({ error: "Internal server error" }, 500);
		}
	})

	// DELETE /tasks/:id - 删除任务
	.delete("/:id", async (c) => {
		try {
			const session = await auth.api.getSession({
				headers: c.req.raw.headers,
			});

			if (!session?.user) {
				return c.json({ error: "Unauthorized" }, 401);
			}

			const taskId = c.req.param("id");

			// 检查任务以确定是否需要返还CP
			const existingTask = await getTaskById(taskId);
			if (existingTask?.isUserTask) {
				await db.user.update({
					where: { id: session.user.id },
					data: { cpValue: { increment: existingTask.cpReward } },
				});
			}

			await deleteTask(taskId, session.user.id);
			return c.json({ message: "Task deleted successfully" });
		} catch (error) {
			console.error("Error deleting task:", error);
			return c.json({ error: "Internal server error" }, 500);
		}
	});

export default tasksRouter;
