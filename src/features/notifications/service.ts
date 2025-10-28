import { db } from "@/lib/database/prisma/client";
import type {
	NotificationType,
	NotificationPriority,
	Prisma,
} from "@prisma/client";

interface CreateNotificationData {
	userId: string;
	type: NotificationType;
	title: string;
	content: string;
	metadata?: Record<string, any>;
	actionUrl?: string;
	priority?: NotificationPriority;
	relatedUserId?: string;
}

export class NotificationService {
	/**
	 * 创建新通知
	 */
	static async createNotification(data: CreateNotificationData) {
		try {
			// 验证 relatedUserId 是否存在
			if (data.relatedUserId) {
				const relatedUserExists = await db.user.findUnique({
					where: { id: data.relatedUserId },
					select: { id: true },
				});

				if (!relatedUserExists) {
					console.warn(
						`Related user ${data.relatedUserId} not found, setting to null`,
					);
					data.relatedUserId = undefined;
				}
			}

			const notification = await db.notification.create({
				data: {
					userId: data.userId,
					type: data.type,
					title: data.title,
					content: data.content,
					metadata: data.metadata
						? (data.metadata as Prisma.JsonValue)
						: undefined,
					actionUrl: data.actionUrl,
					priority: data.priority || "NORMAL",
					relatedUserId: data.relatedUserId,
				},
				include: {
					user: {
						select: {
							id: true,
							name: true,
							email: true,
							notificationPreference: true,
						},
					},
					relatedUser: {
						select: {
							id: true,
							name: true,
							image: true,
							username: true,
						},
					},
				},
			});

			// 根据用户偏好决定是否发送邮件通知
			await NotificationService.scheduleEmailNotification(notification);

			return notification;
		} catch (error) {
			console.error("Error creating notification:", error);
			throw error;
		}
	}

	/**
	 * 批量创建通知
	 */
	static async createBulkNotifications(
		notifications: CreateNotificationData[],
	) {
		try {
			const createdNotifications = await Promise.all(
				notifications.map((notificationData) =>
					NotificationService.createNotification(notificationData),
				),
			);

			return createdNotifications;
		} catch (error) {
			console.error("Error creating bulk notifications:", error);
			throw error;
		}
	}

	/**
	 * 通用评论相关通知
	 */
	static async notifyCommentReply(
		commentId: string,
		parentCommentUserId: string,
		replyUserId: string,
		replyUserName: string,
		entityType: string,
		entityId: string,
		entityTitle: string,
	) {
		// 不给自己发通知
		if (parentCommentUserId === replyUserId) {
			return;
		}

		const entityTypeMap: Record<string, string> = {
			PROJECT: "作品",
			EVENT: "活动",
			TASK: "任务",
			ARTICLE: "文章",
		};

		const entityTypeName = entityTypeMap[entityType] || "内容";

		return NotificationService.createNotification({
			userId: parentCommentUserId,
			type: "PROJECT_COMMENT", // 复用现有通知类型，可以根据需要扩展
			title: "收到评论回复",
			content: `${replyUserName} 回复了你在${entityTypeName} "${entityTitle}" 中的评论`,
			metadata: {
				commentId,
				replyUserId,
				entityType,
				entityId,
				entityTitle,
			},
			actionUrl: NotificationService.getEntityUrl(
				entityType,
				entityId,
				commentId,
			),
			relatedUserId: replyUserId,
		});
	}

	static async notifyCommentLike(
		commentId: string,
		commentUserId: string,
		likeUserId: string,
		likeUserName: string,
		entityType: string,
		entityId: string,
		entityTitle: string,
	) {
		// 不给自己发通知
		if (commentUserId === likeUserId) {
			return;
		}

		const entityTypeMap: Record<string, string> = {
			PROJECT: "作品",
			EVENT: "活动",
			TASK: "任务",
			ARTICLE: "文章",
		};

		const entityTypeName = entityTypeMap[entityType] || "内容";

		return NotificationService.createNotification({
			userId: commentUserId,
			type: "PROJECT_LIKE", // 复用现有通知类型
			title: "评论收到点赞",
			content: `${likeUserName} 点赞了你在${entityTypeName} "${entityTitle}" 中的评论`,
			metadata: {
				commentId,
				likeUserId,
				entityType,
				entityId,
				entityTitle,
			},
			actionUrl: NotificationService.getEntityUrl(
				entityType,
				entityId,
				commentId,
			),
			priority: "LOW",
			relatedUserId: likeUserId,
		});
	}

