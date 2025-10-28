import { createMDXSource } from "@fumadocs/content-collections";
import { loader } from "fumadocs-core/source";
import { Home } from "lucide-react";
import { createElement } from "react";
import { allDocs, allDocsMetas } from "content-collections";
import { config } from "@/config";

/**
 * Documentation source configuration for Fumadocs
 * Configures MDX content loading and internationalization
 */
export const docsSource = loader({
	baseUrl: "/docs",
	i18n: {
		defaultLanguage: config.i18n.defaultLocale,
		languages: Object.keys(config.i18n.locales),
		hideLocale: "never",
	},
	source: createMDXSource(allDocs, allDocsMetas),
	icon(iconName) {
		if (!iconName) {
			return;
		}

		const iconMap = {
			Home,
		};

		if (iconName in iconMap) {
			return createElement(iconMap[iconName as keyof typeof iconMap]);
		}
	},
});
