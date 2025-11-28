import { notFound } from "next/navigation";
import { getEventById } from "@/lib/database";
import { EventSubmissionForm } from "@/modules/dashboard/events/components/submissions/EventSubmissionForm";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface PageProps {
	params: Promise<{ eventId: string }>;
}

export default async function NewSubmissionPage({ params }: PageProps) {
	const { eventId } = await params;
	const event = await getEventById(eventId);

	if (!event) {
		notFound();
	}

	return (
		<div className="container mx-auto max-w-4xl py-10">
			<div className="flex items-center justify-between mb-6">
				<div>
					<p className="text-sm text-muted-foreground">提交作品</p>
					<h1 className="text-2xl font-semibold">{event.title}</h1>
				</div>
				<Button variant="ghost" asChild>
					<Link href={`/events/${eventId}`}>返回活动主页</Link>
				</Button>
			</div>
			<EventSubmissionForm eventId={eventId} eventTitle={event.title} />
		</div>
	);
}
