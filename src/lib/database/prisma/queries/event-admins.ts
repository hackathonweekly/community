import { db } from "@/lib/database/prisma/client";
import type { EventAdminRole, EventAdminStatus } from "@prisma/client";

/**
 * 邀请用户成为活动管理员
 */
export async function inviteEventAdmin(data: {
	eventId: string;
	email: string;
	invitedBy: string;
	role?: EventAdminRole;
	canEditEvent?: boolean;
	canManageRegistrations?: boolean;
	canManageAdmins?: boolean;
}) {
	const {
		eventId,
		email,
		invitedBy,
		role = "ADMIN",
		canEditEvent = true,
		canManageRegistrations = true,
		canManageAdmins = false,
	} = data;

	// 检查是否已经存在相同邮箱的邀请
	const existingInvitation = await db.eventAdmin.findUnique({
		where: {
			eventId_email: {
				eventId,
				email,
			},
		},
	});

	if (existingInvitation && existingInvitation.status === "ACCEPTED") {
		throw new Error("User is already an admin for this event");
	}

	if (existingInvitation && existingInvitation.status === "PENDING") {
		throw new Error("Invitation already sent to this email");
	}

	// 如果之前被拒绝或移除，可以重新邀请
	if (
		existingInvitation &&
		(existingInvitation.status === "REJECTED" ||
			existingInvitation.status === "REMOVED")
	) {
		return await db.eventAdmin.update({
			where: { id: existingInvitation.id },
			data: {
				status: "PENDING",
				role,
				canEditEvent,
				canManageRegistrations,
				canManageAdmins,
				invitedBy,
				invitedAt: new Date(),
				acceptedAt: null,
			},
			include: {
				event: {
					select: {
						id: true,
						title: true,
						startTime: true,
					},
				},
				inviter: {
					select: {
						id: true,
						name: true,
						email: true,
					},
				},
			},
		});
	}

	// 创建新邀请
	return await db.eventAdmin.create({
		data: {
			eventId,
			email,
			invitedBy,
			role,
			canEditEvent,
			canManageRegistrations,
			canManageAdmins,
		},
		include: {
			event: {
				select: {
					id: true,
					title: true,
					startTime: true,
				},
			},
			inviter: {
				select: {
					id: true,
					name: true,
					email: true,
				},
			},
		},
	});
}

/**
 * 接受活动管理员邀请
 */
export async function acceptEventAdminInvitation(
	invitationId: string,
	userId: string,
) {
	// 根据用户邮箱找到邀请
	const user = await db.user.findUnique({
		where: { id: userId },
		select: { email: true },
	});

	if (!user) {
		throw new Error("User not found");
	}

	const invitation = await db.eventAdmin.findUnique({
		where: { id: invitationId },
		include: {
			event: {
				select: {
					id: true,
					title: true,
				},
			},
		},
	});

	if (!invitation) {
		throw new Error("Invitation not found");
	}

	if (invitation.email !== user.email) {
		throw new Error("This invitation is not for your email address");
	}

	if (invitation.status !== "PENDING") {
		throw new Error("This invitation is no longer valid");
	}

	return await db.eventAdmin.update({
		where: { id: invitationId },
		data: {
			status: "ACCEPTED",
			userId,
			acceptedAt: new Date(),
		},
		include: {
			event: {
				select: {
					id: true,
					title: true,
				},
			},
			user: {
				select: {
					id: true,
					name: true,
					email: true,
				},
			},
		},
	});
}

/**
 * 拒绝活动管理员邀请
 */
export async function rejectEventAdminInvitation(
	invitationId: string,
	userId: string,
) {
	const user = await db.user.findUnique({
		where: { id: userId },
		select: { email: true },
	});

	if (!user) {
		throw new Error("User not found");
	}

	const invitation = await db.eventAdmin.findUnique({
		where: { id: invitationId },
	});

	if (!invitation) {
		throw new Error("Invitation not found");
	}

	if (invitation.email !== user.email) {
		throw new Error("This invitation is not for your email address");
	}

	if (invitation.status !== "PENDING") {
		throw new Error("This invitation is no longer valid");
	}

	return await db.eventAdmin.update({
		where: { id: invitationId },
		data: {
			status: "REJECTED",
		},
	});
}

