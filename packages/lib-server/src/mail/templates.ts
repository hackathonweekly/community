import { render } from "@react-email/render";
import { getMessagesForLocale } from "@community/lib-shared/i18n";
import type { Locale, Messages } from "@community/lib-shared/i18n";
import { mailTemplates } from "./templates/index";

function getTrimmedString(value: unknown) {
	if (typeof value !== "string") {
		return undefined;
	}

	const trimmed = value.trim();
	return trimmed.length > 0 ? trimmed : undefined;
}

function appendSubjectSuffix(prefix: string, suffix?: string) {
	return suffix ? `${prefix} - ${suffix}` : prefix;
}

function buildFallbackSubject({
	templateId,
	context,
	locale,
}: {
	templateId: TemplateId;
	context: Record<string, unknown>;
	locale: Locale;
}) {
	const isZh = locale === "zh";
	const eventTitle = getTrimmedString(context.eventTitle);
	const organizationName = getTrimmedString(context.organizationName);
	const weekRange = getTrimmedString(context.weekRange);

	switch (templateId) {
		case "eventUpdate": {
			const updateType = getTrimmedString(
				context.updateType,
			)?.toUpperCase();
			const prefix = isZh
				? updateType === "TIME_CHANGE"
					? "活动时间已变更"
					: updateType === "LOCATION_CHANGE"
						? "活动地点已变更"
						: updateType === "CANCELLED"
							? "活动已取消"
							: "活动信息更新"
				: updateType === "TIME_CHANGE"
					? "Event Time Changed"
					: updateType === "LOCATION_CHANGE"
						? "Event Location Changed"
						: updateType === "CANCELLED"
							? "Event Cancelled"
							: "Event Update";
			return appendSubjectSuffix(prefix, eventTitle);
		}
		case "eventRegistrationRejected":
			return appendSubjectSuffix(
				isZh ? "活动报名结果通知" : "Event Registration Update",
				eventTitle,
			);
		case "eventFeedbackRequest":
			return appendSubjectSuffix(
				isZh ? "活动反馈邀请" : "We'd Love Your Feedback",
				eventTitle,
			);
		case "organizationApplicationReceived":
			return appendSubjectSuffix(
				isZh ? "新的组织加入申请" : "New Organization Join Application",
				organizationName,
			);
		case "organizationApplicationApproved":
			return appendSubjectSuffix(
				isZh ? "组织申请已通过" : "Organization Application Approved",
				organizationName,
			);
		case "organizationApplicationRejected":
			return appendSubjectSuffix(
				isZh ? "组织申请未通过" : "Organization Application Rejected",
				organizationName,
			);
		case "weeklyReportGlobal":
			return appendSubjectSuffix(
				isZh ? "社区每周简报" : "Community Weekly Report",
				weekRange,
			);
		case "weeklyReportOrganization":
			return appendSubjectSuffix(
				isZh
					? organizationName
						? `${organizationName} 每周简报`
						: "组织每周简报"
					: organizationName
						? `${organizationName} Weekly Report`
						: "Organization Weekly Report",
				weekRange,
			);
		default:
			return isZh
				? "Hackathon Weekly 通知"
				: "Hackathon Weekly Notification";
	}
}

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

	if (!subject) {
		subject = buildFallbackSubject({
			templateId,
			context: context as Record<string, unknown>,
			locale,
		});
	}

	const html = await render(email);
	const text = await render(email, { plainText: true });
	return { html, text, subject };
}

export type TemplateId = keyof typeof mailTemplates;
