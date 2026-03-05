import { db } from "@community/lib-server/database";
import {
	type ContributionType,
	ContributionStatus,
	type Prisma,
	type MembershipLevel,
} from "@prisma/client";
import {
	calculateMembershipLevel,
	getLevelInfo,
} from "@community/lib-shared/level-utils";

// 积分配置
export const CP_VALUES = {
	EVENT_CHECKIN: 5,
	EVENT_FEEDBACK: 3,
	EVENT_ORGANIZATION: 20,
	PROJECT_CREATION: 10,
	PROJECT_UPDATE: 2,
	PROJECT_LIKE: 1,
	COMMENT_CREATION: 1,
	PROFILE_COMPLETION: 5,
	VOLUNTEER_SERVICE: 10, // 志愿者服务基础分值
} as const;

// 自动记录贡献
export async function recordContribution({
	userId,
	type,
	category,
	description,
	cpValue,
	sourceId,
	sourceType,
	organizationId,
}: {
	userId: string;
	type: ContributionType;
	category: string;
	description: string;
	cpValue: number;
	sourceId?: string;
	sourceType?: string;
	organizationId?: string;
}) {
	// 防止重复记录（基于sourceId和sourceType）
	if (sourceId && sourceType) {
		const existing = await db.contribution.findFirst({
			where: {
				userId,
				sourceId,
				sourceType,
			},
		});

		if (existing) {
			return existing;
		}
	}

	// 创建贡献记录
	const contribution = await db.contribution.create({
		data: {
			userId,
			type,
			category,
			description,
			cpValue,
			sourceId,
			sourceType,
			organizationId,
			isAutomatic: true,
			status: ContributionStatus.APPROVED,
		},
	});

	// 更新用户总积分
	await updateUserCpValue(userId);

	return contribution;
}

// 更新用户CP总值并检查等级变化
export async function updateUserCpValue(userId: string) {
	const totalCp = await db.contribution.aggregate({
		where: {
			userId,
			status: ContributionStatus.APPROVED,
		},
		_sum: {
			cpValue: true,
		},
	});

	const newCpValue = totalCp._sum.cpValue || 0;

	// 获取当前用户等级
	const user = await db.user.findUnique({
		where: { id: userId },
		select: { membershipLevel: true },
	});

	const oldLevel = user?.membershipLevel;
	const newLevel = calculateMembershipLevel(newCpValue);

	// 更新用户数据
	await db.user.update({
		where: { id: userId },
		data: {
			cpValue: newCpValue,
			membershipLevel: newLevel,
		},
	});

	// 如果等级提升，发送通知
	if (oldLevel !== newLevel) {
		await createLevelUpNotification(userId, newLevel, newCpValue);
	}

	return newCpValue;
}

// 创建等级提升通知
async function createLevelUpNotification(
	userId: string,
	newLevel: MembershipLevel,
	cpValue: number,
) {
	const levelInfo = getLevelInfo("membership", newLevel);
	const levelLabel = levelInfo?.label || newLevel;

	await db.notification.create({
		data: {
			userId,
			type: "ACHIEVEMENT_UNLOCKED",
			title: `🎉 恭喜升级为「${levelLabel}」`,
			content: `您的贡献值已达到 ${cpValue}积分，成功解锁「${levelLabel}」等级！继续加油！`,
			metadata: {
				newLevel,
				cpValue,
				levelLabel,
			},
			actionUrl: "/me",
			priority: "HIGH",
		},
	});
}

// 获取用户贡献记录
export async function getUserContributions(
	userId: string,
	options?: {
		type?: ContributionType;
		status?: ContributionStatus;
		organizationId?: string;
		limit?: number;
		offset?: number;
	},
) {
	const where: Prisma.ContributionWhereInput = {
		userId,
		...(options?.type && { type: options.type }),
		...(options?.status && { status: options.status }),
		...(options?.organizationId && {
			organizationId: options.organizationId,
		}),
	};

	return await db.contribution.findMany({
		where,
		include: {
			user: {
				select: { id: true, name: true, email: true },
			},
			reviewer: {
				select: { id: true, name: true, email: true },
			},
			organization: {
				select: { id: true, name: true, slug: true },
			},
		},
		orderBy: { createdAt: "desc" },
		take: options?.limit,
		skip: options?.offset,
	});
}

// 获取组织贡献记录（用于管理员查看）
export async function getOrganizationContributions(
	organizationId: string,
	options?: {
		status?: ContributionStatus;
		limit?: number;
		offset?: number;
	},
) {
	const where: Prisma.ContributionWhereInput = {
		organizationId,
		...(options?.status && { status: options.status }),
	};

	return await db.contribution.findMany({
		where,
		include: {
			user: {
				select: { id: true, name: true, email: true },
			},
			reviewer: {
				select: { id: true, name: true, email: true },
			},
		},
		orderBy: { createdAt: "desc" },
		take: options?.limit,
		skip: options?.offset,
	});
}

// 审核贡献（管理员用，简化版本）
export async function reviewContribution(
	contributionId: string,
	status: ContributionStatus,
	reviewerId: string,
	reviewNote?: string,
) {
	const contribution = await db.contribution.update({
		where: { id: contributionId },
		data: {
			status,
			reviewedBy: reviewerId,
			reviewedAt: new Date(),
			reviewNote,
		},
		include: {
			user: {
				select: { id: true, name: true, email: true },
			},
			reviewer: {
				select: { id: true, name: true, email: true },
			},
		},
	});

	// 如果批准，更新用户积分
	if (status === ContributionStatus.APPROVED) {
		await updateUserCpValue(contribution.userId);
	}

	return contribution;
}

// 创建手动贡献申报
export async function createContributionRequest({
	userId,
	type,
	category,
	description,
	requestedCp,
	evidence,
	organizationId,
}: {
	userId: string;
	type: ContributionType;
	category: string;
	description: string;
	requestedCp: number;
	evidence?: string;
	organizationId?: string;
}) {
	return await db.contribution.create({
		data: {
			userId,
			type,
			category,
			description,
			cpValue: requestedCp,
			evidence,
			organizationId,
			isAutomatic: false,
			status: ContributionStatus.PENDING,
		},
	});
}

// 获取待审核的贡献列表（管理员功能）
export async function getPendingContributions({
	status = "ALL",
	limit = 50,
	offset = 0,
}: {
	status?: "ALL" | "PENDING" | "APPROVED" | "REJECTED";
	limit?: number;
	offset?: number;
} = {}) {
	const where: Prisma.ContributionWhereInput = {};

	if (status !== "ALL") {
		where.status = status as ContributionStatus;
	}

	return await db.contribution.findMany({
		where,
		include: {
			user: {
				select: { id: true, name: true, email: true },
			},
			reviewer: {
				select: { id: true, name: true, email: true },
			},
			organization: {
				select: { id: true, name: true, slug: true },
			},
		},
		orderBy: [
			{ status: "asc" }, // 待审核的在前
			{ createdAt: "desc" },
		],
		take: limit,
		skip: offset,
	});
}

// 根据ID获取单个贡献记录
export async function getContributionById(contributionId: string) {
	return await db.contribution.findUnique({
		where: { id: contributionId },
		include: {
			user: {
				select: { id: true, name: true, email: true },
			},
			reviewer: {
				select: { id: true, name: true, email: true },
			},
			organization: {
				select: { id: true, name: true, slug: true },
			},
		},
	});
}
