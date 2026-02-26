import { auth } from "@community/lib-server/auth";
import {
	AdminPermission,
	hasPermission,
} from "@community/lib-shared/auth/permissions";
import { db } from "@community/lib-server/database";
import {
	adminAdjustUserCP,
	adminBanUser,
	adminUnbanUser,
	getAdminUserDetail,
	getAdminUsersList,
	getAllSystemConfigs,
	getDashboardStats,
	logAdminAction,
	updateSystemConfig,
} from "@community/lib-server/database/prisma/queries/admin";
import {
	awardBadge,
	createBadge,
	deleteBadge,
	getAllBadges,
	getUserBadges,
	revokeBadge,
	updateBadge,
} from "@community/lib-server/database/prisma/queries/badges";
import {
	getPendingContributions,
	reviewContribution,
} from "@community/lib-server/database/prisma/queries/contributions";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";

const banUserSchema = z.object({
	reason: z.string().min(1, "封禁原因不能为空"),
	expiresAt: z
		.string()
		.optional()
		.transform((val) => (val ? new Date(val) : undefined)),
});

const adjustCpSchema = z.object({
	cpChange: z.number().int().min(-1000).max(1000),
	reason: z.string().min(1, "调整原因不能为空"),
});

const assignRoleSchema = z.object({
	userId: z.string().min(1, "用户ID不能为空"),
	role: z.enum(["user", "operation_admin", "super_admin"], {
		message: "无效的角色类型",
	}),
	reason: z.string().min(5, "设置理由至少需要5个字符"),
});

const awardBadgeSchema = z.object({
	badgeId: z.string().min(1),
	reason: z.string().optional(),
});

const reviewContributionSchema = z.object({
	action: z.enum(["APPROVE", "REJECT"]),
	note: z.string().optional(),
});

const createBadgeSchema = z.object({
	name: z.string().min(1, "勋章名称不能为空"),
	description: z.string().min(1, "勋章描述不能为空"),
	icon: z.string().optional(),
	color: z.string().optional(),
	rarity: z.enum(["COMMON", "UNCOMMON", "RARE", "EPIC", "LEGENDARY"]),
	isActive: z.boolean().default(true),
	isAutoAwarded: z.boolean().default(false),
	conditions: z.any().optional(),
});

const updateConfigSchema = z.object({
	value: z.any(),
	description: z.string().optional(),
});

