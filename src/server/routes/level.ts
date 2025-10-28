import { db } from "@/lib/database";
import {
	canDowngradeToLevel,
	canReviewLevel,
	canUpgradeToLevel,
	getLevelTypeName,
	getUserLevelInfo,
} from "@/lib/level-utils";
import type {
	ContributorLevel,
	CreatorLevel,
	LevelApplicationStatus,
	MembershipLevel,
	MentorLevel,
} from "@prisma/client";
import { Hono } from "hono";
import { z } from "zod";
import { authMiddleware } from "../middleware/auth";

// 等级申请表单验证
const levelApplicationSchema = z.object({
	levelType: z.enum(["MEMBERSHIP", "CREATOR", "MENTOR", "CONTRIBUTOR"]),
	action: z.enum(["UPGRADE", "DOWNGRADE"]),
	targetLevel: z.string().min(1, "目标等级不能为空"),
	reason: z.string().min(10, "申请理由至少需要10个字符"),
	evidence: z.string().optional(),
});

// 审核申请表单验证
const reviewApplicationSchema = z.object({
	applicationId: z.string().min(1, "申请ID不能为空"),
	action: z.enum(["APPROVE", "REJECT"]),
	reviewNote: z.string().optional(),
});

// 管理员调整等级表单验证
const adjustLevelSchema = z.object({
	userId: z.string().min(1, "用户ID不能为空"), // 临时放宽验证，原来是 z.string().cuid()
	levelType: z.enum(["MEMBERSHIP", "CREATOR", "MENTOR", "CONTRIBUTOR"]),
	level: z.string().optional().nullable(), // null表示清除等级
	reason: z.string().min(5, "调整理由至少需要5个字符"),
});

