import { config } from "@/config";
import deepmerge from "deepmerge";
import type { Messages } from "./types";

/**
 * Internationalization utilities for HackathonWeekly
 * Handles dynamic locale loading and message merging
 */

/**
 * Dynamically imports translation messages for a specific locale
 * @param locale - Locale code (e.g., 'en', 'zh')
 * @returns Translation messages object
 */
export async function importLocale(locale: string): Promise<Messages> {
	const translations = await import(`./translations/${locale}.json`);
	return translations.default as Messages;
}

/**
 * Retrieves complete translation messages for a locale
 * Falls back to default locale messages for missing translations
 * @param locale - Target locale code
 * @returns Merged translation messages with fallbacks
 */
export async function getMessagesForLocale(locale: string): Promise<Messages> {
	const localeTranslations = await importLocale(locale);

	// Use locale messages directly if it's the default locale
	if (locale === config.i18n.defaultLocale) {
		return localeTranslations;
	}

	// Merge with default locale to fill in missing translations
	const defaultTranslations = await importLocale(config.i18n.defaultLocale);
	return deepmerge(defaultTranslations, localeTranslations);
}

export * from "./types";
