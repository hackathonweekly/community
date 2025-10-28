import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { db } from "@/lib/database";
import {
	ContentType,
	createContentValidator,
	ensureImageSafe,
	validateSingleContent,
} from "@/lib/content-moderation";
import { auth } from "@/lib/auth";

const app = new Hono();

// 权限验证辅助函数
async function checkEventAdminPermission(
	userId: string,
	eventId: string,
	permission:
		| "canEditEvent"
		| "canManageRegistrations"
		| "canManageAdmins" = "canManageRegistrations",
): Promise<boolean> {
	// 检查用户是否为活动创建者
	const event = await db.event.findUnique({
		where: { id: eventId },
		select: { organizerId: true },
	});

	if (event?.organizerId === userId) {
		return true;
	}

	// 检查用户是否为活动管理员
	const admin = await db.eventAdmin.findFirst({
		where: {
			eventId,
			userId,
			status: "ACCEPTED",
			[permission]: true,
		},
	});

	return !!admin;
}

// Building Public 报名 schema
const buildingRegistrationSchema = z.object({
	projectId: z.string(),
	plan21Days: z.string().min(30),
	visibilityLevel: z.enum(["PUBLIC", "PARTICIPANTS_ONLY"]).default("PUBLIC"),
});

// 打卡 schema
const checkInSchema = z.object({
	title: z.string().min(1),
	content: z.string().min(10),
	nextPlan: z.string().optional(),
	imageUrls: z.array(z.string()).default([]),
	demoUrl: z.string().optional(),
	isPublic: z.boolean().default(true),
});

const validateBuildingPlanContent = (plan?: string) =>
	validateSingleContent(plan, ContentType.BUILDING_PLAN, {
		skipIfEmpty: false,
	});

const validateBuildingCheckInContent = createContentValidator({
	title: { type: ContentType.BUILDING_CHECKIN_TITLE, skipIfEmpty: false },
	content: { type: ContentType.BUILDING_CHECKIN_CONTENT, skipIfEmpty: false },
	nextPlan: {
		type: ContentType.BUILDING_CHECKIN_NEXT_PLAN,
		skipIfEmpty: true,
	},
});

const validateCommentContent = createContentValidator({
	content: { type: ContentType.COMMENT_CONTENT, skipIfEmpty: false },
});

// Building Public 报名
app.post(
	"/events/:eventId/building-public/register",
	zValidator("json", buildingRegistrationSchema),
	async (c) => {
		try {
			const session = await auth.api.getSession({
				headers: c.req.header() as any,
			});
			if (!session?.user) {
				return c.json({ error: "Unauthorized" }, 401);
			}

			const eventId = c.req.param("eventId");
			const data = c.req.valid("json");

			// 检查活动是否存在且为Building Public类型
			const event = await db.event.findUnique({
				where: { id: eventId },
				include: { buildingConfig: true },
			});

			if (!event || !event.buildingConfig) {
				return c.json(
					{ error: "Event not found or not a Building Public event" },
					404,
				);
			}

			// 检查用户是否已经报名
			const existingRegistration =
				await db.buildingRegistration.findUnique({
					where: {
						eventId_userId: {
							eventId,
							userId: session.user.id,
						},
					},
				});

			if (existingRegistration) {
				return c.json(
					{ error: "Already registered for this event" },
					400,
				);
			}

			// 检查作品是否属于用户
			const project = await db.project.findFirst({
				where: {
					id: data.projectId,
					userId: session.user.id,
				},
			});

			if (!project) {
				return c.json(
					{ error: "Project not found or not owned by user" },
					404,
				);
			}

			const planModeration = await validateBuildingPlanContent(
				data.plan21Days,
			);

			if (!planModeration.isValid) {
				console.warn("Building Public plan moderation failed:", {
					userId: session.user.id,
					eventId,
					errors: planModeration.error,
					result: planModeration.result,
				});
				return c.json(
					{
						error: "内容审核未通过",
						details: {
							plan21Days:
								planModeration.error || "内容审核未通过",
						},
					},
					400,
				);
			}

			const depositAmount = event.buildingConfig?.depositAmount ?? 0;
			const requiresDeposit = depositAmount > 0;

			// 创建报名记录
			const registration = await db.buildingRegistration.create({
				data: {
					eventId,
					userId: session.user.id,
					projectId: data.projectId,
					plan21Days: data.plan21Days,
					visibilityLevel: data.visibilityLevel,
					depositAmount,
					depositPaid: !requiresDeposit,
					depositStatus: requiresDeposit ? "PENDING" : "PAID",
				},
				include: {
					project: {
						select: {
							id: true,
							title: true,
							description: true,
							projectTags: true,
						},
					},
				},
			});

			// 创建押金交易记录（仅在需要押金时）
			if (requiresDeposit) {
				await db.depositTransaction.create({
					data: {
						registrationId: registration.id,
						userId: session.user.id,
						type: "DEPOSIT",
						amount: depositAmount,
						status: "PENDING",
					},
				});
			}

			return c.json({
				success: true,
				data: registration,
			});
		} catch (error) {
			console.error("Error registering for Building Public:", error);
			return c.json({ error: "Internal server error" }, 500);
		}
	},
);

