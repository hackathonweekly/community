import { config } from "@community/config";
import { getPendingInvitationByEmail } from "@community/lib-server/database";
import type { BetterAuthPlugin } from "better-auth";
import { APIError } from "better-auth/api";
import { createAuthMiddleware } from "better-auth/plugins";

/**
 * Invitation-only authentication plugin for HackathonWeekly
 * Restricts user registration to invited emails only when signup is disabled
 */

export const invitationOnlyPlugin = (): BetterAuthPlugin =>
	({
		id: "invitationOnlyPlugin",
		hooks: {
			before: [
				{
					// Intercept email signup attempts
					matcher: (context) =>
						context.path?.startsWith("/sign-up/email") ?? false,
					handler: createAuthMiddleware(async (ctx) => {
						// Allow signup if globally enabled
						if (config.auth.enableSignup) {
							return;
						}

						const userEmail = ctx.body.email;

						// Verify invitation exists for the email
						const invitation =
							await getPendingInvitationByEmail(userEmail);

						if (!invitation) {
							throw new APIError("BAD_REQUEST", {
								code: "INVALID_INVITATION",
								message: "No invitation found for this email",
							});
						}
					}),
				},
			],
		},
		$ERROR_CODES: {
			INVALID_INVITATION: "No invitation found for this email",
		},
	}) satisfies BetterAuthPlugin;
