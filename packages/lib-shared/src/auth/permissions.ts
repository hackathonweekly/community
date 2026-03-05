export enum AdminRole {
	SUPER_ADMIN = "super_admin", // 超级管理员：全部权限
	OPERATION_ADMIN = "operation_admin", // 运营管理员：用户、内容、活动、贡献、勋章等运营相关权限
}

export enum AdminPermission {
	// 用户管理权限
	VIEW_USERS = "view_users",
	MANAGE_USERS = "manage_users",
	BAN_USERS = "ban_users",
	ASSIGN_ROLES = "assign_roles", // 设置用户角色权限
	VIEW_FUNCTIONAL_ROLES = "view_functional_roles", // 查看职能角色
	MANAGE_FUNCTIONAL_ROLES = "manage_functional_roles", // 管理职能角色

	// 贡献管理权限
	VIEW_CONTRIBUTIONS = "view_contributions",
	REVIEW_CONTRIBUTIONS = "review_contributions",

	// 勋章管理权限
	VIEW_BADGES = "view_badges",
	MANAGE_BADGES = "manage_badges",
	AWARD_BADGES = "award_badges",

	// 组织管理权限
	VIEW_ORGANIZATIONS = "view_organizations",
	MANAGE_ORGANIZATIONS = "manage_organizations",

	// 系统配置权限
	VIEW_SYSTEM_CONFIG = "view_system_config",
	MANAGE_SYSTEM_CONFIG = "manage_system_config",
	MANAGE_SYSTEM = "manage_system", // 简化版本，向后兼容

	// 仪表板权限
	VIEW_DASHBOARD = "view_dashboard",
}

// 角色权限映射
export const ROLE_PERMISSIONS: Record<AdminRole, AdminPermission[]> = {
	[AdminRole.SUPER_ADMIN]: [
		AdminPermission.VIEW_USERS,
		AdminPermission.MANAGE_USERS,
		AdminPermission.BAN_USERS,
		AdminPermission.ASSIGN_ROLES,
		AdminPermission.VIEW_FUNCTIONAL_ROLES,
		AdminPermission.MANAGE_FUNCTIONAL_ROLES,
		AdminPermission.VIEW_CONTRIBUTIONS,
		AdminPermission.REVIEW_CONTRIBUTIONS,
		AdminPermission.VIEW_BADGES,
		AdminPermission.MANAGE_BADGES,
		AdminPermission.AWARD_BADGES,
		AdminPermission.VIEW_ORGANIZATIONS,
		AdminPermission.MANAGE_ORGANIZATIONS,
		AdminPermission.VIEW_SYSTEM_CONFIG,
		AdminPermission.MANAGE_SYSTEM_CONFIG,
		AdminPermission.MANAGE_SYSTEM,
		AdminPermission.VIEW_DASHBOARD,
	],
	[AdminRole.OPERATION_ADMIN]: [
		AdminPermission.VIEW_USERS,
		AdminPermission.MANAGE_USERS,
		AdminPermission.BAN_USERS,
		AdminPermission.VIEW_FUNCTIONAL_ROLES,
		AdminPermission.VIEW_CONTRIBUTIONS,
		AdminPermission.REVIEW_CONTRIBUTIONS,
		AdminPermission.VIEW_BADGES,
		AdminPermission.MANAGE_BADGES,
		AdminPermission.AWARD_BADGES,
		AdminPermission.VIEW_ORGANIZATIONS,
		AdminPermission.VIEW_DASHBOARD,
	],
};

// 类型断言辅助函数，用于处理不同的用户对象结构
function getUserRole(user: any): string | null | undefined {
	// 尝试多种可能的属性访问方式
	return user?.role || user?.userRole || (user as any)?.role;
}

// 检查用户是否有管理员权限
export function isAdmin(user: any): boolean {
	const userRole = getUserRole(user);
	return (
		userRole === AdminRole.SUPER_ADMIN ||
		userRole === AdminRole.OPERATION_ADMIN ||
		userRole === "admin"
	); // 向后兼容
}

// 检查用户是否有特定权限 - 使用 any 类型避免类型冲突
export function hasPermission(user: any, permission: AdminPermission): boolean {
	const userRole = getUserRole(user);

	if (!userRole) {
		return false;
	}

	// 向后兼容：原来的admin角色等同于super_admin
	if (userRole === "admin") {
		return ROLE_PERMISSIONS[AdminRole.SUPER_ADMIN].includes(permission);
	}

	const role = userRole as AdminRole;
	const permissions = ROLE_PERMISSIONS[role];
	return permissions ? permissions.includes(permission) : false;
}

// 获取用户所有权限
export function getUserPermissions(user: any): AdminPermission[] {
	const userRole = getUserRole(user);

	if (!userRole) {
		return [];
	}

	// 向后兼容
	if (userRole === "admin") {
		return ROLE_PERMISSIONS[AdminRole.SUPER_ADMIN];
	}

	const role = userRole as AdminRole;
	return ROLE_PERMISSIONS[role] || [];
}

// 检查用户是否可以执行某个操作
export function canPerformAction(user: any, action: AdminPermission): boolean {
	return hasPermission(user, action);
}
