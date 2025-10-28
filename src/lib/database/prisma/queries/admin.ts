import { db } from "@/lib/database";
import type { Prisma } from "@prisma/client";

// 记录管理员操作日志
export async function logAdminAction({
	adminId,
	action,
	targetType,
	targetId,
	details = {},
}: {
	adminId: string;
	action: string;
	targetType: string;
	targetId: string;
	details?: Record<string, any>;
}) {
	try {
		await db.adminLog.create({
			data: {
				adminId,
				action,
				targetType,
				targetId,
				details,
			},
		});
	} catch (error) {
		console.error("Failed to log admin action:", error);
		// 不阻断主流程，只记录错误
	}
}

// 获取管理员操作日志
export async function getAdminLogs(options?: {
	adminId?: string;
	targetType?: string;
	limit?: number;
	offset?: number;
}) {
	return await db.adminLog.findMany({
		where: {
			...(options?.adminId && { adminId: options.adminId }),
			...(options?.targetType && { targetType: options.targetType }),
		},
		include: {
			admin: {
				select: { id: true, name: true, email: true },
			},
		},
		orderBy: { createdAt: "desc" },
		take: options?.limit || 50,
		skip: options?.offset || 0,
	});
}

// 获取仪表板统计数据
export async function getDashboardStats() {
	const [
		totalUsers,
		todayUsers,
		pendingContributions,
		activeOrganizations,
		totalEvents,
		totalProjects,
		totalContributions,
		totalBadges,
	] = await Promise.all([
		// 总用户数
		db.user.count(),

		// 今日新增用户
		db.user.count({
			where: {
				createdAt: {
					gte: new Date(new Date().setHours(0, 0, 0, 0)),
				},
			},
		}),

		// 待审核贡献数
		db.contribution.count({
			where: { status: "PENDING" },
		}),

		// 活跃组织数（本月有活动的组织）
		db.organization.count({
			where: {
				events: {
					some: {
						createdAt: {
							gte: new Date(
								new Date().getFullYear(),
								new Date().getMonth(),
								1,
							),
						},
					},
				},
			},
		}),

		// 总活动数
		db.event.count(),

		// 总作品数
		db.project.count(),

		// 总贡献数
		db.contribution.count(),

		// 总勋章数
		db.badge.count(),
	]);

	// 本周新增用户数
	const weekStart = new Date();
	weekStart.setDate(weekStart.getDate() - weekStart.getDay());
	weekStart.setHours(0, 0, 0, 0);

	const thisWeekUsers = await db.user.count({
		where: {
			createdAt: { gte: weekStart },
		},
	});

	return {
		totalUsers,
		todayUsers,
		thisWeekUsers,
		pendingContributions,
		activeOrganizations,
		totalEvents,
		totalProjects,
		totalContributions,
		totalBadges,
	};
}

// 获取用户列表（管理员用）
export async function getAdminUsersList(options?: {
	search?: string;
	cpLevel?: string;
	limit?: number;
	offset?: number;
}) {
	const where: Prisma.UserWhereInput = {};

	if (options?.search) {
		where.OR = [
			{ name: { contains: options.search, mode: "insensitive" } },
			{ email: { contains: options.search, mode: "insensitive" } },
			{ username: { contains: options.search, mode: "insensitive" } },
			{ bio: { contains: options.search, mode: "insensitive" } },
			{
				userRoleString: {
					contains: options.search,
					mode: "insensitive",
				},
			},
		];
	}

	if (options?.cpLevel) {
		const cpRanges = {
			"0": { gte: 0, lt: 50 },
			"1": { gte: 50, lt: 100 },
			"2": { gte: 100, lt: 500 },
			"3": { gte: 500, lt: 2000 },
			"4": { gte: 2000 },
		};
		const range = cpRanges[options.cpLevel as keyof typeof cpRanges];
		if (range) {
			where.cpValue = range;
		}
	}

	return await db.user.findMany({
		where,
		select: {
			id: true,
			name: true,
			email: true,
			username: true,
			image: true,
			role: true,
			cpValue: true,
			banned: true,
			bio: true,
			userRoleString: true,
			phoneNumber: true, // 添加手机号字段
			createdAt: true,
			updatedAt: true,
			joinedAt: true,
			// 添加等级字段
			membershipLevel: true,
			creatorLevel: true,
			mentorLevel: true,
			contributorLevel: true,
			_count: {
				select: {
					projects: true,
					eventCheckIns: true,
					contributions: true,
					userBadges: true,
				},
			},
		},
		orderBy: { createdAt: "desc" },
		take: options?.limit || 50,
		skip: options?.offset || 0,
	});
}

