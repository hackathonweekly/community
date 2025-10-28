import { notificationTemplates } from "./templates";
import type {
	Notification,
	NotificationChannel,
	NotificationConfig,
} from "./types";

interface SendNotificationParams {
	userId: string;
	type: Notification["type"];
	data: Record<string, any>;
	channels?: NotificationChannel[];
}

interface NotificationService {
	sendNotification(params: SendNotificationParams): Promise<void>;
	scheduleCheckInReminder(
		userId: string,
		eventId: string,
		reminderTime: string,
	): Promise<void>;
	markAsRead(notificationId: string, userId: string): Promise<void>;
	getUserNotifications(
		userId: string,
		options?: { unreadOnly?: boolean; limit?: number },
	): Promise<Notification[]>;
	updateNotificationConfig(
		userId: string,
		config: Partial<NotificationConfig>,
	): Promise<void>;
}

function interpolateTemplate(
	template: string,
	data: Record<string, any>,
): string {
	return template.replace(/\{(\w+)\}/g, (match, key) => {
		return data[key] || match;
	});
}

export class NotificationManager implements NotificationService {
	async sendNotification({
		userId,
		type,
		data,
		channels = ["WEB"],
	}: SendNotificationParams): Promise<void> {
		try {
			const promises = channels.map((channel) =>
				this.sendToChannel(userId, type, data, channel),
			);
			await Promise.allSettled(promises);
		} catch (error) {
			console.error("Failed to send notification:", error);
		}
	}

	private async sendToChannel(
		userId: string,
		type: Notification["type"],
		data: Record<string, any>,
		channel: NotificationChannel,
	): Promise<void> {
		const template = notificationTemplates[type]?.[channel];
		if (!template) {
			throw new Error(`Template not found for ${type}:${channel}`);
		}

		const title = interpolateTemplate(template.title, data);
		const message = interpolateTemplate(template.message, data);
		const actionUrl = template.actionUrl
			? interpolateTemplate(template.actionUrl, data)
			: undefined;

		switch (channel) {
			case "WEB":
				await this.sendWebNotification(
					userId,
					type,
					title,
					message,
					actionUrl,
					data,
				);
				break;
			case "EMAIL":
				await this.sendEmailNotification(
					userId,
					type,
					title,
					message,
					actionUrl,
					data,
				);
				break;
			case "PUSH":
				await this.sendPushNotification(
					userId,
					type,
					title,
					message,
					actionUrl,
					data,
				);
				break;
		}
	}

	private async sendWebNotification(
		userId: string,
		type: Notification["type"],
		title: string,
		message: string,
		actionUrl?: string,
		data?: Record<string, any>,
	): Promise<void> {
		// TODO: Store in database
		const notification = {
			id: crypto.randomUUID(),
			userId,
			type,
			title,
			message,
			data,
			actionUrl,
			isRead: false,
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		// Store in database (implement with Prisma)
		console.log("Storing web notification:", notification);
	}

	private async sendEmailNotification(
		userId: string,
		type: Notification["type"],
		title: string,
		message: string,
		actionUrl?: string,
		data?: Record<string, any>,
	): Promise<void> {
		// TODO: Integrate with email service
		console.log("Sending email notification:", {
			userId,
			type,
			title,
			message,
		});
	}

	private async sendPushNotification(
		userId: string,
		type: Notification["type"],
		title: string,
		message: string,
		actionUrl?: string,
		data?: Record<string, any>,
	): Promise<void> {
		// TODO: Integrate with push notification service
		console.log("Sending push notification:", {
			userId,
			type,
			title,
			message,
		});
	}

	async scheduleCheckInReminder(
		userId: string,
		eventId: string,
		reminderTime: string,
	): Promise<void> {
		// TODO: Implement scheduling logic (could use cron jobs, queues, etc.)
		console.log("Scheduling check-in reminder:", {
			userId,
			eventId,
			reminderTime,
		});
	}

	async markAsRead(notificationId: string, userId: string): Promise<void> {
		// TODO: Implement database update
		console.log("Marking notification as read:", {
			notificationId,
			userId,
		});
	}

	async getUserNotifications(
		userId: string,
		options: { unreadOnly?: boolean; limit?: number } = {},
	): Promise<Notification[]> {
		// TODO: Implement database query
		console.log("Getting user notifications:", { userId, options });
		return [];
	}

	async updateNotificationConfig(
		userId: string,
		config: Partial<NotificationConfig>,
	): Promise<void> {
		// TODO: Implement database update
		console.log("Updating notification config:", { userId, config });
	}
}

export const notificationManager = new NotificationManager();
