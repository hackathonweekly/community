import { DEFAULT_CONTACT_FORM_CONFIG } from "./constants";
import { SystemConfigService } from "./service";
import type { ContactFormConfig } from "./types";

export const CONTACT_FORM_CONFIG_KEY = "contact_form";

function normalizeContactFormConfig(
	value?: Partial<ContactFormConfig>,
): ContactFormConfig {
	return {
		...DEFAULT_CONTACT_FORM_CONFIG,
		...(value ?? {}),
	};
}

export async function getContactFormConfig(): Promise<ContactFormConfig> {
	const stored = await SystemConfigService.get<ContactFormConfig>(
		CONTACT_FORM_CONFIG_KEY,
		DEFAULT_CONTACT_FORM_CONFIG,
	);

	return normalizeContactFormConfig(stored);
}

export async function setContactFormConfig(
	config: ContactFormConfig,
	updatedBy: string,
): Promise<void> {
	await SystemConfigService.set(
		CONTACT_FORM_CONFIG_KEY,
		normalizeContactFormConfig(config),
		updatedBy,
		"联系表单配置",
	);
}
