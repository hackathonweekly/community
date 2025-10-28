import { DEFAULT_CUSTOMER_SERVICE_CONFIG } from "./constants";
import { SystemConfigService } from "./service";
import type { CustomerServiceConfig } from "./types";

export const CUSTOMER_SERVICE_CONFIG_KEY = "customer_service";

function normalizeCustomerServiceConfig(
	value?: Partial<CustomerServiceConfig>,
): CustomerServiceConfig {
	return {
		...DEFAULT_CUSTOMER_SERVICE_CONFIG,
		...value,
		aiChat: {
			...DEFAULT_CUSTOMER_SERVICE_CONFIG.aiChat,
			...(value?.aiChat ?? {}),
		},
		community: {
			...DEFAULT_CUSTOMER_SERVICE_CONFIG.community,
			...(value?.community ?? {}),
		},
		feedback: {
			...DEFAULT_CUSTOMER_SERVICE_CONFIG.feedback,
			...(value?.feedback ?? {}),
		},
	};
}

export async function getCustomerServiceConfig(): Promise<CustomerServiceConfig> {
	const stored = await SystemConfigService.get<CustomerServiceConfig>(
		CUSTOMER_SERVICE_CONFIG_KEY,
		DEFAULT_CUSTOMER_SERVICE_CONFIG,
	);

	return normalizeCustomerServiceConfig(stored);
}

export async function setCustomerServiceConfig(
	config: CustomerServiceConfig,
	updatedBy: string,
): Promise<void> {
	await SystemConfigService.set(
		CUSTOMER_SERVICE_CONFIG_KEY,
		normalizeCustomerServiceConfig(config),
		updatedBy,
		"客服系统配置",
	);
}
