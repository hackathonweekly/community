"use client";

import { useTranslations } from "next-intl";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { SubmissionFormConfig } from "@/features/event-submissions/types";

interface Event {
	id: string;
	title: string;
	richContent: string;
	type: string;
	status: string;
	startTime: string;
	endTime: string;
	isOnline: boolean;
	onlineUrl?: string;
	address?: string;
	isExternalEvent: boolean;
	externalUrl?: string;
	coverImage?: string;
	tags: string[];
	featured: boolean;
	viewCount: number;
	maxAttendees?: number;
	registrationDeadline?: string;
	requireApproval: boolean;
	requireProjectSubmission?: boolean;
	submissionsEnabled?: boolean | null;
	submissionFormConfig?: SubmissionFormConfig | null;
	createdAt: string;
	buildingConfig?: {
		id: string;
		duration: number;
		requiredCheckIns: number;
		depositAmount: number;
		refundRate: number;
		isPublic: boolean;
		allowAnonymous: boolean;
		enableVoting: boolean;
		votingEndTime?: string;
		paymentType?: string;
		paymentUrl?: string;
		paymentQRCode?: string;
		paymentNote?: string;
	};
	organizer: {
		id: string;
		name: string;
		image?: string;
		username?: string;
	};
	organization?: {
		id: string;
		name: string;
		slug: string;
		logo?: string;
	};
	questions: Array<{
		id: string;
		question: string;
		type: string;
		required: boolean;
		options: string[];
		order: number;
	}>;
	volunteerRoles?: Array<{
		id: string;
		recruitCount: number;
		requireApproval: boolean;
		description?: string;
		volunteerRole: {
			id: string;
			name: string;
			description: string;
			iconUrl?: string;
			cpPoints: number;
		};
		registrations: Array<{
			id: string;
			status: "APPLIED" | "APPROVED" | "REJECTED" | "CANCELLED";
			appliedAt: string;
			approvedAt?: string;
			note?: string;
			completed: boolean;
			completedAt?: string;
			cpAwarded: boolean;
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
	_count: {
		registrations: number;
		checkIns?: number;
		buildingRegistrations?: number;
		hackathonProjects?: number;
		feedbacks?: number;
	};
}

interface Registration {
	id: string;
	status: "PENDING" | "APPROVED" | "WAITLISTED" | "REJECTED" | "CANCELLED";
	registeredAt: string;
	note?: string;
	reviewedAt?: string;
	reviewNote?: string;
	user: {
		id: string;
		name: string;
		email: string;
		image?: string;
		username?: string;
		userRole?: string;
		city?: string;
		bio?: string;
		phoneNumber?: string;
		wechatId?: string;
	};
	ticketType?: {
		id: string;
		name: string;
		description?: string;
		price?: number;
	};
	answers: Array<{
		id: string;
		answer: string;
		question: {
			id: string;
			question: string;
			type: string;
			required: boolean;
			options?: string[];
		};
	}>;
	projectSubmission?: {
		id: string;
		title: string;
		description: string;
		status: string;
		project: {
			id: string;
			title: string;
			description?: string;
			screenshots?: string[];
			stage: string;
			projectTags?: string[];
			url?: string;
		};
	} | null;
}

export function useEventManagement() {
	const params = useParams();
	const router = useRouter();
	const t = useTranslations("events.manage");
	const eventId = params.eventId as string;

	const [event, setEvent] = useState<Event | null>(null);
	const [registrations, setRegistrations] = useState<Registration[]>([]);
	const [loading, setLoading] = useState(true);
	const [registrationsLoading, setRegistrationsLoading] = useState(false);
	const [activeTab, setActiveTab] = useState("overview");
	const [statusFilter, setStatusFilter] = useState<string>("all");

	const safeSetRegistrations = (newRegistrations: unknown) => {
		if (Array.isArray(newRegistrations)) {
			setRegistrations(newRegistrations as Registration[]);
		} else {
			console.warn(
				"Attempted to set non-array value to registrations:",
				newRegistrations,
			);
			setRegistrations([]);
		}
	};

	const fetchEvent = async () => {
		try {
			const controller = new AbortController();
			const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

			const response = await fetch(
				`/api/events/${eventId}?_t=${Date.now()}`,
				{
					signal: controller.signal,
					cache: "no-cache",
					headers: {
						"Cache-Control": "no-cache, no-store, must-revalidate",
						Pragma: "no-cache",
						Expires: "0",
					},
				},
			);

			clearTimeout(timeoutId);

			if (response.ok) {
				const data = await response.json();
				setEvent(data.data);
			} else {
				toast.error(t("actions.fetchError"));
				router.push("/app/events");
			}
		} catch (error) {
			console.error("Error fetching event:", error);
			if (error instanceof Error && error.name === "AbortError") {
				toast.error(t("actions.timeout"));
			} else {
				toast.error(t("actions.fetchError"));
			}
		} finally {
			setLoading(false);
		}
	};

	const fetchRegistrations = async () => {
		setRegistrationsLoading(true);
		try {
			const params = new URLSearchParams();
			if (statusFilter !== "all") {
				params.set("status", statusFilter);
			}

			const controller = new AbortController();
			const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

			const response = await fetch(
				`/api/events/${eventId}/registrations?${params.toString()}`,
				{
					signal: controller.signal,
				},
			);

			clearTimeout(timeoutId);

			if (response.ok) {
				const data = await response.json();
				safeSetRegistrations(data.data?.registrations || []);
			} else {
				console.error(
					"Failed to fetch registrations:",
					response.status,
				);
				safeSetRegistrations([]);
				toast.error(t("actions.fetchRegistrationsError"));
			}
		} catch (error) {
			console.error("Error fetching registrations:", error);
			safeSetRegistrations([]);
			if (error instanceof Error && error.name === "AbortError") {
				toast.error(t("actions.timeout"));
			} else {
				toast.error(t("actions.fetchRegistrationsError"));
			}
		} finally {
			setRegistrationsLoading(false);
		}
	};

	const updateRegistrationStatus = async (
		userId: string,
		status: string,
		reviewNote?: string,
	) => {
		try {
			const response = await fetch(
				`/api/events/${eventId}/registrations/${userId}`,
				{
					method: "PUT",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({ status, reviewNote }),
				},
			);

			if (response.ok) {
				toast.success(t("actions.registrationUpdateSuccess"));
				fetchRegistrations();
			} else {
				const error = await response.json();
				toast.error(error.error || t("actions.updateError"));
			}
		} catch (error) {
			console.error("Error updating registration:", error);
			toast.error(t("actions.updateError"));
		}
	};

	const cancelRegistration = async (userId: string, reason: string) => {
		try {
			const response = await fetch(
				`/api/events/${eventId}/registrations/${userId}`,
				{
					method: "DELETE",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({ reason }),
				},
			);

			if (response.ok) {
				toast.success(t("actions.cancelSuccess"));
				fetchRegistrations();
			} else {
				const error = await response.json();
				toast.error(error.error || t("actions.cancelError"));
			}
		} catch (error) {
			console.error("Error cancelling registration:", error);
			toast.error(t("actions.cancelError"));
		}
	};

	const exportRegistrations = async () => {
		try {
			const params = new URLSearchParams();
			if (statusFilter !== "all") {
				params.set("status", statusFilter);
			}

			const response = await fetch(
				`/api/events/${eventId}/registrations/export?${params.toString()}`,
			);

			if (response.ok) {
				// Create and download the CSV file
				const blob = await response.blob();
				const url = window.URL.createObjectURL(blob);
				const a = document.createElement("a");

				try {
					a.style.display = "none";
					a.href = url;
					a.download = `${event?.title || "event"}-registrations-${statusFilter}.csv`;
					document.body.appendChild(a);
					a.click();
					toast.success(t("actions.exportSuccess"));
				} finally {
					// Always cleanup resources
					window.URL.revokeObjectURL(url);
					document.body.removeChild(a);
				}
			} else {
				const error = await response.json();
				toast.error(error.error || t("actions.exportError"));
			}
		} catch (error) {
			console.error("Error exporting registrations:", error);
			toast.error(t("actions.exportError"));
		}
	};

	const deleteEvent = async () => {
		try {
			const response = await fetch(`/api/events/${eventId}`, {
				method: "DELETE",
			});

			if (response.ok) {
				toast.success(t("actions.deleteSuccess"));
				router.push("/app/events");
			} else {
				const error = await response.json();
				toast.error(error.error || t("actions.deleteError"));
			}
		} catch (error) {
			console.error("Error deleting event:", error);
			toast.error(t("actions.deleteError"));
		}
	};

	const toggleRegistrationStatus = async (action: "close" | "open") => {
		try {
			const response = await fetch(
				`/api/events/status/${eventId}/registration`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({ action }),
				},
			);

			if (response.ok) {
				const result = await response.json();
				toast.success(
					result.message ||
						`报名已${action === "close" ? "关闭" : "开启"}`,
				);
				// Refresh event data to get updated status
				fetchEvent();
			} else {
				const error = await response.json();
				toast.error(
					error.error ||
						`${action === "close" ? "关闭" : "开启"}报名失败`,
				);
			}
		} catch (error) {
			console.error("Error toggling registration status:", error);
			toast.error(`${action === "close" ? "关闭" : "开启"}报名失败`);
		}
	};

	const handleQRScanSuccess = async (userId: string) => {
		try {
			const response = await fetch(`/api/events/${eventId}/checkin`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					eventId,
					userId,
				}),
			});

