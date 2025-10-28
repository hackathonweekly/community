import { SystemConfigService } from "./service";
import {
	DEFAULT_VISITOR_RESTRICTIONS,
	type VisitorRestrictionConfig,
} from "@/features/permissions";

export const VISITOR_RESTRICTIONS_CONFIG_KEY = "visitor_restrictions";

function normalizeVisitorRestrictions(
	value?: Partial<VisitorRestrictionConfig>,
): VisitorRestrictionConfig {
	return {
		...DEFAULT_VISITOR_RESTRICTIONS,
		...(value ?? {}),
	};
}

export async function getVisitorRestrictionsConfig(): Promise<VisitorRestrictionConfig> {
	const stored = await SystemConfigService.get<VisitorRestrictionConfig>(
		VISITOR_RESTRICTIONS_CONFIG_KEY,
		DEFAULT_VISITOR_RESTRICTIONS,
	);

	return normalizeVisitorRestrictions(stored);
}

export async function setVisitorRestrictionsConfig(
	config: VisitorRestrictionConfig,
	updatedBy: string,
): Promise<void> {
	await SystemConfigService.set(
		VISITOR_RESTRICTIONS_CONFIG_KEY,
		normalizeVisitorRestrictions(config),
		updatedBy,
		"新朋友操作限制配置",
	);
}
