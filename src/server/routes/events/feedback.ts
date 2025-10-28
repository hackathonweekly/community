import { auth } from "@/lib/auth";
import {
	createEventFeedback,
	getEventById,
	getEventFeedback,
	getEventRegistration,
	updateEventFeedback,
} from "@/lib/database";
import { canViewEventManagementData } from "@/features/permissions/events";
import {
	CP_VALUES,
	recordContribution,
} from "@/lib/database/prisma/queries/contributions";
import {
	type CustomAnswers,
	type FeedbackConfig,
	isValidCustomAnswers,
	isValidFeedbackConfig,
	validateAnswersAgainstConfig,
} from "@/lib/database/prisma/types/feedback";
import { zValidator } from "@hono/zod-validator";
import { ContributionType } from "@prisma/client";
import { Hono } from "hono";
import { z } from "zod";

const feedbackSchema = z.object({
	rating: z.number().min(1).max(5),
	comment: z.string().optional(),
	suggestions: z.string().optional(),
	wouldRecommend: z.boolean(),
	customAnswers: z
		.record(
			z.union([z.string(), z.number(), z.boolean(), z.array(z.string())]),
		)
		.optional(),
});

const updateFeedbackSchema = z.object({
	rating: z.number().min(1).max(5),
	comment: z.string().optional(),
	suggestions: z.string().optional(),
	wouldRecommend: z.boolean(),
	customAnswers: z
		.record(
			z.union([z.string(), z.number(), z.boolean(), z.array(z.string())]),
		)
		.optional(),
});

const app = new Hono();

// POST /api/events/:eventId/feedback - Submit event feedback
app.post("/", zValidator("json", feedbackSchema), async (c) => {
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

		// Allow feedback for published events (removed time restrictions)
		if (
			event.status !== "PUBLISHED" &&
			!["ONGOING", "COMPLETED"].includes(event.status)
		) {
			return c.json(
				{
					success: false,
					error: "Feedback can only be submitted for published events",
				},
				400,
			);
		}

		// Check if user is registered for the event with confirmed status
		const registration = await getEventRegistration(
			eventId,
			session.user.id,
		);
		if (!registration || registration.status !== "APPROVED") {
			return c.json(
				{
					success: false,
					error: "You must be an approved participant to leave feedback",
				},
				400,
			);
		}

		// Validate custom answers if feedbackConfig exists
		if (event.feedbackConfig && data.customAnswers) {
			if (!isValidFeedbackConfig(event.feedbackConfig)) {
				return c.json(
					{
						success: false,
						error: "Invalid feedback configuration",
					},
					500,
				);
			}

			if (!isValidCustomAnswers(data.customAnswers)) {
				return c.json(
					{
						success: false,
						error: "Invalid custom answers format",
					},
					400,
				);
			}

			const validation = validateAnswersAgainstConfig(
				data.customAnswers as CustomAnswers,
				event.feedbackConfig as FeedbackConfig,
			);

			if (!validation.valid) {
				return c.json(
					{
						success: false,
						error: "Custom answers validation failed",
						details: validation.errors,
					},
					400,
				);
			}
		}

		const feedback = await createEventFeedback({
			eventId,
			userId: session.user.id,
			rating: data.rating,
			comment: data.comment || null,
			suggestions: data.suggestions || null,
			wouldRecommend: data.wouldRecommend,
			customAnswers: data.customAnswers || null,
		});

		// 记录贡献点：活动反馈
		try {
			await recordContribution({
				userId: session.user.id,
				type: ContributionType.EVENT_FEEDBACK,
				category: "活动参与",
				description: `为活动"${event.title}"提供反馈`,
				cpValue: CP_VALUES.EVENT_FEEDBACK,
				sourceId: eventId,
				sourceType: "event_feedback",
				organizationId: event.organizationId || undefined,
			});
		} catch (error) {
			console.error("Error recording feedback contribution:", error);
			// 不阻断反馈流程，只记录错误
		}

		return c.json({
			success: true,
			data: feedback,
		});
	} catch (error) {
		console.error("Error submitting event feedback:", error);

		if (
			error instanceof Error &&
			error.message.includes("already submitted")
		) {
			return c.json(
				{
					success: false,
					error: "You have already submitted feedback for this event",
				},
				400,
			);
		}

		return c.json(
			{
				success: false,
				error: "Failed to submit feedback",
			},
			500,
		);
	}
});

// GET /api/events/:eventId/feedback - Get feedback for an event
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

		// Check if user has permission to view feedback
		const hasPermission = await canViewEventManagementData(
			eventId,
			session.user.id,
		);
		if (!hasPermission) {
			return c.json(
				{
					success: false,
					error: "You don't have permission to view event feedback",
				},
				403,
			);
		}

		const feedback = await getEventFeedback(eventId);

		return c.json({
			success: true,
			data: feedback,
		});
	} catch (error) {
		console.error("Error fetching event feedback:", error);
		return c.json(
			{
				success: false,
				error: "Failed to fetch event feedback",
			},
			500,
		);
	}
});

// PUT /api/events/:eventId/feedback - Update event feedback
app.put("/", zValidator("json", updateFeedbackSchema), async (c) => {
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
		const data = c.req.valid("json");

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

		// Check if user is registered for the event with confirmed status
		const registration = await getEventRegistration(
			eventId,
			session.user.id,
		);
		if (!registration || registration.status !== "APPROVED") {
			return c.json(
				{
					success: false,
					error: "You must be an approved participant to update feedback",
				},
				400,
			);
		}

		// Validate custom answers if feedbackConfig exists
		if (event.feedbackConfig && data.customAnswers) {
			if (!isValidFeedbackConfig(event.feedbackConfig)) {
				return c.json(
					{
						success: false,
						error: "Invalid feedback configuration",
					},
					500,
				);
			}

			if (!isValidCustomAnswers(data.customAnswers)) {
				return c.json(
					{
						success: false,
						error: "Invalid custom answers format",
					},
					400,
				);
			}

			const validation = validateAnswersAgainstConfig(
				data.customAnswers as CustomAnswers,
				event.feedbackConfig as FeedbackConfig,
			);

			if (!validation.valid) {
				return c.json(
					{
						success: false,
						error: "Custom answers validation failed",
						details: validation.errors,
					},
					400,
				);
			}
		}

		const updatedFeedback = await updateEventFeedback(
			eventId,
			session.user.id,
			{
				rating: data.rating,
				comment: data.comment || null,
				suggestions: data.suggestions || null,
				wouldRecommend: data.wouldRecommend,
				customAnswers: data.customAnswers || null,
			},
		);

		return c.json({
			success: true,
			data: updatedFeedback,
		});
	} catch (error) {
		console.error("Error updating event feedback:", error);

		if (
			error instanceof Error &&
			error.message.includes("Feedback not found")
		) {
			return c.json(
				{
					success: false,
					error: "You haven't submitted feedback for this event yet",
				},
				404,
			);
		}

		return c.json(
			{
				success: false,
				error: "Failed to update feedback",
			},
			500,
		);
	}
});

export default app;
