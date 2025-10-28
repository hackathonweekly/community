import { config as appConfig } from "@/config";
import type {
	BetaBannerConfig,
	BetaBannerLocaleContent,
	ContactFormConfig,
	CustomerServiceConfig,
} from "./types";

const supportedLocales = Object.keys(appConfig.i18n.locales) as Array<
	keyof typeof appConfig.i18n.locales
>;

export const DEFAULT_BETA_BANNER_LOCALES = supportedLocales.reduce(
	(result, locale) => {
		const fallbackLabel = appConfig.i18n.locales[locale]?.label ?? "Beta";
		result[locale as string] = {
			label: fallbackLabel,
			message:
				locale === "zh"
					? "我们正在 Beta 内测阶段，欢迎你的反馈与建议！"
					: "We’re in beta — share your feedback with us!",
		};
		return result;
	},
	{} as Record<string, BetaBannerLocaleContent>,
);

export const DEFAULT_BETA_BANNER_CONFIG: BetaBannerConfig = {
	enabled: true,
	locales: DEFAULT_BETA_BANNER_LOCALES,
};

export const DEFAULT_CONTACT_FORM_CONFIG: ContactFormConfig = {
	enabled: appConfig.contactForm.enabled,
	to: appConfig.contactForm.to,
	subject: appConfig.contactForm.subject,
};

export const DEFAULT_CUSTOMER_SERVICE_CONFIG: CustomerServiceConfig = {
	enabled: appConfig.customerService.enabled,
	aiChat: {
		enabled: appConfig.customerService.aiChat.enabled,
		provider: appConfig.customerService.aiChat.provider,
	},
	community: {
		enabled: appConfig.customerService.community.enabled,
		qrCodeUpload: appConfig.customerService.community.qrCodeUpload,
	},
	feedback: {
		enabled: appConfig.customerService.feedback.enabled,
		docsIntegration: appConfig.customerService.feedback.docsIntegration,
	},
};
