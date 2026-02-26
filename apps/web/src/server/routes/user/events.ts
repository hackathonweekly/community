import { auth } from "@community/lib-server/auth";
import { getEventsByOrganizerId } from "@community/lib-server/database";
import { db } from "@community/lib-server/database/prisma/client";
import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";

const getUserEventsSchema = z.object({
	status: z.enum(["DRAFT", "PUBLISHED", "CANCELLED"]).optional(),
	upcoming: z
		.string()
		.transform((val) => val === "true")
		.optional(),
	page: z
		.string()
		.transform((val) => Number.parseInt(val) || 1)
		.optional(),
	limit: z
		.string()
		.transform((val) => Number.parseInt(val) || 20)
		.optional(),
});

const app = new Hono();

// GET /api/user/events - Get current user's organized events
app.get("/", zValidator("query", getUserEventsSchema), async (c) => {
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

		const params = c.req.valid("query");

		// Convert upcoming filter to status if needed
		const queryParams: {
			page?: number;
			limit?: number;
			status?: "all" | "DRAFT" | "PUBLISHED" | "CANCELLED";
		} = {
			page: params.page,
			limit: params.limit,
			// For organizers, show all events by default (including drafts)
			status: params.status === undefined ? "all" : params.status,
		};

		const result = await getEventsByOrganizerId(
			session.user.id,
			queryParams,
		);

		// Filter for upcoming events if requested
		if (params.upcoming) {
			const now = new Date();
			result.events = result.events.filter(
				(event) => new Date(event.startTime) > now,
			);
		}

		return c.json({
			success: true,
			data: result,
		});
	} catch (error) {
		console.error("Error fetching user events:", error);
		return c.json(
			{
				success: false,
				error: "Failed to fetch events",
			},
			500,
		);
	}
});

// GET /api/user/events/:eventId/like-status - Check if current user liked an event
app.get("/:eventId/like-status", async (c) => {
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

		const { eventId } = c.req.param();

		// Check if user has liked the event
		const like = await db.eventLike.findUnique({
			where: {
				userId_eventId: {
					userId: session.user.id,
					eventId,
				},
			},
		});

		return c.json({
			success: true,
			liked: !!like,
		});
	} catch (error) {
		console.error("Error checking event like status:", error);
		return c.json(
			{
				success: false,
				error: "Internal server error",
			},
			500,
		);
	}
});

export default app;
