"use client";

import { useOptionalSession } from "@dashboard/auth/hooks/use-session";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { type MouseEvent, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { eventKeys } from "@/app/(public)/[locale]/events/[eventId]/hooks/useEventQueries";
import {
	useEventEngagement,
	useEventPhotos,
	useEventProjectSubmissions,
	useEventRegistration,
	useIncrementViewCount,
	useUserFeedback,
} from "@/app/(public)/[locale]/events/[eventId]/hooks/useEventQueries";
import { useRegistrationStatus } from "@/app/(public)/[locale]/events/[eventId]/hooks/useRegistrationStatus";
import { isEventSubmissionsEnabled } from "@/features/event-submissions/utils/is-event-submissions-enabled";
import { EventShareModal } from "@/modules/dashboard/events/components/EventShareModal";
import { QRGenerator } from "@/modules/dashboard/events/components/QRGenerator";
import { EventRegistrationModal } from "@/modules/public/events/components";
import ContactOrganizerDialog from "@/modules/public/events/components/ContactOrganizerDialog";
import { SimpleEventFeedbackDialog } from "@/modules/public/events/components/SimpleEventFeedbackDialog";
import { RegistrationSuccessModal } from "@/modules/public/events/components/registration-success-modal";

import { Hero } from "./components/Hero";
import { AnchorNav } from "./components/common/AnchorNav";
import { MobileCTA } from "./components/common/MobileCTA";
import { AlbumSection } from "./components/sections/AlbumSection";
import { AwardsSection } from "./components/sections/AwardsSection";
import { FeedbackSection } from "./components/sections/FeedbackSection";
import { HostsSection } from "./components/sections/HostsSection";
import { IntroSection } from "./components/sections/IntroSection";
import { ParticipantsSection } from "./components/sections/ParticipantsSection";
import { RegistrationSection } from "./components/sections/RegistrationSection";
import { VolunteersSection } from "./components/sections/VolunteersSection";
import { WorksSection } from "./components/sections/WorksSection";
import type { EventData } from "./components/types";

type NewEventClientProps = {
	event: EventData;
	locale?: string;
};

export function NewEventPageClient({
	event,
	locale = "zh",
}: NewEventClientProps) {
	const t = useTranslations();
	const { user, loaded } = useOptionalSession();
	const pathname = usePathname();
	const router = useRouter();
	const searchParams = useSearchParams();
	const queryClient = useQueryClient();

	const submissionsEnabled = isEventSubmissionsEnabled(event as any);

	useIncrementViewCount(event.id);

	const { projectSubmissions } = useEventProjectSubmissions(event.id);
	const { photos = [] } = useEventPhotos(event.id, t);
	const { isBookmarked, isLiked, likeCount, toggleBookmark, toggleLike } =
		useEventEngagement(event.id, user?.id);
	const { userFeedback, hasSubmittedFeedback } = useUserFeedback(
		event.id,
		user?.id,
	);
	const { cancelRegistration, volunteerApply } = useEventRegistration(
		event.id,
		t,
	);
	const {
		existingRegistration,
		canRegister,
		isEventEnded,
		isRegistrationClosed,
		isEventFull,
	} = useRegistrationStatus(event, user);

	const [showRegistrationForm, setShowRegistrationForm] = useState(false);
	const [showShareModal, setShowShareModal] = useState(false);
	const [showSuccessInfo, setShowSuccessInfo] = useState(false);
	const [showQRGenerator, setShowQRGenerator] = useState(false);
	const [showParticipantsDialog, setShowParticipantsDialog] = useState(false);
	const [isContactDialogOpen, setIsContactDialogOpen] = useState(false);
	const [isFeedbackDialogOpen, setIsFeedbackDialogOpen] = useState(false);
	const [inviteCode, setInviteCode] = useState<string | null>(null);
	const [latestRegistration, setLatestRegistration] = useState<any>(null);

	const hasImportantInfo = Boolean(
		event.registrationSuccessInfo ||
			event.registrationSuccessImage ||
			event.registrationPendingInfo ||
			event.registrationPendingImage,
	);
	const canViewSuccessInfo = Boolean(
		event.isExternalEvent ||
			(latestRegistration && latestRegistration.status !== "CANCELLED") ||
			(existingRegistration &&
				existingRegistration.status !== "CANCELLED"),
	);

	const registrationDisabledReason = useMemo(() => {
		if (event.isExternalEvent) return null;
		if (isEventEnded) return "活动已结束";
		if (isRegistrationClosed) return "报名已截止";
		if (isEventFull) return "名额已满";
		return null;
	}, [
		event.isExternalEvent,
		isEventEnded,
		isRegistrationClosed,
		isEventFull,
	]);

	const registerDisabled = useMemo(
		() =>
			event.isExternalEvent
				? false
				: Boolean(
						(!existingRegistration ||
							existingRegistration.status === "CANCELLED") &&
							(isEventEnded ||
								isRegistrationClosed ||
								isEventFull),
					),
		[
			event.isExternalEvent,
			isEventEnded,
			isRegistrationClosed,
			isEventFull,
			existingRegistration,
		],
	);

	// 处理 URL 中的注册成功提示
	useEffect(() => {
		const registration = searchParams.get("registration");
		if (registration === "success" || registration === "pending") {
			const timer = setTimeout(() => {
				setShowSuccessInfo(true);
				const url = new URL(window.location.href);
				url.searchParams.delete("registration");
				window.history.replaceState({}, "", url.toString());
			}, 300);
			return () => clearTimeout(timer);
		}
	}, [searchParams]);

	// 处理从签到页面跳回需要立即报名的情况
	useEffect(() => {
		const openRegistration = searchParams.get("openRegistration");
		if (!openRegistration) return;
		if (!loaded) return;

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
			const url = new URL(window.location.href);
			url.searchParams.delete("openRegistration");
			window.history.replaceState({}, "", url.toString());
		}, 300);

		return () => clearTimeout(timer);
	}, [searchParams, user, loaded, pathname, router]);

	// URL 带 feedback 参数时提示用户或直接打开反馈弹窗
	useEffect(() => {
		const feedback = searchParams.get("feedback");
		if (feedback !== "true" || !loaded) return;

		const searchString = searchParams.toString();
		const targetPath = searchString
			? `${pathname}?${searchString}`
			: pathname;

		if (!user) {
			toast.error("请先登录再提交反馈", {
				action: {
					label: "去登录",
					onClick: () => {
						router.push(
							`/auth/login?redirectTo=${encodeURIComponent(targetPath)}`,
						);
					},
				},
			});
			return;
		}

		if (existingRegistration?.status === "APPROVED") {
			setIsFeedbackDialogOpen(true);
		} else {
			toast.error("报名后才可提交反馈");
		}
	}, [
		searchParams,
		loaded,
		user,
		existingRegistration?.status,
		pathname,
		router,
	]);

	// 邀请码缓存
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

	const handleDataRefresh = () => {
		queryClient.invalidateQueries({
			queryKey: eventKeys.detail(event.id),
		});
	};

	const buildRedirectTarget = () => {
		const searchString = searchParams.toString();
		return searchString ? `${pathname}?${searchString}` : pathname;
	};

	const redirectToLogin = (redirectTo?: string) => {
		const targetPath = redirectTo ?? buildRedirectTarget();
		router.push(`/auth/login?redirectTo=${encodeURIComponent(targetPath)}`);
	};

	const handleRegister = (
		openModalOrEvent?:
			| (() => void)
			| MouseEvent<HTMLButtonElement, globalThis.MouseEvent>,
	) => {
		const openModal =
			typeof openModalOrEvent === "function"
				? openModalOrEvent
				: undefined;

		const searchString = searchParams.toString();
		const targetPath = searchString
			? `${pathname}?${searchString}`
			: pathname;

		if (event.isExternalEvent && event.externalUrl) {
			window.open(event.externalUrl, "_blank", "noopener noreferrer");
			return;
		}
		if (!user) {
			redirectToLogin(targetPath);
			return;
		}
		if (
			existingRegistration &&
			existingRegistration.status !== "CANCELLED"
		) {
			if (existingRegistration.status === "APPROVED") {
				setShowQRGenerator(true);
			} else {
				setShowSuccessInfo(true);
			}
			return;
		}
		if (isEventEnded) {
			toast.error("活动已结束，无法报名");
			return;
		}
		if (isRegistrationClosed) {
			toast.error("报名已截止");
			return;
		}
		if (isEventFull) {
			toast.error("名额已满");
			return;
		}
		if (openModal) {
			openModal();
			return;
		}
		setShowRegistrationForm(true);
	};

	const handleSubmitWork = () => {
		if (!loaded) return;

		if (!user) {
			const params = new URLSearchParams(searchParams.toString());
			params.set("openRegistration", "true");
			const targetPath = params.toString()
				? `${pathname}?${params.toString()}`
				: pathname;
			redirectToLogin(targetPath);
			return;
		}

		if (existingRegistration?.status === "APPROVED") {
			const getSubmissionOwnerId = (submission?: any) =>
				submission?.submitter?.id ??
				submission?.user?.id ??
				submission?.submitterId ??
				submission?.userId ??
				null;
			const hasUserSubmitted = projectSubmissions
				? projectSubmissions.some(
						(submission: any) =>
							getSubmissionOwnerId(submission) === user.id,
					)
				: false;
			const route = hasUserSubmitted
				? `/app/events/${event.id}/submissions`
				: `/app/events/${event.id}/submissions/new`;
			router.push(route);
			return;
		}

		handleRegister(() => setShowRegistrationForm(true));
	};

	const handleRegistrationComplete = (registration: any) => {
		setLatestRegistration(registration);
		setShowSuccessInfo(true);
		toast.success("报名成功！");
		handleDataRefresh();
	};

	const handleShowSuccessInfo = () => {
		if (!canViewSuccessInfo) {
			toast.error(
				t("events.registrationSuccessInfo.requiresRegistration"),
			);
			return;
		}
		setShowSuccessInfo(true);
	};

	const handleCancelRegistration = () => {
		cancelRegistration(undefined, { onSuccess: handleDataRefresh });
	};

	const handleVolunteerApply = (eventVolunteerRoleId: string) => {
		if (!user) {
			const searchString = searchParams.toString();
			const targetPath = searchString
				? `${pathname}?${searchString}`
				: pathname;
			redirectToLogin(targetPath);
			return;
		}
		volunteerApply(eventVolunteerRoleId, {
			onSuccess: handleDataRefresh,
		});
	};

	const handleFeedbackSubmit = async (feedback: {
		rating: number;
		comment: string;
		suggestions: string;
		wouldRecommend: boolean;
	}) => {
		if (!user) {
			redirectToLogin();
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
				toast.success(isUpdating ? "反馈修改成功" : "反馈提交成功");
				queryClient.invalidateQueries({
					queryKey: eventKeys.detail(event.id),
				});
				queryClient.invalidateQueries({
					queryKey: eventKeys.userFeedback(event.id, user.id),
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

	const registerLabel = useMemo(() => {
		if (event.isExternalEvent && event.externalUrl) return "前往报名";
		if (!user) return "登录后报名";
		if (registrationDisabledReason) return registrationDisabledReason;
		if (existingRegistration) {
			switch (existingRegistration.status) {
				case "APPROVED":
					return "查看门票";
				case "PENDING":
					return "审核中";
				case "WAITLISTED":
					return "等待中";
				default:
					return "重新报名";
			}
		}
		return canRegister ? "立即报名" : "暂不可报名";
	}, [
		canRegister,
		event.externalUrl,
		event.isExternalEvent,
		existingRegistration,
		registrationDisabledReason,
		user,
	]);

	const awards = event.hackathonConfig?.awards || [];

	const resourcesGroups = event.hackathonConfig?.resources
		? [
				{
					title: "学习资料",
					items: event.hackathonConfig.resources.tutorials || [],
				},
				{
					title: "工具推荐",
					items: event.hackathonConfig.resources.tools || [],
				},
				{
					title: "示例",
					items: event.hackathonConfig.resources.examples || [],
				},
			].filter((group) => group.items.length > 0)
		: [];

	const volunteerRoles = event.volunteerRoles ?? [];
	const volunteerStatuses = useMemo(
		() =>
			volunteerRoles.reduce<Record<string, string | null>>(
				(acc, role) => {
					const registration = role.registrations?.find(
						(r) =>
							r.user.id === user?.id && r.status !== "CANCELLED",
					);
					acc[role.id] = registration?.status ?? null;
					return acc;
				},
				{},
			),
		[volunteerRoles, user?.id],
	);

	const enabledAnchors = [
		{
			id: "registration",
			label: "我的票夹",
			show: !!existingRegistration,
		},
		{ id: "intro", label: "介绍" },
		{
			id: "awards",
			label: "奖项",
			show: awards.length > 0 || resourcesGroups.length > 0,
		},
		{
			id: "works",
			label: "作品",
			show: true,
		},
		{
			id: "participants",
			label: "报名者",
			show: true,
		},
		{ id: "album", label: "相册", show: photos.length > 0 },
		{
			id: "volunteers",
			label: "志愿者",
			show:
				volunteerRoles.length > 0 ||
				Boolean(event.volunteerContactInfo) ||
				Boolean(event.volunteerWechatQrCode),
		},
		{ id: "feedback", label: "反馈", show: !event.isExternalEvent },
	]
		.filter((anchor) => anchor.show ?? true)
		.map(({ id, label }) => ({ id, label }));

	const hasVolunteerSection =
		volunteerRoles.length > 0 ||
		Boolean(event.volunteerContactInfo) ||
		Boolean(event.volunteerWechatQrCode);

	const canCancel =
		!!existingRegistration &&
		["APPROVED", "PENDING", "WAITLISTED"].includes(
			existingRegistration.status,
		);

	const canContactOrganizer =
		!event.isExternalEvent &&
		Boolean(event.organizerContact || event.organizer?.email);
	const canShowFeedback = !event.isExternalEvent;

	const handleBookmark = () => {
		if (!user) {
			redirectToLogin();
			return;
		}
		toggleBookmark();
	};

	const handleLike = () => {
		if (!user) {
			redirectToLogin();
			return;
		}
		toggleLike();
	};

	const handleOpenContact = () => {
		if (!canContactOrganizer) return;
		setIsContactDialogOpen(true);
	};

	const handleOpenFeedback = () => {
		if (!canShowFeedback) return;
		if (!loaded) return;

		if (!user) {
			toast.error("请先登录再提交反馈", {
				action: {
					label: "去登录",
					onClick: () => redirectToLogin(),
				},
			});
			return;
		}

		if (existingRegistration?.status !== "APPROVED") {
			toast.error("报名通过后才可提交反馈");
			return;
		}

		setIsFeedbackDialogOpen(true);
	};

	return (
		<div className="min-h-screen bg-slate-50 pb-20 lg:pb-0">
			<Hero
				event={event}
				locale={locale}
				registerLabel={registerLabel}
				onRegister={handleRegister}
				onSubmitWork={handleSubmitWork}
				canCancel={canCancel}
				onCancel={handleCancelRegistration}
				onShare={() => setShowShareModal(true)}
				onToggleBookmark={handleBookmark}
				onToggleLike={handleLike}
				isBookmarked={isBookmarked}
				isLiked={isLiked}
				likeCount={likeCount}
				registerDisabled={registerDisabled}
				isEventAdmin={event.isEventAdmin}
				eventId={event.id}
				currentUserId={user?.id}
				projectSubmissions={projectSubmissions}
				isDialogOpen={showParticipantsDialog}
				onDialogChange={setShowParticipantsDialog}
			/>

			<AnchorNav anchors={enabledAnchors} />

			<div className="container max-w-6xl py-10 space-y-10">
				<div className="space-y-8">
					<RegistrationSection
						event={event}
						locale={locale}
						existingRegistration={existingRegistration}
						registerLabel={registerLabel}
						registerDisabled={registerDisabled}
						onRegister={() =>
							handleRegister(() => setShowRegistrationForm(true))
						}
						onCancel={handleCancelRegistration}
						onShowQR={() => setShowQRGenerator(true)}
						onShowShare={() => setShowShareModal(true)}
						onShowSuccessInfo={handleShowSuccessInfo}
						onContact={handleOpenContact}
						onFeedback={handleOpenFeedback}
						canContact={canContactOrganizer}
						canFeedback={canShowFeedback}
						canCancel={canCancel}
						registrationDisabledReason={registrationDisabledReason}
						isEventEnded={isEventEnded}
						isRegistrationClosed={isRegistrationClosed}
						isEventFull={isEventFull}
					/>

					<IntroSection event={event} />

					<HostsSection
						event={event}
						canContactOrganizer={canContactOrganizer}
					/>

					{(awards.length > 0 || resourcesGroups.length > 0) && (
						<AwardsSection
							awards={awards}
							resourcesGroups={resourcesGroups}
						/>
					)}

					<WorksSection
						projectSubmissions={projectSubmissions}
						locale={locale}
						eventId={event.id}
						userId={user?.id}
						onRequireLogin={redirectToLogin}
						onSubmitWork={handleSubmitWork}
						enabled={submissionsEnabled}
					/>

					<ParticipantsSection
						event={event}
						currentUserId={user?.id}
						projectSubmissions={projectSubmissions}
						onRequireLogin={() => redirectToLogin()}
						isDialogOpen={showParticipantsDialog}
						onDialogChange={setShowParticipantsDialog}
					/>

					{photos.length > 0 ? (
						<AlbumSection
							photos={photos}
							locale={locale}
							eventId={event.id}
						/>
					) : null}

					{hasVolunteerSection ? (
						<VolunteersSection
							event={event}
							volunteerRoles={volunteerRoles}
							volunteerStatuses={volunteerStatuses}
							onApply={handleVolunteerApply}
						/>
					) : null}

					{canContactOrganizer || canShowFeedback ? (
						<FeedbackSection
							onContact={handleOpenContact}
							onFeedback={handleOpenFeedback}
							canContact={canContactOrganizer}
							canFeedback={canShowFeedback}
							onShare={() => setShowShareModal(true)}
						/>
					) : null}
				</div>
			</div>

			<MobileCTA
				locale={locale}
				eventId={event.id}
				isEventAdmin={event.isEventAdmin}
				submissionsEnabled={submissionsEnabled}
				registerLabel={registerLabel}
				onRegister={() =>
					handleRegister(() => setShowRegistrationForm(true))
				}
				onShowSuccessInfo={handleShowSuccessInfo}
				onCancel={handleCancelRegistration}
				onShare={() => setShowShareModal(true)}
				onFeedback={handleOpenFeedback}
				onContact={handleOpenContact}
				onShowQR={() => setShowQRGenerator(true)}
				canCancel={canCancel}
				hasPhotos={photos.length > 0}
				registerDisabled={registerDisabled}
				canShowQr={existingRegistration?.status === "APPROVED"}
				canContact={canContactOrganizer}
				canFeedback={canShowFeedback}
				hasImportantInfo={hasImportantInfo}
			/>

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
						richContent: event.description || "",
					}}
				/>
			)}

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

			{showRegistrationForm && (
				<EventRegistrationModal
					isOpen={showRegistrationForm}
					onClose={() => setShowRegistrationForm(false)}
					event={event}
					inviteCode={inviteCode ?? undefined}
					onRegistrationComplete={handleRegistrationComplete}
				/>
			)}

			{canContactOrganizer && (
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
