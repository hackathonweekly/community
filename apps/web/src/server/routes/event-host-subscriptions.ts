import {
	subscribeToEventHost,
	unsubscribeFromEventHost,
	isSubscribedToEventHost,
} from "@community/lib-server/database";
import { db } from "@community/lib-server/database/prisma/client";
import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { validator } from "hono-openapi/zod";
import { z } from "zod";
import { authMiddleware } from "../middleware/auth";

const subscriptionTargetSchema = z
	.object({
		organizationId: z.string().min(1).optional().nullable(),
		hostUserId: z.string().min(1).optional().nullable(),
	})
	.refine((value) => {
		const hasOrganization = !!value.organizationId;
		const hasHost = !!value.hostUserId;
		return hasOrganization !== hasHost;
	}, "organizationId and hostUserId cannot both be provided or omitted");

export const eventHostSubscriptionsRouter = new Hono()
	.use(authMiddleware)
	.get(
		"/status",
		validator("query", subscriptionTargetSchema),
		describeRoute({
			summary: "Get subscription status for an event host",
			tags: ["Event Host Subscriptions"],
		}),
		async (c) => {
			const user = c.get("user");
			const { organizationId, hostUserId } = c.req.valid("query");

			try {
				const subscribed = await isSubscribedToEventHost({
					userId: user.id,
					organizationId: organizationId ?? undefined,
					hostUserId: hostUserId ?? undefined,
				});
				return c.json({ subscribed });
			} catch (error) {
				console.error(
					"Failed to get event host subscription status:",
					error,
				);
				return c.json({ error: "Invalid subscription target" }, 400);
			}
		},
	)
	.post(
		"/",
		validator("json", subscriptionTargetSchema),
		describeRoute({
			summary:
				"Subscribe to future events from an organization or host user",
			tags: ["Event Host Subscriptions"],
		}),
		async (c) => {
			const user = c.get("user");
			const { organizationId, hostUserId } = c.req.valid("json");

			try {
				if (organizationId) {
					const organization = await db.organization.findUnique({
						where: { id: organizationId },
						select: { id: true },
					});
					if (!organization) {
						return c.json({ error: "Organization not found" }, 404);
					}
				}

				if (hostUserId) {
					if (hostUserId === user.id) {
						return c.json(
							{ error: "Cannot subscribe to your own events" },
							400,
						);
					}

					const hostUser = await db.user.findUnique({
						where: { id: hostUserId },
						select: { id: true },
					});
					if (!hostUser) {
						return c.json({ error: "User not found" }, 404);
					}
				}

				const subscription = await subscribeToEventHost({
					userId: user.id,
					organizationId: organizationId ?? undefined,
					hostUserId: hostUserId ?? undefined,
				});

				return c.json({
					success: true,
					subscribed: !subscription.unsubscribedAt,
				});
			} catch (error) {
				console.error("Failed to subscribe to event host:", error);
				return c.json({ error: "Failed to subscribe" }, 500);
			}
		},
	)
	.delete(
		"/",
		validator("json", subscriptionTargetSchema),
		describeRoute({
			summary:
				"Unsubscribe from future events from an organization or host user",
			tags: ["Event Host Subscriptions"],
		}),
		async (c) => {
			const user = c.get("user");
			const { organizationId, hostUserId } = c.req.valid("json");

			try {
				await unsubscribeFromEventHost({
					userId: user.id,
					organizationId: organizationId ?? undefined,
					hostUserId: hostUserId ?? undefined,
				});

				return c.json({ success: true });
			} catch (error) {
				console.error("Failed to unsubscribe from event host:", error);
				return c.json({ error: "Failed to unsubscribe" }, 500);
			}
		},
	);
