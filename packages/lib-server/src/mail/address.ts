const VIRTUAL_EMAIL_DOMAIN = "@wechat.app";

/**
 * Returns true if the email address is marked as a virtual/placeholder address.
 */
export function isVirtualEmail(email: string | null | undefined): boolean {
	if (!email) {
		return false;
	}

	return email.trim().toLowerCase().endsWith(VIRTUAL_EMAIL_DOMAIN);
}

/**
 * Returns true when the provided email is usable for sending real emails.
 */
export function isSendableEmail(
	email: string | null | undefined,
): email is string {
	if (!email) {
		return false;
	}

	return !isVirtualEmail(email) && email.trim().length > 0;
}

/**
 * Filters out virtual or empty emails and returns a deduplicated array while preserving the original casing.
 */
export function filterSendableEmails(
	emails: Array<string | null | undefined>,
): string[] {
	const unique = new Map<string, string>();

	emails
		.filter((email): email is string => typeof email === "string")
		.map((email) => email.trim())
		.filter((email) => email.length > 0)
		.filter(isSendableEmail)
		.forEach((email) => {
			const lower = email.toLowerCase();
			if (!unique.has(lower)) {
				unique.set(lower, email);
			}
		});

	return Array.from(unique.values());
}

export const VIRTUAL_EMAIL_SUFFIX = VIRTUAL_EMAIL_DOMAIN;
