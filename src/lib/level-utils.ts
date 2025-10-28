/**
 * 等级系统工具函数和常量定义
 */

import type {
	ContributorLevel,
	CreatorLevel,
	LevelType,
	MembershipLevel,
	MentorLevel,
} from "@prisma/client";

// 等级定义和说明
export const LEVEL_DEFINITIONS = {
	// 基础参与层级
	membership: {
		VISITOR: {
			label: "新朋友",
			description: "对社区感兴趣的潜在伙伴",
			color: "bg-gray-100 text-gray-800 border-gray-200",
			requirements: "浏览网站、关注社交媒体",
			benefits: "访问公开内容、加入开放社群",
		},
		MEMBER: {
			label: "共创伙伴",
			description: "认同社区文化并完成首次贡献的伙伴",
			color: "bg-green-100 text-green-800 border-green-200",
			requirements: "担任志愿者，完成产品分享或参加黑客松比赛",
			benefits:
				"加入共创伙伴核心群，解锁全部参与轨道，获得社区基础权益（如内部活动参与权，内部资源使用权）",
		},
	},

	// 创造者轨道
	creator: {
		C1: {
			label: "探索者",
			description: "在社区公开分享一个可阐述清楚的产品Idea或Demo",
			color: "bg-orange-100 text-orange-800 border-orange-200",
			requirements: "在社区公开分享一个可阐述清楚的产品Idea或Demo",
			benefits: "探索者认证、获得社区关于产品定义和方向的反馈",
		},
		C2: {
			label: "创造者",
			description: "分享一个可交付、可体验的MVP",
			color: "bg-orange-200 text-orange-900 border-orange-300",
			requirements: "分享一个可交付、可体验的MVP",
			benefits: "创造者认证、项目优先获得社区推荐、专属对接轻度辅导资源",
		},
		C3: {
			label: "增长者",
			description: "产品获得 >100 名真实用户或实现首次创收",
			color: "bg-orange-300 text-orange-900 border-orange-400",
			requirements: "产品获得 >100 名真实用户或实现首次创收",
			benefits:
				"增长者认证、深度资源对接（融资、渠道）、社区媒体专访与宣发",
		},
		C4: {
			label: "领跑者",
			description: "产品达到PMF标准，拥有持续增长的用户和健康的商业模式",
			color: "bg-orange-400 text-white border-orange-500",
			requirements: "产品达到PMF标准，拥有持续增长的用户和健康的商业模式",
			benefits:
				"领跑者认证、社区重大活动/决策的优先参与权、对外合作优先权",
		},
		C5: {
			label: "引领者",
			description: "产品年收入达到100万人民币，或月活用户达到10万人",
			color: "bg-gradient-to-r from-orange-500 to-red-500 text-white border-red-500",
			requirements: "产品年收入达到100万人民币，或月活用户达到10万人",
			benefits: "引领者认证、核心决策参与权、社区品牌授权与联名",
		},
	},

	// 导师轨道
	mentor: {
		M1: {
			label: "分享者",
			description:
				"主持过1次社区内部分享会，或发布过2篇高质量技术/经验文章",
			color: "bg-yellow-100 text-yellow-800 border-yellow-200",
			requirements:
				"主持过1次社区内部分享会，或发布过2篇高质量技术/经验文章",
			benefits: "分享者认证、优先获得社区内部演讲机会",
		},
		M2: {
			label: "讲师",
			description:
				"累计完成5场分享/课程并获正面反馈，或成功辅导2名成员完成MVP",
			color: "bg-yellow-200 text-yellow-900 border-yellow-300",
			requirements:
				"累计完成5场分享/课程并获正面反馈，或成功辅导2名成员完成MVP",
			benefits: "认证讲师、获得社区提供的课酬、进入讲师团",
		},
		M3: {
			label: "导师",
			description:
				"成功辅导5名成员达成其个人目标，在社区内有公认的专业声望",
			color: "bg-yellow-300 text-yellow-900 border-yellow-400",
			requirements:
				"成功辅导5名成员达成其个人目标，在社区内有公认的专业声望",
			benefits: "认证导师、拥有对社区内容方向的建议权、专属导师津贴",
		},
		M4: {
			label: "专家导师",
			description: "由核心团队邀请，对社区的知识体系建设有重大贡献",
			color: "bg-yellow-400 text-white border-yellow-500",
			requirements: "由核心团队邀请，对社区的知识体系建设有重大贡献",
			benefits: "专家导师认证、参与制定社区学习路径和内容标准",
		},
		M5: {
			label: "荣誉导师",
			description: "由核心团队提名并评审，是社区公认的知识灯塔",
			color: "bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-orange-500",
			requirements: "由核心团队提名并评审，是社区公认的知识灯塔",
			benefits: "荣誉导师认证、永久享受社区最高荣誉和权益",
		},
	},

	// 贡献者轨道
	contributor: {
		O1: {
			label: "志愿者",
			description: "参与过>1小时的志愿者服务",
			color: "bg-blue-100 text-blue-800 border-blue-200",
			requirements: "参与过>1小时的志愿者服务",
			benefits: "志愿者认证、优先参与社区项目",
		},
		O2: {
			label: "共创者",
			description: "至少独立组织过1场20+人的社区活动",
			color: "bg-blue-200 text-blue-900 border-blue-300",
			requirements: "至少独立组织过1场20+人的社区活动",
			benefits:
				"共创者认证、获得社区活动经费支持、拥有特定板块的管理权限",
		},
		O3: {
			label: "组织者",
			description: "深度参与组织过3场以上大型活动",
			color: "bg-blue-300 text-blue-900 border-blue-400",
			requirements: "深度参与组织过3场以上大型活动",
			benefits: "组织者认证、进入社区活动委员会、获得专项激励",
		},
		O4: {
			label: "核心组织者",
			description: "担任社区/城市负责人或核心项目owner ≥ 6个月",
			color: "bg-blue-400 text-white border-blue-500",
			requirements: "担任社区/城市负责人或核心项目owner ≥ 6个月",
			benefits: "核心组织者认证、社区治理提案权、核心贡献者津贴",
		},
		O5: {
			label: "荣誉贡献者",
			description: "由核心团队提名并评审，是社区公认的荣誉贡献者",
			color: "bg-gradient-to-r from-blue-500 to-purple-500 text-white border-purple-500",
			requirements: "由核心团队提名并评审，是社区公认的荣誉贡献者",
			benefits: "荣誉贡献者认证、永久享受社区最高荣誉和权益",
		},
	},
} as const;