export const superAdminRouter = new Hono()
	// GET /dashboard - 仪表板数据
	.get("/dashboard", async (c) => {
		try {
			const session = await auth.api.getSession({
				headers: c.req.raw.headers,
			});

			if (
				!session?.user ||
				!hasPermission(session.user, AdminPermission.VIEW_DASHBOARD)
			) {
				return c.json({ error: "Access denied" }, 403);
			}

			const stats = await getDashboardStats();
			return c.json({ stats });
		} catch (error) {
			console.error("Error fetching dashboard stats:", error);
			return c.json({ error: "Internal server error" }, 500);
		}
	})

	// GET /users - 用户列表
	.get("/users", async (c) => {
		try {
			const session = await auth.api.getSession({
				headers: c.req.raw.headers,
			});

			if (
				!session?.user ||
				!hasPermission(session.user, AdminPermission.VIEW_USERS)
			) {
				return c.json({ error: "Access denied" }, 403);
			}

			const {
				search,
				cpLevel,
				limit = "1000",
				offset = "0",
			} = c.req.query();

			const [users, totalCount] = await Promise.all([
				getAdminUsersList({
					search,
					cpLevel,
					limit: Number.parseInt(limit),
					offset: Number.parseInt(offset),
				}),
				// 获取总用户数（不受分页限制）
				db.user.count({
					where: search
						? {
								OR: [
									{
										name: {
											contains: search,
											mode: "insensitive",
										},
									},
									{
										email: {
											contains: search,
											mode: "insensitive",
										},
									},
									{
										username: {
											contains: search,
											mode: "insensitive",
										},
									},
									{
										bio: {
											contains: search,
											mode: "insensitive",
										},
									},
									{
										userRoleString: {
											contains: search,
											mode: "insensitive",
										},
									},
								],
							}
						: undefined,
				}),
			]);

			// 转换数据格式以匹配前端期望
			const transformedUsers = users.map((user) => ({
				id: user.id,
				name: user.name,
				email: user.email,
				username: user.username,
				image: user.image,
				cpValue: user.cpValue,
				role: user.role,
				isBanned: user?.banned || false, // 转换字段名，添加空值检查
				createdAt: user.createdAt.toISOString(),
				totalContributions: user._count?.contributions || 0, // 转换字段名
				approvedContributions: 0, // 这个需要单独查询
				badgeCount: user._count?.userBadges || 0, // 转换字段名
				phoneNumber: user.phoneNumber, // 添加手机号字段
				bio: user.bio,
				userRoleString: user.userRoleString,
				// 身份字段
				membershipLevel: user.membershipLevel,
			}));

			return c.json({ users: transformedUsers, totalCount });
		} catch (error) {
			console.error("Error fetching users:", error);
			return c.json({ error: "Internal server error" }, 500);
		}
	})

	// GET /users/:id - 用户详情
	.get("/users/:id", async (c) => {
		try {
			const session = await auth.api.getSession({
				headers: c.req.raw.headers,
			});

			if (
				!session?.user ||
				!hasPermission(session.user, AdminPermission.VIEW_USERS)
			) {
				return c.json({ error: "Access denied" }, 403);
			}

			const userId = c.req.param("id");
			const user = await getAdminUserDetail(userId);

			if (!user) {
				return c.json({ error: "User not found" }, 404);
			}

			return c.json({ user });
		} catch (error) {
			console.error("Error fetching user detail:", error);
			return c.json({ error: "Internal server error" }, 500);
		}
	})

	// POST /users/:id/ban - 封禁用户
	.post("/users/:id/ban", zValidator("json", banUserSchema), async (c) => {
		try {
			const session = await auth.api.getSession({
				headers: c.req.raw.headers,
			});

			if (
				!session?.user ||
				!hasPermission(session.user, AdminPermission.BAN_USERS)
			) {
				return c.json({ error: "Access denied" }, 403);
			}

			const userId = c.req.param("id");
			const { reason, expiresAt } = c.req.valid("json");

			const user = await adminBanUser(
				session.user.id,
				userId,
				reason,
				expiresAt,
			);

			return c.json({ user });
		} catch (error) {
			console.error("Error banning user:", error);
			return c.json({ error: "Internal server error" }, 500);
		}
	})

	// POST /users/:id/unban - 解封用户
	.post("/users/:id/unban", async (c) => {
		try {
			const session = await auth.api.getSession({
				headers: c.req.raw.headers,
			});

			if (
				!session?.user ||
				!hasPermission(session.user, AdminPermission.BAN_USERS)
			) {
				return c.json({ error: "Access denied" }, 403);
			}

			const userId = c.req.param("id");
			const user = await adminUnbanUser(session.user.id, userId);

			return c.json({ user });
		} catch (error) {
			console.error("Error unbanning user:", error);
			return c.json({ error: "Internal server error" }, 500);
		}
	})

	// POST /users/:id/adjust-cp - 调整用户CP
	.post(
		"/users/:id/adjust-cp",
		zValidator("json", adjustCpSchema),
		async (c) => {
			try {
				const session = await auth.api.getSession({
					headers: c.req.raw.headers,
				});

				if (
					!session?.user ||
					!hasPermission(session.user, AdminPermission.MANAGE_USERS)
				) {
					return c.json({ error: "Access denied" }, 403);
				}

				const userId = c.req.param("id");
				const { cpChange, reason } = c.req.valid("json");

				const user = await adminAdjustUserCP(
					session.user.id,
					userId,
					cpChange,
					reason,
				);

				return c.json({ user });
			} catch (error) {
				console.error("Error adjusting user积分:", error);
				return c.json({ error: "Internal server error" }, 500);
			}
		},
	)

	// POST /users/assign-role - 设置用户角色
	.post(
		"/users/assign-role",
		zValidator("json", assignRoleSchema),
		async (c) => {
			try {
				const session = await auth.api.getSession({
					headers: c.req.raw.headers,
				});

				const { userId, role, reason } = c.req.valid("json");

				// 权限验证：检查用户是否有设置角色的权限
				if (
					!session?.user ||
					!hasPermission(session.user, AdminPermission.ASSIGN_ROLES)
				) {
					return c.json({ error: "Access denied" }, 403);
				}

				// 如果要设置为超级管理员，必须是超级管理员才能操作
				const userRole = (session.user as any).role;
				if (
					role === "super_admin" &&
					userRole !== "super_admin" &&
					userRole !== "admin"
				) {
					return c.json(
						{
							error: "Only super admins can assign super admin role",
						},
						403,
					);
				}

				// 检查用户是否存在
				const targetUser = await db.user.findUnique({
					where: { id: userId },
				});

				if (!targetUser) {
					return c.json({ error: "User not found" }, 404);
				}

				// 更新用户角色
				const updatedUser = await db.user.update({
					where: { id: userId },
					data: { role },
				});

				// 记录管理员操作
				await logAdminAction({
					adminId: session.user.id,
					action: "assign_role",
					targetType: "user",
					targetId: userId,
					details: {
						oldRole: targetUser.role,
						newRole: role,
						reason,
					},
				});

				return c.json({
					success: true,
					user: {
						id: updatedUser.id,
						name: updatedUser.name,
						email: updatedUser.email,
						role: updatedUser.role,
					},
				});
			} catch (error) {
				console.error("Error assigning user role:", error);
				return c.json({ error: "Internal server error" }, 500);
			}
		},
	)

	// GET /users/:id/badges - 获取用户勋章
	.get("/users/:id/badges", async (c) => {
		try {
			const session = await auth.api.getSession({
				headers: c.req.raw.headers,
			});

			if (
				!session?.user ||
				!hasPermission(session.user, AdminPermission.VIEW_BADGES)
			) {
				return c.json({ error: "Access denied" }, 403);
			}

			const userId = c.req.param("id");
			const badges = await getUserBadges(userId);

			return c.json({ badges });
		} catch (error) {
			console.error("Error fetching user badges:", error);
			return c.json({ error: "Internal server error" }, 500);
		}
	})

	// POST /users/:id/badges - 为用户颁发勋章
	.post(
		"/users/:id/badges",
		zValidator("json", awardBadgeSchema),
		async (c) => {
			try {
				const session = await auth.api.getSession({
					headers: c.req.raw.headers,
				});

				if (
					!session?.user ||
					!hasPermission(session.user, AdminPermission.AWARD_BADGES)
				) {
					return c.json({ error: "Access denied" }, 403);
				}

				const userId = c.req.param("id");
				const { badgeId, reason } = c.req.valid("json");

				const userBadge = await awardBadge({
					userId,
					badgeId,
					awardedBy: session.user.id,
					reason,
				});

				await logAdminAction({
					adminId: session.user.id,
					action: "award_badge",
					targetType: "user_badge",
					targetId: userBadge.id,
					details: { userId, badgeId, reason },
				});

				return c.json({ userBadge });
			} catch (error) {
				console.error("Error awarding badge:", error);

				if (
					error instanceof Error &&
					error.message.includes("已拥有该勋章")
				) {
					return c.json({ error: "用户已拥有该勋章" }, 409);
				}

				return c.json({ error: "Internal server error" }, 500);
			}
		},
	)

	// DELETE /users/:userId/badges/:badgeId - 撤销用户勋章
	.delete("/users/:userId/badges/:badgeId", async (c) => {
		try {
			const session = await auth.api.getSession({
				headers: c.req.raw.headers,
			});

			if (
				!session?.user ||
				!hasPermission(session.user, AdminPermission.MANAGE_BADGES)
			) {
				return c.json({ error: "Access denied" }, 403);
			}

			const userId = c.req.param("userId");
			const badgeId = c.req.param("badgeId");

			await revokeBadge(userId, badgeId);

			await logAdminAction({
				adminId: session.user.id,
				action: "revoke_badge",
				targetType: "user_badge",
				targetId: `${userId}-${badgeId}`,
				details: { userId, badgeId },
			});

			return c.json({ success: true });
		} catch (error) {
			console.error("Error revoking badge:", error);
			return c.json({ error: "Internal server error" }, 500);
		}
	})

	// GET /contributions - 获取贡献列表
	.get("/contributions", async (c) => {
		try {
			const session = await auth.api.getSession({
				headers: c.req.raw.headers,
			});

			if (
				!session?.user ||
				!hasPermission(
					session.user,
					AdminPermission.REVIEW_CONTRIBUTIONS,
				)
			) {
				return c.json({ error: "Access denied" }, 403);
			}

			const {
				status = "ALL",
				limit = "50",
				offset = "0",
			} = c.req.query();

			const contributions = await getPendingContributions({
				status: status as any,
				limit: Number.parseInt(limit),
				offset: Number.parseInt(offset),
			});

			return c.json({ contributions });
		} catch (error) {
			console.error("Error fetching contributions:", error);
			return c.json({ error: "Internal server error" }, 500);
		}
	})

	// POST /contributions/:id/review - 审核贡献
	.post(
		"/contributions/:id/review",
		zValidator("json", reviewContributionSchema),
		async (c) => {
			try {
				const session = await auth.api.getSession({
					headers: c.req.raw.headers,
				});

				if (
					!session?.user ||
					!hasPermission(
						session.user,
						AdminPermission.REVIEW_CONTRIBUTIONS,
					)
				) {
					return c.json({ error: "Access denied" }, 403);
				}

				const contributionId = c.req.param("id");
				const { action, note } = c.req.valid("json");

				const contribution = await reviewContribution(
					contributionId,
					action === "APPROVE" ? "APPROVED" : "REJECTED",
					session.user.id,
					note,
				);

				await logAdminAction({
					adminId: session.user.id,
					action:
						action === "APPROVE"
							? "approve_contribution"
							: "reject_contribution",
					targetType: "contribution",
					targetId: contributionId,
					details: { contributionId, action, note },
				});

				return c.json({ contribution });
			} catch (error) {
				console.error("Error reviewing contribution:", error);
				return c.json({ error: "Internal server error" }, 500);
			}
		},
	)

	// GET /badges - 获取所有勋章
	.get("/badges", async (c) => {
		try {
			const session = await auth.api.getSession({
				headers: c.req.raw.headers,
			});

			if (
				!session?.user ||
				!hasPermission(session.user, AdminPermission.VIEW_BADGES)
			) {
				return c.json({ error: "Access denied" }, 403);
			}

			const badges = await getAllBadges();

			// 转换格式以匹配前端期望
			const formattedBadges = badges.map((badge) => ({
				...badge,
				awardedCount: badge._count?.userBadges || 0,
			}));

			return c.json({ badges: formattedBadges });
		} catch (error) {
			console.error("Error fetching badges:", error);
			return c.json({ error: "Internal server error" }, 500);
		}
	})

	// POST /badges - 创建新勋章
	.post("/badges", zValidator("json", createBadgeSchema), async (c) => {
		try {
			const session = await auth.api.getSession({
				headers: c.req.raw.headers,
			});

			if (
				!session?.user ||
				!hasPermission(session.user, AdminPermission.MANAGE_BADGES)
			) {
				return c.json({ error: "Access denied" }, 403);
			}

			const {
				name,
				description,
				icon,
				color,
				rarity,
				isActive,
				isAutoAwarded,
				conditions,
			} = c.req.valid("json");

			const badge = await createBadge({
				name,
				description,
				iconUrl: icon,
				color,
				rarity: rarity as any,
				isActive,
				isAutoAwarded,
				conditions,
			});

			await logAdminAction({
				adminId: session.user.id,
				action: "create_badge",
				targetType: "badge",
				targetId: badge.id,
				details: { name, description, rarity },
			});

			return c.json({ badge });
		} catch (error) {
			console.error("Error creating badge:", error);
			return c.json({ error: "Internal server error" }, 500);
		}
	})

	// PUT /badges/:id - 更新勋章
	.put("/badges/:id", zValidator("json", createBadgeSchema), async (c) => {
		try {
			const session = await auth.api.getSession({
				headers: c.req.raw.headers,
			});

			if (
				!session?.user ||
				!hasPermission(session.user, AdminPermission.MANAGE_BADGES)
			) {
				return c.json({ error: "Access denied" }, 403);
			}

			const badgeId = c.req.param("id");
			const {
				name,
				description,
				icon,
				color,
				rarity,
				isActive,
				isAutoAwarded,
				conditions,
			} = c.req.valid("json");

			const badge = await updateBadge(badgeId, {
				name,
				description,
				iconUrl: icon,
				color,
				rarity: rarity as any,
				isActive,
				isAutoAwarded,
				conditions,
			});

			await logAdminAction({
				adminId: session.user.id,
				action: "update_badge",
				targetType: "badge",
				targetId: badgeId,
				details: { name, description, rarity },
			});

			return c.json({ badge });
		} catch (error) {
			console.error("Error updating badge:", error);
			return c.json({ error: "Internal server error" }, 500);
		}
	})

	// DELETE /badges/:id - 删除勋章
	.delete("/badges/:id", async (c) => {
		try {
			const session = await auth.api.getSession({
				headers: c.req.raw.headers,
			});

			if (
				!session?.user ||
				!hasPermission(session.user, AdminPermission.MANAGE_BADGES)
			) {
				return c.json({ error: "Access denied" }, 403);
			}

			const badgeId = c.req.param("id");

			await deleteBadge(badgeId);

			await logAdminAction({
				adminId: session.user.id,
				action: "delete_badge",
				targetType: "badge",
				targetId: badgeId,
				details: { badgeId },
			});

			return c.json({ success: true });
		} catch (error) {
			console.error("Error deleting badge:", error);
			return c.json({ error: "Internal server error" }, 500);
		}
	})

	// GET /config - 获取系统配置
	.get("/config", async (c) => {
		try {
			const session = await auth.api.getSession({
				headers: c.req.raw.headers,
			});

			if (
				!session?.user ||
				!hasPermission(session.user, AdminPermission.MANAGE_SYSTEM)
			) {
				return c.json({ error: "Access denied" }, 403);
			}

			const configs = await getAllSystemConfigs();

			// 转换格式以匹配前端期望
			const formattedConfigs = configs.map((config) => ({
				key: config.key,
				value: config.value,
				description: config.description,
				updatedAt: config.updatedAt,
				updatedBy: config.updater,
			}));

			return c.json({ configs: formattedConfigs });
		} catch (error) {
			console.error("Error fetching system configs:", error);
			return c.json({ error: "Internal server error" }, 500);
		}
	})

	// PUT /config/:key - 更新系统配置
	.put("/config/:key", zValidator("json", updateConfigSchema), async (c) => {
		try {
			const session = await auth.api.getSession({
				headers: c.req.raw.headers,
			});

			if (
				!session?.user ||
				!hasPermission(session.user, AdminPermission.MANAGE_SYSTEM)
			) {
				return c.json({ error: "Access denied" }, 403);
			}

			const configKey = c.req.param("key");
			const { value, description } = c.req.valid("json");

			const config = await updateSystemConfig(
				configKey,
				value,
				session.user.id,
				description,
			);

			return c.json({ config });
		} catch (error) {
			console.error("Error updating system config:", error);
			return c.json({ error: "Internal server error" }, 500);
		}
	})

	// 活动管理路由
	// GET /events - 获取所有活动
	.get("/events", async (c) => {
		try {
			const session = await auth.api.getSession({
				headers: c.req.raw.headers,
			});

			if (
				!session?.user ||
				!hasPermission(session.user, AdminPermission.VIEW_DASHBOARD)
			) {
				return c.json({ error: "Access denied" }, 403);
			}

			const limit = Number(c.req.query("limit")) || 20;
			const offset = Number(c.req.query("offset")) || 0;
			const search = c.req.query("search");

			const where = search
				? {
						OR: [
							{
								title: {
									contains: search,
									mode: "insensitive" as const,
								},
							},
							{
								organizer: {
									name: {
										contains: search,
										mode: "insensitive" as const,
									},
								},
							},
							{
								organization: {
									name: {
										contains: search,
										mode: "insensitive" as const,
									},
								},
							},
						],
					}
				: {};

			const events = await db.event.findMany({
				where,
				include: {
					organizer: {
						select: {
							name: true,
						},
					},
					organization: {
						select: {
							name: true,
						},
					},
					_count: {
						select: {
							registrations: true,
						},
					},
				},
				orderBy: {
					createdAt: "desc",
				},
				take: limit,
				skip: offset,
			});

			const mappedEvents = events.map((event) => ({
				id: event.id,
				title: event.title,
				description: event.richContent || event.shortDescription,
				type: event.type,
				status: event.status,
				startTime: event.startTime.toISOString(),
				endTime: event.endTime.toISOString(),
				isOnline: event.isOnline,
				address: event.address,
				maxAttendees: event.maxAttendees,
				registrationCount: event._count.registrations,
				organizerName: event.organizer.name,
				organizationName: event.organization?.name,
				createdAt: event.createdAt.toISOString(),
				featured: event.featured,
			}));

			return c.json(mappedEvents);
		} catch (error) {
			console.error("Error fetching events:", error);
			return c.json({ error: "Internal server error" }, 500);
		}
	})

	// GET /events/stats - 获取活动统计
	.get("/events/stats", async (c) => {
		try {
			const session = await auth.api.getSession({
				headers: c.req.raw.headers,
			});

			if (
				!session?.user ||
				!hasPermission(session.user, AdminPermission.VIEW_DASHBOARD)
			) {
				return c.json({ error: "Access denied" }, 403);
			}

			const [total, published, draft, cancelled, totalRegistrations] =
				await Promise.all([
					db.event.count(),
					db.event.count({ where: { status: "PUBLISHED" } }),
					db.event.count({ where: { status: "DRAFT" } }),
					db.event.count({ where: { status: "CANCELLED" } }),
					db.eventRegistration.count(),
				]);

			return c.json({
				total,
				published,
				draft,
				cancelled,
				totalRegistrations,
			});
		} catch (error) {
			console.error("Error fetching event stats:", error);
			return c.json({ error: "Internal server error" }, 500);
		}
	})

	// PATCH /events/:id/featured - 切换活动精选状态
	.patch("/events/:id/featured", async (c) => {
		try {
			const session = await auth.api.getSession({
				headers: c.req.raw.headers,
			});

			if (
				!session?.user ||
				!hasPermission(session.user, AdminPermission.MANAGE_SYSTEM)
			) {
				return c.json({ error: "Access denied" }, 403);
			}

			const eventId = c.req.param("id");
			const { featured } = await c.req.json();

			// 检查活动是否存在
			const event = await db.event.findUnique({
				where: { id: eventId },
			});

			if (!event) {
				return c.json({ error: "活动不存在" }, 404);
			}

			// 更新精选状态
			const updatedEvent = await db.event.update({
				where: { id: eventId },
				data: { featured },
			});

			// 记录管理员操作
			await logAdminAction({
				adminId: session.user.id,
				action: featured ? "FEATURE_EVENT" : "UNFEATURE_EVENT",
				targetType: "Event",
				targetId: eventId,
				details: { eventTitle: event.title, featured },
			});

			return c.json({
				success: true,
				featured: updatedEvent.featured,
			});
		} catch (error) {
			console.error("Error updating event featured status:", error);
			return c.json({ error: "Internal server error" }, 500);
		}
	})

	// DELETE /events/:id - 删除活动
	.delete("/events/:id", async (c) => {
		try {
			const session = await auth.api.getSession({
				headers: c.req.raw.headers,
			});

			if (
				!session?.user ||
				!hasPermission(session.user, AdminPermission.MANAGE_SYSTEM)
			) {
				return c.json({ error: "Access denied" }, 403);
			}

			const eventId = c.req.param("id");

			// 检查活动是否存在
			const event = await db.event.findUnique({
				where: { id: eventId },
			});

			if (!event) {
				return c.json({ error: "活动不存在" }, 404);
			}

			// 删除活动（由于数据库约束设置了CASCADE，相关数据会自动删除）
			await db.event.delete({
				where: { id: eventId },
			});

			// 记录管理员操作
			await logAdminAction({
				adminId: session.user.id,
				action: "DELETE_EVENT",
				targetType: "Event",
				targetId: eventId,
				details: { eventTitle: event.title },
			});

			return c.json({ success: true });
		} catch (error) {
			console.error("Error deleting event:", error);
			return c.json({ error: "Internal server error" }, 500);
		}
	})

	// 作品管理路由
	// GET /projects - 获取所有作品
	.get("/projects", async (c) => {
		try {
			const session = await auth.api.getSession({
				headers: c.req.raw.headers,
			});

			if (
				!session?.user ||
				!hasPermission(session.user, AdminPermission.VIEW_DASHBOARD)
			) {
				return c.json({ error: "Access denied" }, 403);
			}

			const limit = Number(c.req.query("limit")) || 20;
			const offset = Number(c.req.query("offset")) || 0;
			const search = c.req.query("search");

			const where = search
				? {
						OR: [
							{
								title: {
									contains: search,
									mode: "insensitive" as const,
								},
							},
							{
								description: {
									contains: search,
									mode: "insensitive" as const,
								},
							},
							{
								user: {
									name: {
										contains: search,
										mode: "insensitive" as const,
									},
								},
							},
							{
								projectTags: {
									hasSome: [search],
								},
							},
						],
					}
				: {};

			const projects = await db.project.findMany({
				where,
				include: {
					user: {
						select: {
							name: true,
							image: true,
						},
					},
				},
				orderBy: {
					createdAt: "desc",
				},
				take: limit,
				skip: offset,
			});

			const mappedProjects = projects.map((project) => ({
				id: project.id,
				title: project.title,
				description: project.description,
				subtitle: project.subtitle,
				stage: project.stage,
				url: project.url,
				userId: project.userId,
				userName: project.user.name,
				userAvatar: project.user.image,
				featured: project.featured,
				viewCount: project.viewCount,
				likeCount: project.likeCount,
				commentCount: project.commentCount,
				screenshots: project.screenshots,
				projectTags: project.projectTags,
				pricingType: project.pricingType,
				isRecruiting: project.isRecruiting,
				createdAt: project.createdAt.toISOString(),
				updatedAt: project.updatedAt.toISOString(),
			}));

			return c.json(mappedProjects);
		} catch (error) {
			console.error("Error fetching projects:", error);
			return c.json({ error: "Internal server error" }, 500);
		}
	})

	// GET /projects/stats - 获取作品统计
	.get("/projects/stats", async (c) => {
		try {
			const session = await auth.api.getSession({
				headers: c.req.raw.headers,
			});

			if (
				!session?.user ||
				!hasPermission(session.user, AdminPermission.VIEW_DASHBOARD)
			) {
				return c.json({ error: "Access denied" }, 403);
			}

			const [
				total,
				featured,
				recruiting,
				totalViews,
				totalLikes,
				stageStats,
			] = await Promise.all([
				db.project.count(),
				db.project.count({ where: { featured: true } }),
				db.project.count({ where: { isRecruiting: true } }),
				db.project.aggregate({
					_sum: { viewCount: true },
				}),
				db.project.aggregate({
					_sum: { likeCount: true },
				}),
				db.project.groupBy({
					by: ["stage"],
					_count: true,
				}),
			]);

			const byStage = stageStats.reduce(
				(acc, stat) => {
					acc[stat.stage] = stat._count;
					return acc;
				},
				{} as { [key: string]: number },
			);

			return c.json({
				total,
				featured,
				recruiting,
				totalViews: totalViews._sum.viewCount || 0,
				totalLikes: totalLikes._sum.likeCount || 0,
				byStage,
			});
		} catch (error) {
			console.error("Error fetching project stats:", error);
			return c.json({ error: "Internal server error" }, 500);
		}
	})

	// PATCH /projects/:id/featured - 切换作品精选状态
	.patch("/projects/:id/featured", async (c) => {
		try {
			const session = await auth.api.getSession({
				headers: c.req.raw.headers,
			});

			if (
				!session?.user ||
				!hasPermission(session.user, AdminPermission.MANAGE_SYSTEM)
			) {
				return c.json({ error: "Access denied" }, 403);
			}

			const projectId = c.req.param("id");
			const { featured } = await c.req.json();

			// 检查作品是否存在
			const project = await db.project.findUnique({
				where: { id: projectId },
			});

			if (!project) {
				return c.json({ error: "作品不存在" }, 404);
			}

			// 更新精选状态
			const updatedProject = await db.project.update({
				where: { id: projectId },
				data: { featured },
			});

			// 记录管理员操作
			await logAdminAction({
				adminId: session.user.id,
				action: featured ? "FEATURE_PROJECT" : "UNFEATURE_PROJECT",
				targetType: "Project",
				targetId: projectId,
				details: { projectTitle: project.title, featured },
			});

			return c.json({
				success: true,
				featured: updatedProject.featured,
			});
		} catch (error) {
			console.error("Error updating project featured status:", error);
			return c.json({ error: "Internal server error" }, 500);
		}
	})

	// DELETE /projects/:id - 删除作品
	.delete("/projects/:id", async (c) => {
		try {
			const session = await auth.api.getSession({
				headers: c.req.raw.headers,
			});

			if (
				!session?.user ||
				!hasPermission(session.user, AdminPermission.MANAGE_SYSTEM)
			) {
				return c.json({ error: "Access denied" }, 403);
			}

			const projectId = c.req.param("id");

			// 检查作品是否存在
			const project = await db.project.findUnique({
				where: { id: projectId },
			});

			if (!project) {
				return c.json({ error: "作品不存在" }, 404);
			}

			// 删除作品（由于数据库约束设置了CASCADE，相关数据会自动删除）
			await db.project.delete({
				where: { id: projectId },
			});

			// 记录管理员操作
			await logAdminAction({
				adminId: session.user.id,
				action: "DELETE_PROJECT",
				targetType: "Project",
				targetId: projectId,
				details: { projectTitle: project.title },
			});

			return c.json({ success: true });
		} catch (error) {
			console.error("Error deleting project:", error);
			return c.json({ error: "Internal server error" }, 500);
		}
	})

	// 获奖证书管理路由
	// GET /certificates - 获取所有获奖证书
	.get("/certificates", async (c) => {
		try {
			const session = await auth.api.getSession({
				headers: c.req.raw.headers,
			});

			if (
				!session?.user ||
				!hasPermission(session.user, AdminPermission.VIEW_DASHBOARD)
			) {
				return c.json({ error: "Access denied" }, 403);
			}

			const limit = Number(c.req.query("limit")) || 50;
			const offset = Number(c.req.query("offset")) || 0;
			const search = c.req.query("search");
			const level = c.req.query("level");
			const category = c.req.query("category");
			const generated = c.req.query("generated");

			const where: any = {};

			// 搜索条件
			if (search) {
				where.OR = [
					{
						project: {
							title: {
								contains: search,
								mode: "insensitive" as const,
							},
						},
					},
					{
						project: {
							user: {
								name: {
									contains: search,
									mode: "insensitive" as const,
								},
							},
						},
					},
					{
						award: {
							name: {
								contains: search,
								mode: "insensitive" as const,
							},
						},
					},
				];
			}

			// 奖项级别筛选
			if (level && level !== "all") {
				where.award = { ...(where.award || {}), level };
			}

			// 奖项类别筛选
			if (category && category !== "all") {
				where.award = { ...(where.award || {}), category };
			}

			// 证书生成状态筛选
			if (generated && generated !== "all") {
				where.certificateGenerated = generated === "generated";
			}

			const certificates = await db.projectAward.findMany({
				where,
				include: {
					project: {
						include: {
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
					award: true,
					event: {
						select: {
							id: true,
							title: true,
						},
					},
					awarder: {
						select: {
							id: true,
							name: true,
						},
					},
				},
				orderBy: {
					awardedAt: "desc",
				},
				take: limit,
				skip: offset,
			});

			return c.json({ success: true, data: certificates });
		} catch (error) {
			console.error("Error fetching certificates:", error);
			return c.json({ error: "Internal server error" }, 500);
		}
	});

export default superAdminRouter;
