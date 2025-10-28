import { logger } from "@/lib/logs";
import type { SendEmailHandler } from "./types";

/**
 * Unified email provider that uses Plunk in production and console logging in development
 * Set ENABLE_EMAIL_IN_DEV=true to send real emails in development mode
 */
export const sendViaProvider: SendEmailHandler = async ({
	to,
	subject,
	html,
	text,
}) => {
	// Check if we should send real emails in development
	const shouldSendRealEmail =
		process.env.NODE_ENV === "production" ||
		process.env.ENABLE_EMAIL_IN_DEV === "true";

	// Development environment without real email sending: log to console
	if (!shouldSendRealEmail) {
		logger.info(
			`📧 [DEV] Email to: ${to}\nSubject: ${subject}\nHTML: ${html}\nText: ${text}`,
		);
		return;
	}

	// Production environment or development with real email enabled: use Plunk
	if (!process.env.PLUNK_API_KEY) {
		throw new Error("PLUNK_API_KEY is not configured");
	}

	logger.info(`📧 [SENDING] Real email to: ${to}, Subject: ${subject}`);

	const response = await fetch("https://api.useplunk.com/v1/send", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${process.env.PLUNK_API_KEY}`,
		},
		body: JSON.stringify({
			to,
			subject,
			body: html || text, // 如果 html 为空，使用 text 作为 body
			text,
		}),
	});

	if (!response.ok) {
		const error = await response.json();
		logger.error("Failed to send email via Plunk:", error);
		throw new Error("Could not send email");
	}

	logger.info(`📧 [SUCCESS] Email sent successfully to: ${to}`);
};
