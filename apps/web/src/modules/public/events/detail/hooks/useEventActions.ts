"use client";

import type { MouseEvent } from "react";
import { toast } from "sonner";
import { eventKeys } from "./useEventQueries";
import type { useEventDetailsState } from "./useEventDetailsState";

type State = ReturnType<typeof useEventDetailsState>;

interface EventLike {
	id: string;
	isExternalEvent: boolean;
	externalUrl?: string;
	organizerContact?: string;
	organizer?: { email?: string };
}

export function useEventActions(event: EventLike, state: State) {
	const {
		t,
		user,
		loaded,
		pathname,
		router,
		searchParams,
		queryClient,
		projectSubmissions,
		existingRegistration,
		isEventEnded,
		isRegistrationClosed,
		isEventFull,
		hasImportantInfo,
		canViewSuccessInfo,
		hasSubmittedFeedback,
		cancelRegistration,
		volunteerApply,
		canContactOrganizer,
		canShowFeedback,
		toggleBookmark,
		toggleLike,
		// Setters
		setShowRegistrationForm,
		setShowSuccessInfo,
		setShowQRGenerator,
		setIsContactDialogOpen,
		setIsFeedbackDialogOpen,
		setLatestRegistration,
		setActiveTab,
		setIsLoginRedirecting,
		loginRedirectTimerRef,
		tabsRef,
		// Helpers
		redirectToLogin,
		handleDataRefresh,
	} = state;

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
			if (loginRedirectTimerRef.current) {
				window.clearTimeout(loginRedirectTimerRef.current);
			}
			setIsLoginRedirecting(true);
			loginRedirectTimerRef.current = window.setTimeout(() => {
				setIsLoginRedirecting(false);
			}, 4000);
			redirectToLogin(targetPath);
			return;
		}
		if (
			existingRegistration &&
			existingRegistration.status !== "CANCELLED"
		) {
			if (existingRegistration.status === "APPROVED") {
				if (hasImportantInfo) {
					setShowSuccessInfo(true);
				} else {
					setShowQRGenerator(true);
				}
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
				? `/events/${event.id}/submissions`
				: `/events/${event.id}/submissions/new`;
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

	const handleViewParticipants = () => {
		if (!user) {
			redirectToLogin();
			return;
		}
		setActiveTab("participants");
		if (tabsRef.current) {
			tabsRef.current.scrollIntoView({
				behavior: "smooth",
				block: "start",
			});
		}
	};

	const handleShareCopyLink = async () => {
		const url =
			typeof window !== "undefined"
				? `${window.location.origin}/events/${event.id}`
				: `/events/${event.id}`;
		try {
			await navigator.clipboard.writeText(url);
			toast.success("链接已复制");
		} catch {
			toast.error("复制失败，请手动复制");
		}
	};

	return {
		handleRegister,
		handleSubmitWork,
		handleRegistrationComplete,
		handleShowSuccessInfo,
		handleCancelRegistration,
		handleVolunteerApply,
		handleFeedbackSubmit,
		handleBookmark,
		handleLike,
		handleOpenContact,
		handleOpenFeedback,
		handleViewParticipants,
		handleShareCopyLink,
	};
}
