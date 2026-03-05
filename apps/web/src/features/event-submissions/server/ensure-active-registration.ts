import "server-only";

import { redirect } from "next/navigation";

import { getEventRegistration } from "@community/lib-server/database";
import { getSession } from "@/modules/account/auth/lib/server";

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
		const registrationUrl = `/events/${eventId}/register`;
		redirect(registrationUrl);
	}

	return {
		session,
		registration,
	};
}
