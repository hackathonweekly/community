import { db } from "@community/lib-server/database/prisma/client";
import { resolveEventIdentifier } from "@community/lib-server/database";

/**
 * 检查用户是否有权限管理指定活动
 */
export async function canManageEvent(
	eventId: string,
	userId: string,
): Promise<boolean> {
	const event = await db.event.findUnique({
		where: resolveEventIdentifier(eventId),
		select: {
			id: true,
			organizerId: true,
			organizationId: true,
			organization: {
				select: {
					id: true,
					members: {
						where: {
							userId: userId,
							role: { in: ["owner", "admin"] },
						},
						select: { id: true },
					},
				},
			},
			admins: {
				where: {
					userId: userId,
					status: "ACCEPTED",
					canEditEvent: true,
				},
				select: { id: true },
			},
		},
	});

	if (!event) {
		return false;
	}

	// 用户是活动创建者
	if (event.organizerId === userId) {
		return true;
	}

	// 用户是活动管理员且有编辑权限
	if (event.admins.length > 0) {
		return true;
	}

	// 用户是所属组织的管理员或所有者
	if (event.organizationId && event.organization) {
		const hasOrgPermission = event.organization.members.length > 0;
		return hasOrgPermission;
	}

	return false;
}

/**
 * 检查用户是否有权限管理活动报名
 */
export async function canManageEventRegistrations(
	eventId: string,
	userId: string,
): Promise<boolean> {
	const event = await db.event.findUnique({
		where: resolveEventIdentifier(eventId),
		select: {
			id: true,
			organizerId: true,
			organizationId: true,
			organization: {
				select: {
					id: true,
					members: {
						where: {
							userId: userId,
							role: { in: ["owner", "admin"] },
						},
						select: { id: true },
					},
				},
			},
			admins: {
				where: {
					userId: userId,
					status: "ACCEPTED",
					canManageRegistrations: true,
				},
				select: { id: true },
			},
		},
	});

	if (!event) {
		return false;
	}

	// 用户是活动创建者
	if (event.organizerId === userId) {
		return true;
	}

	// 用户是活动管理员且有管理报名权限
	if (event.admins.length > 0) {
		return true;
	}

	// 用户是所属组织的管理员或所有者
	if (event.organizationId && event.organization) {
		const hasOrgPermission = event.organization.members.length > 0;
		return hasOrgPermission;
	}

	return false;
}

/**
 * 检查用户是否有权限管理活动管理员
 */
export async function canManageEventAdmins(
	eventId: string,
	userId: string,
): Promise<boolean> {
	const event = await db.event.findUnique({
		where: resolveEventIdentifier(eventId),
		select: {
			id: true,
			organizerId: true,
			organizationId: true,
			organization: {
				select: {
					id: true,
					members: {
						where: {
							userId: userId,
							role: { in: ["owner", "admin"] },
						},
						select: { id: true },
					},
				},
			},
			admins: {
				where: {
					userId: userId,
					status: "ACCEPTED",
					canManageAdmins: true,
				},
				select: { id: true },
			},
		},
	});

	if (!event) {
		return false;
	}

	// 用户是活动创建者
	if (event.organizerId === userId) {
		return true;
	}

	// 用户是活动管理员且有管理管理员权限
	if (event.admins.length > 0) {
		return true;
	}

	// 用户是所属组织的管理员或所有者
	if (event.organizationId && event.organization) {
		const hasOrgPermission = event.organization.members.length > 0;
		return hasOrgPermission;
	}

	return false;
}

/**
 * 检查用户是否有权限管理指定票种
 */
export async function canManageTicketType(
	ticketTypeId: string,
	userId: string,
): Promise<boolean> {
	const ticketType = await db.eventTicketType.findUnique({
		where: { id: ticketTypeId },
		select: {
			id: true,
			eventId: true,
		},
	});

	if (!ticketType) {
		return false;
	}

	return canManageEvent(ticketType.eventId, userId);
}

/**
 * 检查用户是否有权限查看活动详细信息（包括敏感数据）
 */
export async function canViewEventDetails(
	eventId: string,
	userId: string,
): Promise<boolean> {
	const event = await db.event.findUnique({
		where: resolveEventIdentifier(eventId),
		select: {
			id: true,
			status: true,
			organizerId: true,
			organizationId: true,
			organization: {
				select: {
					id: true,
					members: {
						where: {
							userId: userId,
							role: { in: ["owner", "admin", "member"] },
						},
						select: { id: true },
					},
				},
			},
		},
	});

	if (!event) {
		return false;
	}

	// 公开的已发布活动所有人都可以查看基础信息
	if (event.status === "PUBLISHED") {
		return true;
	}

	// 草稿状态只有创建者和组织成员可以查看
	if (event.organizerId === userId) {
		return true;
	}

	if (event.organizationId && event.organization) {
		const hasOrgAccess = event.organization.members.length > 0;
		return hasOrgAccess;
	}

	return false;
}

/**
 * 检查用户是否有权限查看活动的管理数据（如报名列表、统计等）
 */
export async function canViewEventManagementData(
	eventId: string,
	userId: string,
): Promise<boolean> {
	return canManageEventRegistrations(eventId, userId);
}
