import type { NotificationTemplate, NotificationChannel } from "./types";

export const notificationTemplates: Record<
	string,
	Record<NotificationChannel, NotificationTemplate>
> = {
	CHECK_IN_REMINDER: {
		WEB: {
			type: "CHECK_IN_REMINDER",
			channel: "WEB",
			title: "📅 打卡提醒",
			message: "今天还没有打卡哦，记得分享你的开发进度！",
			actionUrl: "/events/{eventId}",
		},
		EMAIL: {
			type: "CHECK_IN_REMINDER",
			channel: "EMAIL",
			title: "📅 Building Public 打卡提醒",
			message:
				"你好！今天还没有打卡哦，记得在 {eventTitle} 中分享你的开发进度。坚持打卡，完成21天挑战！",
			actionUrl: "/events/{eventId}",
		},
		PUSH: {
			type: "CHECK_IN_REMINDER",
			channel: "PUSH",
			title: "⏰ 别忘了打卡",
			message: "今天的开发进度如何？快来打卡分享吧！",
			actionUrl: "/events/{eventId}",
		},
	},
	LIKE_RECEIVED: {
		WEB: {
			type: "LIKE_RECEIVED",
			channel: "WEB",
			title: "👍 收到点赞",
			message: "{userName} 点赞了你第{day}天的打卡",
			actionUrl: "/events/{eventId}#feed",
		},
		EMAIL: {
			type: "LIKE_RECEIVED",
			channel: "EMAIL",
			title: "👍 你的打卡收到了点赞",
			message:
				"{userName} 点赞了你在 {eventTitle} 第{day}天的打卡。你的努力得到了认可，继续加油！",
			actionUrl: "/events/{eventId}#feed",
		},
		PUSH: {
			type: "LIKE_RECEIVED",
			channel: "PUSH",
			title: "👍 收到点赞",
			message: "{userName} 点赞了你的打卡",
			actionUrl: "/events/{eventId}#feed",
		},
	},
	COMMENT_RECEIVED: {
		WEB: {
			type: "COMMENT_RECEIVED",
			channel: "WEB",
			title: "💬 收到评论",
			message: "{userName} 评论了你第{day}天的打卡",
			actionUrl: "/events/{eventId}#feed",
		},
		EMAIL: {
			type: "COMMENT_RECEIVED",
			channel: "EMAIL",
			title: "💬 你的打卡收到了评论",
			message:
				'{userName} 在 {eventTitle} 中评论了你第{day}天的打卡："{commentContent}"',
			actionUrl: "/events/{eventId}#feed",
		},
		PUSH: {
			type: "COMMENT_RECEIVED",
			channel: "PUSH",
			title: "💬 收到评论",
			message: "{userName} 评论了你的打卡",
			actionUrl: "/events/{eventId}#feed",
		},
	},
	CHALLENGE_COMPLETED: {
		WEB: {
			type: "CHALLENGE_COMPLETED",
			channel: "WEB",
			title: "🎉 挑战完成",
			message: "恭喜！你已完成 {eventTitle} 挑战",
			actionUrl: "/events/{eventId}/certificate",
		},
		EMAIL: {
			type: "CHALLENGE_COMPLETED",
			channel: "EMAIL",
			title: "🎉 恭喜完成 Building Public 挑战！",
			message:
				"恭喜你成功完成了 {eventTitle}！你在21天中坚持打卡 {checkInCount} 次，展现了出色的毅力和执行力。",
			actionUrl: "/events/{eventId}/certificate",
		},
		PUSH: {
			type: "CHALLENGE_COMPLETED",
			channel: "PUSH",
			title: "🎉 挑战完成！",
			message: "恭喜完成 {eventTitle}",
			actionUrl: "/events/{eventId}/certificate",
		},
	},
	CHALLENGE_STARTED: {
		WEB: {
			type: "CHALLENGE_STARTED",
			channel: "WEB",
			title: "🚀 挑战开始",
			message: "{eventTitle} 已经开始，开始你的21天开发之旅！",
			actionUrl: "/events/{eventId}",
		},
		EMAIL: {
			type: "CHALLENGE_STARTED",
			channel: "EMAIL",
			title: "🚀 Building Public 挑战开始了！",
			message:
				"{eventTitle} 已经正式开始！准备好开始你的21天开发之旅了吗？记得每天打卡分享你的进度。",
			actionUrl: "/events/{eventId}",
		},
		PUSH: {
			type: "CHALLENGE_STARTED",
			channel: "PUSH",
			title: "🚀 挑战开始",
			message: "{eventTitle} 开始了！",
			actionUrl: "/events/{eventId}",
		},
	},
};