export const levelRouter = new Hono()
	.use(authMiddleware)

	// 提交等级申请
	.post("/apply", async (c) => {
		try {
			const user = c.get("user");
			const body = await c.req.json();
			const { levelType, action, targetLevel, reason, evidence } =
				levelApplicationSchema.parse(body);

			// 获取用户当前等级
			const currentUser = await db.user.findUnique({
				where: { id: user.id },
				select: {
					membershipLevel: true,
					creatorLevel: true,
					mentorLevel: true,
					contributorLevel: true,
				},
			});

			if (!currentUser) {
				return c.json({ error: "用户不存在" }, 404);
			}

			// 获取当前等级值
			let currentLevel: string | null = null;
			switch (levelType) {
				case "MEMBERSHIP":
					currentLevel = currentUser.membershipLevel;
					break;
				case "CREATOR":
					currentLevel = currentUser.creatorLevel;
					break;
				case "MENTOR":
					currentLevel = currentUser.mentorLevel;
					break;
				case "CONTRIBUTOR":
					currentLevel = currentUser.contributorLevel;
					break;
			}

			// 验证等级变更的合法性
			const levelTypeKey = levelType.toLowerCase() as
				| "membership"
				| "creator"
				| "mentor"
				| "contributor";

			if (action === "UPGRADE") {
				if (
					!canUpgradeToLevel(currentLevel, targetLevel, levelTypeKey)
				) {
					return c.json(
						{
							error: "无法升级到该等级，请检查升级路径是否正确",
						},
						400,
					);
				}
			} else if (action === "DOWNGRADE") {
				if (
					!canDowngradeToLevel(
						currentLevel,
						targetLevel,
						levelTypeKey,
					)
				) {
					return c.json(
						{
							error: "无法降级到该等级，请检查降级路径是否正确",
						},
						400,
					);
				}
			}

			// 检查是否有待审核的相同类型申请
			const existingApplication = await db.levelApplication.findFirst({
				where: {
					userId: user.id,
					levelType,
					status: "PENDING",
				},
			});

			if (existingApplication) {
				return c.json(
					{
						error: `您已有一个待审核的${getLevelTypeName(levelType)}申请，请等待审核完成`,
					},
					400,
				);
			}

			// 创建等级申请
			const application = await db.levelApplication.create({
				data: {
					userId: user.id,
					levelType,
					action,
					targetLevel,
					currentLevel,
					reason,
					evidence,
				},
				include: {
					user: {
						select: {
							id: true,
							name: true,
							username: true,
							email: true,
						},
					},
				},
			});

			return c.json({
				success: true,
				application,
				message: "等级申请提交成功，请等待管理员审核",
			});
		} catch (error) {
			console.error("等级申请提交失败:", error);

			if (error instanceof z.ZodError) {
				return c.json(
					{
						error: "请求数据格式错误",
						details: error.errors,
					},
					400,
				);
			}

			return c.json({ error: "服务器内部错误" }, 500);
		}
	})

	// 获取用户的申请记录
	.get("/applications", async (c) => {
		try {
			const user = c.get("user");

			const applications = await db.levelApplication.findMany({
				where: { userId: user.id },
				include: {
					reviewer: {
						select: {
							id: true,
							name: true,
							username: true,
						},
					},
				},
				orderBy: { createdAt: "desc" },
			});

			return c.json({
				success: true,
				applications,
			});
		} catch (error) {
			console.error("获取申请记录失败:", error);
			return c.json({ error: "服务器内部错误" }, 500);
		}
	})

	// 获取待审核的申请列表（管理员用）
	.get("/pending", async (c) => {
		try {
			const user = c.get("user");

			// 获取用户在各组织的角色
			const userMemberships = await db.member.findMany({
				where: { userId: user.id },
				include: {
					organization: {
						select: {
							id: true,
							name: true,
							slug: true,
						},
					},
				},
			});

			const organizationRoles = userMemberships.map((m) => m.role);

			// 检查是否有审核权限
			if (
				user.role !== "admin" &&
				user.role !== "super_admin" &&
				!organizationRoles.some(
					(role) =>
						role === "admin" ||
						role === "owner" ||
						role === "manager",
				)
			) {
				return c.json({ error: "无权限访问" }, 403);
			}

			const applications = await db.levelApplication.findMany({
				where: { status: "PENDING" },
				include: {
					user: {
						select: {
							id: true,
							name: true,
							username: true,
							email: true,
							membershipLevel: true,
							creatorLevel: true,
							mentorLevel: true,
							contributorLevel: true,
						},
					},
				},
				orderBy: { createdAt: "asc" },
			});

			// 过滤用户有权限审核的申请
			const filteredApplications = applications.filter((app) =>
				canReviewLevel(
					user.role,
					organizationRoles,
					app.targetLevel,
					app.levelType,
				),
			);

			return c.json({
				success: true,
				applications: filteredApplications,
			});
		} catch (error) {
			console.error("获取待审核申请失败:", error);
			return c.json({ error: "服务器内部错误" }, 500);
		}
	})

	// 审核申请
	.post("/review", async (c) => {
		try {
			const user = c.get("user");
			const body = await c.req.json();
			const { applicationId, action, reviewNote } =
				reviewApplicationSchema.parse(body);

			// 获取申请记录
			const application = await db.levelApplication.findUnique({
				where: { id: applicationId },
				include: {
					user: {
						select: {
							id: true,
							name: true,
							membershipLevel: true,
							creatorLevel: true,
							mentorLevel: true,
							contributorLevel: true,
						},
					},
				},
			});

			if (!application) {
				return c.json({ error: "申请记录不存在" }, 404);
			}

			if (application.status !== "PENDING") {
				return c.json({ error: "该申请已经被处理过了" }, 400);
			}

			// 检查审核权限
			const userMemberships = await db.member.findMany({
				where: { userId: user.id },
			});
			const organizationRoles = userMemberships.map((m) => m.role);

			if (
				!canReviewLevel(
					user.role,
					organizationRoles,
					application.targetLevel,
					application.levelType,
				)
			) {
				return c.json({ error: "无权限审核该等级申请" }, 403);
			}

			const newStatus: LevelApplicationStatus =
				action === "APPROVE" ? "APPROVED" : "REJECTED";

			// 开始数据库事务
			const result = await db.$transaction(async (prisma) => {
				// 更新申请状态
				const updatedApplication = await prisma.levelApplication.update(
					{
						where: { id: applicationId },
						data: {
							status: newStatus,
							reviewedBy: user.id,
							reviewedAt: new Date(),
							reviewNote,
						},
					},
				);

				// 如果申请被批准，更新用户等级
				if (action === "APPROVE") {
					const updateData: any = {};

					switch (application.levelType) {
						case "MEMBERSHIP":
							updateData.membershipLevel =
								application.targetLevel as MembershipLevel;
							break;
						case "CREATOR":
							updateData.creatorLevel =
								application.targetLevel as CreatorLevel;
							break;
						case "MENTOR":
							updateData.mentorLevel =
								application.targetLevel as MentorLevel;
							break;
						case "CONTRIBUTOR":
							updateData.contributorLevel =
								application.targetLevel as ContributorLevel;
							break;
					}

					await prisma.user.update({
						where: { id: application.userId },
						data: updateData,
					});
				}

				return updatedApplication;
			});

			return c.json({
				success: true,
				application: result,
				message: action === "APPROVE" ? "申请已批准" : "申请已拒绝",
			});
		} catch (error) {
			console.error("审核申请失败:", error);

			if (error instanceof z.ZodError) {
				return c.json(
					{
						error: "请求数据格式错误",
						details: error.errors,
					},
					400,
				);
			}

			return c.json({ error: "服务器内部错误" }, 500);
		}
	})

	// 管理员直接调整用户等级
	.post("/admin/adjust", async (c) => {
		try {
			const user = c.get("user");

			// 只有超级管理员可以直接调整等级
			if (user.role !== "admin" && user.role !== "super_admin") {
				return c.json({ error: "无权限执行此操作" }, 403);
			}

			const body = await c.req.json();

			// 添加详细日志：记录收到的原始请求数据
			console.log("🔍 [LEVEL_ADJUST] 收到等级调整请求:");
			console.log("  - 操作者:", user.id, user.name, user.role);
			console.log("  - 原始请求体:", JSON.stringify(body, null, 2));
			console.log("  - userId 类型:", typeof body.userId);
			console.log("  - userId 值:", body.userId);
			console.log("  - userId 长度:", body.userId?.length);

			const { userId, levelType, level, reason } =
				adjustLevelSchema.parse(body);

			console.log("✅ [LEVEL_ADJUST] Zod验证通过，解析后的数据:");
			console.log("  - userId:", userId);
			console.log("  - levelType:", levelType);
			console.log("  - level:", level);
			console.log("  - reason:", reason);

			// 移除CUID格式验证，允许其他格式的用户ID
			console.log(
				"✅ [LEVEL_ADJUST] 跳过CUID格式验证，允许任何格式的用户ID",
			);

			// 获取目标用户
			const targetUser = await db.user.findUnique({
				where: { id: userId },
				select: {
					id: true,
					name: true,
					membershipLevel: true,
					creatorLevel: true,
					mentorLevel: true,
					contributorLevel: true,
				},
			});

			if (!targetUser) {
				return c.json({ error: "目标用户不存在" }, 404);
			}

			// 获取当前等级
			let currentLevel: string | null = null;
			switch (levelType) {
				case "MEMBERSHIP":
					currentLevel = targetUser.membershipLevel;
					break;
				case "CREATOR":
					currentLevel = targetUser.creatorLevel;
					break;
				case "MENTOR":
					currentLevel = targetUser.mentorLevel;
					break;
				case "CONTRIBUTOR":
					currentLevel = targetUser.contributorLevel;
					break;
			}

			// 开始数据库事务
			const result = await db.$transaction(async (prisma) => {
				// 更新用户等级
				const updateData: any = {};

				switch (levelType) {
					case "MEMBERSHIP":
						updateData.membershipLevel =
							level as MembershipLevel | null;
						break;
					case "CREATOR":
						updateData.creatorLevel = level as CreatorLevel | null;
						break;
					case "MENTOR":
						updateData.mentorLevel = level as MentorLevel | null;
						break;
					case "CONTRIBUTOR":
						updateData.contributorLevel =
							level as ContributorLevel | null;
						break;
				}

				const updatedUser = await prisma.user.update({
					where: { id: userId },
					data: updateData,
				});

				// 创建一个管理员操作记录
				await prisma.levelApplication.create({
					data: {
						userId,
						levelType,
						action: level ? "UPGRADE" : "DOWNGRADE",
						targetLevel: level || "NONE",
						currentLevel,
						reason,
						status: "APPROVED",
						reviewedBy: user.id,
						reviewedAt: new Date(),
						submittedByAdmin: true,
						reviewNote: `管理员直接调整等级: ${reason}`,
					},
				});

				return updatedUser;
			});

			return c.json({
				success: true,
				user: result,
				message: "用户等级调整成功",
			});
		} catch (error) {
			console.error("🚨 [LEVEL_ADJUST] 调整用户等级失败:", error);

			if (error instanceof z.ZodError) {
				console.error("🚨 [LEVEL_ADJUST] Zod 验证错误详情:");
				console.error(
					"  - 错误数组:",
					JSON.stringify(error.errors, null, 2),
				);
				error.errors.forEach((err, index) => {
					console.error(`  - 错误 ${index + 1}:`);
					console.error(`    路径: ${err.path.join(".")}`);
					console.error(`    验证类型: ${err.code}`);
					console.error(`    错误信息: ${err.message}`);
					if ("validation" in err) {
						console.error(`    验证规则: ${err.validation}`);
					}
					if ("received" in err) {
						console.error(`    接收到的值: ${err.received}`);
					}
				});

				return c.json(
					{
						error: "请求数据格式错误",
						details: error.errors,
					},
					400,
				);
			}

			return c.json({ error: "服务器内部错误" }, 500);
		}
	})

	// 获取用户当前等级信息
	.get("/info", async (c) => {
		try {
			const user = c.get("user");

			const currentUser = await db.user.findUnique({
				where: { id: user.id },
				select: {
					membershipLevel: true,
					creatorLevel: true,
					mentorLevel: true,
					contributorLevel: true,
				},
			});

			if (!currentUser) {
				return c.json({ error: "用户不存在" }, 404);
			}

			const levelInfo = getUserLevelInfo(currentUser);

			return c.json({
				success: true,
				levels: levelInfo,
				rawLevels: currentUser,
			});
		} catch (error) {
			console.error("获取用户等级信息失败:", error);
			return c.json({ error: "服务器内部错误" }, 500);
		}
	});
