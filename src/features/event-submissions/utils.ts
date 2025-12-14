import type { SubmissionFieldType, SubmissionFormConfig } from "./types";

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

	if (
		attachmentsEnabled === undefined &&
		communityUseAuthorizationEnabled === undefined
	) {
		return undefined;
	}

	return {
		...(attachmentsEnabled !== undefined && { attachmentsEnabled }),
		...(communityUseAuthorizationEnabled !== undefined && {
			communityUseAuthorizationEnabled,
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

	const settings = normalizeSettings(rawConfig.settings);
	const hasFields = Boolean(sortedFields && sortedFields.length > 0);

	if (!hasFields && !settings) {
		return null;
	}

	return {
		...(hasFields ? { fields: sortedFields } : {}),
		...(settings ? { settings } : {}),
	};
}
