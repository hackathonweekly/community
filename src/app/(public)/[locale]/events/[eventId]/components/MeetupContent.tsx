"use client";

import {
	EventDescription,
	EventInfoCard,
	EventHero,
} from "@/modules/public/events/components";
import { isEventSubmissionsEnabled } from "@/features/event-submissions/utils/is-event-submissions-enabled";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { LayoutGrid } from "lucide-react";
import { useLocale } from "next-intl";

interface MeetupContentProps {
	event: any;
	user?: any;
	existingRegistration?: any;
	canRegister: boolean;
	isRegistering: boolean;
	getRegistrationStatusText: () => string;
	handleRegister: (openModal?: () => void) => void;
	handleCancelRegistration: () => void;
	onVolunteerApply: (eventVolunteerRoleId: string) => void;
	onDataRefresh: () => void;
	onFeedbackSubmit?: (feedback: {
		rating: number;
		comment: string;
		suggestions: string;
		wouldRecommend: boolean;
	}) => void;
	projectSubmissions?: any[];
	eventTypeColors: Record<string, string>;
	eventTypeLabels: Record<string, string>;
	isBookmarked: boolean;
	onOpenRegistrationModal?: () => void;
	// 新增的移动端需要的处理函数
	onShowQRGenerator?: () => void;
	onShowSuccessInfo?: () => void;
	onShowShare?: () => void;
	hasSubmittedFeedback?: boolean;
}

export function MeetupContent({
	event,
	user,
	projectSubmissions,
	eventTypeColors,
	eventTypeLabels,
	isBookmarked,
}: MeetupContentProps) {
	const locale = useLocale();
	const submissionsEnabled = isEventSubmissionsEnabled(event);
	const publicSubmissionsUrl = `/${locale}/events/${event.id}/submissions`;

	return (
		<>
			{/* Hero Section */}
			<EventHero
				event={event}
				user={user}
				eventTypeColors={eventTypeColors}
				eventTypeLabels={eventTypeLabels}
				isBookmarked={isBookmarked}
			/>

			{/* Event Info Card */}
			<EventInfoCard
				event={{
					...event,
					registrations: event.registrations,
				}}
				currentUserId={user?.id}
				projectSubmissions={projectSubmissions}
			/>

			{submissionsEnabled && (
				<div className="flex flex-wrap gap-3 mb-8">
					<Link href={publicSubmissionsUrl}>
						<Button variant="outline" className="gap-2">
							<LayoutGrid className="w-4 h-4" />
							作品广场
						</Button>
					</Link>
				</div>
			)}

			{/* Description */}
			<EventDescription richContent={event.richContent || ""} />
		</>
	);
}
