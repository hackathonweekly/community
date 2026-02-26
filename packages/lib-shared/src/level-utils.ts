/**
 * 社区身份工具函数和常量定义
 */

import type { MembershipLevel } from "./prisma-enums";

// 等级积分 阈值配置
export const LEVEL_THRESHOLDS = {
	VISITOR: 0,
	NEWCOMER: 1,
	MEMBER: 50,
	ACTIVE: 200,
	CORE: 500,
	SENIOR: 1500,
	LEGEND: 5000,
} as const;

// 等级顺序（从低到高）
const LEVEL_ORDER: MembershipLevel[] = [
	"VISITOR",
	"NEWCOMER",
	"MEMBER",
	"ACTIVE",
	"CORE",
	"SENIOR",
	"LEGEND",
];

// 身份定义和说明
export const LEVEL_DEFINITIONS = {
	membership: {
		VISITOR: {
			label: "新朋友",
			description: "对社区感兴趣的潜在伙伴",
			color: "bg-gray-100 text-gray-800 border-gray-200",
			requirements: "浏览网站、关注社交媒体",
			benefits: "访问公开内容、加入开放社群",
		},
		NEWCOMER: {
			label: "新人",
			description: "刚加入社区的新伙伴",
			color: "bg-blue-100 text-blue-800 border-blue-200",
			requirements: "完成注册并获得首个积分",
			benefits: "参与社区基础活动",
		},
		MEMBER: {
			label: "社区成员",
			description: "认同社区文化并完成首次贡献的伙伴",
			color: "bg-green-100 text-green-800 border-green-200",
			requirements: "累计获得 50积分",
			benefits: "加入社区成员核心群，解锁全部参与轨道",
		},
		ACTIVE: {
			label: "活跃成员",
			description: "持续参与社区活动的活跃伙伴",
			color: "bg-yellow-100 text-yellow-800 border-yellow-200",
			requirements: "累计获得 200积分",
			benefits: "获得活跃成员标识，优先参与内部活动",
		},
		CORE: {
			label: "核心成员",
			description: "社区核心贡献者",
			color: "bg-orange-100 text-orange-800 border-orange-200",
			requirements: "累计获得 500积分",
			benefits: "参与社区决策，获得核心成员专属权益",
		},
		SENIOR: {
			label: "资深成员",
			description: "长期深度参与社区的资深伙伴",
			color: "bg-purple-100 text-purple-800 border-purple-200",
			requirements: "累计获得 1500积分",
			benefits: "获得资深成员标识，参与社区治理",
		},
		LEGEND: {
			label: "传奇",
			description: "社区传奇贡献者",
			color: "bg-red-100 text-red-800 border-red-200",
			requirements: "累计获得 5000积分",
			benefits: "最高荣誉标识，社区名人堂",
		},
	},
} as const;

// 获取身份信息
export function getLevelInfo(
	levelType: "membership",
	level: MembershipLevel | string,
) {
	const levelDefinitions = LEVEL_DEFINITIONS[levelType];
	return (
		levelDefinitions as Record<
			string,
			(typeof levelDefinitions)[keyof typeof levelDefinitions]
		>
	)[level];
}

// 根据积分 值计算等级
export function calculateMembershipLevel(cpValue: number): MembershipLevel {
	if (cpValue >= LEVEL_THRESHOLDS.LEGEND) return "LEGEND";
	if (cpValue >= LEVEL_THRESHOLDS.SENIOR) return "SENIOR";
	if (cpValue >= LEVEL_THRESHOLDS.CORE) return "CORE";
	if (cpValue >= LEVEL_THRESHOLDS.ACTIVE) return "ACTIVE";
	if (cpValue >= LEVEL_THRESHOLDS.MEMBER) return "MEMBER";
	if (cpValue >= LEVEL_THRESHOLDS.NEWCOMER) return "NEWCOMER";
	return "VISITOR";
}

// 获取下一个等级信息
export function getNextLevelInfo(currentLevel: MembershipLevel | string) {
	const idx = LEVEL_ORDER.indexOf(currentLevel as MembershipLevel);
	if (idx === -1 || idx >= LEVEL_ORDER.length - 1) return null;
	const nextLevel = LEVEL_ORDER[idx + 1];
	return {
		level: nextLevel,
		threshold: LEVEL_THRESHOLDS[nextLevel],
		...getLevelInfo("membership", nextLevel),
	};
}

// 计算到下一等级的进度百分比
export function calculateLevelProgress(
	cpValue: number,
	currentLevel: MembershipLevel | string,
): number {
	const nextInfo = getNextLevelInfo(currentLevel);
	if (!nextInfo) return 100;

	const currentThreshold =
		LEVEL_THRESHOLDS[currentLevel as keyof typeof LEVEL_THRESHOLDS] ?? 0;
	const nextThreshold = nextInfo.threshold;
	const range = nextThreshold - currentThreshold;
	if (range <= 0) return 100;

	return Math.min(
		100,
		Math.floor(((cpValue - currentThreshold) / range) * 100),
	);
}
