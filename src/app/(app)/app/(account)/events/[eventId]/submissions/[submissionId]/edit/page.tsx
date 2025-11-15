import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { EventSubmissionForm } from "@/modules/dashboard/events/components/submissions/EventSubmissionForm";
import type { EventSubmission } from "@/features/event-submissions/types";
import { Button } from "@/components/ui/button";
import Link from "next/link";

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
	if (cookie) headerObject["cookie"] = cookie;
	const authz = headerList.get("authorization");
	if (authz) headerObject["authorization"] = authz;
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
	const submission = await fetchSubmission(submissionId);

	if (!submission) {
		notFound();
	}

	return (
		<div className="container mx-auto max-w-4xl py-10">
			<div className="flex items-center justify-between mb-6">
				<div>
					<p className="text-sm text-muted-foreground">编辑作品</p>
					<h1 className="text-2xl font-semibold">
						{submission.event.title}
					</h1>
				</div>
				<Button variant="ghost" asChild>
					<Link href={`/app/events/${eventId}/submissions`}>
						返回列表
					</Link>
				</Button>
			</div>
			<EventSubmissionForm
				eventId={eventId}
				eventTitle={submission.event.title}
				initialData={submission}
				mode="edit"
			/>
		</div>
	);
}
