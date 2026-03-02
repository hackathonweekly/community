import { config } from "@community/config";
import { logger } from "@community/lib-server/logs";
import type { mailTemplates } from "./templates/index";
import { sendViaProvider } from "./provider";
import type { TemplateId } from "./templates";
import { getTemplate } from "./templates";
import { isSendableEmail } from "./address";

export async function sendEmail<T extends TemplateId>(
	params: {
		to: string;
		locale?: keyof typeof config.i18n.locales;
	} & (
		| {
				templateId: T;
				context: Omit<
					Parameters<(typeof mailTemplates)[T]>[0],
					"locale" | "translations"
				>;
				subject?: string;
		  }
		| {
				subject: string;
				text?: string;
				html?: string;
		  }
	),
) {
	const { to: rawTo, locale = config.i18n.defaultLocale } = params;
	const to = rawTo.trim();

	if (!isSendableEmail(to)) {
		logger.info(
			"Skipping email delivery to %s because the address is virtual or empty",
			rawTo,
		);
		return true;
	}

	let html: string;
	let text: string;
	let subject: string;
	const subjectFallback =
		typeof params.subject === "string" ? params.subject.trim() : "";

	if ("templateId" in params) {
		const { templateId, context } = params;
		const template = await getTemplate({
			templateId,
			context,
			locale,
		});
		subject = template.subject || subjectFallback;
		text = template.text;
		html = template.html;
	} else {
		subject = params.subject;
		text = params.text ?? "";
		html = params.html ?? "";
	}

	try {
		await sendViaProvider({
			to,
			subject,
			text,
			html,
		});
		return true;
	} catch (e) {
		logger.error(e);
		return false;
	}
}
