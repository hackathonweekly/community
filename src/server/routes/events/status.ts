import { auth } from "@/lib/auth";
import { getEventById, updateEvent } from "@/lib/database";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";

const app = new Hono();

const toggleRegistrationSchema = z.object({
	action: z.enum(["close", "open"]),
});

// POST /api/events/:id/status/registration - Toggle registration status
app.post(
	"/:id/registration",
	zValidator("json", toggleRegistrationSchema),
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

			const eventId = c.req.param("id");
			const { action } = c.req.valid("json");

			// Check if user owns the event
			const existingEvent = await getEventById(eventId);
			if (!existingEvent) {
				return c.json(
					{
						success: false,
						error: "Event not found",
					},
					404,
				);
			}

			if (existingEvent.organizerId !== session.user.id) {
				return c.json(
					{
						success: false,
						error: "Unauthorized: You can only manage your own events",
					},
					403,
				);
			}

			// Determine new status based on action and current status
			let newStatus: string;
			if (action === "close") {
				newStatus = "REGISTRATION_CLOSED";
			} else {
				// action === "open"
				// When opening registration, return to PUBLISHED if it was closed
				newStatus =
					existingEvent.status === "REGISTRATION_CLOSED"
						? "PUBLISHED"
						: existingEvent.status;
			}

			// Only update if status is actually changing
			if (existingEvent.status === newStatus) {
				return c.json({
					success: true,
					message: `Registration is already ${action === "close" ? "closed" : "open"}`,
					event: { ...existingEvent, status: newStatus },
				});
			}

			// Update the event status
			const updatedEvent = await updateEvent(eventId, {
				status: newStatus as
					| "DRAFT"
					| "PUBLISHED"
					| "REGISTRATION_CLOSED"
					| "ONGOING"
					| "COMPLETED"
					| "CANCELLED",
			});

			return c.json({
				success: true,
				message: `Registration ${action === "close" ? "closed" : "opened"} successfully`,
				event: updatedEvent,
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
	},
);

export default app;
