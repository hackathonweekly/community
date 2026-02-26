"use client";

import { useOptionalSession } from "@shared/auth/hooks/use-session";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { isEventSubmissionsEnabled } from "@/features/event-submissions/utils/is-event-submissions-enabled";
import { eventKeys } from "./useEventQueries";
import {
	useEventEngagement,
	useEventPhotos,
	useEventProjectSubmissions,
	useEventRegistration,
	useIncrementViewCount,
	useUserFeedback,
} from "./useEventQueries";
import { useRegistrationStatus } from "./useRegistrationStatus";
import type { EventData } from "../components/types";

export function useEventDetailsState(event: EventData, locale: string) {
	const t = useTranslations();
	const { user, loaded } = useOptionalSession();
	const pathname = usePathname();
	const router = useRouter();
	const searchParams = useSearchParams();
	const queryClient = useQueryClient();

	const submissionsEnabled = isEventSubmissionsEnabled(event as any);
	const isHackathonEvent = event.type === "HACKATHON";
	const showWorks = isHackathonEvent && submissionsEnabled;

	useIncrementViewCount(event.id);

	const { projectSubmissions } = useEventProjectSubmissions(
		event.id,
		showWorks,
	);
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

	// --- Modal / UI state ---
	const [showRegistrationForm, setShowRegistrationForm] = useState(false);
	const [showSuccessInfo, setShowSuccessInfo] = useState(false);
	const [showQRGenerator, setShowQRGenerator] = useState(false);
	const [isContactDialogOpen, setIsContactDialogOpen] = useState(false);
	const [isFeedbackDialogOpen, setIsFeedbackDialogOpen] = useState(false);
	const [inviteCode, setInviteCode] = useState<string | null>(null);
	const [latestRegistration, setLatestRegistration] = useState<any>(null);
	const [activeTab, setActiveTab] = useState("intro");
	const [isLoginRedirecting, setIsLoginRedirecting] = useState(false);
	const loginRedirectTimerRef = useRef<number | null>(null);
	const tabsRef = useRef<HTMLDivElement | null>(null);

	// --- Derived state ---
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

	const registerLabel = useMemo(() => {
		if (event.isExternalEvent && event.externalUrl) return "前往报名";
		if (registrationDisabledReason) return registrationDisabledReason;
		if (!user) return "登录后报名";
		if (existingRegistration) {
			switch (existingRegistration.status) {
				case "APPROVED":
					return "查看须知";
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

	const registerLabelDisplay = isLoginRedirecting
		? "正在跳转..."
		: registerLabel;
	const registerDisabledDisplay = registerDisabled || isLoginRedirecting;

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

	// --- URL parameter side effects ---

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

	// Prefetch login page
	useEffect(() => {
		if (!user) {
			router.prefetch("/auth/login");
		}
	}, [router, user]);

	// Cleanup login redirect timer
	useEffect(() => {
		return () => {
			if (loginRedirectTimerRef.current) {
				window.clearTimeout(loginRedirectTimerRef.current);
			}
		};
	}, []);

	// --- Helpers exposed to actions ---
	const buildRedirectTarget = () => {
		const searchString = searchParams.toString();
		return searchString ? `${pathname}?${searchString}` : pathname;
	};

	const redirectToLogin = (redirectTo?: string) => {
		const targetPath = redirectTo ?? buildRedirectTarget();
		router.push(`/auth/login?redirectTo=${encodeURIComponent(targetPath)}`);
	};

	const handleDataRefresh = () => {
		queryClient.invalidateQueries({
			queryKey: eventKeys.detail(event.id),
		});
	};

	return {
		// Session
		t,
		user,
		loaded,
		pathname,
		router,
		searchParams,
		queryClient,

		// Feature flags
		showWorks,

		// Query data
		projectSubmissions,
		photos,
		isBookmarked,
		isLiked,
		likeCount,
		toggleBookmark,
		toggleLike,
		userFeedback,
		hasSubmittedFeedback,
		cancelRegistration,
		volunteerApply,
		existingRegistration,
		canRegister,
		isEventEnded,
		isRegistrationClosed,
		isEventFull,

		// Modal state
		showRegistrationForm,
		setShowRegistrationForm,
		showSuccessInfo,
		setShowSuccessInfo,
		showQRGenerator,
		setShowQRGenerator,
		isContactDialogOpen,
		setIsContactDialogOpen,
		isFeedbackDialogOpen,
		setIsFeedbackDialogOpen,
		inviteCode,
		latestRegistration,
		setLatestRegistration,
		activeTab,
		setActiveTab,
		isLoginRedirecting,
		setIsLoginRedirecting,
		loginRedirectTimerRef,
		tabsRef,

		// Derived
		hasImportantInfo,
		canViewSuccessInfo,
		registerLabelDisplay,
		registerDisabledDisplay,
		awards,
		resourcesGroups,
		volunteerRoles,
		volunteerStatuses,
		hasVolunteerSection,
		canCancel,
		canContactOrganizer,
		canShowFeedback,

		// Helpers
		redirectToLogin,
		handleDataRefresh,
	};
}
