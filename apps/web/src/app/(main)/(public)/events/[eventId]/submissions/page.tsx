import { notFound } from "next/navigation";
import { getEventById } from "@community/lib-server/database";
import { EventSubmissionsGallery } from "@/modules/public/events/submissions/EventSubmissionsGallery";
import Link from "next/link";
import { Button } from "@community/ui/ui/button";
import { ArrowLeft, Presentation } from "lucide-react";
import { SubmissionsActionButton } from "@/modules/public/events/submissions/SubmissionsActionButton";
import { ShareSubmissionsDialog } from "@/modules/public/events/submissions/ShareSubmissionsDialog";
import { isEventSubmissionsEnabled } from "@/features/event-submissions/utils/is-event-submissions-enabled";

interface PageProps {
	params: Promise<{ eventId: string }>;
}

export default async function PublicSubmissionsPage({ params }: PageProps) {
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

	const now = new Date();
	const startTime = new Date(event.startTime);
	const endTime = new Date(event.endTime);
	const isEventStarted = now >= startTime;
	const isEventEnded = now >= endTime || event.status === "COMPLETED";
	const isSubmissionOpen =
		(event.submissionsOpen ?? true) && isEventStarted && !isEventEnded;

	// Whether the public gallery shows vote counts and live standings
	const showVotesOnGallery =
		event.type === "HACKATHON"
			? Boolean((event as any)?.showVotesOnGallery ?? true)
			: false;
	// 关闭投票时展示最终结果；打开投票时展示实时榜单但不暴露最终排名
	const showResults = !isVotingOpen;

	return (
		<div className="container mx-auto max-w-7xl pt-6 pb-10 space-y-6">
			<div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
				<div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
					<Button
						variant="ghost"
						size="sm"
						asChild
						className="-ml-2 self-start"
					>
						<Link href={`/events/${eventId}`} aria-label="返回活动">
							<span className="inline-flex items-center gap-2">
								<ArrowLeft className="h-4 w-4" />
								<span className="hidden xs:inline">
									返回活动
								</span>
							</span>
						</Link>
					</Button>
					<h1 className="text-xl sm:text-2xl md:text-3xl font-semibold line-clamp-2 break-words">
						{event.title}
					</h1>
				</div>

				<div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-end">
					<Button
						asChild
						variant="outline"
						size="lg"
						className="gap-2"
					>
						<Link href={`/events/${eventId}/submissions/slides`}>
							<Presentation className="h-4 w-4" />
							投屏模式
						</Link>
					</Button>
					<ShareSubmissionsDialog />
					<SubmissionsActionButton
						eventId={eventId}
						isSubmissionOpen={isSubmissionOpen}
						size="lg"
						className="hidden md:inline-flex"
					/>
				</div>
			</div>
			<EventSubmissionsGallery
				eventId={eventId}
				showResults={showResults}
				isVotingOpen={isVotingOpen}
				showVotesOnGallery={showVotesOnGallery}
				isSubmissionOpen={isSubmissionOpen}
				showInlineSubmissionCta
			/>
		</div>
	);
}