			const result = await response.json();

			if (response.ok) {
				const attendeeName =
					result.data?.user?.name || t("actions.defaultAttendeeName");
				const checkInTime = new Date().toLocaleTimeString();
				toast.success(
					t("actions.checkInSuccess", { name: attendeeName }),
					{
						description: t("actions.checkInSuccessDescription", {
							time: checkInTime,
						}),
						duration: 5000,
					},
				);
				try {
					const audio = new Audio("/sounds/success.mp3");
					audio.volume = 0.3;
					audio.play().catch(() => {
						// Ignore audio playback failures
					});
				} catch (e) {
					// Ignore audio errors
				}
			} else {
				const rawError =
					typeof result.error === "string" ? result.error : "";
				let errorMessage = rawError || t("actions.checkInFailed");
				let errorType: "error" | "warning" = "error";

				if (rawError.includes("already checked in")) {
					errorMessage = t("actions.checkInAlready");
					errorType = "warning";
				} else if (rawError.includes("not registered")) {
					errorMessage = t("actions.checkInNotRegistered");
				} else if (rawError.includes("not confirmed")) {
					errorMessage = t("actions.checkInNotConfirmed");
				}

				if (errorType === "warning") {
					toast.warning(errorMessage, {
						description: t("actions.duplicateCheckInDescription"),
						duration: 4000,
					});
				} else {
					toast.error(errorMessage, {
						description: t("actions.checkInFailedDescription"),
						duration: 5000,
					});
				}
			}

