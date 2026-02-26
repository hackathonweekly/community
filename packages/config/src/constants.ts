import { config as appConfig } from "@community/config";
import type { ContactFormConfig } from "./types";

export const DEFAULT_CONTACT_FORM_CONFIG: ContactFormConfig = {
	enabled: appConfig.contactForm.enabled,
	to: appConfig.contactForm.to,
	subject: appConfig.contactForm.subject,
};
