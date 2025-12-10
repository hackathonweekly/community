"use client";

import { useRouter } from "next/navigation";
import { useEventEngagement, useEventRegistration } from "./useEventQueries";
import { useTranslations } from "next-intl";
import { useMemo, useState, useEffect } from "react";

export interface UnifiedEventRegistrationProps {
	event: {
		id: string;
		status: string;
		endTime: string;
		registrationDeadline?: string;
		isExternalEvent: boolean;
		externalUrl?: string;
		requireApproval: boolean;
		startTime: string;
		address?: string;
		isOnline?: boolean;
		onlineUrl?: string;
		coverImage?: string;
		richContent?: string | null;
	};
	user?: { id: string } | null;
	existingRegistration?: { status: string } | null;
	canRegister: boolean | null;
	pathname: string;
}

export function useUnifiedEventRegistration({
	event,
	user,
	existingRegistration,
	canRegister,
	pathname,
}: UnifiedEventRegistrationProps) {
	const t = useTranslations();
	const router = useRouter();
	const { isBookmarked, toggleBookmark } = useEventEngagement(
		event.id,
		user?.id,
	);
	const {
		register,
		cancelRegistration,
		volunteerApply,
		isRegistering,
		isCancellingRegistration,
		isApplyingVolunteer,
	} = useEventRegistration(event.id, t);

	// 使用 state 来存储当前时间，避免 hydration mismatch
	const [now, setNow] = useState<Date | null>(null);

	useEffect(() => {
		setNow(new Date());
	}, []);

	// 计算活动状态 - 在客户端 mount 前只依赖 status 判断
	const isEventEnded = useMemo(() => {
		const isStatusCompleted = event.status === "COMPLETED";
		if (!now) return isStatusCompleted;
		return new Date(event.endTime) < now || isStatusCompleted;
	}, [event.endTime, event.status, now]);

	const isEventDraft = useMemo(
		() => event.status === "DRAFT",
		[event.status],
	);

	// 注册按钮文本
	const getRegisterButtonText = () => {
		if (event.isExternalEvent) {
			return "前往报名";
		}
		if (isRegistering) {
			return t("events.registration.registering");
		}
		if (existingRegistration) {
			switch (existingRegistration.status) {
				case "APPROVED":
					return "📱 签到二维码";
				case "PENDING":
					return "审核中";
				case "WAITLISTED":
					return "等待中";
				case "CANCELLED":
					return "重新报名";
				default:
					return t("events.registration.registerNow");
			}
		}
		if (isEventEnded) {
			return "🏁 已结束";
		}
		if (!user) {
			return "登录后报名";
		}
		if (canRegister) {
			return t("events.registration.registerNow");
		}
		return getRegistrationStatusText();
	};

	// 注册状态文本
	const getRegistrationStatusText = () => {
		// 这里可以根据需要添加更复杂的状态判断逻辑
		if (event.requireApproval) {
			return "需要审核";
		}
		if (event.registrationDeadline && now) {
			if (new Date(event.registrationDeadline) < now) {
				return "报名已截止";
			}
		}
		return "暂不可报名";
	};

	// 主要报名操作
	const handleRegisterAction = () => {
		if (event.isExternalEvent && event.externalUrl) {
			window.open(event.externalUrl, "_blank", "noopener noreferrer");
			return;
		}
		if (existingRegistration?.status === "APPROVED") {
			// 显示签到二维码的逻辑需要父组件处理
			return "SHOW_QR_CODE";
		}
		// 移动端跳转到报名页面
		if (typeof window !== "undefined") {
			const locale = window.location.pathname.split("/")[1];
			window.location.href = `/${locale}/events/${event.id}/register`;
		}
	};

	// 取消报名操作
	const handleCancelRegistrationAction = () => {
		if (
			existingRegistration &&
			(existingRegistration.status === "PENDING" ||
				existingRegistration.status === "WAITLISTED" ||
				existingRegistration.status === "APPROVED")
		) {
			cancelRegistration();
		}
	};

	// 收藏操作
	const handleBookmark = async () => {
		if (!user) {
			router.push(
				`/auth/login?redirectTo=${encodeURIComponent(pathname)}`,
			);
			return;
		}
		await toggleBookmark();
	};

	// 志愿者申请操作
	const handleVolunteerApply = (eventVolunteerRoleId: string) => {
		volunteerApply(eventVolunteerRoleId);
	};

	// 分享相关
	const getShareUrl = () => {
		if (typeof window !== "undefined") {
			return window.location.href;
		}
		return "";
	};

	const generateShareText = () => {
		const timeStr = formatEventTime(event.startTime, event.endTime);
		let locationStr = "";

		if (event.isOnline) {
			locationStr = "线上活动";
		} else if (event.address) {
			locationStr = `地点：${event.address}`;
		}

		return `🎉 活动\n\n⏰ 时间：${timeStr}\n${locationStr ? `📍 ${locationStr}\n` : ""}\n🔗 报名链接：${getShareUrl()}`;
	};

	// 时间格式化
	const formatEventTime = (startTime: string, endTime: string) => {
		const start = new Date(startTime);
		const end = new Date(endTime);
		const formatter = new Intl.DateTimeFormat("zh-CN", {
			year: "numeric",
			month: "numeric",
			day: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		});

		const startStr = formatter.format(start);
		const endStr = formatter.format(end);

		if (start.toDateString() === end.toDateString()) {
			return `${startStr} - ${formatter.format(end).split(" ")[1]}`;
		}
		return `${startStr} - ${endStr}`;
	};

	// 取消报名按钮显示条件
	const shouldShowCancelButton = () => {
		return (
			existingRegistration &&
			(existingRegistration.status === "PENDING" ||
				existingRegistration.status === "WAITLISTED" ||
				existingRegistration.status === "APPROVED")
		);
	};

	// 志愿者招募数据统计
	const getVolunteerStats = (volunteerRoles?: any[]) => {
		if (!volunteerRoles || volunteerRoles.length === 0) {
			return null;
		}

		const totalNeeded = volunteerRoles.reduce(
			(sum, role) => sum + role.recruitCount,
			0,
		);
		const totalApplied = volunteerRoles.reduce(
			(sum, role) =>
				sum +
				role.registrations.filter(
					(reg: any) => reg.status === "APPROVED",
				).length,
			0,
		);

		return { totalNeeded, totalApplied };
	};

	// 是否可以申请志愿者
	const canApplyVolunteer =
		!isEventEnded && !isEventDraft && !event.isExternalEvent;

	return {
		// 基础状态
		isBookmarked,
		isEventEnded,
		isEventDraft,
		canRegister,
		canApplyVolunteer,

		// 注册相关
		existingRegistration,
		isRegistering,
		isCancellingRegistration,
		getRegisterButtonText,
		getRegistrationStatusText,
		handleRegisterAction,
		handleCancelRegistrationAction,
		shouldShowCancelButton,

		// 收藏相关
		handleBookmark,

		// 志愿者相关
		isApplyingVolunteer,
		handleVolunteerApply,
		getVolunteerStats,

		// 分享相关
		getShareUrl,
		generateShareText,
		formatEventTime,

		// 原始数据
		event,
		user,
		pathname,
	};
}
