import { config } from "@/config";
import type { Locale } from "@/lib/i18n";
import { getCookie } from "hono/cookie";
import { createMiddleware } from "hono/factory";

/**
 * Locale detection middleware for HackathonWeekly
 * Reads user's language preference from cookies or uses default
 */

export const localeMiddleware = createMiddleware<{
	Variables: {
		locale: Locale;
	};
}>(async (context, next) => {
	// Attempt to retrieve locale from cookie
	const cookieLocale = getCookie(context, config.i18n.localeCookieName) as
		| Locale
		| undefined;

	// Use cookie locale or fall back to default
	const userLocale = cookieLocale ?? config.i18n.defaultLocale;

	// Attach locale to request context for downstream handlers
	context.set("locale", userLocale);

	await next();
});
