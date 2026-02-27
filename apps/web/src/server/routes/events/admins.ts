import { auth } from "@community/lib-server/auth";
import { resolveEventIdentifier } from "@community/lib-server/database";
import { db } from "@community/lib-server/database/prisma/client";
import {
	acceptEventAdminInvitation,
	getEventAdmins,
	getUserEventAdminInvitations,
	inviteEventAdmin,
	rejectEventAdminInvitation,
	removeEventAdmin,
} from "@community/lib-server/database/prisma/queries/event-admins";
import { canManageEventAdmins } from "@/features/permissions/events";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";

const inviteAdminSchema = z
	.object({
		email: z.string().email("Invalid email address").optional(),
		userId: z.string().optional(),
		role: z.enum(["ADMIN", "SUPER_ADMIN"]).default("ADMIN"),
		canEditEvent: z.boolean().default(true),
		canManageRegistrations: z.boolean().default(true),
		canManageAdmins: z.boolean().default(false),
	})
	.refine((data) => data.email || data.userId, {
		message: "Either email or userId must be provided",
	});

const app = new Hono();

async function resolveEventByIdentifier(eventIdentifier: string) {
	return db.event.findUnique({
		where: resolveEventIdentifier(eventIdentifier),
		select: { id: true, title: true },
	});
}

// GET /api/events/:eventId/admins - 获取活动管理员列表
app.get("/:eventId/admins", async (c) => {
	try {
		const session = await auth.api.getSession({
			headers: c.req.raw.headers,
		});

		if (!session) {
			return c.json(
				{
					success: false,
					error: "Authentication required",
				},
				401,
			);
		}

		const eventIdentifier = c.req.param("eventId");

		// 检查是否有权限查看管理员列表
		const hasPermission = await canManageEventAdmins(
			eventIdentifier,
			session.user.id,
		);
		if (!hasPermission) {
			return c.json(
				{
					success: false,
					error: "Not authorized to view event admins",
				},
				403,
			);
		}

		const event = await resolveEventByIdentifier(eventIdentifier);
		if (!event) {
			return c.json(
				{
					success: false,
					error: "Event not found",
				},
				404,
			);
		}

		const admins = await getEventAdmins(event.id, true); // 包含邀请中的

		return c.json({
			success: true,
			data: admins,
		});
	} catch (error) {
		console.error("Error fetching event admins:", error);
		return c.json(
			{
				success: false,
				error: "Failed to fetch event admins",
			},
			500,
		);
	}
});

// POST /api/events/:eventId/admins/invite - 邀请用户成为活动管理员
app.post(
	"/:eventId/admins/invite",
	zValidator("json", inviteAdminSchema),
	async (c) => {
		try {
			const session = await auth.api.getSession({
				headers: c.req.raw.headers,
			});

			if (!session) {
				return c.json(
					{
						success: false,
						error: "Authentication required",
					},
					401,
				);
			}

			const eventIdentifier = c.req.param("eventId");
			const data = c.req.valid("json");

			// 检查是否有权限管理活动管理员
			const hasPermission = await canManageEventAdmins(
				eventIdentifier,
				session.user.id,
			);
			if (!hasPermission) {
				return c.json(
					{
						success: false,
						error: "Not authorized to invite event admins",
					},
					403,
				);
			}

			const event = await resolveEventByIdentifier(eventIdentifier);
			if (!event) {
				return c.json(
					{
						success: false,
						error: "Event not found",
					},
					404,
				);
			}
			const eventId = event.id;

			// Validate that we have either email or userId
			if (!data.email && !data.userId) {
				return c.json(
					{
						success: false,
						error: "Either email or userId is required",
					},
					400,
				);
			}

			// When userId is provided, add admin directly (no invitation needed)
			if (data.userId) {
				// 验证用户存在
				const targetUser = await db.user.findUnique({
					where: { id: data.userId },
					select: { id: true, name: true, email: true },
				});

				if (!targetUser) {
					return c.json(
						{
							success: false,
							error: "User not found",
						},
						404,
					);
				}

				// 不能添加自己
				if (data.userId === session.user.id) {
					return c.json(
						{
							success: false,
							error: "Cannot add yourself as admin",
						},
						400,
					);
				}

				// 检查是否已经是管理员
				const existingAdmin = await db.eventAdmin.findFirst({
					where: {
						eventId,
						OR: [
							{ userId: data.userId },
							{ email: targetUser.email },
						],
						status: { not: "REMOVED" },
					},
				});

				if (existingAdmin) {
					return c.json(
						{
							success: false,
							error: "User is already an admin for this event",
						},
						400,
					);
				}

				// 直接添加为管理员（状态为已接受）
				const newAdmin = await db.eventAdmin.create({
					data: {
						eventId,
						userId: data.userId,
						email: targetUser.email,
						role: data.role,
						status: "ACCEPTED",
						canEditEvent: data.canEditEvent,
						canManageRegistrations: data.canManageRegistrations,
						canManageAdmins: data.canManageAdmins,
						invitedBy: session.user.id,
						acceptedAt: new Date(),
					},
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
				});

				return c.json({
					success: true,
					data: newAdmin,
				});
			}

			// 不能邀请自己 (for email invitations)
			if (data.email && data.email === session.user.email) {
				return c.json(
					{
						success: false,
						error: "Cannot invite yourself",
					},
					400,
				);
			}

			// 只有提供email才发送邀请（传统方式）
			if (data.email) {
				const invitation = await inviteEventAdmin({
					eventId,
					email: data.email,
					invitedBy: session.user.id,
					role: data.role,
					canEditEvent: data.canEditEvent,
					canManageRegistrations: data.canManageRegistrations,
					canManageAdmins: data.canManageAdmins,
				});

				// TODO: 发送邀请邮件
				// await sendEventAdminInvitationEmail(invitation);

				return c.json({
					success: true,
					data: invitation,
				});
			}
		} catch (error) {
			console.error("Error inviting event admin:", error);

			if (error instanceof Error) {
				return c.json(
					{
						success: false,
						error: error.message,
					},
					400,
				);
			}

			return c.json(
				{
					success: false,
					error: "Failed to invite event admin",
				},
				500,
			);
		}
	},
);

