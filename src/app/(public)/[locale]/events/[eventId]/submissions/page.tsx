import { notFound } from "next/navigation";
import { getEventById } from "@/lib/database";
import { EventSubmissionsGallery } from "@/modules/public/events/submissions/EventSubmissionsGallery";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface PageProps {
	params: Promise<{ locale: string; eventId: string }>;
}

export default async function PublicSubmissionsPage({ params }: PageProps) {
	const { locale, eventId } = await params;
	const event = await getEventById(eventId);
	if (!event) {
		notFound();
	}

	// Get hackathon stage
	const hackathonStage =
		event.type === "HACKATHON"
			? (event as any)?.hackathonConfig?.stage?.current
			: null;

	// Only show ranks and exact vote counts in the final results stage
	const isResultsStage = hackathonStage === "RESULTS";

	// Only allow voting during VOTING stage
	const isVotingOpen = hackathonStage === "VOTING";

	return (
		<div className="container mx-auto max-w-6xl py-10 space-y-6">
			<div className="flex items-center gap-3">
				<Button variant="ghost" asChild>
					<Link
						href={`/${locale}/events/${eventId}`}
						aria-label="返回活动"
					>
						<span className="inline-flex items-center gap-2">
							<ArrowLeft className="h-4 w-4" />
							返回活动
						</span>
					</Link>
				</Button>
				<h1 className="text-3xl font-semibold">{event.title}</h1>
			</div>
			<EventSubmissionsGallery
				eventId={eventId}
				locale={locale}
				showResults={isResultsStage}
				isVotingOpen={isVotingOpen}
			/>
		</div>
	);
}