// 获取用户的Building Public报名信息
app.get("/events/:eventId/building-public/registration", async (c) => {
	try {
		const session = await auth.api.getSession({
			headers: c.req.header() as any,
		});
		if (!session?.user) {
			return c.json({ error: "Unauthorized" }, 401);
		}

		const eventId = c.req.param("eventId");

		const registration = await db.buildingRegistration.findUnique({
			where: {
				eventId_userId: {
					eventId,
					userId: session.user.id,
				},
			},
			include: {
				user: true,
				project: {
					select: {
						id: true,
						title: true,
						description: true,
						projectTags: true,
					},
				},
				checkIns: {
					orderBy: { day: "desc" },
					take: 5,
				},
				depositTrans: {
					orderBy: { createdAt: "desc" },
				},
			},
		});

		return c.json({
			success: true,
			data: registration,
		});
	} catch (error) {
		console.error("Error fetching Building Public registration:", error);
		return c.json({ error: "Internal server error" }, 500);
	}
});

// 提交打卡
app.post(
	"/events/:eventId/building-public/check-in",
	zValidator("json", checkInSchema),
	async (c) => {
		try {
			const session = await auth.api.getSession({
				headers: c.req.header() as any,
			});
			if (!session?.user) {
				return c.json({ error: "Unauthorized" }, 401);
			}

			const eventId = c.req.param("eventId");
			const data = c.req.valid("json");

			// 检查用户是否已报名
			const registration = await db.buildingRegistration.findUnique({
				where: {
					eventId_userId: {
						eventId,
						userId: session.user.id,
					},
				},
				include: {
					event: {
						include: { buildingConfig: true },
					},
				},
			});

			if (!registration) {
				return c.json({ error: "Not registered for this event" }, 400);
			}

			// 计算当前是第几天
			const eventStartDate = new Date(registration.event.startTime);
			const today = new Date();
			const daysSinceStart =
				Math.floor(
					(today.getTime() - eventStartDate.getTime()) /
						(1000 * 60 * 60 * 24),
				) + 1;
			const currentDay = Math.max(1, daysSinceStart);

			// 检查活动是否在进行中
			if (
				today < eventStartDate ||
				today > new Date(registration.event.endTime)
			) {
				return c.json({ error: "Event is not active" }, 400);
			}

			const checkInModeration = await validateBuildingCheckInContent({
				title: data.title,
				content: data.content,
				nextPlan: data.nextPlan,
			});

			if (!checkInModeration.isValid) {
				console.warn("Building Public check-in moderation failed:", {
					userId: session.user.id,
					eventId,
					errors: checkInModeration.errors,
					results: checkInModeration.results,
				});
				return c.json(
					{
						error: "内容审核未通过",
						details: checkInModeration.errors,
					},
					400,
				);
			}

			for (const imageUrl of data.imageUrls ?? []) {
				const moderation = await ensureImageSafe(imageUrl, "content", {
					skipIfEmpty: false,
				});
				if (!moderation.isApproved) {
					console.warn("Building Public check-in image rejected", {
						userId: session.user.id,
						eventId,
						imageUrl,
						result: moderation.result,
					});
					return c.json(
						{
							error: moderation.reason ?? "打卡图片未通过审核",
						},
						400,
					);
				}
			}

			// 创建打卡记录
			const checkIn = await db.checkInRecord.create({
				data: {
					registrationId: registration.id,
					eventId,
					userId: session.user.id,
					day: currentDay,
					title: data.title,
					content: data.content,
					nextPlan: data.nextPlan,
					imageUrls: data.imageUrls,
					demoUrl: data.demoUrl,
					isPublic: data.isPublic,
				},
			});

			// 更新报名记录的打卡次数
			const updatedRegistration = await db.buildingRegistration.update({
				where: { id: registration.id },
				data: {
					checkInCount: {
						increment: 1,
					},
				},
				include: {
					event: {
						include: { buildingConfig: true },
					},
				},
			});

			// 自动判定完成状态
			const requiredCheckIns =
				registration.event.buildingConfig?.requiredCheckIns || 6;
			const newCheckInCount = updatedRegistration.checkInCount;
			const eventEndDate = new Date(registration.event.endTime);
			const now = new Date();

			// 如果打卡次数达到要求且活动已结束，自动标记为完成
			if (
				newCheckInCount >= requiredCheckIns &&
				now > eventEndDate &&
				!updatedRegistration.isCompleted
			) {
				await db.buildingRegistration.update({
					where: { id: registration.id },
					data: { isCompleted: true },
				});
			}

			return c.json({
				message: "打卡成功！",
				data: {
					checkIn,
					checkInCount: updatedRegistration.checkInCount,
				},
			});
		} catch (error) {
			console.error("Error creating check-in:", error);
			return c.json({ error: "Internal server error" }, 500);
		}
	},
);

