import { db } from "@/lib/database/prisma/client";
import { sendEmail } from "@/lib/mail";
import type { NotificationType } from "@prisma/client";

export class EmailNotificationProcessor {
	/**
	 * 处理待发送的邮件通知队列
	 */
	static async processEmailQueue(limit = 50) {
		try {
			const pendingEmails = await db.emailNotificationQueue.findMany({
				where: {
					status: "PENDING",
					scheduledAt: {
						lte: new Date(),
					},
				},
				include: {
					user: true,
					notification: true,
				},
				orderBy: [{ priority: "desc" }, { scheduledAt: "asc" }],
				take: limit,
			});

			console.log(`Processing ${pendingEmails.length} pending emails`);

			for (const emailJob of pendingEmails) {
				await EmailNotificationProcessor.processSingleEmail(emailJob);

				// 添加短暂延迟避免邮件服务商限流
				await new Promise((resolve) => setTimeout(resolve, 100));
			}

			console.log(`Completed processing ${pendingEmails.length} emails`);
		} catch (error) {
			console.error("Error processing email queue:", error);
		}
	}

	/**
	 * 处理单个邮件任务
	 */
	private static async processSingleEmail(emailJob: any) {
		try {
			// 更新状态为处理中
			await db.emailNotificationQueue.update({
				where: { id: emailJob.id },
				data: { status: "RETRY" },
			});

			const emailData = emailJob.emailData as any;
			const { notification, user } = emailData;

			const subject = EmailNotificationProcessor.getEmailSubject(
				notification.type,
				notification.title,
			);
			const htmlContent =
				EmailNotificationProcessor.generateEmailContent(emailData);

			// 发送邮件
			await sendEmail({
				to: user.email,
				subject,
				html: htmlContent,
			});

			// 更新为发送成功
			await db.emailNotificationQueue.update({
				where: { id: emailJob.id },
				data: {
					status: "SENT",
					sentAt: new Date(),
				},
			});

			console.log(`✅ Email sent to ${user.email}: ${subject}`);
		} catch (error) {
			console.error(
				`❌ Failed to send email to ${emailJob.user.email}:`,
				error,
			);

			// 更新重试计数和错误信息
			const newRetryCount = emailJob.retryCount + 1;
			const maxRetries = 3;

			await db.emailNotificationQueue.update({
				where: { id: emailJob.id },
				data: {
					status: newRetryCount >= maxRetries ? "FAILED" : "PENDING",
					retryCount: newRetryCount,
					errorMessage:
						error instanceof Error
							? error.message
							: "Unknown error",
					// 失败重试时延迟更长时间
					scheduledAt:
						newRetryCount < maxRetries
							? new Date(
									Date.now() +
										2 ** newRetryCount * 5 * 60 * 1000,
								) // 指数退避
							: undefined,
				},
			});
		}
	}

	/**
	 * 生成邮件主题
	 */
	private static getEmailSubject(
		type: NotificationType,
		title: string,
	): string {
		const prefixMap: Record<string, string> = {
			PROJECT_COMMENT: "📝",
			PROJECT_LIKE: "👍",
			ORGANIZATION_MEMBER_APPLICATION: "👥",
			ORGANIZATION_APPLICATION_RESULT: "✅",
			EVENT_REGISTRATION_RESULT: "🎫",
			EVENT_TIME_CHANGE: "⏰",
			EVENT_REMINDER: "🔔",
			ACCOUNT_SECURITY: "🔒",
			SYSTEM_ANNOUNCEMENT: "📢",
			USER_BOOKMARKED: "⭐",
		};

		const prefix = prefixMap[type] || "🔔";
		return `${prefix} ${title} | HackathonWeekly`;
	}

