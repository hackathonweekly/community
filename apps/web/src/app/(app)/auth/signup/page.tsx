import { config } from "@community/config";
import { isPlaceholderInvitationEmail } from "@community/lib-shared/auth/invitations";
import { SignupForm } from "@account/auth/components/SignupForm";
import { getInvitation } from "@shared/auth/lib/server";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { withQuery } from "ufo";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata() {
	const t = await getTranslations();

	return {
		title: t("auth.signup.title"),
	};
}
export default async function SignupPage({
	searchParams,
}: {
	searchParams: Promise<{
		[key: string]: string | string[] | undefined;
		invitationId?: string;
	}>;
}) {
	const params = await searchParams;
	const { invitationId } = params;

	if (!(config.auth.enableSignup || invitationId)) {
		return redirect(withQuery("/auth/login", params));
	}

	if (invitationId) {
		const invitation = await getInvitation(invitationId);

		if (
			!invitation ||
			invitation.status !== "pending" ||
			invitation.expiresAt.getTime() < new Date().getTime()
		) {
			return redirect(withQuery("/auth/login", params));
		}

		let prefillEmail: string | undefined;

		if (
			invitation.metadata &&
			typeof invitation.metadata === "object" &&
			!Array.isArray(invitation.metadata)
		) {
			const potentialEmail = (
				invitation.metadata as Record<string, unknown>
			).originalEmail;

			if (typeof potentialEmail === "string") {
				const normalizedEmail = potentialEmail.trim();
				if (normalizedEmail.length > 0) {
					prefillEmail = normalizedEmail;
				}
			}
		}

		if (
			!prefillEmail &&
			typeof invitation.email === "string" &&
			!isPlaceholderInvitationEmail(invitation.email)
		) {
			prefillEmail = invitation.email;
		}

		return <SignupForm prefillEmail={prefillEmail} />;
	}

	return <SignupForm />;
}