// 获取Building Public打卡列表
app.get("/events/:eventId/building-public/check-ins", async (c) => {
	try {
		const eventId = c.req.param("eventId");
		const sort = c.req.query("sort") || "latest";
		const day = c.req.query("day") || "all";
		const user = c.req.query("user") || "all";
		const page = Number.parseInt(c.req.query("page") || "1");
		const limit = Number.parseInt(c.req.query("limit") || "20");

		const where: any = {
			eventId,
			isPublic: true,
		};

		if (day !== "all") {
			where.day = Number.parseInt(day);
		}

		if (user !== "all") {
			where.userId = user;
		}

		let orderBy: any = { checkedInAt: "desc" };
		if (sort === "popular") {
			orderBy = { likeCount: "desc" };
		}

		const checkIns = await db.checkInRecord.findMany({
			where,
			orderBy,
			skip: (page - 1) * limit,
			take: limit,
			include: {
				user: {
					select: {
						id: true,
						name: true,
						image: true,
						username: true,
					},
				},
				registration: {
					include: {
						project: {
							select: {
								id: true,
								title: true,
								projectTags: true,
							},
						},
					},
				},
			},
		});

		// 如果用户已登录，获取点赞状态
		const session = await auth.api.getSession({
			headers: c.req.header() as any,
		});
		let checkInsWithLikeStatus = checkIns;

		if (session?.user) {
			const likedCheckIns = await db.checkInLike.findMany({
				where: {
					userId: session.user.id,
					checkInId: {
						in: checkIns.map((c) => c.id),
					},
				},
			});

			const likedIds = new Set(
				likedCheckIns.map((like) => like.checkInId),
			);
			checkInsWithLikeStatus = checkIns.map((checkIn) => ({
				...checkIn,
				isLiked: likedIds.has(checkIn.id),
			}));
		}

		return c.json({
			success: true,
			data: checkInsWithLikeStatus,
		});
	} catch (error) {
		console.error("Error fetching check-ins:", error);
		return c.json({ error: "Internal server error" }, 500);
	}
});

// 获取Building Public参与者列表
app.get("/events/:eventId/building-public/participants", async (c) => {
	try {
		const eventId = c.req.param("eventId");

		const participants = await db.buildingRegistration.findMany({
			where: { eventId },
			include: {
				user: {
					select: {
						id: true,
						name: true,
						image: true,
						username: true,
					},
				},
				project: {
					select: {
						id: true,
						title: true,
						projectTags: true,
					},
				},
			},
			orderBy: [
				{ isCompleted: "desc" },
				{ checkInCount: "desc" },
				{ finalScore: "desc" },
			],
		});

		return c.json({
			success: true,
			data: participants,
		});
	} catch (error) {
		console.error("Error fetching participants:", error);
		return c.json({ error: "Internal server error" }, 500);
	}
});

