import { render } from "@react-email/render";
import { getMessagesForLocale } from "@community/lib-shared/i18n";
import type { Locale, Messages } from "@community/lib-shared/i18n";
import { mailTemplates } from "./templates/index";

export async function getTemplate<T extends TemplateId>({
	templateId,
	context,
	locale,
}: {
	templateId: T;
	context: Omit<
		Parameters<(typeof mailTemplates)[T]>[0],
		"locale" | "translations"
	>;
	locale: Locale;
}) {
	const template = mailTemplates[templateId];
	const translations = await getMessagesForLocale(locale);

	const email = template({
		...(context as any),
		locale,
		translations,
	});

	const templateTranslations = translations.mail?.[
		templateId as keyof Messages["mail"]
	] as { subject?: string } | undefined;

	let subject = templateTranslations?.subject?.trim() ?? "";

	if (!subject) {
		const contextData = context as Record<string, unknown>;
		const contextSubject =
			typeof contextData.subject === "string"
				? contextData.subject.trim()
				: undefined;
		const contextTitle =
			typeof contextData.title === "string"
				? contextData.title.trim()
				: undefined;
		subject = contextSubject || contextTitle || "";
	}

	const html = await render(email);
	const text = await render(email, { plainText: true });
	return { html, text, subject };
}

export type TemplateId = keyof typeof mailTemplates;
