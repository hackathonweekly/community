import { auth } from "@community/lib-server/auth";
import {
	checkIntoEvent,
	getEventCheckIns,
	getEventById,
	getUserRegistration,
	getUserCheckIn,
	cancelEventCheckIn,
} from "@community/lib-server/database";
import { canViewEventManagementData } from "@/features/permissions/events";
import {
	recordContribution,
	CP_VALUES,
} from "@community/lib-server/database/prisma/queries/contributions";
import { checkAndAwardAutoBadges } from "@community/lib-server/database/prisma/queries/badges";
import { ContributionType } from "@prisma/client";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";

const checkInSchema = z.object({
	eventId: z.string(),
	userId: z.string().optional(), // If not provided, check-in the authenticated user
});

const app = new Hono();

// POST /api/events/checkin - Check into an event
app.post("/", zValidator("json", checkInSchema), async (c) => {
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

		const data = c.req.valid("json");
		const targetUserId = data.userId || session.user.id;

		// Get event details
		const event = await getEventById(data.eventId);
		if (!event) {
			return c.json(
				{
					success: false,
					error: "Event not found",
				},
				404,
			);
		}

		// Check if event check-in is available (2 hours before start time)
		const now = new Date();
		const checkInStartTime = new Date(
			event.startTime.getTime() - 2 * 60 * 60 * 1000,
		); // 2 hours before

		if (now < checkInStartTime) {
			return c.json(
				{
					success: false,
					error: "Check-in is not available yet. You can check in 2 hours before the event starts.",
				},
				400,
			);
		}

		// If checking in someone else, verify permissions
		if (data.userId && data.userId !== session.user.id) {
			const hasPermission = await canViewEventManagementData(
				data.eventId,
				session.user.id,
			);

			if (!hasPermission) {
				return c.json(
					{
						success: false,
						error: "You don't have permission to check in other users",
					},
					403,
				);
			}
		}

		const checkIn = await checkIntoEvent({
			eventId: data.eventId,
			userId: targetUserId,
			checkedInBy: data.userId ? session.user.id : undefined,
		});

		// 记录贡献点：活动签到
		try {
			await recordContribution({
				userId: targetUserId,
				type: ContributionType.EVENT_CHECKIN,
				category: "活动参与",
				description: `参与活动：${event.title}`,
				cpValue: CP_VALUES.EVENT_CHECKIN,
				sourceId: data.eventId,
				sourceType: "event",
				organizationId: event.organizationId || undefined,
			});

			// 检查并颁发自动勋章
			await checkAndAwardAutoBadges(targetUserId);
		} catch (error) {
			console.error(
				"Error recording contribution or awarding badges:",
				error,
			);
			// 不阻断签到流程，只记录错误
		}

		return c.json({
			success: true,
			data: checkIn,
		});
	} catch (error) {
		console.error("Error checking into event:", error);

		if (
			error instanceof Error &&
			error.message.includes("already checked in")
		) {
			return c.json(
				{
					success: false,
					error: "User has already checked into this event",
				},
				400,
			);
		}

		return c.json(
			{
				success: false,
				error: "Failed to check into event",
			},
			500,
		);
	}
});

// GET /api/events/:eventId/checkin - Get check-ins for an event
app.get("/", async (c) => {
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

		const eventId = c.req.param("eventId");
		if (!eventId) {
			return c.json(
				{
					success: false,
					error: "Event ID is required",
				},
				400,
			);
		}

		// Get event details to verify permissions
		const event = await getEventById(eventId);
		if (!event) {
			return c.json(
				{
					success: false,
					error: "Event not found",
				},
				404,
			);
		}

		// Check if user has permission to view check-ins
		const hasPermission = await canViewEventManagementData(
			eventId,
			session.user.id,
		);

		if (!hasPermission) {
			return c.json(
				{
					success: false,
					error: "You don't have permission to view event check-ins",
				},
				403,
			);
		}

		const checkIns = await getEventCheckIns(eventId);

		return c.json({
			success: true,
			data: checkIns,
		});
	} catch (error) {
		console.error("Error fetching event check-ins:", error);
		return c.json(
			{
				success: false,
				error: "Failed to fetch event check-ins",
			},
			500,
		);
	}
});

