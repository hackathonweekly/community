import { notFound } from "next/navigation";
import { getBaseUrl } from "@/lib/utils";
import type { EventSubmission } from "@/features/event-submissions/types";
import { SubmissionDetail } from "@/modules/public/events/submissions/SubmissionDetail";
import { getEventById } from "@/lib/database";

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
	const showResults = !isVotingOpen;

	return (
		<div className="container mx-auto max-w-4xl py-10">
			<SubmissionDetail
				submission={submission}
				locale={locale}
				showResults={showResults}
			/>
		</div>
	);
}
