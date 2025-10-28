import { config } from "@/config";
import { getMessagesForLocale } from "@/lib/i18n";
import { getUserLocale } from "@i18n/lib/locale-cookie";
import { routing } from "@i18n/routing";
import { getRequestConfig } from "next-intl/server";

export default getRequestConfig(async ({ requestLocale }) => {
	let locale = await requestLocale;

	if (!locale) {
		locale = await getUserLocale();
	}

	if (!(routing.locales.includes(locale) && config.i18n.enabled)) {
		locale = routing.defaultLocale;
	}

	return {
		locale,
		messages: await getMessagesForLocale(locale),
	};
});