	/**
	 * 生成邮件内容
	 */
	private static generateEmailContent(emailData: any): string {
		const { notification, user, relatedUser } = emailData;

		const baseUrl =
			process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL;
		if (!baseUrl) {
			console.error(
				"Missing NEXT_PUBLIC_APP_URL or NEXT_PUBLIC_SITE_URL environment variable for email generation",
			);
			// 提供一个默认值以避免邮件完全失败
			const fallbackUrl = "https://hackathonweekly.com";
			console.warn(`Using fallback URL: ${fallbackUrl}`);
		}
		const emailBaseUrl = baseUrl || "https://hackathonweekly.com";

		return `
		<!DOCTYPE html>
		<html>
		<head>
			<meta charset="utf-8">
			<meta name="viewport" content="width=device-width, initial-scale=1">
			<title>${notification.title}</title>
			<style>
				body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; background-color: #f5f5f5; }
				.container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
				.header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
				.header h1 { margin: 0; font-size: 24px; }
				.content { padding: 30px; }
				.notification-type { display: inline-block; background: #e3f2fd; color: #1976d2; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; margin-bottom: 16px; }
				.title { font-size: 20px; font-weight: 600; margin: 0 0 16px 0; color: #333; }
				.message { font-size: 16px; margin-bottom: 24px; color: #666; }
				.action-button { display: inline-block; background: #667eea; color: white; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600; margin: 16px 0; }
				.user-info { display: flex; align-items: center; gap: 12px; margin: 20px 0; padding: 16px; background: #f8f9fa; border-radius: 8px; }
				.user-avatar { width: 40px; height: 40px; border-radius: 50%; background: #667eea; display: flex; align-items: center; justify-content: center; color: white; font-weight: 600; }
				.footer { padding: 20px 30px; border-top: 1px solid #eee; background: #f8f9fa; text-align: center; font-size: 14px; color: #666; }
				.footer a { color: #667eea; text-decoration: none; }
			</style>
		</head>
		<body>
			<div class="container">
				<div class="header">
					<h1>🏆 HackathonWeekly</h1>
				</div>
				<div class="content">
					<div class="notification-type">${EmailNotificationProcessor.getNotificationTypeLabel(notification.type)}</div>
					<h2 class="title">${notification.title}</h2>
					<div class="message">${notification.content}</div>
					
					${
						relatedUser
							? `
					<div class="user-info">
						<div class="user-avatar">${relatedUser.name.charAt(0).toUpperCase()}</div>
						<div>
							<div style="font-weight: 600;">${relatedUser.name}</div>
							${relatedUser.username ? `<div style="color: #666; font-size: 14px;">@${relatedUser.username}</div>` : ""}
						</div>
					</div>
					`
							: ""
					}
					
					${
						notification.actionUrl
							? `
					<a href="${emailBaseUrl}${notification.actionUrl}" class="action-button">查看详情</a>
					`
							: ""
					}
				</div>
				<div class="footer">
					<p>此邮件由系统自动发送，请勿直接回复。</p>
					<p>如需更改通知设置，请访问 <a href="${emailBaseUrl}/app/settings/notifications">通知设置</a></p>
					<p>© 2024 HackathonWeekly. All rights reserved.</p>
				</div>
			</div>
		</body>
		</html>
		`;
	}

	/**
	 * 获取通知类型的中文标签
	 */
	private static getNotificationTypeLabel(type: NotificationType): string {
		const labelMap: Record<string, string> = {
			PROJECT_COMMENT: "作品评论",
			PROJECT_LIKE: "作品点赞",
			ORGANIZATION_MEMBER_APPLICATION: "组织申请",
			ORGANIZATION_APPLICATION_RESULT: "申请结果",
			EVENT_REGISTRATION_RESULT: "活动报名",
			EVENT_TIME_CHANGE: "活动变更",
			EVENT_REMINDER: "活动提醒",
			ACCOUNT_SECURITY: "账户安全",
			SYSTEM_ANNOUNCEMENT: "系统公告",
			USER_BOOKMARKED: "用户收藏",
		};

		return labelMap[type] || "通知";
	}

	/**
	 * 清理过期的邮件队列记录
	 */
	static async cleanupOldEmails() {
		try {
			const cutoffDate = new Date();
			cutoffDate.setDate(cutoffDate.getDate() - 7); // 保留7天

			const result = await db.emailNotificationQueue.deleteMany({
				where: {
					OR: [
						{
							status: "SENT",
							sentAt: {
								lt: cutoffDate,
							},
						},
						{
							status: "FAILED",
							updatedAt: {
								lt: cutoffDate,
							},
						},
					],
				},
			});

			console.log(`Cleaned up ${result.count} old email queue records`);
		} catch (error) {
			console.error("Error cleaning up old emails:", error);
		}
	}
}
