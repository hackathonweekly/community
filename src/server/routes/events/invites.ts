import {
	createChannelInvite,
	getOrCreateUserInvite,
	listEventInvitesWithStats,
} from "@/lib/database";
import { db } from "@/lib/database/prisma/client";
import { canManageEvent } from "@/features/permissions/events";
import { authMiddleware } from "../../middleware/auth";
import { Hono } from "hono";
import { z } from "zod";
import { validator } from "hono-openapi/zod";

const paramSchema = z.object({ eventId: z.string() });

const createChannelInviteSchema = z.object({
	label: z.string().min(1, "渠道名称不能为空").max(100),
});

export const eventInvitesRouter = new Hono()
	.post(
		"/:eventId/invites/user",
		authMiddleware,
		validator("param", paramSchema),
		async (c) => {
			const { eventId } = c.req.valid("param");
			const user = c.get("user");

			// 确保活动存在，避免生成孤立邀请码
			const event = await db.event.findUnique({
				where: { id: eventId },
				select: { id: true },
			});

			if (!event) {
				return c.json({ success: false, error: "活动不存在" }, 404);
			}

			const invite = await getOrCreateUserInvite(eventId, user.id);

			return c.json({
				success: true,
				data: { invite },
			});
		},
	)
	.post(
		"/:eventId/invites/channel",
		authMiddleware,
		validator("param", paramSchema),
		validator("json", createChannelInviteSchema),
		async (c) => {
			const { eventId } = c.req.valid("param");
			const user = c.get("user");
			const body = c.req.valid("json");

			const event = await db.event.findUnique({
				where: { id: eventId },
				select: { id: true },
			});

			if (!event) {
				return c.json({ success: false, error: "活动不存在" }, 404);
			}

			const hasPermission = await canManageEvent(eventId, user.id);
			if (!hasPermission) {
				return c.json(
					{ success: false, error: "没有权限管理此活动" },
					403,
				);
			}

			const invite = await createChannelInvite({
				eventId,
				createdByUserId: user.id,
				label: body.label,
			});

			return c.json({
				success: true,
				data: { invite },
			});
		},
	)
	.get(
		"/:eventId/invites",
		authMiddleware,
		validator("param", paramSchema),
		async (c) => {
			const { eventId } = c.req.valid("param");
			const user = c.get("user");

			const event = await db.event.findUnique({
				where: { id: eventId },
				select: { id: true },
			});

			if (!event) {
				return c.json({ success: false, error: "活动不存在" }, 404);
			}

			const hasPermission = await canManageEvent(eventId, user.id);
			if (!hasPermission) {
				return c.json(
					{ success: false, error: "没有权限管理此活动" },
					403,
				);
			}

			const invites = await listEventInvitesWithStats(eventId);

			return c.json({
				success: true,
				data: { invites },
			});
		},
	);
