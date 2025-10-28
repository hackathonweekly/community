import type { Messages } from "@/lib/i18n/types";

declare global {
	interface IntlMessages extends Messages {}
}
