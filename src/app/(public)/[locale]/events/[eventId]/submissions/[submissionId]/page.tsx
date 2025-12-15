import type { EventSubmission } from "@/features/event-submissions/types";
import { withHackathonConfigDefaults } from "@/features/hackathon/config";
import { getEventById } from "@/lib/database";
import { getBaseUrl } from "@/lib/utils";
import { SubmissionDetail } from "@/modules/public/events/submissions/SubmissionDetail";
import { notFound } from "next/navigation";

interface PageProps {
	params: Promise<{ locale: string; eventId: string; submissionId: string }>;
}

async function fetchSubmission(
	submissionId: string,
): Promise<EventSubmission | null> {
	const baseUrl = getBaseUrl();
	const response = await fetch(`${baseUrl}/api/submissions/${submissionId}`, {
		cache: "no-store",
	});
	if (!response.ok) {
		return null;
	}
	const payload = await response.json();
	return payload?.data ?? null;
}

export default async function SubmissionDetailPage({ params }: PageProps) {
	const { locale, eventId, submissionId } = await params;
	const submission = await fetchSubmission(submissionId);

	if (!submission || submission.eventId !== eventId) {
		notFound();
	}

	// Only reveal exact vote counts during the final results stage
	const event = await getEventById(eventId);
	const isVotingOpen =
		event?.type === "HACKATHON"
			? Boolean((event as any)?.votingOpen)
			: false;
	const votingConfig =
		event?.type === "HACKATHON"
			? withHackathonConfigDefaults(
					(event as any)?.hackathonConfig as any,
				).voting
			: null;

	// Respect admin toggle: when disabled, hide vote counts on gallery (even after voting ends)
	const showVotesOnGallery =
		event?.type === "HACKATHON"
			? Boolean((event as any)?.showVotesOnGallery ?? true)
			: false;
	const showResults = showVotesOnGallery && !isVotingOpen;
	const submissionUrl = `${getBaseUrl()}/${locale}/events/${eventId}/submissions/${submissionId}`;

	return (
		<div className="container mx-auto max-w-6xl py-6 lg:py-8">
			<SubmissionDetail
				submission={submission}
				locale={locale}
				isVotingOpen={isVotingOpen}
				votingConfig={votingConfig}
				showResults={showResults}
				submissionUrl={submissionUrl}
				eventTitle={event?.title ?? null}
			/>
		</div>
	);
}