// 等级顺序定义
export const LEVEL_ORDER = {
	membership: ["VISITOR", "MEMBER"] as const,
	creator: ["C1", "C2", "C3", "C4", "C5"] as const,
	mentor: ["M1", "M2", "M3", "M4", "M5"] as const,
	contributor: ["O1", "O2", "O3", "O4", "O5"] as const,
} as const;

// 获取等级信息
export function getLevelInfo(
	levelType: "membership" | "creator" | "mentor" | "contributor",
	level: string,
) {
	const levelDefinitions = LEVEL_DEFINITIONS[levelType];
	if (!levelDefinitions) {
		return undefined;
	}

	return (levelDefinitions as any)[level];
}

// 获取用户当前等级信息
export function getUserLevelInfo(user: {
	membershipLevel?: MembershipLevel | null;
	creatorLevel?: CreatorLevel | null;
	mentorLevel?: MentorLevel | null;
	contributorLevel?: ContributorLevel | null;
}) {
	const levels = [];

	// 基础等级
	if (user.membershipLevel) {
		const info = getLevelInfo("membership", user.membershipLevel);
		if (info) {
			levels.push({
				type: "membership" as LevelType,
				level: user.membershipLevel,
				label: info.label,
				description: info.description,
				color: info.color,
				requirements: info.requirements,
				benefits: info.benefits,
			});
		}
	}

	// 专业轨道
	if (user.creatorLevel) {
		const info = getLevelInfo("creator", user.creatorLevel);
		if (info) {
			levels.push({
				type: "creator" as LevelType,
				level: user.creatorLevel,
				label: info.label,
				description: info.description,
				color: info.color,
				requirements: info.requirements,
				benefits: info.benefits,
			});
		}
	}

	if (user.mentorLevel) {
		const info = getLevelInfo("mentor", user.mentorLevel);
		if (info) {
			levels.push({
				type: "mentor" as LevelType,
				level: user.mentorLevel,
				label: info.label,
				description: info.description,
				color: info.color,
				requirements: info.requirements,
				benefits: info.benefits,
			});
		}
	}

	if (user.contributorLevel) {
		const info = getLevelInfo("contributor", user.contributorLevel);
		if (info) {
			levels.push({
				type: "contributor" as LevelType,
				level: user.contributorLevel,
				label: info.label,
				description: info.description,
				color: info.color,
				requirements: info.requirements,
				benefits: info.benefits,
			});
		}
	}

	return levels;
}

