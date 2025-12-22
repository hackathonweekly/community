import { notFound } from "next/navigation";
import { normalizeSubmissionFormConfig } from "@/features/event-submissions/utils";
import { ensureActiveEventRegistration } from "@/features/event-submissions/server/ensure-active-registration";
import { getEventById } from "@/lib/database";
import { EventSubmissionForm } from "@/modules/dashboard/events/components/submissions/EventSubmissionForm";
import { SubmissionPageShell } from "@/modules/dashboard/events/components/submissions/SubmissionPageShell";
import { isEventSubmissionsEnabled } from "@/features/event-submissions/utils/is-event-submissions-enabled";
import { getUserLocale } from "@/modules/i18n/lib/locale-cookie";

interface PageProps {
	params: Promise<{ eventId: string }>;
}

export default async function NewSubmissionPage({ params }: PageProps) {
	const { eventId } = await params;
	const event = await getEventById(eventId);
	const locale = await getUserLocale();

	if (!event) {
		notFound();
	}
	if (!isEventSubmissionsEnabled(event as any)) {
		notFound();
	}

	await ensureActiveEventRegistration(eventId, {
		returnTo: `/app/events/${eventId}/submissions/new`,
	});

	// Parse submissionFormConfig from event
	const submissionFormConfig = normalizeSubmissionFormConfig(
		event.submissionFormConfig ?? null,
	);

	return (
		<SubmissionPageShell
			eyebrow="提交作品"
			title={event.title}
			backHref={`/${locale}/eventsnew/${eventId}`}
			backLabel="返回活动主页"
		>
			<EventSubmissionForm
				eventId={eventId}
				eventTitle={event.title}
				submissionFormConfig={submissionFormConfig}
			/>
		</SubmissionPageShell>
	);
}