// 点赞打卡
app.post("/building-public/check-ins/:checkInId/like", async (c) => {
	try {
		const session = await auth.api.getSession({
			headers: c.req.header() as any,
		});
		if (!session?.user) {
			return c.json({ error: "Unauthorized" }, 401);
		}

		const checkInId = c.req.param("checkInId");

		// 检查是否已经点赞
		const existingLike = await db.checkInLike.findUnique({
			where: {
				checkInId_userId: {
					checkInId,
					userId: session.user.id,
				},
			},
		});

		let liked: boolean;
		let likeCount: number;

		if (existingLike) {
			// 取消点赞
			await db.checkInLike.delete({
				where: { id: existingLike.id },
			});

			// 更新点赞数
			const updated = await db.checkInRecord.update({
				where: { id: checkInId },
				data: {
					likeCount: {
						decrement: 1,
					},
				},
			});

			liked = false;
			likeCount = updated.likeCount;
		} else {
			// 添加点赞
			await db.checkInLike.create({
				data: {
					checkInId,
					userId: session.user.id,
				},
			});

			// 更新点赞数
			const updated = await db.checkInRecord.update({
				where: { id: checkInId },
				data: {
					likeCount: {
						increment: 1,
					},
				},
			});

			liked = true;
			likeCount = updated.likeCount;
		}

		return c.json({
			success: true,
			data: {
				liked,
				likeCount,
			},
		});
	} catch (error) {
		console.error("Error toggling like:", error);
		return c.json({ error: "Internal server error" }, 500);
	}
});

// 获取用户的打卡历史
app.get("/events/:eventId/building-public/my-check-ins", async (c) => {
	try {
		const session = await auth.api.getSession({
			headers: c.req.header() as any,
		});
		if (!session?.user) {
			return c.json({ error: "Unauthorized" }, 401);
		}

		const eventId = c.req.param("eventId");

		const checkIns = await db.checkInRecord.findMany({
			where: {
				eventId,
				userId: session.user.id,
			},
			orderBy: { day: "asc" },
		});

		return c.json({
			success: true,
			data: checkIns,
		});
	} catch (error) {
		console.error("Error fetching user check-ins:", error);
		return c.json({ error: "Internal server error" }, 500);
	}
});

// 评论打卡
const commentSchema = z.object({
	content: z.string().min(1).max(500),
});

app.post(
	"/building-public/check-ins/:checkInId/comments",
	zValidator("json", commentSchema),
	async (c) => {
		try {
			const session = await auth.api.getSession({
				headers: c.req.header() as any,
			});
			if (!session?.user) {
				return c.json({ error: "Unauthorized" }, 401);
			}

			const checkInId = c.req.param("checkInId");
			const data = c.req.valid("json");

			// 检查打卡记录是否存在
			const checkIn = await db.checkInRecord.findUnique({
				where: { id: checkInId },
			});

			if (!checkIn) {
				return c.json({ error: "Check-in not found" }, 404);
			}

			const commentModeration = await validateCommentContent({
				content: data.content,
			});

			if (!commentModeration.isValid) {
				console.warn(
					"Building Public check-in comment moderation failed:",
					{
						userId: session.user.id,
						checkInId,
						errors: commentModeration.errors,
						result: commentModeration.results.content,
					},
				);
				return c.json(
					{
						error: "内容审核未通过",
						details: commentModeration.errors,
					},
					400,
				);
			}

			// 创建评论
			const comment = await db.checkInComment.create({
				data: {
					checkInId,
					userId: session.user.id,
					content: data.content,
				},
				include: {
					user: {
						select: {
							id: true,
							name: true,
							image: true,
							username: true,
						},
					},
				},
			});

			// 更新评论数
			await db.checkInRecord.update({
				where: { id: checkInId },
				data: {
					commentCount: {
						increment: 1,
					},
				},
			});

			return c.json({
				success: true,
				data: comment,
			});
		} catch (error) {
			console.error("Error creating comment:", error);
			return c.json({ error: "Internal server error" }, 500);
		}
	},
);

// 获取打卡评论
app.get("/building-public/check-ins/:checkInId/comments", async (c) => {
	try {
		const checkInId = c.req.param("checkInId");
		const page = Number.parseInt(c.req.query("page") || "1");
		const limit = Number.parseInt(c.req.query("limit") || "20");

		const comments = await db.checkInComment.findMany({
			where: { checkInId },
			orderBy: { commentedAt: "asc" },
			skip: (page - 1) * limit,
			take: limit,
			include: {
				user: {
					select: {
						id: true,
						name: true,
						image: true,
						username: true,
					},
				},
			},
		});

		return c.json({
			success: true,
			data: comments,
		});
	} catch (error) {
		console.error("Error fetching comments:", error);
		return c.json({ error: "Internal server error" }, 500);
	}
});