// 检查是否可以升级到目标等级
export function canUpgradeToLevel(
	currentLevel: string | null,
	targetLevel: string,
	levelType: "membership" | "creator" | "mentor" | "contributor",
): boolean {
	const order = LEVEL_ORDER[levelType];
	const currentIndex = currentLevel
		? (order as readonly string[]).indexOf(currentLevel)
		: -1;
	const targetIndex = (order as readonly string[]).indexOf(targetLevel);

	// 目标等级必须存在，且必须是当前等级的下一级
	return targetIndex !== -1 && targetIndex === currentIndex + 1;
}

// 检查是否可以降级到目标等级
export function canDowngradeToLevel(
	currentLevel: string | null,
	targetLevel: string,
	levelType: "membership" | "creator" | "mentor" | "contributor",
): boolean {
	if (!currentLevel) {
		return false;
	}

	const order = LEVEL_ORDER[levelType];
	const currentIndex = (order as readonly string[]).indexOf(currentLevel);
	const targetIndex = (order as readonly string[]).indexOf(targetLevel);

	// 目标等级必须存在，且必须小于当前等级
	return targetIndex !== -1 && targetIndex < currentIndex;
}

// 获取下一个可升级的等级
export function getNextLevel(
	currentLevel: string | null,
	levelType: "membership" | "creator" | "mentor" | "contributor",
): string | null {
	const order = LEVEL_ORDER[levelType];
	const currentIndex = currentLevel
		? (order as readonly string[]).indexOf(currentLevel)
		: -1;

	if (currentIndex + 1 < order.length) {
		return order[currentIndex + 1];
	}

	return null;
}

// 获取等级类型的中文名称
export function getLevelTypeName(levelType: LevelType): string {
	switch (levelType) {
		case "MEMBERSHIP":
			return "基础成员";
		case "CREATOR":
			return "创造者轨道";
		case "MENTOR":
			return "导师轨道";
		case "CONTRIBUTOR":
			return "贡献者轨道";
		default:
			return "未知类型";
	}
}

// 获取等级的完整显示名称
export function getFullLevelName(levelType: LevelType, level: string): string {
	const typeName = getLevelTypeName(levelType);
	const info = getLevelInfo(
		levelType.toLowerCase() as
			| "membership"
			| "creator"
			| "mentor"
			| "contributor",
		level,
	);

	if (!info) {
		return `${typeName} - ${level}`;
	}

	return `${info.label} (${level})`;
}

// 检查用户是否为管理员（有权限审核等级申请）
export function canReviewLevel(
	userRole: string | null | undefined,
	organizationRoles: string[],
	targetLevel: string,
	levelType: LevelType,
): boolean {
	// 超级管理员可以审核所有等级
	if (userRole === "admin" || userRole === "super_admin") {
		return true;
	}

	// 组织管理员只能审核基础等级和专业轨道的1-2级
	const isOrgAdmin = organizationRoles.some(
		(role) => role === "admin" || role === "owner" || role === "manager",
	);

	if (!isOrgAdmin) {
		return false;
	}

	// 基础等级：组织管理员都可以审核
	if (levelType === "MEMBERSHIP") {
		return true;
	}

	// 专业轨道：只能审核1-2级
	const level = targetLevel.slice(-1); // 获取数字部分
	return level === "1" || level === "2";
}
