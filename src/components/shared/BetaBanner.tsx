import { config as appConfig } from "@/config";
import { DEFAULT_BETA_BANNER_CONFIG } from "@/config/constants";
import { getBetaBannerConfig } from "@/config/beta-banner";
import type { BetaBannerConfig } from "@/config/types";
import { BetaBannerClient } from "./BetaBannerClient";

type BetaBannerProps = {
	locale: string;
};

function pickLocaleContent(config: BetaBannerConfig, locale: string) {
	const normalizedLocale = config.locales[locale]
		? locale
		: appConfig.i18n.defaultLocale;

	return (
		config.locales[normalizedLocale] ??
		DEFAULT_BETA_BANNER_CONFIG.locales[normalizedLocale] ??
		DEFAULT_BETA_BANNER_CONFIG.locales[appConfig.i18n.defaultLocale]
	);
}

export async function BetaBanner({ locale }: BetaBannerProps) {
	const betaConfig = await getBetaBannerConfig();
	const content = pickLocaleContent(betaConfig, locale);

	const label = content?.label?.trim() ?? "";
	const message = content?.message?.trim() ?? "";
	const contentSignature = label && message ? `${label}::${message}` : null;

	return (
		<BetaBannerClient
			enabled={betaConfig.enabled}
			label={label}
			message={message}
			contentSignature={contentSignature}
		/>
	);
}
