export interface Notification {
	id: string;
	userId: string;
	type:
		| "CHECK_IN_REMINDER"
		| "LIKE_RECEIVED"
		| "COMMENT_RECEIVED"
		| "CHALLENGE_COMPLETED"
		| "CHALLENGE_STARTED";
	title: string;
	message: string;
	data?: Record<string, any>;
	isRead: boolean;
	createdAt: Date;
	updatedAt: Date;
}

export interface NotificationConfig {
	enableCheckInReminders: boolean;
	enableLikeNotifications: boolean;
	enableCommentNotifications: boolean;
	enableChallengeNotifications: boolean;
	reminderTime: string; // HH:MM format
}

export type NotificationChannel = "WEB" | "EMAIL" | "PUSH";

export interface NotificationTemplate {
	type: Notification["type"];
	channel: NotificationChannel;
	title: string;
	message: string;
	actionUrl?: string;
}
