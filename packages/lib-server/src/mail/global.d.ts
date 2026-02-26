import type { Messages } from "@community/lib-shared/i18n/types";

declare global {
	interface IntlMessages extends Messages {}
}
