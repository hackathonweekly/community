"use client";
import { useMemo } from "react";

type User = { id: string } | null | undefined;

type Registration = {
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
};

type EventLike = {
	id: string;
	status: string;
	startTime: string;
	endTime: string;
	isExternalEvent: boolean;
	registrationDeadline?: string;
	maxAttendees?: number;
	organizer: { id: string };
	_count: { registrations: number };
	registrations?: Registration[];
};

export function useRegistrationStatus(event: EventLike, user: User) {
	const existingRegistration = useMemo(
		() => event.registrations?.find((reg) => reg.user.id === user?.id),
		[event.registrations, user?.id],
	);

	// 双重状态判断：时间判断 + 状态判断
	const isEventEnded = useMemo(() => {
		const isTimePassed = new Date(event.endTime) < new Date();
		const isStatusCompleted = event.status === "COMPLETED";
		return isTimePassed || isStatusCompleted;
	}, [event.endTime, event.status]);

	// 为了向后兼容，保留原名称但使用新逻辑
	const isEventPast = isEventEnded;

	const isRegistrationClosed = useMemo(
		() =>
			event.registrationDeadline
				? new Date(event.registrationDeadline) < new Date()
				: false,
		[event.registrationDeadline],
	);

	const isEventFull = useMemo(
		() =>
			event.maxAttendees
				? event._count.registrations >= event.maxAttendees
				: false,
		[event._count.registrations, event.maxAttendees],
	);

	const canRegister = useMemo(() => {
		return (
			!event.isExternalEvent &&
			event.status === "PUBLISHED" &&
			!isEventPast &&
			!isRegistrationClosed &&
			!isEventFull &&
			(!existingRegistration ||
				existingRegistration.status === "CANCELLED") &&
			!!user
		);
	}, [
		event,
		isEventPast,
		isRegistrationClosed,
		isEventFull,
		existingRegistration,
		user,
	]);

	const getRegistrationStatusText = (t: (key: string) => string) => {
		if (!user) return t("events.loginToRegister");
		if (event.isExternalEvent) return t("events.goToExternalPlatform");
		if (existingRegistration) {
			switch (existingRegistration.status) {
				case "APPROVED":
					return t("events.youAreRegistered");
				case "PENDING":
					return t("events.registrationPending");
				case "WAITLISTED":
					return t("events.youAreWaitlisted");
				case "REJECTED":
					return t("events.registrationRejectedMessage");
				case "CANCELLED":
					return t("events.registrationCancelled");
				default:
					return t("events.registrationStatusUnknown");
			}
		}
		if (isEventPast) return t("events.eventEnded");
		if (isRegistrationClosed) return t("events.registrationClosed");
		if (isEventFull) return t("events.eventFull");
		if (event.status !== "PUBLISHED") return t("events.eventNotAvailable");
		return t("events.registerNow");
	};

	return {
		existingRegistration,
		isEventPast,
		isEventEnded, // 新增：明确的活动结束状态
		isRegistrationClosed,
		isEventFull,
		canRegister,
		getRegistrationStatusText,
	} as const;
}