// GET /api/events/:eventId/checkin/status - Get check-in status for current user
app.get("/status", async (c) => {
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

		const eventId = c.req.param("eventId");
		if (!eventId) {
			return c.json(
				{
					success: false,
					error: "Event ID is required",
				},
				400,
			);
		}

		// Get event details
		const event = await getEventById(eventId);
		if (!event) {
			return c.json(
				{
					success: false,
					error: "Event not found",
				},
				404,
			);
		}

		// Check if user is registered for the event
		const registration = await getUserRegistration(
			eventId,
			session.user.id,
		);
		if (!registration) {
			return c.json({
				success: true,
				data: {
					canCheckIn: false,
					isAlreadyCheckedIn: false,
					statusCode: "NOT_REGISTERED",
					message:
						"You are not registered for this event. Please register first.",
					event,
				},
			});
		}

		if (registration.status !== "APPROVED") {
			return c.json({
				success: true,
				data: {
					canCheckIn: false,
					isAlreadyCheckedIn: false,
					statusCode: "REGISTRATION_PENDING",
					message: "Your registration is not approved yet.",
					event,
				},
			});
		}

		// Check if user is already checked in
		const existingCheckIn = await getUserCheckIn(eventId, session.user.id);
		if (existingCheckIn) {
			return c.json({
				success: true,
				data: {
					canCheckIn: false,
					isAlreadyCheckedIn: true,
					statusCode: "ALREADY_CHECKED_IN",
					message: `You have already checked in at ${new Date(existingCheckIn.checkedInAt).toLocaleString()}.`,
					event,
				},
			});
		}

		// Check if check-in is available (2 hours before event starts)
		const now = new Date();
		const checkInStartTime = new Date(
			event.startTime.getTime() - 2 * 60 * 60 * 1000,
		); // 2 hours before

		if (now < checkInStartTime) {
			return c.json({
				success: true,
				data: {
					canCheckIn: false,
					isAlreadyCheckedIn: false,
					statusCode: "CHECKIN_NOT_STARTED",
					message: `Check-in will be available 2 hours before the event starts. Available from ${checkInStartTime.toLocaleString()}.`,
					event,
				},
			});
		}

		// Check if event has ended (optional restriction)
		if (event.endTime < now) {
			return c.json({
				success: true,
				data: {
					canCheckIn: false,
					isAlreadyCheckedIn: false,
					statusCode: "EVENT_ENDED",
					message:
						"Event has already ended. Check-in is no longer available.",
					event,
				},
			});
		}

		// User can check in
		return c.json({
			success: true,
			data: {
				canCheckIn: true,
				isAlreadyCheckedIn: false,
				statusCode: "READY",
				message:
					"Ready to check in! Click the button below to confirm your attendance.",
				event,
			},
		});
	} catch (error) {
		console.error("Error getting check-in status:", error);
		return c.json(
			{
				success: false,
				error: "Failed to get check-in status",
			},
			500,
		);
	}
});

// DELETE /api/events/checkin - Cancel check-in for an event
app.delete("/", zValidator("json", checkInSchema), async (c) => {
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

		const data = c.req.valid("json");
		const targetUserId = data.userId || session.user.id;

		// Get event details
		const event = await getEventById(data.eventId);
		if (!event) {
			return c.json(
				{
					success: false,
					error: "Event not found",
				},
				404,
			);
		}

		// If canceling someone else's check-in, verify permissions
		if (data.userId && data.userId !== session.user.id) {
			const hasPermission = await canViewEventManagementData(
				data.eventId,
				session.user.id,
			);

			if (!hasPermission) {
				return c.json(
					{
						success: false,
						error: "You don't have permission to cancel other users' check-ins",
					},
					403,
				);
			}
		}

		const canceledCheckIn = await cancelEventCheckIn(
			data.eventId,
			targetUserId,
		);

		return c.json({
			success: true,
			data: canceledCheckIn,
		});
	} catch (error) {
		console.error("Error canceling check-in:", error);

		if (
			error instanceof Error &&
			error.message.includes("not checked in")
		) {
			return c.json(
				{
					success: false,
					error: "User is not checked in to this event",
				},
				400,
			);
		}

		return c.json(
			{
				success: false,
				error: "Failed to cancel check-in",
			},
			500,
		);
	}
});

export default app;