// 获取用户详细信息（管理员用）
export async function getAdminUserDetail(userId: string) {
	return await db.user.findUnique({
		where: { id: userId },
		include: {
			projects: {
				select: {
					id: true,
					title: true,
					stage: true,
					likeCount: true,
					createdAt: true,
				},
				orderBy: { createdAt: "desc" },
				take: 10,
			},
			eventCheckIns: {
				select: {
					id: true,
					checkedInAt: true,
					event: {
						select: { id: true, title: true, startTime: true },
					},
				},
				orderBy: { checkedInAt: "desc" },
				take: 10,
			},
			contributions: {
				select: {
					id: true,
					type: true,
					description: true,
					cpValue: true,
					status: true,
					createdAt: true,
				},
				orderBy: { createdAt: "desc" },
				take: 10,
			},
			userBadges: {
				select: {
					id: true,
					awardedAt: true,
					reason: true,
					badge: {
						select: { id: true, name: true, rarity: true },
					},
				},
				orderBy: { awardedAt: "desc" },
			},
			sessions: {
				select: {
					id: true,
					createdAt: true,
					ipAddress: true,
				},
				orderBy: { createdAt: "desc" },
				take: 5,
			},
		},
	});
}

// 管理员操作用户
export async function adminBanUser(
	adminId: string,
	userId: string,
	reason: string,
	expiresAt?: Date,
) {
	const user = await db.user.update({
		where: { id: userId },
		data: {
			banned: true,
			banReason: reason,
			banExpires: expiresAt,
		},
	});

	await logAdminAction({
		adminId,
		action: "ban_user",
		targetType: "user",
		targetId: userId,
		details: { reason, expiresAt },
	});

	return user;
}

export async function adminUnbanUser(adminId: string, userId: string) {
	const user = await db.user.update({
		where: { id: userId },
		data: {
			banned: false,
			banReason: null,
			banExpires: null,
		},
	});

	await logAdminAction({
		adminId,
		action: "unban_user",
		targetType: "user",
		targetId: userId,
		details: {},
	});

	return user;
}

// 管理员调整用户CP
export async function adminAdjustUserCP(
	adminId: string,
	userId: string,
	cpChange: number,
	reason: string,
) {
	const user = await db.user.update({
		where: { id: userId },
		data: {
			cpValue: { increment: cpChange },
		},
	});

	await logAdminAction({
		adminId,
		action: "adjust_cp",
		targetType: "user",
		targetId: userId,
		details: { cpChange, reason, newCpValue: user.cpValue },
	});

	return user;
}

// 获取待审核贡献列表
export async function getPendingContributions(options?: {
	type?: string;
	organizationId?: string;
	limit?: number;
	offset?: number;
}) {
	return await db.contribution.findMany({
		where: {
			status: "PENDING",
			...(options?.type && { type: options.type as any }),
			...(options?.organizationId && {
				organizationId: options.organizationId,
			}),
		},
		include: {
			user: {
				select: { id: true, name: true, email: true },
			},
			organization: {
				select: { id: true, name: true },
			},
		},
		orderBy: { createdAt: "asc" }, // 按时间顺序审核
		take: options?.limit || 50,
		skip: options?.offset || 0,
	});
}

// 系统配置相关
export async function getSystemConfig(key: string) {
	const config = await db.systemConfig.findUnique({
		where: { key },
	});
	return config?.value;
}

export async function updateSystemConfig(
	key: string,
	value: any,
	updatedBy: string,
	description?: string,
) {
	const config = await db.systemConfig.upsert({
		where: { key },
		update: {
			value,
			updatedBy,
			description,
		},
		create: {
			key,
			value,
			updatedBy,
			description,
		},
	});

	await logAdminAction({
		adminId: updatedBy,
		action: "update_config",
		targetType: "system_config",
		targetId: key,
		details: { oldValue: config.value, newValue: value },
	});

	return config;
}

// 获取所有系统配置（管理员功能）
export async function getAllSystemConfigs() {
	return await db.systemConfig.findMany({
		include: {
			updater: {
				select: { id: true, name: true, email: true },
			},
		},
		orderBy: { key: "asc" },
	});
}
