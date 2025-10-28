import { config as appConfig } from "@/config";
import { SystemConfigService } from "./service";
import type { BetaBannerConfig, BetaBannerLocaleContent } from "./types";
import { DEFAULT_BETA_BANNER_CONFIG } from "./constants";

function mergeLocales(
	storedConfig?: BetaBannerConfig,
): Record<string, BetaBannerLocaleContent> {
	const locales = Object.keys(appConfig.i18n.locales);

	return locales.reduce(
		(acc, locale) => {
			const fallback = DEFAULT_BETA_BANNER_CONFIG.locales[locale];
			const storedLocale = storedConfig?.locales?.[locale];

			acc[locale] = {
				label: storedLocale?.label?.trim() || fallback?.label || "Beta",
				message:
					storedLocale?.message?.trim() ||
					fallback?.message ||
					"We’re in beta — share your feedback with us!",
			};
			return acc;
		},
		{} as Record<string, BetaBannerLocaleContent>,
	);
}

export async function getBetaBannerConfig(): Promise<BetaBannerConfig> {
	const storedConfig = await SystemConfigService.get<BetaBannerConfig>(
		"beta_banner",
		DEFAULT_BETA_BANNER_CONFIG,
	);

	return {
		enabled: storedConfig?.enabled ?? DEFAULT_BETA_BANNER_CONFIG.enabled,
		locales: mergeLocales(storedConfig),
	};
}
