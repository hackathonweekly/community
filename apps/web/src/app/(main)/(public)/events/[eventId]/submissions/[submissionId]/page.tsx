import { headers } from "next/headers";
import { notFound } from "next/navigation";

import type { EventSubmission } from "@/features/event-submissions/types";
import {
	buildForwardedAuthHeaders,
	resolveRequestOrigin,
} from "@/features/event-submissions/server/request-headers";
import { isEventSubmissionsEnabled } from "@/features/event-submissions/utils/is-event-submissions-enabled";
import { withHackathonConfigDefaults } from "@/features/hackathon/config";
import { SubmissionDetail } from "@/modules/public/events/submissions/SubmissionDetail";
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
	if (!response.ok) {
		return null;
	}
	const payload = await response.json();
	return payload?.data ?? null;
}

export default async function SubmissionDetailPage({ params }: PageProps) {
	const { eventId, submissionId } = await params;
	const headerList = await headers();
	const requestOrigin = resolveRequestOrigin(headerList);
	const submission = await fetchSubmission({
		submissionId,
		requestOrigin,
		requestHeaders: buildForwardedAuthHeaders(headerList),
	});

	if (!submission || submission.eventId !== eventId) {
		notFound();
	}

	// Only reveal exact vote counts during the final results stage
	const event = await getEventById(eventId);
	if (!event || !isEventSubmissionsEnabled(event as any)) {
		notFound();
	}
	const isVotingOpen =
		event.type === "HACKATHON"
			? Boolean((event as any)?.votingOpen)
			: false;
	const votingConfig =
		event.type === "HACKATHON"
			? withHackathonConfigDefaults(
					(event as any)?.hackathonConfig as any,
				).voting
			: null;

	// Respect admin toggle: when disabled, hide vote counts on gallery (even after voting ends)
	const showVotesOnGallery =
		event.type === "HACKATHON"
			? Boolean((event as any)?.showVotesOnGallery ?? true)
			: false;
	const showResults = showVotesOnGallery && !isVotingOpen;
	const submissionUrl = `${requestOrigin}/events/${eventId}/submissions/${submissionId}`;

	return (
		<div className="container mx-auto max-w-6xl py-6 lg:py-8">
			<SubmissionDetail
				submission={submission}
				isVotingOpen={isVotingOpen}
				votingConfig={votingConfig}
				showResults={showResults}
				submissionUrl={submissionUrl}
				eventTitle={event.title ?? null}
			/>
		</div>
	);
}
