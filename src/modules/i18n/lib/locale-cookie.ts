import "server-only";

import { config } from "@/config";
import type { Locale } from "@/lib/i18n";
import { cookies } from "next/headers";

export async function getUserLocale() {
	const cookie = (await cookies()).get(config.i18n.localeCookieName);
	return cookie?.value ?? config.i18n.defaultLocale;
}

export async function setLocaleCookie(locale: Locale) {
	(await cookies()).set(config.i18n.localeCookieName, locale);
}
