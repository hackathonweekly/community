import type {
	SubmissionBaseFieldConfig,
	SubmissionFieldType,
	SubmissionFormConfig,
} from "./types";

const FIELD_TYPE_SET = new Set<SubmissionFieldType>([
	"text",
	"textarea",
	"url",
	"phone",
	"email",
	"image",
	"file",
	"select",
	"radio",
	"checkbox",
]);

// Runtime guard that ensures we only keep valid submission settings.
const normalizeSettings = (
	settings: unknown,
): SubmissionFormConfig["settings"] | undefined => {
	if (!settings || typeof settings !== "object") {
		return undefined;
	}

	const maybeSettings = settings as Record<string, unknown>;
	const attachmentsEnabled =
		typeof maybeSettings.attachmentsEnabled === "boolean"
			? maybeSettings.attachmentsEnabled
			: undefined;
	const communityUseAuthorizationEnabled =
		typeof maybeSettings.communityUseAuthorizationEnabled === "boolean"
			? maybeSettings.communityUseAuthorizationEnabled
			: undefined;
	const workAuthorizationAgreementMarkdownRaw =
		typeof maybeSettings.workAuthorizationAgreementMarkdown === "string"
			? maybeSettings.workAuthorizationAgreementMarkdown.trim()
			: "";
	const workAuthorizationAgreementMarkdown =
		workAuthorizationAgreementMarkdownRaw
			? workAuthorizationAgreementMarkdownRaw
			: undefined;

	if (
		attachmentsEnabled === undefined &&
		communityUseAuthorizationEnabled === undefined &&
		workAuthorizationAgreementMarkdown === undefined
	) {
		return undefined;
	}

	return {
		...(attachmentsEnabled !== undefined && { attachmentsEnabled }),
		...(communityUseAuthorizationEnabled !== undefined && {
			communityUseAuthorizationEnabled,
		}),
		...(workAuthorizationAgreementMarkdown !== undefined && {
			workAuthorizationAgreementMarkdown,
		}),
	};
};

const normalizeOptions = (value: unknown): string[] | undefined => {
	if (!Array.isArray(value)) {
		return undefined;
	}
	const safeOptions = value.filter(
		(option): option is string => typeof option === "string",
	);
	return safeOptions.length > 0 ? safeOptions : undefined;
};

const normalizeOptionalString = (value: unknown): string | undefined => {
	if (typeof value !== "string") {
		return undefined;
	}
	const trimmed = value.trim();
	return trimmed.length > 0 ? trimmed : undefined;
};

const normalizeBaseFieldConfig = (
	value: unknown,
): SubmissionBaseFieldConfig | undefined => {
	if (!value || typeof value !== "object") {
		return undefined;
	}

	const raw = value as Record<string, unknown>;
	const label = normalizeOptionalString(raw.label);
	const description = normalizeOptionalString(raw.description);
	const placeholder = normalizeOptionalString(raw.placeholder);
	const required =
		typeof raw.required === "boolean" ? raw.required : undefined;
	const enabled = typeof raw.enabled === "boolean" ? raw.enabled : undefined;

	const hasAny =
		label !== undefined ||
		description !== undefined ||
		placeholder !== undefined ||
		required !== undefined ||
		enabled !== undefined;

	return hasAny
		? {
				...(label !== undefined && { label }),
				...(description !== undefined && { description }),
				...(placeholder !== undefined && { placeholder }),
				...(required !== undefined && { required }),
				...(enabled !== undefined && { enabled }),
			}
		: undefined;
};

export function normalizeSubmissionFormConfig(
	config: unknown,
): SubmissionFormConfig | null {
	if (!config || typeof config !== "object") {
		return null;
	}

	const rawConfig = config as Record<string, unknown>;
	const rawFields = Array.isArray(rawConfig.fields)
		? (rawConfig.fields as unknown[])
		: [];

	const fields: SubmissionFormConfig["fields"] =
		rawFields.length > 0 ? [] : undefined;

	rawFields.forEach((field, index) => {
		if (!field || typeof field !== "object") {
			return;
		}

		const safeField = field as Record<string, unknown>;
		const key = typeof safeField.key === "string" ? safeField.key : "";
		const label =
			typeof safeField.label === "string" ? safeField.label : "";

		if (!key || !label) {
			return;
		}

		const typeValue = safeField.type;
		const type =
			typeof typeValue === "string" &&
			FIELD_TYPE_SET.has(typeValue as SubmissionFieldType)
				? (typeValue as SubmissionFieldType)
				: "text";

		const required = Boolean(safeField.required);
		const enabled =
			safeField.enabled === undefined ? true : Boolean(safeField.enabled);
		const publicVisible =
			safeField.publicVisible === undefined
				? true
				: Boolean(safeField.publicVisible);
		const placeholder =
			typeof safeField.placeholder === "string"
				? safeField.placeholder
				: undefined;
		const description =
			typeof safeField.description === "string"
				? safeField.description
				: undefined;
		const order =
			typeof safeField.order === "number" ? safeField.order : index;

		fields?.push({
			key,
			label,
			type,
			required,
			enabled,
			publicVisible,
			placeholder,
			description,
			options: normalizeOptions(safeField.options),
			order,
		});
	});

	const sortedFields = fields?.sort((a, b) => a.order - b.order);

	const rawBaseFields =
		rawConfig.baseFields && typeof rawConfig.baseFields === "object"
			? (rawConfig.baseFields as Record<string, unknown>)
			: null;
	const tagline = rawBaseFields
		? normalizeBaseFieldConfig(rawBaseFields.tagline)
		: undefined;
	const demoUrl = rawBaseFields
		? normalizeBaseFieldConfig(rawBaseFields.demoUrl)
		: undefined;
	const attachments = rawBaseFields
		? normalizeBaseFieldConfig(rawBaseFields.attachments)
		: undefined;

	const baseFields: SubmissionFormConfig["baseFields"] | undefined =
		tagline || demoUrl || attachments
			? {
					...(tagline && { tagline }),
					...(demoUrl && { demoUrl }),
					...(attachments && { attachments }),
				}
			: undefined;

	const hasBaseFields = Boolean(baseFields);

	const settings = normalizeSettings(rawConfig.settings);
	const hasFields = Boolean(sortedFields && sortedFields.length > 0);

	if (!hasFields && !settings && !hasBaseFields) {
		return null;
	}

	return {
		...(hasFields ? { fields: sortedFields } : {}),
		...(hasBaseFields ? { baseFields } : {}),
		...(settings ? { settings } : {}),
	};
}
