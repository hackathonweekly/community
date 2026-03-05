import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";

import type { EventSubmission } from "@/features/event-submissions/types";
import {
	buildForwardedAuthHeaders,
	resolveRequestOrigin,
} from "@/features/event-submissions/server/request-headers";
import { isEventSubmissionsEnabled } from "@/features/event-submissions/utils/is-event-submissions-enabled";
import { SubmissionQrVotePage } from "@/modules/public/events/submissions/SubmissionQrVotePage";
import { auth } from "@community/lib-server/auth/auth";
import { getEventById } from "@community/lib-server/database";

interface PageProps {
	params: Promise<{ eventId: string; submissionId: string }>;
}

async function fetchSubmission(params: {
	submissionId: string;
	requestOrigin: string;
	requestHeaders: Record<string, string>;
}): Promise<EventSubmission | null> {
	const { submissionId, requestOrigin, requestHeaders } = params;
	const response = await fetch(
		`${requestOrigin}/api/submissions/${submissionId}`,
		{
			cache: "no-store",
			headers: requestHeaders,
		},
	);
	if (!response.ok) return null;
	const payload = await response.json();
	return payload?.data ?? null;
}

export default async function SubmissionVotePage({ params }: PageProps) {
	const { eventId, submissionId } = await params;
	const headerList = await headers();

	const session = await auth.api.getSession({
		headers: headerList,
	});
	if (!session) {
		const redirectTo = `/events/${eventId}/submissions/${submissionId}/vote`;
		redirect(`/auth/login?redirectTo=${encodeURIComponent(redirectTo)}`);
	}

	const event = await getEventById(eventId);
	if (!event || !isEventSubmissionsEnabled(event as any)) {
		notFound();
	}

	const submission = await fetchSubmission({
		submissionId,
		requestOrigin: resolveRequestOrigin(headerList),
		requestHeaders: buildForwardedAuthHeaders(headerList),
	});
	if (!submission || submission.eventId !== eventId) {
		notFound();
	}

	const isVotingOpen =
		event.type === "HACKATHON"
			? Boolean((event as any)?.votingOpen)
			: false;

	return (
		<div className="container mx-auto max-w-xl py-6">
			<SubmissionQrVotePage
				eventId={eventId}
				submissionId={submissionId}
				eventTitle={event.title ?? null}
				submission={submission}
				isVotingOpen={isVotingOpen}
			/>
		</div>
	);
}
