import type { EventSubmission } from "@/features/event-submissions/types";
import { isEventSubmissionsEnabled } from "@/features/event-submissions/utils/is-event-submissions-enabled";
import { auth } from "@/lib/auth/auth";
import { getEventById } from "@/lib/database";
import { getBaseUrl } from "@/lib/utils";
import { SubmissionQrVotePage } from "@/modules/public/events/submissions/SubmissionQrVotePage";
import { notFound, redirect } from "next/navigation";

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
	if (!response.ok) return null;
	const payload = await response.json();
	return payload?.data ?? null;
}

export default async function SubmissionVotePage({ params }: PageProps) {
	const { locale, eventId, submissionId } = await params;

	const session = await auth.api.getSession({
		headers: await import("next/headers").then((m) => m.headers()),
	});
	if (!session) {
		const redirectTo = `/${locale}/events/${eventId}/submissions/${submissionId}/vote`;
		redirect(`/auth/login?redirectTo=${encodeURIComponent(redirectTo)}`);
	}

	const event = await getEventById(eventId);
	if (!event || !isEventSubmissionsEnabled(event as any)) {
		notFound();
	}

	const submission = await fetchSubmission(submissionId);
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
				locale={locale}
				eventTitle={event.title ?? null}
				submission={submission}
				isVotingOpen={isVotingOpen}
			/>
		</div>
	);
}