/**
 * 移除活动管理员
 */
export async function removeEventAdmin(
	eventId: string,
	adminId: string,
	removedBy: string,
) {
	const admin = await db.eventAdmin.findUnique({
		where: { id: adminId },
		include: {
			user: {
				select: {
					id: true,
					name: true,
					email: true,
				},
			},
		},
	});

	if (!admin) {
		throw new Error("Admin not found");
	}

	if (admin.eventId !== eventId) {
		throw new Error("Admin does not belong to this event");
	}

	if (admin.status !== "ACCEPTED") {
		throw new Error("Admin is not active");
	}

	// 不能移除自己
	if (admin.userId === removedBy) {
		throw new Error("You cannot remove yourself as admin");
	}

	return await db.eventAdmin.update({
		where: { id: adminId },
		data: {
			status: "REMOVED",
		},
		include: {
			user: {
				select: {
					id: true,
					name: true,
					email: true,
				},
			},
		},
	});
}

/**
 * 获取活动的所有管理员
 */
export async function getEventAdmins(
	eventId: string,
	includeInvitations = false,
) {
	const whereClause = includeInvitations
		? { eventId }
		: { eventId, status: "ACCEPTED" as EventAdminStatus };

	return await db.eventAdmin.findMany({
		where: whereClause,
		include: {
			user: {
				select: {
					id: true,
					name: true,
					email: true,
					image: true,
					username: true,
				},
			},
			inviter: {
				select: {
					id: true,
					name: true,
					username: true,
				},
			},
		},
		orderBy: [
			{ status: "asc" }, // PENDING first, then ACCEPTED
			{ invitedAt: "asc" },
		],
	});
}

/**
 * 获取用户的所有活动管理员邀请
 */
export async function getUserEventAdminInvitations(userId: string) {
	const user = await db.user.findUnique({
		where: { id: userId },
		select: { email: true },
	});

	if (!user) {
		throw new Error("User not found");
	}

	return await db.eventAdmin.findMany({
		where: {
			email: user.email,
			status: "PENDING" as EventAdminStatus,
		},
		include: {
			event: {
				select: {
					id: true,
					title: true,
					richContent: true,
					startTime: true,
					endTime: true,
					isOnline: true,
				},
			},
			inviter: {
				select: {
					id: true,
					name: true,
					username: true,
				},
			},
		},
		orderBy: {
			invitedAt: "desc",
		},
	});
}

/**
 * 检查用户是否是活动管理员
 */
export async function isEventAdmin(
	eventId: string,
	userId: string,
): Promise<boolean> {
	const admin = await db.eventAdmin.findFirst({
		where: {
			eventId,
			userId,
			status: "ACCEPTED" as EventAdminStatus,
		},
	});

	return !!admin;
}

/**
 * 获取用户在指定活动的管理员权限
 */
export async function getEventAdminPermissions(
	eventId: string,
	userId: string,
) {
	const admin = await db.eventAdmin.findFirst({
		where: {
			eventId,
			userId,
			status: "ACCEPTED" as EventAdminStatus,
		},
	});

	return admin || null;
}

/**
 * 检查用户是否可以管理活动管理员（邀请/移除其他管理员）
 */
export async function canManageEventAdmins(
	eventId: string,
	userId: string,
): Promise<boolean> {
	// 检查是否是活动创建者
	const event = await db.event.findUnique({
		where: { id: eventId },
		select: { organizerId: true },
	});

	if (event?.organizerId === userId) {
		return true;
	}

	// 检查是否是有权限管理其他管理员的SUPER_ADMIN
	const admin = await db.eventAdmin.findFirst({
		where: {
			eventId,
			userId,
			status: "ACCEPTED",
			canManageAdmins: true,
		},
	});

	return !!admin;
}
