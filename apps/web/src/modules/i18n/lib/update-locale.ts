"use server";

import type { Locale } from "@community/lib-shared/i18n";
import { setLocaleCookie } from "@i18n/lib/locale-cookie";
import { revalidatePath } from "next/cache";

export async function updateLocale(locale: Locale) {
	await setLocaleCookie(locale);
	revalidatePath("/");
}