	private static getEntityUrl(
		entityType: string,
		entityId: string,
		commentId?: string,
	): string {
		const baseUrls: Record<string, string> = {
			PROJECT: `/projects/${entityId}`,
			EVENT: `/events/${entityId}`,
			TASK: `/tasks/${entityId}`,
			ARTICLE: `/articles/${entityId}`,
		};

		const baseUrl = baseUrls[entityType] || `/content/${entityId}`;
		return commentId ? `${baseUrl}#comment-${commentId}` : baseUrl;
	}

	/**
	 * 作品相关通知
	 */
	static async notifyProjectComment(
		projectId: string,
		projectTitle: string,
		projectOwnerId: string,
		commentUserId: string,
		commentUserName: string,
	) {
		// 不给自己发通知
		if (projectOwnerId === commentUserId) {
			return;
		}

		return NotificationService.createNotification({
			userId: projectOwnerId,
			type: "PROJECT_COMMENT",
			title: "作品收到新评论",
			content: `${commentUserName} 评论了你的作品 "${projectTitle}"`,
			metadata: {
				projectId,
				commentUserId,
				projectTitle,
			},
			actionUrl: `/projects/${projectId}#comments`,
			relatedUserId: commentUserId,
		});
	}

	static async notifyProjectLike(
		projectId: string,
		projectTitle: string,
		projectOwnerId: string,
		likeUserId: string,
		likeUserName: string,
	) {
		// 不给自己发通知
		if (projectOwnerId === likeUserId) {
			return;
		}

		return NotificationService.createNotification({
			userId: projectOwnerId,
			type: "PROJECT_LIKE",
			title: "作品收到点赞",
			content: `${likeUserName} 点赞了你的作品 "${projectTitle}"`,
			metadata: {
				projectId,
				likeUserId,
				projectTitle,
			},
			actionUrl: `/projects/${projectId}`,
			priority: "LOW",
			relatedUserId: likeUserId,
		});
	}

	/**
	 * 组织相关通知
	 */
	static async notifyOrganizationMemberApplication(
		organizationId: string,
		organizationName: string,
		adminUserIds: string[],
		applicantId: string,
		applicantName: string,
		organizationSlug?: string,
	) {
		return NotificationService.createBulkNotifications(
			adminUserIds.map((adminUserId) => ({
				userId: adminUserId,
				type: "ORGANIZATION_MEMBER_APPLICATION",
				title: "新的成员申请",
				content: `${applicantName} 申请加入组织 "${organizationName}"`,
				metadata: {
					organizationId,
					applicantId,
					organizationName,
					applicantName,
				},
				actionUrl: organizationSlug
					? `/app/${organizationSlug}/settings/members`
					: `/app/organization/${organizationId}/members/applications`,
				priority: "HIGH",
				relatedUserId: applicantId,
			})),
		);
	}

	static async notifyOrganizationApplicationResult(
		userId: string,
		organizationName: string,
		approved: boolean,
		organizationSlug?: string,
	) {
		return NotificationService.createNotification({
			userId,
			type: "ORGANIZATION_APPLICATION_RESULT",
			title: approved ? "申请通过" : "申请被拒绝",
			content: approved
				? `恭喜！你已成功加入组织 "${organizationName}"`
				: `很抱歉，你的组织申请 "${organizationName}" 未被通过`,
			metadata: {
				organizationName,
				approved,
				organizationSlug,
			},
			actionUrl:
				approved && organizationSlug
					? `/app/${organizationSlug}`
					: undefined,
			priority: "HIGH",
		});
	}

	/**
	 * 活动相关通知
	 */
	static async notifyEventRegistrationResult(
		userId: string,
		eventId: string,
		eventTitle: string,
		approved: boolean,
	) {
		return NotificationService.createNotification({
			userId,
			type: "EVENT_REGISTRATION_RESULT",
			title: approved ? "活动报名成功" : "活动报名未通过",
			content: approved
				? `你已成功报名活动 "${eventTitle}"`
				: `很抱歉，你的活动报名 "${eventTitle}" 未被通过`,
			metadata: {
				eventId,
				eventTitle,
				approved,
			},
			actionUrl: `/events/${eventId}`,
			priority: "HIGH",
		});
	}

	static async notifyEventTimeChange(
		userIds: string[],
		eventId: string,
		eventTitle: string,
		newStartTime: Date,
	) {
		return NotificationService.createBulkNotifications(
			userIds.map((userId) => ({
				userId,
				type: "EVENT_TIME_CHANGE",
				title: "活动时间变更",
				content: `你报名的活动 "${eventTitle}" 时间已变更，请查看最新时间安排`,
				metadata: {
					eventId,
					eventTitle,
					newStartTime: newStartTime.toISOString(),
				},
				actionUrl: `/events/${eventId}`,
				priority: "URGENT",
			})),
		);
	}

