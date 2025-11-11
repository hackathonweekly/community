"use client";

import {
	EventDescription,
	EventInfoCard,
	EventHero,
} from "@/modules/public/events/components";

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

			{/* Description */}
			<EventDescription richContent={event.richContent || ""} />
		</>
	);
}