			// Refresh relevant data after successful check-in
			if (activeTab === "registrations") {
				fetchRegistrations();
			}
			// Always refresh event data to update check-in counts
			fetchEvent();
		} catch (error) {
			console.error("Error checking in user:", error);
			toast.error(t("actions.checkInFailed"), {
				description: t("actions.networkErrorDescription"),
				duration: 5000,
			});
		}
	};

	useEffect(() => {
		fetchEvent();
	}, [eventId]);

	useEffect(() => {
		if (event && activeTab === "registrations") {
			fetchRegistrations();
		}
	}, [event, activeTab, statusFilter]);

	// Calculate stats
	const confirmedCount = (registrations || []).filter(
		(r) => r.status === "APPROVED",
	).length;
	const pendingCount = (registrations || []).filter(
		(r) => r.status === "PENDING",
	).length;

	return {
		// State
		event,
		registrations,
		loading,
		registrationsLoading,
		activeTab,
		statusFilter,
		eventId,
		confirmedCount,
		pendingCount,

		// Actions
		setActiveTab,
		setStatusFilter,
		fetchEvent,
		fetchRegistrations,
		updateRegistrationStatus,
		cancelRegistration,
		exportRegistrations,
		handleQRScanSuccess,
		deleteEvent,
		toggleRegistrationStatus,
	};
}