	static async notifyEventReminder(
		userIds: string[],
		eventId: string,
		eventTitle: string,
		startTime: Date,
		reminderType: "24h" | "1h",
	) {
		const reminderText = reminderType === "24h" ? "明天" : "1小时后";

		return NotificationService.createBulkNotifications(
			userIds.map((userId) => ({
				userId,
				type: "EVENT_REMINDER",
				title: "活动提醒",
				content: `你报名的活动 "${eventTitle}" 将在${reminderText}开始`,
				metadata: {
					eventId,
					eventTitle,
					startTime: startTime.toISOString(),
					reminderType,
				},
				actionUrl: `/events/${eventId}`,
				priority: "HIGH",
			})),
		);
	}

	/**
	 * 社交通知
	 */
	static async notifyUserBookmarked(
		userId: string,
		bookmarkerUserId: string,
		bookmarkerUserName: string,
	) {
		return NotificationService.createNotification({
			userId,
			type: "USER_BOOKMARKED",
			title: "收到新收藏",
			content: `${bookmarkerUserName} 收藏了你的个人资料`,
			metadata: {
				bookmarkerUserId,
				bookmarkerUserName,
			},
			// actionUrl: "/profile", // 收藏通知不需要跳转，仅标记已读
			priority: "LOW",
			relatedUserId: bookmarkerUserId,
		});
	}

	static async notifyUserFollowed(
		userId: string,
		followerUserId: string,
		followerUserName: string,
	) {
		return NotificationService.createNotification({
			userId,
			type: "USER_FOLLOWED",
			title: "收到新关注",
			content: `${followerUserName} 关注了你`,
			metadata: {
				followerUserId,
				followerUserName,
			},
			priority: "LOW",
			relatedUserId: followerUserId,
		});
	}

	/**
	 * 用户点赞通知
	 */
	static async notifyUserLiked(
		userId: string,
		likerUserId: string,
		likerUserName: string,
	) {
		return NotificationService.createNotification({
			userId,
			type: "USER_LIKED", // Note: need to add this to NotificationType enum
			title: "收到新点赞",
			content: `${likerUserName} 点赞了你`,
			metadata: {
				likerUserId,
				likerUserName,
			},
			priority: "LOW",
			relatedUserId: likerUserId,
		});
	}

	/**
	 * 系统通知
	 */
	static async notifyAccountSecurity(
		userId: string,
		actionType: string,
		details: string,
	) {
		return NotificationService.createNotification({
			userId,
			type: "ACCOUNT_SECURITY",
			title: "账户安全提醒",
			content: `你的账户发生了安全相关操作：${details}`,
			metadata: {
				actionType,
				details,
			},
			actionUrl: "/app/settings/security",
			priority: "URGENT",
		});
	}

	static async notifySystemAnnouncement(
		userIds: string[],
		title: string,
		content: string,
		actionUrl?: string,
	) {
		return NotificationService.createBulkNotifications(
			userIds.map((userId) => ({
				userId,
				type: "SYSTEM_ANNOUNCEMENT",
				title,
				content,
				actionUrl,
				priority: "HIGH" as NotificationPriority,
			})),
		);
	}

	/**
	 * 安排邮件通知
	 */
	private static async scheduleEmailNotification(notification: any) {
		const preferences = notification.user.notificationPreference;

		// 如果用户没有设置偏好，使用默认设置
		if (!preferences) {
			// 创建默认偏好设置
			await db.notificationPreference.create({
				data: {
					userId: notification.userId,
				},
			});
		}

		const shouldSendEmail =
			NotificationService.shouldSendEmailForNotificationType(
				notification.type,
				preferences,
			);

		if (shouldSendEmail) {
			await db.emailNotificationQueue.create({
				data: {
					userId: notification.userId,
					notificationId: notification.id,
					emailType: NotificationService.getEmailTemplateType(
						notification.type,
					),
					emailData: {
						notification: {
							title: notification.title,
							content: notification.content,
							actionUrl: notification.actionUrl,
							type: notification.type,
							priority: notification.priority,
						},
						user: {
							name: notification.user.name,
							email: notification.user.email,
						},
						relatedUser: notification.relatedUser,
						metadata: notification.metadata,
					} as Prisma.JsonValue,
					priority: notification.priority,
					scheduledAt: NotificationService.getEmailScheduleTime(
						notification.type,
					),
				},
			});
		}
	}

