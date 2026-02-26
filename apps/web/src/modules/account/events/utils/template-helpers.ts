import type { EventFormData } from "../components/types";

type TemplateType = "HACKATHON_LEARNING" | "MEETUP" | "CUSTOM";

interface TemplatePayloadOptions {
	name: string;
	description: string;
	type?: TemplateType;
	isPublic?: boolean;
}

interface TemplateTicketType {
	name: string;
	description?: string;
	price?: number;
	maxQuantity?: number;
	sortOrder: number;
}

interface TemplateVolunteerRole {
	volunteerRoleId: string;
	recruitCount: number;
	description?: string;
	requireApproval?: boolean;
}

interface TemplateQuestion {
	question: string;
	type: string;
	options: string[];
	required: boolean;
	order: number;
}

interface TemplatePayload {
	name: string;
	type: TemplateType;
	description: string;
	title: string;
	defaultDescription: string;
	shortDescription?: string;
	duration?: number;
	maxAttendees?: number;
	requireApproval: boolean;
	organizationId?: string;
	isPublic: boolean;
	ticketTypes?: TemplateTicketType[];
	volunteerRoles?: TemplateVolunteerRole[];
	questions?: TemplateQuestion[];
}

const toPositiveInteger = (value: unknown): number | undefined => {
	if (typeof value === "number" && Number.isFinite(value)) {
		return value > 0 ? Math.trunc(value) : undefined;
	}

	if (typeof value === "string") {
		const parsed = Number.parseInt(value, 10);
		return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
	}

	return undefined;
};

const toNonNegativeNumber = (value: unknown): number | undefined => {
	if (typeof value === "number" && Number.isFinite(value)) {
		return value >= 0 ? value : undefined;
	}

	if (typeof value === "string" && value.trim() !== "") {
		const parsed = Number.parseFloat(value);
		return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
	}

	return undefined;
};

const normalizeOptions = (options: unknown): string[] => {
	if (!Array.isArray(options)) {
		return [];
	}

	return options
		.map((option) =>
			typeof option === "string"
				? option.trim()
				: option != null
					? String(option)
					: "",
		)
		.filter((option) => option !== "");
};

export const buildTemplatePayload = (
	formData: EventFormData,
	{
		name,
		description,
		type = "CUSTOM",
		isPublic = false,
	}: TemplatePayloadOptions,
): TemplatePayload => {
	const startTime = formData.startTime ? new Date(formData.startTime) : null;
	const endTime = formData.endTime ? new Date(formData.endTime) : null;

	let duration: number | undefined;
	if (
		startTime &&
		!Number.isNaN(startTime.getTime()) &&
		endTime &&
		!Number.isNaN(endTime.getTime())
	) {
		const diffMinutes = Math.round(
			(endTime.getTime() - startTime.getTime()) / (1000 * 60),
		);
		duration = diffMinutes > 0 ? diffMinutes : undefined;
	}

	const ticketTypes = Array.isArray(formData.ticketTypes)
		? formData.ticketTypes
				.filter(
					(ticket) =>
						typeof ticket?.name === "string" &&
						ticket.name.trim() !== "",
				)
				.map((ticket, index) => {
					const normalized: TemplateTicketType = {
						name: ticket.name.trim(),
						sortOrder: index,
					};

					if (ticket.description?.trim()) {
						normalized.description = ticket.description.trim();
					}

					const price = toNonNegativeNumber(ticket.price);
					if (price !== undefined) {
						normalized.price = price;
					}

					const maxQuantity = toPositiveInteger(ticket.quantity);
					if (maxQuantity !== undefined) {
						normalized.maxQuantity = maxQuantity;
					}

					return normalized;
				})
		: [];

	const volunteerRoles = Array.isArray(formData.volunteerRoles)
		? formData.volunteerRoles
				.filter((role) => role?.volunteerRoleId)
				.map((role) => {
					const normalized: TemplateVolunteerRole = {
						volunteerRoleId: role.volunteerRoleId,
						recruitCount: toPositiveInteger(role.recruitCount) ?? 1,
					};

					if (role.description?.trim()) {
						normalized.description = role.description.trim();
					}

					if (typeof role.requireApproval === "boolean") {
						normalized.requireApproval = role.requireApproval;
					}

					return normalized;
				})
		: [];

	const questions = Array.isArray(formData.questions)
		? formData.questions
				.filter(
					(question) =>
						typeof question?.question === "string" &&
						question.question.trim() !== "" &&
						typeof question.type === "string",
				)
				.map(
					(question, index): TemplateQuestion => ({
						question: question.question.trim(),
						type: question.type,
						options: normalizeOptions(question.options),
						required: Boolean(question.required),
						order: index,
					}),
				)
		: [];

	return {
		name,
		type,
		description,
		title: formData.title || name,
		defaultDescription: formData.richContent || "",
		shortDescription:
			formData.shortDescription && formData.shortDescription.trim() !== ""
				? formData.shortDescription.trim()
				: undefined,
		duration,
		maxAttendees: toPositiveInteger(formData.maxAttendees),
		requireApproval: Boolean(formData.requireApproval),
		organizationId:
			formData.organizationId && formData.organizationId !== "none"
				? formData.organizationId
				: undefined,
		isPublic,
		ticketTypes: ticketTypes.length > 0 ? ticketTypes : undefined,
		volunteerRoles: volunteerRoles.length > 0 ? volunteerRoles : undefined,
		questions: questions.length > 0 ? questions : undefined,
	};
};

export const extractErrorMessage = async (
	response: Response,
	defaultMessage: string,
): Promise<string> => {
	try {
		const errorBody = await response.json();

		if (typeof errorBody === "string") {
			return errorBody;
		}

		if (typeof errorBody?.message === "string") {
			return errorBody.message;
		}

		const error = errorBody?.error ?? errorBody?.details;

		if (typeof error === "string") {
			return error;
		}

		const messages: string[] = [];

		const addIssueMessages = (issues: unknown) => {
			if (Array.isArray(issues)) {
				issues.forEach((issue) => {
					if (!issue) return;
					if (typeof issue.message === "string") {
						const path = Array.isArray(issue.path)
							? issue.path.join(".")
							: undefined;
						messages.push(
							path && path.length > 0
								? `${path}: ${issue.message}`
								: issue.message,
						);
					} else if (typeof issue === "string") {
						messages.push(issue);
					}
				});
			}
		};

		if (Array.isArray(errorBody?.details)) {
			addIssueMessages(errorBody.details);
		}

		if (Array.isArray(error?.issues)) {
			addIssueMessages(error.issues);
		}

		if (messages.length > 0) {
			return messages.join("; ");
		}

		if (typeof error === "object" && error !== null) {
			const parts = Object.entries(error)
				.filter(([, value]) => value != null)
				.map(([key, value]) => `${key}: ${String(value)}`);
			if (parts.length > 0) {
				return parts.join("; ");
			}
		}
	} catch {}

	return `${defaultMessage}（状态 ${response.status}）`;
};
