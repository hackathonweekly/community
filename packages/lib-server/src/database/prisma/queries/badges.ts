import { db } from "@community/lib-server/database";
import { BadgeRarity } from "@prisma/client";

// 根据稀有度获取默认颜色
function getDefaultColorByRarity(rarity: BadgeRarity): string {
	const rarityColors: Record<BadgeRarity, string> = {
		COMMON: "#6B7280", // 灰色
		UNCOMMON: "#10B981", // 绿色
		RARE: "#3B82F6", // 蓝色
		EPIC: "#8B5CF6", // 紫色
		LEGENDARY: "#F59E0B", // 黄金色
	};
	return rarityColors[rarity];
}

// 创建勋章
export async function createBadge({
	name,
	description,
	iconUrl,
	color,
	rarity = BadgeRarity.COMMON,
	isActive = true,
	isAutoAwarded = false,
	conditions,
}: {
	name: string;
	description: string;
	iconUrl?: string;
	color?: string;
	rarity?: BadgeRarity;
	isActive?: boolean;
	isAutoAwarded?: boolean;
	conditions?: any;
}) {
	// 如果没有提供颜色，根据稀有度自动分配颜色
	const badgeColor = color || getDefaultColorByRarity(rarity);

	return await db.badge.create({
		data: {
			name,
			description,
			iconUrl,
			color: badgeColor,
			rarity,
			isActive,
			isAutoAwarded,
			conditions,
		},
	});
}

// 获取所有活跃勋章
export async function getActiveBadges() {
	return await db.badge.findMany({
		where: { isActive: true },
		orderBy: [{ rarity: "desc" }, { name: "asc" }],
	});
}

// 为用户颁发勋章
export async function awardBadge({
	userId,
	badgeId,
	awardedBy,
	reason,
	expiresAt,
}: {
	userId: string;
	badgeId: string;
	awardedBy?: string;
	reason?: string;
	expiresAt?: Date;
}) {
	// 检查是否已经拥有该勋章
	const existing = await db.userBadge.findUnique({
		where: {
			userId_badgeId: {
				userId,
				badgeId,
			},
		},
	});

	if (existing) {
		throw new Error("用户已拥有该勋章");
	}

	return await db.userBadge.create({
		data: {
			userId,
			badgeId,
			awardedBy,
			reason,
			expiresAt,
		},
		include: {
			badge: true,
			user: {
				select: { id: true, name: true, email: true },
			},
			awarder: {
				select: { id: true, name: true },
			},
		},
	});
}

// 获取用户勋章
export async function getUserBadges(userId: string) {
	return await db.userBadge.findMany({
		where: {
			userId,
			// 只获取未过期的勋章
			OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
		},
		include: {
			badge: true,
			awarder: {
				select: { id: true, name: true },
			},
		},
		orderBy: [{ badge: { rarity: "desc" } }, { awardedAt: "desc" }],
	});
}

// 撤销用户勋章
export async function revokeBadge(userId: string, badgeId: string) {
	return await db.userBadge.delete({
		where: {
			userId_badgeId: {
				userId,
				badgeId,
			},
		},
	});
}

// 获取勋章获得者列表
export async function getBadgeHolders(badgeId: string) {
	return await db.userBadge.findMany({
		where: {
			badgeId,
			OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
		},
		include: {
			user: {
				select: {
					id: true,
					name: true,
					email: true,
					image: true,
					cpValue: true,
				},
			},
			badge: true,
		},
		orderBy: { awardedAt: "desc" },
	});
}

// 自动勋章检查和颁发
export async function checkAndAwardAutoBadges(userId: string) {
	const user = await db.user.findUnique({
		where: { id: userId },
		include: {
			eventCheckIns: true,
			projects: true,
			projectLikes: true,
			userBadges: { include: { badge: true } },
		},
	});

	if (!user) {
		return [];
	}

	const awardedBadges = [];

	// 检查各种自动勋章条件
	const existingBadgeNames = user.userBadges.map((ub) => ub.badge.name);

	// 新人启航勋章（完成个人资料）
	if (
		user.bio &&
		user.region &&
		user.skills.length > 0 &&
		!existingBadgeNames.includes("新人启航")
	) {
		const badge = await db.badge.findFirst({ where: { name: "新人启航" } });
		if (badge) {
			const awarded = await awardBadge({
				userId,
				badgeId: badge.id,
				reason: "完成个人资料设置",
			});
			awardedBadges.push(awarded);
		}
	}

	// 活动达人勋章（参与10次以上活动）
	if (
		user.eventCheckIns.length >= 10 &&
		!existingBadgeNames.includes("活动达人")
	) {
		const badge = await db.badge.findFirst({ where: { name: "活动达人" } });
		if (badge) {
			const awarded = await awardBadge({
				userId,
				badgeId: badge.id,
				reason: `参与了${user.eventCheckIns.length}次活动`,
			});
			awardedBadges.push(awarded);
		}
	}

	// 作品之星勋章（作品获得50+点赞）
	const totalLikes = user.projects.reduce(
		(sum, project) => sum + project.likeCount,
		0,
	);
	if (totalLikes >= 50 && !existingBadgeNames.includes("作品之星")) {
		const badge = await db.badge.findFirst({ where: { name: "作品之星" } });
		if (badge) {
			const awarded = await awardBadge({
				userId,
				badgeId: badge.id,
				reason: `作品获得${totalLikes}个点赞`,
			});
			awardedBadges.push(awarded);
		}
	}

	return awardedBadges;
}

// 初始化默认勋章
export async function initializeDefaultBadges() {
	const defaultBadges = [
		{
			name: "新人启航",
			description: "完成社区启航任务，正式成为社区成员",
			rarity: BadgeRarity.COMMON,
		},
		{
			name: "活动达人",
			description: "积极参与社区活动，参与10次以上活动",
			rarity: BadgeRarity.UNCOMMON,
		},
		{
			name: "作品之星",
			description: "创建的作品获得社区广泛认可，获得50+点赞",
			rarity: BadgeRarity.EPIC,
		},
		{
			name: "社区导师",
			description: "指导新人获得显著成果，为社区培养人才",
			rarity: BadgeRarity.LEGENDARY,
		},
		{
			name: "分部领袖",
			description: "担任分部负责人6个月以上，领导分部发展",
			rarity: BadgeRarity.LEGENDARY,
		},
		{
			name: "技术专家",
			description: "在某技术领域有突出贡献和专业能力",
			rarity: BadgeRarity.EPIC,
		},
	];

	const createdBadges = [];

	for (const badgeData of defaultBadges) {
		const existing = await db.badge.findFirst({
			where: { name: badgeData.name },
		});

		if (!existing) {
			const badge = await createBadge(badgeData);
			createdBadges.push(badge);
		}
	}

	return createdBadges;
}

// 获取所有勋章列表（管理员功能）
export async function getAllBadges() {
	return await db.badge.findMany({
		include: {
			_count: {
				select: {
					userBadges: true,
				},
			},
		},
		orderBy: [{ rarity: "desc" }, { name: "asc" }],
	});
}

// 更新勋章
export async function updateBadge(
	badgeId: string,
	data: {
		name?: string;
		description?: string;
		iconUrl?: string;
		color?: string;
		rarity?: BadgeRarity;
		isActive?: boolean;
		isAutoAwarded?: boolean;
		conditions?: any;
	},
) {
	return await db.badge.update({
		where: { id: badgeId },
		data,
	});
}

// 删除勋章
export async function deleteBadge(badgeId: string) {
	return await db.badge.delete({
		where: { id: badgeId },
	});
}