	private static shouldSendEmailForNotificationType(
		type: NotificationType,
		preferences: any,
	): boolean {
		if (!preferences) {
			return true; // 默认发送
		}

		switch (type) {
			case "PROJECT_COMMENT":
				return preferences.projectCommentEmail;
			case "PROJECT_LIKE":
			case "PROJECT_STATUS_UPDATE":
			case "PROJECT_COLLABORATION_INVITE":
			case "PROJECT_VIEW_MILESTONE":
				return preferences.projectLikeEmail;
			case "ORGANIZATION_MEMBER_APPLICATION":
			case "ORGANIZATION_APPLICATION_RESULT":
			case "ORGANIZATION_ROLE_CHANGE":
			case "ORGANIZATION_ANNOUNCEMENT":
			case "ORGANIZATION_MEMBER_REMOVED":
			case "ORGANIZATION_MEMBER_JOINED":
				return preferences.organizationEmail;
			case "EVENT_REGISTRATION_RESULT":
			case "EVENT_TIME_CHANGE":
			case "EVENT_CANCELLED":
			case "EVENT_REMINDER":
			case "EVENT_CHECKIN_OPEN":
			case "EVENT_NEW_REGISTRATION":
			case "EVENT_CAPACITY_WARNING":
			case "EVENT_PHOTO_UPLOADED":
				return preferences.eventEmail;
			case "ACCOUNT_SECURITY":
			case "ACCOUNT_BANNED":
			case "SYSTEM_ANNOUNCEMENT":
			case "ACHIEVEMENT_UNLOCKED":
			case "DAILY_REWARD":
				return preferences.systemEmail;
			case "USER_BOOKMARKED":
			case "USER_FOLLOWED":
			case "USER_LIKED":
			case "PRIVATE_MESSAGE":
			case "PROFILE_VIEW_MILESTONE":
				return preferences.socialEmail;
			default:
				return false;
		}
	}

	private static getEmailTemplateType(type: NotificationType): string {
		// 将通知类型映射到邮件模板类型
		const typeMap: Record<string, string> = {
			PROJECT_COMMENT: "project_comment",
			PROJECT_LIKE: "project_like",
			PROJECT_STATUS_UPDATE: "project_status_update",
			PROJECT_COLLABORATION_INVITE: "project_collaboration_invite",
			PROJECT_VIEW_MILESTONE: "project_view_milestone",
			ORGANIZATION_MEMBER_APPLICATION: "organization_application",
			ORGANIZATION_APPLICATION_RESULT: "organization_application_result",
			ORGANIZATION_ROLE_CHANGE: "organization_role_change",
			ORGANIZATION_ANNOUNCEMENT: "organization_announcement",
			ORGANIZATION_MEMBER_REMOVED: "organization_member_removed",
			ORGANIZATION_MEMBER_JOINED: "organization_member_joined",
			EVENT_REGISTRATION_RESULT: "event_registration_result",
			EVENT_TIME_CHANGE: "event_time_change",
			EVENT_CANCELLED: "event_cancelled",
			EVENT_REMINDER: "event_reminder",
			EVENT_CHECKIN_OPEN: "event_checkin_open",
			EVENT_NEW_REGISTRATION: "event_new_registration",
			EVENT_CAPACITY_WARNING: "event_capacity_warning",
			EVENT_PHOTO_UPLOADED: "event_photo_uploaded",
			ACCOUNT_SECURITY: "account_security",
			ACCOUNT_BANNED: "account_banned",
			SYSTEM_ANNOUNCEMENT: "system_announcement",
			ACHIEVEMENT_UNLOCKED: "achievement_unlocked",
			DAILY_REWARD: "daily_reward",
			USER_BOOKMARKED: "user_bookmarked",
			USER_FOLLOWED: "user_followed",
			USER_LIKED: "user_liked",
			PRIVATE_MESSAGE: "private_message",
			PROFILE_VIEW_MILESTONE: "profile_view_milestone",
		};

		return typeMap[type] || "general_notification";
	}

	private static getEmailScheduleTime(type: NotificationType): Date {
		const now = new Date();

		// 紧急通知立即发送
		const immediateTypes: NotificationType[] = [
			"ACCOUNT_SECURITY",
			"ACCOUNT_BANNED",
			"EVENT_TIME_CHANGE",
			"EVENT_CANCELLED",
		];

		if (immediateTypes.includes(type)) {
			return now;
		}

		// 其他通知延迟5分钟发送，允许合并
		return new Date(now.getTime() + 5 * 60 * 1000);
	}
}
