"use client";
import { useSession } from "@/modules/dashboard/auth/hooks/use-session";
import { useTranslations } from "next-intl";
import { useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

// Local page components
import { EventLayout } from "./components/EventLayout";
import { HackathonContent } from "./components/HackathonContent";
import { MeetupContent } from "./components/MeetupContent";
import { BuildingPublicContent } from "./components/BuildingPublicContent";

// Local hooks
import {
	useEventEngagement,
	useEventProjectSubmissions,
	useEventRegistration,
	useUserFeedback,
	eventKeys,
} from "./hooks/useEventQueries";
import { useRegistrationStatus } from "./hooks/useRegistrationStatus";

// Types
import type { HackathonConfig, BuildingConfig } from "./types/event-types";

export interface EventDetailsProps {
	event: {
		id: string;
		title: string;
		description: string;
		type: string;
		status: string;
		startTime: string;
		endTime: string;
		timezone: string;
		isOnline: boolean;
		address?: string;
		onlineUrl?: string;
		isExternalEvent: boolean;
		externalUrl?: string;
		maxAttendees?: number;
		registrationDeadline?: string;
		requireApproval: boolean;
		requireProjectSubmission?: boolean;
		registrationSuccessInfo?: string;
		registrationSuccessImage?: string;
		registrationPendingInfo?: string;
		registrationPendingImage?: string;
		coverImage?: string;
		tags: string[];
		featured: boolean;
		viewCount: number;
		createdAt: string;
		isEventAdmin?: boolean;
		buildingConfig?: BuildingConfig;
		hackathonConfig?: HackathonConfig;
		organizer: {
			id: string;
			name: string;
			email: string;
			image?: string;
			username?: string;
			bio?: string;
			userRoleString?: string;
			city?: string;
		};
		organization?: {
			id: string;
			name: string;
			slug?: string;
			logo?: string;
		};
		registrations: Array<{
			id: string;
			status: string;
			registeredAt: string;
			user: {
				id: string;
				name: string;
				image?: string;
				username?: string;
				userRoleString?: string;
				currentWorkOn?: string;
				bio?: string;
				lifeStatus?: string;
				region?: string;
				skills?: string[];
				whatICanOffer?: string;
				whatIAmLookingFor?: string;
				showEmail?: boolean;
				email?: string;
				showWechat?: boolean;
				wechatId?: string;
				githubUrl?: string;
				twitterUrl?: string;
				websiteUrl?: string;
			};
		}>;
		questions: Array<{
			id: string;
			question: string;
			type: string;
			options: string[];
			required: boolean;
			order: number;
		}>;
		feedbacks: Array<{
			id: string;
			rating: number;
			comment?: string;
			suggestions?: string;
			wouldRecommend: boolean;
			createdAt: string;
			user: {
				id: string;
				name: string;
				image?: string;
				username?: string;
			};
		}>;
		_count: {
			registrations: number;
			checkIns: number;
		};
		ticketTypes: Array<{
			id: string;
			name: string;
			description?: string;
			price?: number;
			maxQuantity?: number;
			currentQuantity: number;
			isActive: boolean;
		}>;
		volunteerRoles?: Array<{
			id: string;
			recruitCount: number;
			isRequired: boolean;
			sopUrl?: string;
			wechatQrCode?: string;
			description?: string;
			volunteerRole: {
				id: string;
				name: string;
				description: string;
				detailDescription?: string;
				iconUrl?: string;
				cpPoints: number;
			};
			registrations: Array<{
				id: string;
				status: "APPLIED" | "APPROVED" | "REJECTED" | "CANCELLED";
				appliedAt: string;
				approvedAt?: string;
				note?: string;
				user: {
					id: string;
					name: string;
					image?: string;
					username?: string;
					userRoleString?: string;
					currentWorkOn?: string;
				};
			}>;
		}>;
		volunteerContactInfo?: string;
		volunteerWechatQrCode?: string;
		organizerContact?: string;
	};
}

const eventTypeColors: Record<string, string> = {
	MEETUP: "bg-green-100 text-green-800",
	HACKATHON: "bg-purple-100 text-purple-800",
	BUILDING_PUBLIC: "bg-orange-100 text-orange-800",
};

const getEventTypeLabels = (t: any): Record<string, string> => ({
	MEETUP: t("events.types.meetup"),
	HACKATHON: t("events.types.hackathon"),
	BUILDING_PUBLIC: t("events.types.buildingPublic"),
});

export function EventDetailsClient({ event }: EventDetailsProps) {
	const t = useTranslations();
	const router = useRouter();
	const pathname = usePathname();
	const { user } = useSession();
	const eventTypeLabels = getEventTypeLabels(t);

	// Registration status helpers - 使用新的双重状态判断
	const {
		existingRegistration,
		canRegister,
		getRegistrationStatusText,
		isEventEnded,
	} = useRegistrationStatus(event, user);

	// 检查用户是否应该被引导提交反馈
	const shouldPromptFeedback = () => {
		if (!user || !isEventEnded) return false;

		// 检查用户是否已经报名参加活动
		const hasRegistered =
			existingRegistration && existingRegistration.status === "APPROVED";
		if (!hasRegistered) return false;

		// 检查是否已经提交过反馈
		const hasSubmittedFeedback = event.feedbacks.some(
			(feedback) => feedback.user.id === user.id,
		);

		return !hasSubmittedFeedback;
	};

	// Engagement state needed for MeetupContent
	const { isBookmarked } = useEventEngagement(event.id, user?.id);

	// Event project submissions data
	const { projectSubmissions } = useEventProjectSubmissions(event.id);

	// User feedback data
	const { userFeedback, hasSubmittedFeedback } = useUserFeedback(
		event.id,
		user?.id,
	);

	// 温和的反馈提示 - 仅在页面加载时显示一次
	useEffect(() => {
		// 延迟3秒显示，避免干扰用户浏览
		const feedbackPromptTimer = setTimeout(() => {
			if (shouldPromptFeedback()) {
				toast.info("感谢您参与本次活动！期待您的宝贵反馈 💭", {
					duration: 5000,
					action: {
						label: "立即反馈",
						onClick: () => {
							// 触发反馈表单打开的逻辑会在下面的组件中处理
							// 这里只是一个温和的提示
						},
					},
				});
			}
		}, 3000);

		return () => clearTimeout(feedbackPromptTimer);
	}, [user?.id, isEventEnded]); // 依赖用户和活动状态，避免重复提示

	// Data refresh function
	const queryClient = useQueryClient();
	const handleDataRefresh = () => {
		queryClient.invalidateQueries({
			queryKey: eventKeys.detail(event.id),
		});
	};

	// Event registration mutations
	const {
		register,
		cancelRegistration,
		volunteerApply,
		isRegistering: isMutationRegistering,
	} = useEventRegistration(event.id, t);

	const handleRegister = async (openModal?: () => void) => {
		if (!user) {
			// 跳转到登录页，并带上当前页面的 URL 作为 redirectTo 参数
			const currentPath = pathname;
			router.push(
				`/auth/login?redirectTo=${encodeURIComponent(currentPath)}`,
			);
			return;
		}
		// If a modal opener is provided, use it (for mobile)
		if (openModal) {
			openModal();
		}
	};

	const handleVolunteerApply = async (eventVolunteerRoleId: string) => {
		if (!user) {
			// 跳转到登录页，并带上当前页面的 URL 作为 redirectTo 参数
			const currentPath = pathname;
			router.push(
				`/auth/login?redirectTo=${encodeURIComponent(currentPath)}`,
			);
			return;
		}
		volunteerApply(eventVolunteerRoleId);
	};

	const handleCancelRegistration = async () => {
		cancelRegistration();
	};

	const handleFeedbackSubmit = async (feedback: {
		rating: number;
		comment: string;
		suggestions: string;
		wouldRecommend: boolean;
	}) => {
		if (!user) {
			// 跳转到登录页，并带上当前页面的 URL 作为 redirectTo 参数
			const currentPath = pathname;
			router.push(
				`/auth/login?redirectTo=${encodeURIComponent(currentPath)}`,
			);
			return;
		}

		try {
			const method = "POST"; // Simplified for demo
			const url = `/api/events/${event.id}/feedback`;

			const response = await fetch(url, {
				method,
				headers: {
					"Content-Type": "application/json",
				},
				credentials: "include",
				body: JSON.stringify({
					rating: feedback.rating,
					comment: feedback.comment || undefined,
					suggestions: feedback.suggestions || undefined,
					wouldRecommend: feedback.wouldRecommend,
				}),
			});

			if (response.ok) {
				toast.success("反馈提交成功！感谢您的参与");
				queryClient.invalidateQueries({
					queryKey: eventKeys.detail(event.id),
				});
			} else {
				const errorData = await response.json();
				toast.error(errorData.error || "反馈提交失败");
			}
		} catch (error) {
			console.error("Error submitting feedback:", error);
			toast.error("反馈提交失败，请重试");
		}
	};

	return (
		<EventLayout
			event={event}
			user={user}
			showBackToEvents={true}
			showSidebar={true}
			showPhotos={event.type !== "HACKATHON"} // Hackathon events manage their own photo display
			containerClassName={
				event.type === "HACKATHON"
					? "container max-w-6xl pt-8 pb-24 md:pb-12 md:pb-safe-bottom"
					: "container max-w-6xl pt-8 pb-24 md:pb-12 pb-safe-bottom-mobile"
			}
			// Pass registration handler and modal opener to child components
			onRegister={handleRegister}
			onOpenRegistrationModal={() => {
				// This will be passed down to content components
			}}
		>
			{({
				openRegistrationModal,
				openQRGenerator,
				openSuccessInfo,
				openShareModal,
			}) => {
				switch (event.type) {
					case "HACKATHON":
						return (
							<HackathonContent
								event={{
									...event,
									richContent: event.description,
								}}
								currentUserId={user?.id}
								user={user}
								existingRegistration={existingRegistration}
								canRegister={canRegister}
								isRegistering={isMutationRegistering}
								getRegistrationStatusText={() =>
									getRegistrationStatusText(t)
								}
								handleRegister={handleRegister}
								handleCancelRegistration={
									handleCancelRegistration
								}
								onVolunteerApply={handleVolunteerApply}
								onDataRefresh={handleDataRefresh}
								onFeedbackSubmit={handleFeedbackSubmit}
								projectSubmissions={projectSubmissions}
								eventTypeColors={eventTypeColors}
								eventTypeLabels={eventTypeLabels}
								isBookmarked={isBookmarked}
								onOpenRegistrationModal={openRegistrationModal}
								onShowQRGenerator={openQRGenerator}
								onShowSuccessInfo={openSuccessInfo}
								onShowShare={openShareModal}
								existingFeedback={userFeedback}
								hasSubmittedFeedback={hasSubmittedFeedback}
							/>
						);
					case "BUILDING_PUBLIC":
						return (
							<BuildingPublicContent
								event={{
									...event,
									richContent: event.description,
								}}
								currentUserId={user?.id}
								eventRegistration={existingRegistration}
								registrationStatusText={getRegistrationStatusText(
									t,
								)}
								onOpenRegistration={() =>
									handleRegister(openRegistrationModal)
								}
								onDataRefresh={handleDataRefresh}
							/>
						);
					default:
						return (
							<MeetupContent
								event={event}
								user={user}
								existingRegistration={existingRegistration}
								canRegister={canRegister}
								isRegistering={isMutationRegistering}
								getRegistrationStatusText={() =>
									getRegistrationStatusText(t)
								}
								handleRegister={handleRegister}
								handleCancelRegistration={
									handleCancelRegistration
								}
								onVolunteerApply={handleVolunteerApply}
								onDataRefresh={handleDataRefresh}
								onFeedbackSubmit={handleFeedbackSubmit}
								projectSubmissions={projectSubmissions}
								eventTypeColors={eventTypeColors}
								eventTypeLabels={eventTypeLabels}
								isBookmarked={isBookmarked}
								onOpenRegistrationModal={openRegistrationModal}
								onShowQRGenerator={openQRGenerator}
								onShowSuccessInfo={openSuccessInfo}
								onShowShare={openShareModal}
								existingFeedback={userFeedback}
								hasSubmittedFeedback={hasSubmittedFeedback}
							/>
						);
				}
			}}
		</EventLayout>
	);
}
