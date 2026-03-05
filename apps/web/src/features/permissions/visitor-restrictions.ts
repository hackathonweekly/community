/**
 * 简单的新朋友限制系统
 * 只限制新朋友的核心操作，鼓励伙伴升级为社区成员
 */

import type { MembershipLevel } from "@community/lib-shared/prisma-enums";

export interface UserLevel {
	membershipLevel?: MembershipLevel | null;
}

/**
 * 检查用户是否为新朋友
 */
export function isVisitor(userLevel: UserLevel): boolean {
	return (
		!userLevel.membershipLevel || userLevel.membershipLevel === "VISITOR"
	);
}

/**
 * 检查用户是否可以执行需要社区成员资格的操作
 */
export function canDoMemberAction(userLevel: UserLevel): boolean {
	return !isVisitor(userLevel);
}

/**
 * 新朋友限制的操作类型
 */
export enum RestrictedAction {
	CREATE_COMMENT = "create_comment",
	CREATE_PROJECT = "create_project",
	CREATE_ORGANIZATION = "create_organization",
	CREATE_EVENT = "create_event",
	LIKE_PROJECT = "like_project",
	BOOKMARK_PROJECT = "bookmark_project",
}

/**
 * 新朋友限制配置
 */
export interface VisitorRestrictionConfig {
	[RestrictedAction.CREATE_COMMENT]: boolean;
	[RestrictedAction.CREATE_PROJECT]: boolean;
	[RestrictedAction.CREATE_ORGANIZATION]: boolean;
	[RestrictedAction.CREATE_EVENT]: boolean;
	[RestrictedAction.LIKE_PROJECT]: boolean;
	[RestrictedAction.BOOKMARK_PROJECT]: boolean;
}

/**
 * 默认新朋友限制配置 - 建议对核心创作行为做限制
 */
export const DEFAULT_VISITOR_RESTRICTIONS: VisitorRestrictionConfig = {
	[RestrictedAction.CREATE_COMMENT]: true, // 限制评论
	[RestrictedAction.CREATE_PROJECT]: false, // 限制创建作品
	[RestrictedAction.CREATE_ORGANIZATION]: true, // 限制创建组织
	[RestrictedAction.CREATE_EVENT]: false, // 允许创建活动
	[RestrictedAction.LIKE_PROJECT]: false, // 不限制点赞（鼓励参与）
	[RestrictedAction.BOOKMARK_PROJECT]: false, // 不限制收藏（鼓励参与）
};

/**
 * 检查新朋友是否可以执行某个操作
 */
export function canVisitorDoAction(
	action: RestrictedAction,
	config: VisitorRestrictionConfig = DEFAULT_VISITOR_RESTRICTIONS,
): boolean {
	return !config[action]; // 如果配置为true（限制），则返回false（不能做）
}

/**
 * 检查用户是否可以执行某个操作（综合检查）
 */
export function canUserDoAction(
	userLevel: UserLevel,
	action: RestrictedAction,
	config: VisitorRestrictionConfig = DEFAULT_VISITOR_RESTRICTIONS,
): { allowed: boolean; reason?: string } {
	// 如果不是新朋友，则允许所有操作
	if (!isVisitor(userLevel)) {
		return { allowed: true };
	}

	// 如果是新朋友，检查是否被限制
	const allowed = canVisitorDoAction(action, config);

	if (allowed) {
		return { allowed: true };
	}

	return {
		allowed: false,
		reason: getActionRestrictedMessage(action),
	};
}

/**
 * 获取操作被限制的提示信息
 */
function getActionRestrictedMessage(action: RestrictedAction): string {
	const messages = {
		[RestrictedAction.CREATE_COMMENT]:
			"发表评论需要成为社区成员，请联系社区负责人！",
		[RestrictedAction.CREATE_PROJECT]:
			"创建作品需要成为社区成员，请联系社区负责人！",
		[RestrictedAction.CREATE_ORGANIZATION]:
			"创建组织需要成为社区成员，请联系社区负责人！",
		[RestrictedAction.CREATE_EVENT]:
			"创建活动需要成为社区成员，请联系社区负责人！",
		[RestrictedAction.LIKE_PROJECT]:
			"点赞作品需要成为社区成员，请联系社区负责人！",
		[RestrictedAction.BOOKMARK_PROJECT]:
			"收藏作品需要成为社区成员，请联系社区负责人！",
	};

	return messages[action];
}

/**
 * 获取用户等级显示名称
 */
export function getMembershipLevelName(level: MembershipLevel | null): string {
	switch (level) {
		case "VISITOR":
			return "新朋友";
		case "MEMBER":
			return "社区成员";
		default:
			return "新朋友";
	}
}

/**
 * 创建权限检查Hook（用于React组件）
 */
export function createPermissionHook(action: RestrictedAction) {
	return function useCanDoAction(
		userLevel: UserLevel,
		config?: VisitorRestrictionConfig,
	) {
		return canUserDoAction(userLevel, action, config);
	};
}
