import { redirect } from "next/navigation";
import { config } from "@/config";

/**
 * Root page component
 * Redirects users to the default locale homepage
 * Ensures all visitors land on a properly localized version of the site
 */
export default function RootPage() {
	redirect(`/${config.i18n.defaultLocale}`);
}
