export type RegistrationFieldKey =
	| "name"
	| "userRoleString"
	| "currentWorkOn"
	| "lifeStatus"
	| "bio"
	| "phoneNumber"
	| "email"
	| "wechatId"
	| "shippingAddress";

export type RegistrationFieldTemplate = "FULL" | "MINIMAL" | "CUSTOM";

export interface RegistrationFieldSwitch {
	enabled: boolean;
	required: boolean;
}

export type RegistrationFieldConfigMap = Record<
	RegistrationFieldKey,
	RegistrationFieldSwitch
>;

export interface RegistrationFieldConfig {
	template: RegistrationFieldTemplate;
	fields: RegistrationFieldConfigMap;
	participationAgreementMarkdown?: string;
}

export const registrationFieldKeys: RegistrationFieldKey[] = [
	"name",
	"userRoleString",
	"currentWorkOn",
	"lifeStatus",
	"bio",
	"phoneNumber",
	"email",
	"wechatId",
	"shippingAddress",
];

const cloneConfig = (
	config: RegistrationFieldConfig,
): RegistrationFieldConfig => ({
	template: config.template,
	participationAgreementMarkdown: config.participationAgreementMarkdown,
	fields: registrationFieldKeys.reduce((acc, key) => {
		const value = config.fields[key];
		acc[key] = { enabled: value.enabled, required: value.required };
		return acc;
	}, {} as RegistrationFieldConfigMap),
});

export const defaultRegistrationFieldConfig: RegistrationFieldConfig = {
	template: "FULL",
	fields: {
		name: { enabled: true, required: true },
		userRoleString: { enabled: true, required: true },
		currentWorkOn: { enabled: true, required: true },
		lifeStatus: { enabled: true, required: true },
		bio: { enabled: true, required: true },
		phoneNumber: { enabled: true, required: true },
		email: { enabled: true, required: true },
		wechatId: { enabled: true, required: false },
		shippingAddress: { enabled: false, required: false },
	},
};

export const minimalRegistrationFieldConfig: RegistrationFieldConfig = {
	template: "MINIMAL",
	fields: {
		name: { enabled: true, required: true },
		userRoleString: { enabled: false, required: false },
		currentWorkOn: { enabled: false, required: false },
		lifeStatus: { enabled: false, required: false },
		bio: { enabled: false, required: false },
		phoneNumber: { enabled: true, required: true },
		email: { enabled: false, required: false },
		wechatId: { enabled: false, required: false },
		shippingAddress: { enabled: false, required: false },
	},
};

const templateMap: Record<RegistrationFieldTemplate, RegistrationFieldConfig> =
	{
		FULL: defaultRegistrationFieldConfig,
		MINIMAL: minimalRegistrationFieldConfig,
		CUSTOM: defaultRegistrationFieldConfig,
	};

const normalizeFieldSwitch = (
	value: Partial<RegistrationFieldSwitch> | undefined,
	fallback: RegistrationFieldSwitch,
): RegistrationFieldSwitch => {
	const enabled =
		value?.enabled !== undefined ? value.enabled : fallback.enabled;
	const required =
		value?.required !== undefined ? value.required : fallback.required;

	// required implies enabled
	return {
		enabled: required ? true : enabled,
		required,
	};
};

export const resolveRegistrationFieldConfig = (
	config?: Partial<RegistrationFieldConfig> | null,
): RegistrationFieldConfig => {
	const template =
		config?.template && config.template in templateMap
			? (config.template as RegistrationFieldTemplate)
			: "FULL";

	const base = templateMap[template];
	const clonedBase = cloneConfig(base);

	const incomingFields = (config?.fields ||
		{}) as Partial<RegistrationFieldConfigMap>;

	const mergedFields = registrationFieldKeys.reduce((acc, key) => {
		const fallback = clonedBase.fields[key];
		acc[key] = normalizeFieldSwitch(incomingFields[key], fallback);
		return acc;
	}, {} as RegistrationFieldConfigMap);

	const participationAgreementMarkdown =
		typeof config?.participationAgreementMarkdown === "string" &&
		config.participationAgreementMarkdown.trim()
			? config.participationAgreementMarkdown.trim()
			: undefined;

	return {
		template,
		fields: mergedFields,
		...(participationAgreementMarkdown
			? { participationAgreementMarkdown }
			: {}),
	};
};

export const getPresetRegistrationFieldConfig = (
	template: RegistrationFieldTemplate,
): RegistrationFieldConfig => cloneConfig(templateMap[template]);
