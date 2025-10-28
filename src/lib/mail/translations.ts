import { config } from "@/config";

export const defaultLocale = config.i18n.defaultLocale;

// Simple default translations for email preview
export const defaultTranslations = {
	mail: {
		common: {
			useLink: "Please use the following link:",
			openLinkInBrowser: "Or copy and paste this URL into your browser:",
		},
		magicLink: {
			body: "You requested a magic link to sign in.",
			login: "Sign In",
		},
	},
};
