import { sendEmail } from "@/lib/mail/send";
import type { Locale } from "@/lib/i18n";

interface BaseEventNotificationData {
	eventTitle: string;
	eventDate: string;
	eventLocation: string;
	eventUrl: string;
	userName: string;
	userEmail: string;
	locale?: Locale;
}

interface EventNotificationData extends BaseEventNotificationData {}

interface EventUpdateNotificationData extends BaseEventNotificationData {
	updateType:
		| "TIME_CHANGE"
		| "LOCATION_CHANGE"
		| "GENERAL_UPDATE"
		| "CANCELLED";
	updateDetails: string;
}

interface EventRejectionNotificationData extends BaseEventNotificationData {
	rejectionReason?: string;
	alternativeEventsUrl?: string;
}

interface EventFeedbackNotificationData extends BaseEventNotificationData {
	feedbackUrl: string;
}

interface EventOrderCancelledNotificationData
	extends BaseEventNotificationData {
	orderNo: string;
}

// Registration confirmation
export async function sendEventRegistrationConfirmation(
	data: EventNotificationData,
) {
	return await sendEmail({
		to: data.userEmail,
		locale: data.locale,
		templateId: "eventRegistrationConfirmation",
		context: {
			eventTitle: data.eventTitle,
			eventDate: data.eventDate,
			eventLocation: data.eventLocation,
			eventUrl: data.eventUrl,
			userName: data.userName,
		},
	});
}

// Registration approved
export async function sendEventRegistrationApproved(
	data: EventNotificationData,
) {
	return await sendEmail({
		to: data.userEmail,
		locale: data.locale,
		templateId: "eventRegistrationApproved",
		context: {
			eventTitle: data.eventTitle,
			eventDate: data.eventDate,
			eventLocation: data.eventLocation,
			eventUrl: data.eventUrl,
			userName: data.userName,
		},
	});
}

// Registration rejected
export async function sendEventRegistrationRejected(
	data: EventRejectionNotificationData,
) {
	return await sendEmail({
		to: data.userEmail,
		locale: data.locale,
		templateId: "eventRegistrationRejected",
		context: {
			eventTitle: data.eventTitle,
			eventDate: data.eventDate,
			eventLocation: data.eventLocation,
			userName: data.userName,
			rejectionReason: data.rejectionReason,
			alternativeEventsUrl: data.alternativeEventsUrl,
		},
	});
}

// Event reminder
export async function sendEventReminder(
	data: EventNotificationData & { daysUntilEvent: number },
) {
	return await sendEmail({
		to: data.userEmail,
		locale: data.locale,
		templateId: "eventReminder",
		context: {
			eventTitle: data.eventTitle,
			eventDate: data.eventDate,
			eventLocation: data.eventLocation,
			eventUrl: data.eventUrl,
			userName: data.userName,
			daysUntilEvent: data.daysUntilEvent,
		},
	});
}

// Event update notification
export async function sendEventUpdate(data: EventUpdateNotificationData) {
	return await sendEmail({
		to: data.userEmail,
		locale: data.locale,
		templateId: "eventUpdate",
		context: {
			eventTitle: data.eventTitle,
			eventDate: data.eventDate,
			eventLocation: data.eventLocation,
			eventUrl: data.eventUrl,
			userName: data.userName,
			updateType: data.updateType,
			updateDetails: data.updateDetails,
		},
	});
}

// Feedback request
export async function sendEventFeedbackRequest(
	data: EventFeedbackNotificationData,
) {
	return await sendEmail({
		to: data.userEmail,
		locale: data.locale,
		templateId: "eventFeedbackRequest",
		context: {
			eventTitle: data.eventTitle,
			eventDate: data.eventDate,
			userName: data.userName,
			feedbackUrl: data.feedbackUrl,
			eventUrl: data.eventUrl,
		},
	});
}

export async function sendEventOrderCancelled(
	data: EventOrderCancelledNotificationData,
) {
	return await sendEmail({
		to: data.userEmail,
		locale: data.locale,
		templateId: "eventOrderCancelled",
		context: {
			eventTitle: data.eventTitle,
			eventDate: data.eventDate,
			eventLocation: data.eventLocation,
			eventUrl: data.eventUrl,
			userName: data.userName,
			orderNo: data.orderNo,
		},
	});
}

export async function sendEventHostNewEventAnnouncement(params: {
	eventTitle: string;
	eventDate: string;
	eventLocation: string;
	eventUrl: string;
	hostName: string;
	userEmail: string;
	locale?: Locale;
}) {
	return await sendEmail({
		to: params.userEmail,
		locale: params.locale,
		templateId: "eventHostNewEvent",
		context: {
			eventTitle: params.eventTitle,
			eventDate: params.eventDate,
			eventLocation: params.eventLocation,
			eventUrl: params.eventUrl,
			hostName: params.hostName,
		},
	});
}

// Bulk notification helpers for sending to multiple users
export async function sendBulkEventNotifications<
	T extends BaseEventNotificationData,
>(
	users: Array<{ email: string; name: string; locale?: Locale }>,
	baseData: Omit<T, "userName" | "userEmail" | "locale">,
	sendFunction: (data: T) => Promise<any>,
) {
	const promises = users.map((user) =>
		sendFunction({
			...baseData,
			userName: user.name,
			userEmail: user.email,
			locale: user.locale,
		} as T),
	);

	return Promise.allSettled(promises);
}
