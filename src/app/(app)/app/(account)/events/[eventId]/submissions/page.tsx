import { notFound } from "next/navigation";
import { getEventById } from "@/lib/database";
import { ensureActiveEventRegistration } from "@/features/event-submissions/server/ensure-active-registration";
import { SubmissionsDashboard } from "@/modules/dashboard/events/components/submissions/SubmissionsDashboard";

interface PageProps {
	params: Promise<{ eventId: string }>;
}

export default async function EventSubmissionsPage({ params }: PageProps) {
	const { eventId } = await params;
	const event = await getEventById(eventId);

	if (!event) {
		notFound();
	}

	await ensureActiveEventRegistration(eventId, {
		returnTo: `/app/events/${eventId}/submissions`,
	});

	const now = new Date();
	const startTime = new Date(event.startTime);
	const endTime = new Date(event.endTime);
	const isEventStarted = now >= startTime;
	const isEventEnded = now >= endTime || event.status === "COMPLETED";
	const isSubmissionOpen =
		(event.submissionsOpen ?? true) && isEventStarted && !isEventEnded;

	return (
		<SubmissionsDashboard
			eventId={eventId}
			eventTitle={event.title}
			isSubmissionOpen={isSubmissionOpen}
		/>
	);
}
