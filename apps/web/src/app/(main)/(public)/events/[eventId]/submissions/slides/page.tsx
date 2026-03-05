import { notFound } from "next/navigation";

import { withHackathonConfigDefaults } from "@/features/hackathon/config";
import { isEventSubmissionsEnabled } from "@/features/event-submissions/utils/is-event-submissions-enabled";
import { getEventById } from "@community/lib-server/database";
import { getBaseUrl } from "@community/lib-shared/utils";
import { SubmissionsSlideDeck } from "@/modules/public/events/submissions/SubmissionsSlideDeck";

interface PageProps {
	params: Promise<{ eventId: string }>;
}

export default async function EventSubmissionSlidesPage({ params }: PageProps) {
	const { eventId } = await params;
	const event = await getEventById(eventId);
	if (!event) {
		notFound();
	}
	if (!isEventSubmissionsEnabled(event as any)) {
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

	const showVotesOnGallery =
		event.type === "HACKATHON"
			? Boolean((event as any)?.showVotesOnGallery ?? true)
			: false;
	const showResults = showVotesOnGallery && !isVotingOpen;

	return (
		<SubmissionsSlideDeck
			eventId={eventId}
			eventTitle={event.title}
			baseUrl={getBaseUrl()}
			isVotingOpen={isVotingOpen}
			votingConfig={votingConfig}
			showResults={showResults}
		/>
	);
}