// 编辑打卡
app.put(
	"/building-public/check-ins/:checkInId",
	zValidator("json", checkInSchema),
	async (c) => {
		try {
			const session = await auth.api.getSession({
				headers: c.req.header() as any,
			});
			if (!session?.user) {
				return c.json({ error: "Unauthorized" }, 401);
			}

			const checkInId = c.req.param("checkInId");
			const data = c.req.valid("json");

			// 检查打卡记录是否存在且属于当前用户
			const checkIn = await db.checkInRecord.findUnique({
				where: { id: checkInId },
			});

			if (!checkIn || checkIn.userId !== session.user.id) {
				return c.json(
					{ error: "Check-in not found or not owned by user" },
					404,
				);
			}

			const checkInModeration = await validateBuildingCheckInContent({
				title: data.title,
				content: data.content,
				nextPlan: data.nextPlan,
			});

			if (!checkInModeration.isValid) {
				console.warn(
					"Building Public check-in update moderation failed:",
					{
						userId: session.user.id,
						checkInId,
						errors: checkInModeration.errors,
						results: checkInModeration.results,
					},
				);
				return c.json(
					{
						error: "内容审核未通过",
						details: checkInModeration.errors,
					},
					400,
				);
			}

			for (const imageUrl of data.imageUrls ?? []) {
				const moderation = await ensureImageSafe(imageUrl, "content", {
					skipIfEmpty: false,
				});
				if (!moderation.isApproved) {
					console.warn(
						"Building Public check-in update image rejected",
						{
							userId: session.user.id,
							checkInId,
							imageUrl,
							result: moderation.result,
						},
					);
					return c.json(
						{
							error: moderation.reason ?? "打卡图片未通过审核",
						},
						400,
					);
				}
			}

			// 更新打卡记录
			const updatedCheckIn = await db.checkInRecord.update({
				where: { id: checkInId },
				data: {
					title: data.title,
					content: data.content,
					nextPlan: data.nextPlan,
					imageUrls: data.imageUrls,
					demoUrl: data.demoUrl,
					isPublic: data.isPublic,
				},
				include: {
					user: {
						select: {
							id: true,
							name: true,
							image: true,
							username: true,
						},
					},
					registration: {
						include: {
							project: {
								select: {
									id: true,
									title: true,
									projectTags: true,
								},
							},
						},
					},
				},
			});

			return c.json({
				success: true,
				data: updatedCheckIn,
			});
		} catch (error) {
			console.error("Error updating check-in:", error);
			return c.json({ error: "Internal server error" }, 500);
		}
	},
);

// 删除打卡
app.delete("/building-public/check-ins/:checkInId", async (c) => {
	try {
		const session = await auth.api.getSession({
			headers: c.req.header() as any,
		});
		if (!session?.user) {
			return c.json({ error: "Unauthorized" }, 401);
		}

		const checkInId = c.req.param("checkInId");

		// 检查打卡记录是否存在且属于当前用户
		const checkIn = await db.checkInRecord.findUnique({
			where: { id: checkInId },
			include: { registration: true },
		});

		if (!checkIn || checkIn.userId !== session.user.id) {
			return c.json(
				{ error: "Check-in not found or not owned by user" },
				404,
			);
		}

		// 删除相关的点赞和评论
		await db.checkInLike.deleteMany({
			where: { checkInId },
		});

		await db.checkInComment.deleteMany({
			where: { checkInId },
		});

		// 删除打卡记录
		await db.checkInRecord.delete({
			where: { id: checkInId },
		});

		// 更新报名记录的打卡次数
		await db.buildingRegistration.update({
			where: { id: checkIn.registrationId },
			data: {
				checkInCount: {
					decrement: 1,
				},
			},
		});

		return c.json({
			success: true,
			message: "打卡记录已删除",
		});
	} catch (error) {
		console.error("Error deleting check-in:", error);
		return c.json({ error: "Internal server error" }, 500);
	}
});

