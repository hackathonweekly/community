"use client";

import { usePathname } from "next/navigation";
import {
	EventDescription,
	EventInfoCard,
	EventHero,
	EventRegistrationCard,
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
	existingFeedback?: {
		rating: number;
		comment?: string;
		suggestions?: string;
		wouldRecommend: boolean;
	} | null;
	hasSubmittedFeedback?: boolean;
}

export function MeetupContent({
	event,
	user,
	existingRegistration,
	canRegister,
	isRegistering,
	getRegistrationStatusText,
	handleRegister,
	handleCancelRegistration,
	onVolunteerApply,
	onDataRefresh,
	onFeedbackSubmit,
	projectSubmissions,
	eventTypeColors,
	eventTypeLabels,
	isBookmarked,
	onOpenRegistrationModal,
	// 新增的移动端处理函数
	onShowQRGenerator,
	onShowSuccessInfo,
	onShowShare,
	existingFeedback,
	hasSubmittedFeedback,
}: MeetupContentProps) {
	const pathname = usePathname();

	const handleRegistrationClick = () => {
		handleRegister(onOpenRegistrationModal);
	};

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

			{/* Mobile Registration Card - placed after event info for small screens */}
			<div className="lg:hidden">
				<EventRegistrationCard
					event={event}
					user={user}
					existingRegistration={existingRegistration}
					canRegister={canRegister}
					pathname={pathname}
					onShowQRGenerator={() => onShowQRGenerator?.()}
					onShowSuccessInfo={() => onShowSuccessInfo?.()}
					onShowShare={() => onShowShare?.()}
					onFeedbackSubmit={onFeedbackSubmit}
					existingFeedback={existingFeedback}
					hasSubmittedFeedback={hasSubmittedFeedback}
					onVolunteerApply={onVolunteerApply}
					onDataRefresh={onDataRefresh}
				/>
			</div>

			{/* Description */}
			<EventDescription richContent={event.richContent || ""} />
		</>
	);
}
