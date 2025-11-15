import { notFound } from "next/navigation";
import { getEventById } from "@/lib/database";
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

	return (
		<div className="container mx-auto max-w-5xl py-10">
			<SubmissionsDashboard eventId={eventId} eventTitle={event.title} />
		</div>
	);
}
