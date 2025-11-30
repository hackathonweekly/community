"use client";

import { RegistrationSuccessModal } from "@/modules/public/events/components/registration-success-modal";
import { EventShareModal } from "@/modules/dashboard/events/components/EventShareModal";
import { QRGenerator } from "@/modules/dashboard/events/components/QRGenerator";
import {
	EventRegistrationCard,
	EventRegistrationModal,
} from "@/modules/public/events/components";
import { useTranslations } from "next-intl";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect, type ReactNode } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import ContactOrganizerDialog from "@/modules/public/events/components/ContactOrganizerDialog";
import { SimpleEventFeedbackDialog } from "@/modules/public/events/components/SimpleEventFeedbackDialog";

// Local page components
import { BackToEventsLink } from "./BackToEventsLink";
import { OrganizerCard } from "./OrganizerCard";
import { OrganizationCard } from "./OrganizationCard";
import { ManagementButton } from "./ManagementButton";
import { MobileEventBottomActions } from "./MobileEventBottomActions";
import { FixedBackButton } from "./FixedBackButton";

// Local hooks
import {
	useEventEngagement,
	useIncrementViewCount,
	useEventRegistration,
	useUserFeedback,
	useEventProjectSubmissions,
	eventKeys,
} from "../hooks/useEventQueries";
import { useRegistrationStatus } from "../hooks/useRegistrationStatus";