// 管理员更新完成状态
app.patch(
	"/building-public/registrations/:registrationId/completion",
	async (c) => {
		try {
			const session = await auth.api.getSession({
				headers: c.req.header() as any,
			});
			if (!session?.user) {
				return c.json({ error: "Unauthorized" }, 401);
			}

			const registrationId = c.req.param("registrationId");
			const { isCompleted } = await c.req.json();

			// 检查报名记录是否存在并获取活动信息
			const registration = await db.buildingRegistration.findUnique({
				where: { id: registrationId },
				include: { event: true },
			});

			if (!registration) {
				return c.json({ error: "Registration not found" }, 404);
			}

			// 检查管理员权限
			const hasPermission = await checkEventAdminPermission(
				session.user.id,
				registration.eventId,
				"canManageRegistrations",
			);

			if (!hasPermission) {
				return c.json({ error: "Insufficient permissions" }, 403);
			}

			// 更新完成状态
			const updated = await db.buildingRegistration.update({
				where: { id: registrationId },
				data: { isCompleted: Boolean(isCompleted) },
			});

			return c.json({
				success: true,
				data: updated,
			});
		} catch (error) {
			console.error("Error updating completion status:", error);
			return c.json({ error: "Internal server error" }, 500);
		}
	},
);

// 管理员评分
app.patch("/building-public/registrations/:registrationId/score", async (c) => {
	try {
		const session = await auth.api.getSession({
			headers: c.req.header() as any,
		});
		if (!session?.user) {
			return c.json({ error: "Unauthorized" }, 401);
		}

		const registrationId = c.req.param("registrationId");
		const { finalScore, feedback } = await c.req.json();

		// 检查报名记录是否存在并获取活动信息
		const registration = await db.buildingRegistration.findUnique({
			where: { id: registrationId },
			include: { event: true },
		});

		if (!registration) {
			return c.json({ error: "Registration not found" }, 404);
		}

		// 检查管理员权限
		const hasPermission = await checkEventAdminPermission(
			session.user.id,
			registration.eventId,
			"canManageRegistrations",
		);

		if (!hasPermission) {
			return c.json({ error: "Insufficient permissions" }, 403);
		}

		// 更新评分
		const updated = await db.buildingRegistration.update({
			where: { id: registrationId },
			data: {
				finalScore: Number(finalScore),
				// feedback 字段需要添加到数据库schema中
			},
		});

		return c.json({
			success: true,
			data: updated,
		});
	} catch (error) {
		console.error("Error updating score:", error);
		return c.json({ error: "Internal server error" }, 500);
	}
});

// 批量更新完成状态（定时任务或管理员手动触发）
app.post("/building-public/batch-update-completion", async (c) => {
	try {
		const session = await auth.api.getSession({
			headers: c.req.header() as any,
		});
		if (!session?.user) {
			return c.json({ error: "Unauthorized" }, 401);
		}

		// 检查是否为系统管理员 (可以根据需要添加更严格的检查)
		// 这里简化为检查用户是否有全局管理权限，实际可以根据业务需求调整
		const user = await db.user.findUnique({
			where: { id: session.user.id },
			select: { role: true },
		});

		// 只允许超级管理员执行批量操作
		if (!user || !["admin", "super_admin"].includes(user.role || "")) {
			return c.json(
				{ error: "Insufficient permissions for batch operations" },
				403,
			);
		}

		// 查找所有结束的 Building Public 活动
		const now = new Date();
		const endedEvents = await db.event.findMany({
			where: {
				endTime: { lt: now },
				buildingConfig: { isNot: null },
			},
			include: {
				buildingConfig: true,
				buildingRegistrations: {
					where: { isCompleted: false },
				},
			},
		});

		let updatedCount = 0;

		for (const event of endedEvents) {
			if (!event.buildingConfig) {
				continue;
			}

			const requiredCheckIns = event.buildingConfig.requiredCheckIns;

			for (const registration of event.buildingRegistrations) {
				if (registration.checkInCount >= requiredCheckIns) {
					await db.buildingRegistration.update({
						where: { id: registration.id },
						data: { isCompleted: true },
					});
					updatedCount++;
				}
			}
		}

		return c.json({
			success: true,
			message: `已更新 ${updatedCount} 个参与者的完成状态`,
			updatedCount,
		});
	} catch (error) {
		console.error("Error batch updating completion status:", error);
		return c.json({ error: "Internal server error" }, 500);
	}
});

export default app;
