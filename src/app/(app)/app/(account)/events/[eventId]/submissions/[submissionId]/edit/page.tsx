import { headers } from "next/headers";
import { notFound } from "next/navigation";

import { config } from "@/config";
import { getEventById } from "@/lib/database";
import { EventSubmissionForm } from "@/modules/dashboard/events/components/submissions/EventSubmissionForm";
import { SubmissionPageShell } from "@/modules/dashboard/events/components/submissions/SubmissionPageShell";
import type {
	EventSubmission,
	SubmissionFormConfig,
} from "@/features/event-submissions/types";

interface PageProps {
	params: Promise<{ eventId: string; submissionId: string }>;
}

async function fetchSubmission(
	submissionId: string,
): Promise<EventSubmission | null> {
	// Build an absolute URL using the current request's proto + host
	// Relative URLs are not supported by Node fetch in this context
	const headerList = await headers();
	const proto = headerList.get("x-forwarded-proto") ?? "http";
	const host =
		headerList.get("x-forwarded-host") ??
		headerList.get("host") ??
		`localhost:${process.env.PORT ?? 3000}`;
	const absoluteUrl = `${proto}://${host}/api/submissions/${submissionId}`;
	// Only forward whitelisted headers to avoid forbidden header issues
	const headerObject: Record<string, string> = {};
	const cookie = headerList.get("cookie");
	if (cookie) headerObject.cookie = cookie;
	const authz = headerList.get("authorization");
	if (authz) headerObject.authorization = authz;
	const res = await fetch(absoluteUrl, {
		cache: "no-store",
		// Pass through all incoming request headers (includes cookies) so auth/session stays intact
		headers: headerObject,
	});
	if (!res.ok) {
		return null;
	}
	const payload = await res.json();
	return payload?.data ?? null;
}

export default async function EditSubmissionPage({ params }: PageProps) {
	const { eventId, submissionId } = await params;
	const [submission, event] = await Promise.all([
		fetchSubmission(submissionId),
		getEventById(eventId),
	]);

	if (!submission || !event) {
		notFound();
	}

	const submissionFormConfig = (event.submissionFormConfig ??
		null) as SubmissionFormConfig | null;

	return (
		<SubmissionPageShell
			eyebrow="编辑作品"
			title={event.title}
			backHref={`/${config.i18n.defaultLocale}/events/${eventId}/submissions`}
			backLabel="返回列表"
		>
			<EventSubmissionForm
				eventId={eventId}
				eventTitle={event.title}
				initialData={submission}
				mode="edit"
				submissionFormConfig={submissionFormConfig}
			/>
		</SubmissionPageShell>
	);
}
