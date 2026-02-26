import { auth } from "@community/lib-server/auth";
import {
	getUserEventRegistrations,
	registerForEvent,
	getEventById,
	updateRegistrationStatus,
	findEventInviteByCode,
} from "@community/lib-server/database";
import {
	sendEventRegistrationConfirmation,
	sendEventRegistrationApproved,
} from "@community/lib-server/mail/events";
import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";

const getRegistrationsSchema = z.object({
	status: z
		.enum(["PENDING", "APPROVED", "WAITLISTED", "REJECTED", "CANCELLED"])
		.optional(),
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

const registerSchema = z.object({
	eventId: z.string(),
	inviteCode: z.string().optional(),
	answers: z
		.array(
			z.object({
				questionId: z.string(),
				answer: z.string(),
			}),
		)
		.default([]),
});

const updateRegistrationSchema = z.object({
	status: z.enum([
		"PENDING",
		"APPROVED",
		"WAITLISTED",
		"REJECTED",
		"CANCELLED",
	]),
});

const app = new Hono();

// GET /api/user/registrations - Get current user's event registrations
app.get("/", zValidator("query", getRegistrationsSchema), async (c) => {
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

		const result = await getUserEventRegistrations(session.user.id, params);

		return c.json({
			success: true,
			data: result,
		});
	} catch (error) {
		console.error("Error fetching user registrations:", error);
		return c.json(
			{
				success: false,
				error: "Failed to fetch registrations",
			},
			500,
		);
	}
});

// POST /api/user/registrations - Register for an event
app.post("/", zValidator("json", registerSchema), async (c) => {
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

		// Get event details for email
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

		let inviteId: string | undefined;
		if (data.inviteCode) {
			const invite = await findEventInviteByCode(
				data.eventId,
				data.inviteCode,
			);
			if (invite) {
				inviteId = invite.id;
			}
		}

		const registration = await registerForEvent({
			eventId: data.eventId,
			userId: session.user.id,
			answers: data.answers,
			inviteId,
		});

		// Send confirmation email
		const eventLocation = event.isOnline
			? event.onlineUrl || "Online"
			: event.address || "";

		await sendEventRegistrationConfirmation({
			eventTitle: event.title,
			eventDate: new Date(event.startTime).toLocaleDateString("en-US", {
				weekday: "long",
				year: "numeric",
				month: "long",
				day: "numeric",
				hour: "numeric",
				minute: "2-digit",
			}),
			eventLocation,
			eventUrl: `${process.env.NEXT_PUBLIC_APP_URL}/events/${event.id}`,
			userName: session.user.name || session.user.email,
			userEmail: session.user.email,
		});

		return c.json({
			success: true,
			data: registration,
		});
	} catch (error) {
		console.error("Error registering for event:", error);

		if (error instanceof Error) {
			if (error.message.includes("already registered")) {
				return c.json(
					{
						success: false,
						error: "You are already registered for this event",
					},
					400,
				);
			}
			if (error.message.includes("full")) {
				return c.json(
					{
						success: false,
						error: "Event is full",
					},
					400,
				);
			}
		}

		return c.json(
			{
				success: false,
				error: "Failed to register for event",
			},
			500,
		);
	}
});

// PUT /api/user/registrations/:id - Update registration status (for organizers)
app.put("/:id", zValidator("json", updateRegistrationSchema), async (c) => {
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

		const registrationId = c.req.param("id");
		const data = c.req.valid("json");

		const updatedRegistration = await updateRegistrationStatus(
			registrationId,
			data.status,
		);

		// Send approval email if status changed to APPROVED
		if (data.status === "APPROVED") {
			const eventLocation = updatedRegistration.event.isOnline
				? updatedRegistration.event.onlineUrl || "Online"
				: updatedRegistration.event.address || "";

			await sendEventRegistrationApproved({
				eventTitle: updatedRegistration.event.title,
				eventDate: new Date(
					updatedRegistration.event.startTime,
				).toLocaleDateString("en-US", {
					weekday: "long",
					year: "numeric",
					month: "long",
					day: "numeric",
					hour: "numeric",
					minute: "2-digit",
				}),
				eventLocation,
				eventUrl: `${process.env.NEXT_PUBLIC_APP_URL}/events/${updatedRegistration.event.id}`,
				userName:
					updatedRegistration.user.name ||
					updatedRegistration.user.email,
				userEmail: updatedRegistration.user.email,
			});
		}

		return c.json({
			success: true,
			data: updatedRegistration,
		});
	} catch (error) {
		console.error("Error updating registration status:", error);
		return c.json(
			{
				success: false,
				error: "Failed to update registration status",
			},
			500,
		);
	}
});

export default app;
