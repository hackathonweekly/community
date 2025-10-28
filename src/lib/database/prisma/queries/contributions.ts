import { db } from "@/lib/database";
import {
	type ContributionType,
	ContributionStatus,
	type Prisma,
} from "@prisma/client";

// CP值配置
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

	// 更新用户总CP值
	await updateUserCpValue(userId);

	return contribution;
}

// 更新用户CP总值
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

	await db.user.update({
		where: { id: userId },
		data: { cpValue: totalCp._sum.cpValue || 0 },
	});

	return totalCp._sum.cpValue || 0;
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

	// 如果批准，更新用户CP值
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

// CP值等级计算
export function calculateUserLevel(cpValue: number): {
	currentLevel: number;
	nextLevel: number;
	currentLevelCp: number;
	nextLevelCp: number;
	progressPercent: number;
	levelName: string;
	nextLevelName: string;
} {
	const levels = [
		{ name: "访客", min: 0, max: 0 },
		{ name: "注册用户", min: 0, max: 49 },
		{ name: "社区成员", min: 50, max: 99 },
		{ name: "活跃贡献者", min: 100, max: 499 },
		{ name: "核心贡献者", min: 500, max: 1999 },
		{ name: "社区领袖", min: 2000, max: Number.POSITIVE_INFINITY },
	];

	let currentLevel = levels[0];
	let levelNumber = 0;

	for (let i = 0; i < levels.length; i++) {
		if (cpValue >= levels[i].min && cpValue <= levels[i].max) {
			currentLevel = levels[i];
			levelNumber = i;
			break;
		}
	}

	const nextLevel =
		levelNumber < levels.length - 1
			? levels[levelNumber + 1]
			: currentLevel;
	const nextLevelCp = nextLevel.min;
	const progressPercent =
		nextLevel.min === Number.POSITIVE_INFINITY
			? 100
			: Math.min(
					100,
					((cpValue - currentLevel.min) /
						(nextLevel.min - currentLevel.min)) *
						100,
				);

	return {
		currentLevel: levelNumber,
		nextLevel: levelNumber + 1,
		currentLevelCp: currentLevel.min,
		nextLevelCp,
		progressPercent,
		levelName: currentLevel.name,
		nextLevelName: nextLevel.name,
	};
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
