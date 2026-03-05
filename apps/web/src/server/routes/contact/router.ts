import { getContactFormConfig } from "@community/lib-server/system-config/contact-form";
import { logger } from "@community/lib-server/logs";
import { sendEmail } from "@community/lib-server/mail";
import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { resolver, validator } from "hono-openapi/zod";
import { z } from "zod";
import { localeMiddleware } from "../../middleware/locale";
import { contactFormSchema } from "./types";

export const contactRouter = new Hono().basePath("/contact").post(
	"/",
	localeMiddleware,
	validator("form", contactFormSchema),
	describeRoute({
		tags: ["Contact"],
		summary: "Send a message from the contact form",
		description: "Send a message with an email and name",
		responses: {
			204: {
				description: "Message sent",
			},
			400: {
				description: "Could not send message",
				content: {
					"application/json": {
						schema: resolver(z.object({ error: z.string() })),
					},
				},
			},
		},
	}),
	async (c) => {
		const { email, name, message } = c.req.valid("form");
		const locale = c.get("locale");

		try {
			const contactConfig = await getContactFormConfig();

			const textContent = `Name: ${name}\n\nEmail: ${email}\n\nMessage: ${message}`;
			const htmlContent = `
				<h3>New Contact Form Message</h3>
				<p><strong>Name:</strong> ${name}</p>
				<p><strong>Email:</strong> ${email}</p>
				<p><strong>Message:</strong></p>
				<p>${message.replace(/\n/g, "<br>")}</p>
			`;

			await sendEmail({
				to: contactConfig.to,
				locale,
				subject: contactConfig.subject,
				text: textContent,
				html: htmlContent,
			});

			return c.body(null, 204);
		} catch (error) {
			logger.error(error);
			return c.json({ error: "Could not send email" }, 500);
		}
	},
);
