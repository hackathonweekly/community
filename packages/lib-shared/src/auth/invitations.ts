export const INVITATION_PLACEHOLDER_DOMAIN = "invitation-placeholder.local";

export function isPlaceholderInvitationEmail(
	email?: string | null,
): email is string {
	return (
		typeof email === "string" &&
		email.endsWith(`@${INVITATION_PLACEHOLDER_DOMAIN}`)
	);
}