interface EventLayoutProps {
	event: {
		id: string;
		title: string;
		description: string;
		shortDescription?: string;
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
		buildingConfig?: any;
		hackathonConfig?: any;
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
	user?: any;
	children:
		| ReactNode
		| ((props: {
				openRegistrationModal: () => void;
				openQRGenerator: () => void;
				openSuccessInfo: () => void;
				openShareModal: () => void;
		  }) => ReactNode); // 支持函数形式的 children
	showBackToEvents?: boolean;
	showSidebar?: boolean;
	containerClassName?: string;
	onRegister?: (openModal?: () => void) => void;
	onOpenRegistrationModal?: () => void;
}

export function EventLayout({
	event,
	user,
	children,
	showBackToEvents = true,
	showSidebar = true,
	containerClassName = "container max-w-6xl pt-8 pb-24 md:pb-12",
	onRegister,
	onOpenRegistrationModal,
}: EventLayoutProps) {
	const t = useTranslations();
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const [showQRGenerator, setShowQRGenerator] = useState(false);
	const [showShareModal, setShowShareModal] = useState(false);
	const [showSuccessInfo, setShowSuccessInfo] = useState(false);
	const [showRegistrationForm, setShowRegistrationForm] = useState(false);
	const [inviteCode, setInviteCode] = useState<string | null>(null);
	const [isContactDialogOpen, setIsContactDialogOpen] = useState(false);
	const [isFeedbackDialogOpen, setIsFeedbackDialogOpen] = useState(false);

	const renderChildren = () => {
		if (typeof children !== "function") {
			return children;
		}

		return children({
			openRegistrationModal: () => setShowRegistrationForm(true),
			openQRGenerator: () => setShowQRGenerator(true),
			openSuccessInfo: () => setShowSuccessInfo(true),
			openShareModal: () => setShowShareModal(true),
		});
	};

	// Registration status helpers
	const {
		existingRegistration,
		isEventPast,
		isRegistrationClosed,
		isEventFull,
		canRegister,
		getRegistrationStatusText,
	} = useRegistrationStatus(event, user);

	// Check for registration success parameter in URL and auto-open success modal
	useEffect(() => {
		const registration = searchParams.get("registration");
		if (registration === "success" || registration === "pending") {
			// Wait a bit for data to refresh, then open the success modal
			const timer = setTimeout(() => {
				setShowSuccessInfo(true);
				// Clean up the URL parameter
				const url = new URL(window.location.href);
				url.searchParams.delete("registration");
				window.history.replaceState({}, "", url.toString());
			}, 300);
			return () => clearTimeout(timer);
		}
	}, [searchParams]);

	// Check for feedback anchor in URL
	useEffect(() => {
		const feedback = searchParams.get("feedback");
		if (feedback === "true") {
			if (!user) {
				// User is not logged in, show login prompt
				const timer = setTimeout(() => {
					toast.error(t("events.feedback.loginRequired"), {
						duration: 5000,
						action: {
							label: t("auth.login.submit"),
							onClick: () => {
								const currentPath = pathname;
								router.push(
									`/auth/login?redirectTo=${encodeURIComponent(currentPath)}`,
								);
							},
						},
					});
				}, 500);
				return () => clearTimeout(timer);
			}
			if (existingRegistration?.status === "APPROVED") {
				// User is logged in and approved, auto-click feedback button
				const timer = setTimeout(() => {
					const feedbackButtons = document.querySelectorAll(
						'[data-testid="feedback-button"], button[class*="feedback"]',
					);
					if (feedbackButtons.length > 0) {
						(feedbackButtons[0] as HTMLElement).click();
					}
				}, 500);
				return () => clearTimeout(timer);
			}
			if (user && !existingRegistration) {
				// User is logged in but not registered for the event
				const timer = setTimeout(() => {
					toast.error("您需要先报名参加活动才能提交反馈", {
						duration: 5000,
					});
				}, 500);
				return () => clearTimeout(timer);
			}
		}
	}, [searchParams, user, existingRegistration, t, pathname, router]);

	// Auto-open registration modal when redirected from check-in
	useEffect(() => {
		const openRegistration = searchParams.get("openRegistration");
		if (!openRegistration) return;

		const searchString = searchParams.toString();
		const targetPath = searchString
			? `${pathname}?${searchString}`
			: pathname;

		if (!user) {
			const timer = setTimeout(() => {
				router.push(
					`/auth/login?redirectTo=${encodeURIComponent(targetPath)}`,
				);
			}, 300);
			return () => clearTimeout(timer);
		}

		const timer = setTimeout(() => {
			setShowRegistrationForm(true);
			if (typeof window !== "undefined") {
				const url = new URL(window.location.href);
				url.searchParams.delete("openRegistration");
				window.history.replaceState({}, "", url.toString());
			}
		}, 300);

		return () => clearTimeout(timer);
	}, [searchParams, user, pathname, router]);

	useEffect(() => {
		if (typeof window === "undefined") {
			return;
		}

		const storageKey = `event-invite-${event.id}`;
		const inviteParam = searchParams.get("invite");

		if (inviteParam) {
			setInviteCode(inviteParam);
			try {
				window.localStorage.setItem(storageKey, inviteParam);
			} catch (error) {
				console.warn("Failed to persist invite code", error);
			}
			return;
		}

		try {
			const storedInvite = window.localStorage.getItem(storageKey);
			setInviteCode(storedInvite);
		} catch (error) {
			console.warn("Failed to read stored invite code", error);
			setInviteCode(null);
		}
	}, [event.id, searchParams]);

	// Increment view count on load
	useIncrementViewCount(event.id);

	// Engagement states (likes, bookmarks)
	const { isBookmarked, isLiked, likeCount, toggleBookmark, toggleLike } =
		useEventEngagement(event.id, user?.id);

	// User feedback data
	const { userFeedback, hasSubmittedFeedback } = useUserFeedback(
		event.id,
		user?.id,
	);

	// Event project submissions data
	const { projectSubmissions } = useEventProjectSubmissions(event.id);

	// Data refresh for volunteer applications
	const queryClient = useQueryClient();
	const handleDataRefresh = () => {
		queryClient.invalidateQueries({
			queryKey: eventKeys.detail(event.id),
		});
	};

	const canContactOrganizer = Boolean(
		event.organizerContact && !event.isExternalEvent,
	);
	const canShowFeedback = true;

	const [latestRegistration, setLatestRegistration] = useState<any>(null);

	// Event registration mutations
	const {
		cancelRegistration,
		volunteerApply,
		isRegistering: isMutationRegistering,
		isCancellingRegistration,
		isApplyingVolunteer,
	} = useEventRegistration(event.id, t);

	// 统一的注册处理函数
	const handleUnifiedRegister = () => {
		if (!user) {
			// 跳转到登录页，并带上当前页面的 URL 作为 redirectTo 参数
			const currentPath = pathname;
			router.push(
				`/auth/login?redirectTo=${encodeURIComponent(currentPath)}`,
			);
			return;
		}
		if (onRegister) {
			onRegister(() => setShowRegistrationForm(true));
		} else {
			// Fallback: directly open the modal
			setShowRegistrationForm(true);
		}
	};

	const handleRegistrationComplete = (registration: any) => {
		setLatestRegistration(registration);
		setShowSuccessInfo(true);
		toast.success(t("events.registrationSuccess"));
		handleDataRefresh();
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
		handleDataRefresh();
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
			const isUpdating = hasSubmittedFeedback;
			const method = isUpdating ? "PUT" : "POST";
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
				toast.success(
					isUpdating
						? "反馈修改成功！"
						: "反馈提交成功！感谢您的参与",
				);
				queryClient.invalidateQueries({
					queryKey: eventKeys.detail(event.id),
				});
				queryClient.invalidateQueries({
					queryKey: eventKeys.userFeedback(event.id, user.id),
				});
			} else {
				const errorData = await response.json();
				toast.error(
					errorData.error ||
						(isUpdating ? "反馈修改失败" : "反馈提交失败"),
				);
			}
		} catch (error) {
			console.error("Error submitting feedback:", error);
			toast.error("反馈提交失败，请重试");
		}
	};

	return (
		<div className={containerClassName}>
			{/* Fixed Back Button for Mobile */}
			<FixedBackButton />

			{/* Header */}
			{showBackToEvents && (
				<div className="flex items-center justify-between">
					<BackToEventsLink label={t("events.backToEventsList")} />
					<ManagementButton
						eventId={event.id}
						isEventAdmin={event.isEventAdmin || false}
					/>
				</div>
			)}

			<main>
				{/* Main Content - Layout depends on showSidebar */}
				{showSidebar ? (
					<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
						{/* Main Content */}
						<div className="lg:col-span-2 space-y-3">
							{renderChildren()}
						</div>

						{/* Sidebar - Desktop only */}
						<div className="hidden lg:block space-y-6">
							{/* Registration Card - Desktop: Show in sidebar */}
							<EventRegistrationCard
								event={event}
								user={user}
								existingRegistration={existingRegistration}
								canRegister={canRegister}
								pathname={pathname}
								onShowQRGenerator={() =>
									setShowQRGenerator(true)
								}
								onShowSuccessInfo={() =>
									setShowSuccessInfo(true)
								}
								onShowShare={() => setShowShareModal(true)}
								onFeedbackSubmit={handleFeedbackSubmit}
								hasSubmittedFeedback={hasSubmittedFeedback}
								onVolunteerApply={handleVolunteerApply}
								onDataRefresh={handleDataRefresh}
								onShowContact={() =>
									setIsContactDialogOpen(true)
								}
								onShowFeedback={() =>
									setIsFeedbackDialogOpen(true)
								}
							/>

							{/* Organization/Organizer Cards */}
							{event.organization ? (
								<>
									<OrganizationCard
										title={t("events.organization")}
										organization={event.organization}
									/>
									<OrganizerCard
										title={t("events.organizer")}
										organizer={event.organizer}
										showSubscription={false}
									/>
								</>
							) : (
								<OrganizerCard
									title={t("events.organizer")}
									organizer={event.organizer}
								/>
							)}
						</div>
					</div>
				) : (
					<div>{renderChildren()}</div>
				)}
			</main>

			{/* Modals - Always available */}
			{/* QR Generator Modal */}
			{showQRGenerator && user && existingRegistration && (
				<QRGenerator
					isOpen={showQRGenerator}
					onClose={() => setShowQRGenerator(false)}
					eventId={event.id}
					userId={user.id}
					eventTitle={event.title}
					userName={user.name || "Unknown User"}
				/>
			)}

			{/* Share Modal */}
			{showShareModal && (
				<EventShareModal
					isOpen={showShareModal}
					onClose={() => setShowShareModal(false)}
					eventId={event.id}
					eventTitle={event.title}
					event={{
						startTime: event.startTime,
						endTime: event.endTime,
						address: event.address,
						isOnline: event.isOnline,
						onlineUrl: event.onlineUrl,
						coverImage: event.coverImage,
						richContent: event.shortDescription || "",
					}}
				/>
			)}

			{/* Registration Success Info Modal */}
			{showSuccessInfo && (
				<RegistrationSuccessModal
					isOpen={showSuccessInfo}
					onClose={() => {
						setShowSuccessInfo(false);
						setLatestRegistration(null);
					}}
					eventTitle={event.title}
					successInfo={event.registrationSuccessInfo}
					successImage={event.registrationSuccessImage}
					requireApproval={event.requireApproval}
					registrationStatus={
						latestRegistration?.status ||
						existingRegistration?.status
					}
					pendingInfo={event.registrationPendingInfo}
					pendingImage={event.registrationPendingImage}
				/>
			)}

			{/* Feedback Share Modal */}

			{/* Registration Modal */}
			{showRegistrationForm && (
				<EventRegistrationModal
					isOpen={showRegistrationForm}
					onClose={() => setShowRegistrationForm(false)}
					event={event}
					inviteCode={inviteCode ?? undefined}
					onRegistrationComplete={handleRegistrationComplete}
				/>
			)}

			{/* Mobile Bottom Actions - Only show on mobile */}
			<MobileEventBottomActions
				event={event}
				user={user}
				existingRegistration={existingRegistration}
				canRegister={canRegister}
				onShowShare={() => setShowShareModal(true)}
				onShowQRGenerator={() => setShowQRGenerator(true)}
				onShowSuccessInfo={() => setShowSuccessInfo(true)}
				pathname={pathname}
				onShowFeedback={() => setIsFeedbackDialogOpen(true)}
				onShowContact={() => setIsContactDialogOpen(true)}
				hasSubmittedFeedback={hasSubmittedFeedback}
				canShowFeedback={canShowFeedback}
				canContactOrganizer={canContactOrganizer}
				projectSubmissions={projectSubmissions}
			/>

			{/* Cross-surface dialogs */}
			{!event.isExternalEvent && (
				<ContactOrganizerDialog
					open={isContactDialogOpen}
					onOpenChange={setIsContactDialogOpen}
					organizerName={event.organizer?.name}
					organizerUsername={event.organizer?.username}
					email={
						event.organizerContact
							? undefined
							: event.organizer?.email
					}
					contact={event.organizerContact}
					wechatQr={undefined}
				/>
			)}

			{canShowFeedback && (
				<SimpleEventFeedbackDialog
					open={isFeedbackDialogOpen}
					onOpenChange={setIsFeedbackDialogOpen}
					eventTitle={event.title}
					eventId={event.id}
					onSubmit={handleFeedbackSubmit}
					existingFeedback={userFeedback}
					isEditing={hasSubmittedFeedback}
				/>
			)}
		</div>
	);
}
