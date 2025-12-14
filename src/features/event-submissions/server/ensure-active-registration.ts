import "server-only";

import { redirect } from "next/navigation";

import { config } from "@/config";
import { getEventRegistration } from "@/lib/database";
import { getSession } from "@/modules/dashboard/auth/lib/server";

import { isActiveRegistrationStatus } from "../constants";

interface EnsureActiveRegistrationOptions {
	returnTo?: string;
}

export async function ensureActiveEventRegistration(
	eventId: string,
	options: EnsureActiveRegistrationOptions = {},
) {
	const session = await getSession();

	if (!session) {
		const loginUrl =
			options.returnTo && options.returnTo.length > 0
				? `/auth/login?redirectTo=${encodeURIComponent(options.returnTo)}`
				: "/auth/login";
		redirect(loginUrl);
	}

	const registration = await getEventRegistration(eventId, session.user.id);

	if (!registration || !isActiveRegistrationStatus(registration.status)) {
		const locale = session.user.locale || config.i18n.defaultLocale;
		const registrationUrl = config.i18n.enabled
			? `/${locale}/events/${eventId}/register`
			: `/events/${eventId}/register`;
		redirect(registrationUrl);
	}

	return {
		session,
		registration,
	};
}