// DELETE /api/events/:eventId/admins/:adminId - 移除活动管理员
app.delete("/:eventId/admins/:adminId", async (c) => {
	try {
		const session = await auth.api.getSession({
			headers: c.req.raw.headers,
		});

		if (!session) {
			return c.json(
				{
					success: false,
					error: "Authentication required",
				},
				401,
			);
		}

		const eventIdentifier = c.req.param("eventId");
		const adminId = c.req.param("adminId");

		// 检查是否有权限管理活动管理员
		const hasPermission = await canManageEventAdmins(
			eventIdentifier,
			session.user.id,
		);
		if (!hasPermission) {
			return c.json(
				{
					success: false,
					error: "Not authorized to remove event admins",
				},
				403,
			);
		}

		const event = await resolveEventByIdentifier(eventIdentifier);
		if (!event) {
			return c.json(
				{
					success: false,
					error: "Event not found",
				},
				404,
			);
		}

		const removedAdmin = await removeEventAdmin(
			event.id,
			adminId,
			session.user.id,
		);

		// TODO: 发送移除通知邮件
		// await sendEventAdminRemovedEmail(removedAdmin);

		return c.json({
			success: true,
			data: removedAdmin,
		});
	} catch (error) {
		console.error("Error removing event admin:", error);

		if (error instanceof Error) {
			return c.json(
				{
					success: false,
					error: error.message,
				},
				400,
			);
		}

		return c.json(
			{
				success: false,
				error: "Failed to remove event admin",
			},
			500,
		);
	}
});

// GET /api/events/admin-invitations - 获取当前用户的管理员邀请
app.get("/admin-invitations", async (c) => {
	try {
		const session = await auth.api.getSession({
			headers: c.req.raw.headers,
		});

		if (!session) {
			return c.json(
				{
					success: false,
					error: "Authentication required",
				},
				401,
			);
		}

		const invitations = await getUserEventAdminInvitations(session.user.id);

		return c.json({
			success: true,
			data: invitations,
		});
	} catch (error) {
		console.error("Error fetching admin invitations:", error);
		return c.json(
			{
				success: false,
				error: "Failed to fetch admin invitations",
			},
			500,
		);
	}
});

// POST /api/events/admin-invitations/:invitationId/accept - 接受管理员邀请
app.post("/admin-invitations/:invitationId/accept", async (c) => {
	try {
		const session = await auth.api.getSession({
			headers: c.req.raw.headers,
		});

		if (!session) {
			return c.json(
				{
					success: false,
					error: "Authentication required",
				},
				401,
			);
		}

		const invitationId = c.req.param("invitationId");

		const acceptedInvitation = await acceptEventAdminInvitation(
			invitationId,
			session.user.id,
		);

		// TODO: 发送接受邀请通知邮件给邀请者
		// await sendEventAdminAcceptedEmail(acceptedInvitation);

		return c.json({
			success: true,
			data: acceptedInvitation,
		});
	} catch (error) {
		console.error("Error accepting admin invitation:", error);

		if (error instanceof Error) {
			return c.json(
				{
					success: false,
					error: error.message,
				},
				400,
			);
		}

		return c.json(
			{
				success: false,
				error: "Failed to accept admin invitation",
			},
			500,
		);
	}
});

// POST /api/events/admin-invitations/:invitationId/reject - 拒绝管理员邀请
app.post("/admin-invitations/:invitationId/reject", async (c) => {
	try {
		const session = await auth.api.getSession({
			headers: c.req.raw.headers,
		});

		if (!session) {
			return c.json(
				{
					success: false,
					error: "Authentication required",
				},
				401,
			);
		}

		const invitationId = c.req.param("invitationId");

		const rejectedInvitation = await rejectEventAdminInvitation(
			invitationId,
			session.user.id,
		);

		// TODO: 发送拒绝邀请通知邮件给邀请者
		// await sendEventAdminRejectedEmail(rejectedInvitation);

		return c.json({
			success: true,
			data: rejectedInvitation,
		});
	} catch (error) {
		console.error("Error rejecting admin invitation:", error);

		if (error instanceof Error) {
			return c.json(
				{
					success: false,
					error: error.message,
				},
				400,
			);
		}

		return c.json(
			{
				success: false,
				error: "Failed to reject admin invitation",
			},
			500,
		);
	}
});

export { app as eventAdminRouter };
