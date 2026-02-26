import { logger } from "@community/lib-server/logs";
import { sendEmail } from "@community/lib-server/mail";
import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { resolver, validator } from "hono-openapi/zod";
import { z } from "zod";
import { localeMiddleware } from "../middleware/locale";

/**
 * Newsletter subscription endpoint for HackathonWeekly
 *
 * Features:
 * - Email validation
 * - Internationalized confirmation emails
 * - Error handling and logging
 */

const newsletterEmailSchema = z.object({
	email: z.string().email("Please provide a valid email address"),
});

export const newsletterRouter = new Hono().basePath("/newsletter").post(
	"/signup",
	localeMiddleware,
	validator("form", newsletterEmailSchema),
	describeRoute({
		tags: ["Newsletter"],
		summary: "Subscribe to HackathonWeekly newsletter",
		description:
			"Subscribes an email address to receive hackathon updates and event announcements",
		responses: {
			204: {
				description:
					"Subscription successful - confirmation email sent",
			},
			400: {
				description: "Invalid email format",
				content: {
					"application/json": {
						schema: resolver(
							z.object({
								error: z.string(),
							}),
						),
					},
				},
			},
			500: {
				description: "Email delivery failed",
				content: {
					"application/json": {
						schema: resolver(
							z.object({
								error: z.string(),
							}),
						),
					},
				},
			},
		},
	}),
	async (ctx) => {
		const { email } = ctx.req.valid("form");
		const locale = ctx.get("locale");

		try {
			// Send localized confirmation email
			await sendEmail({
				to: email,
				locale,
				templateId: "newsletterSignup",
				context: {},
			});

			logger.info(`Newsletter signup: ${email} (locale: ${locale})`);

			return ctx.body(null, 204);
		} catch (error) {
			logger.error("Newsletter signup failed:", { email, error });

			return ctx.json(
				{ error: "Failed to send confirmation email" },
				500,
			);
		}
	},
);
