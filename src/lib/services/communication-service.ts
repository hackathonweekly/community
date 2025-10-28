import type { CommunicationType } from "@prisma/client";

// 邮件发送服务接口
export interface EmailService {
	sendEmail(data: {
		to: string;
		subject: string;
		content: string;
		recipientName?: string;
	}): Promise<{
		success: boolean;
		messageId?: string;
		error?: string;
	}>;
}

// 短信发送服务接口
export interface SMSService {
	sendSMS(data: {
		to: string;
		content: string;
		recipientName?: string;
	}): Promise<{
		success: boolean;
		messageId?: string;
		error?: string;
	}>;
}

// 模拟邮件服务实现
class MockEmailService implements EmailService {
	async sendEmail(data: {
		to: string;
		subject: string;
		content: string;
		recipientName?: string;
	}) {
		// 模拟发送延迟
		await new Promise((resolve) => setTimeout(resolve, 100));

		// 模拟 5% 的失败率
		if (Math.random() < 0.05) {
			return {
				success: false,
				error: "邮件发送失败：服务器连接超时",
			};
		}

		console.log(`[模拟邮件发送] 
收件人: ${data.recipientName || "未知"} <${data.to}>
主题: ${data.subject}
内容: ${data.content.substring(0, 50)}...`);

		return {
			success: true,
			messageId: `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
		};
	}
}

// 模拟短信服务实现
class MockSMSService implements SMSService {
	async sendSMS(data: {
		to: string;
		content: string;
		recipientName?: string;
	}) {
		// 模拟发送延迟
		await new Promise((resolve) => setTimeout(resolve, 150));

		// 模拟 3% 的失败率
		if (Math.random() < 0.03) {
			return {
				success: false,
				error: "短信发送失败：号码格式不正确",
			};
		}

		console.log(`[模拟短信发送] 
收件人: ${data.recipientName || "未知"} (${data.to})
内容: ${data.content}`);

		return {
			success: true,
			messageId: `sms_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
		};
	}
}

// 实际的邮件服务实现 (使用现有的邮件系统)
class RealEmailService implements EmailService {
	async sendEmail(data: {
		to: string;
		subject: string;
		content: string;
		recipientName?: string;
	}) {
		try {
			// TODO: 集成现有的邮件发送系统
			// 这里应该调用项目中已有的邮件发送服务
			// 例如: src/lib/mail/ 中的邮件服务

			// 暂时使用模拟实现
			const mockService = new MockEmailService();
			return await mockService.sendEmail(data);
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : "邮件发送失败",
			};
		}
	}
}

// 实际的短信服务实现
class RealSMSService implements SMSService {
	async sendSMS(data: {
		to: string;
		content: string;
		recipientName?: string;
	}) {
		try {
			// TODO: 集成短信服务提供商 (例如: 腾讯云短信、阿里云短信等)
			// 需要配置相应的API密钥和模板

			// 暂时使用模拟实现
			const mockService = new MockSMSService();
			return await mockService.sendSMS(data);
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : "短信发送失败",
			};
		}
	}
}

// 通信服务工厂
export class CommunicationServiceFactory {
	private static emailService: EmailService;
	private static smsService: SMSService;

	static getEmailService(): EmailService {
		if (!CommunicationServiceFactory.emailService) {
			// 根据环境变量决定使用哪种实现
			if (
				process.env.NODE_ENV === "development" ||
				process.env.USE_MOCK_EMAIL === "true"
			) {
				CommunicationServiceFactory.emailService =
					new MockEmailService();
			} else {
				CommunicationServiceFactory.emailService =
					new RealEmailService();
			}
		}
		return CommunicationServiceFactory.emailService;
	}

	static getSMSService(): SMSService {
		if (!CommunicationServiceFactory.smsService) {
			// 根据环境变量决定使用哪种实现
			if (
				process.env.NODE_ENV === "development" ||
				process.env.USE_MOCK_SMS === "true"
			) {
				CommunicationServiceFactory.smsService = new MockSMSService();
			} else {
				CommunicationServiceFactory.smsService = new RealSMSService();
			}
		}
		return CommunicationServiceFactory.smsService;
	}

	static getService(type: CommunicationType): EmailService | SMSService {
		switch (type) {
			case "EMAIL":
				return CommunicationServiceFactory.getEmailService();
			case "SMS":
				return CommunicationServiceFactory.getSMSService();
			default:
				throw new Error(`不支持的通信类型: ${type}`);
		}
	}
}

// 批量发送服务
export class BatchCommunicationService {
	static async sendBatch(data: {
		type: CommunicationType;
		records: Array<{
			recordId: string;
			recipientEmail?: string;
			recipientPhone?: string;
			recipientName: string;
		}>;
		subject: string;
		content: string;
		onProgress?: (
			sent: number,
			total: number,
			current: { name: string; status: string },
		) => void;
	}) {
		const { type, records, subject, content, onProgress } = data;
		const service = CommunicationServiceFactory.getService(type);
		const results: Array<{
			recordId: string;
			success: boolean;
			messageId?: string;
			error?: string;
		}> = [];

		let sentCount = 0;

		for (const record of records) {
			try {
				let result: {
					success: boolean;
					messageId?: string;
					error?: string;
				};

				if (type === "EMAIL" && record.recipientEmail) {
					result = await (service as EmailService).sendEmail({
						to: record.recipientEmail,
						subject,
						content,
						recipientName: record.recipientName,
					});
				} else if (type === "SMS" && record.recipientPhone) {
					result = await (service as SMSService).sendSMS({
						to: record.recipientPhone,
						content: `${subject}\n\n${content}`, // 短信合并主题和内容
						recipientName: record.recipientName,
					});
				} else {
					result = {
						success: false,
						error: `缺少${type === "EMAIL" ? "邮箱" : "手机号"}信息`,
					};
				}

				results.push({
					recordId: record.recordId,
					...result,
				});

				if (result.success) {
					sentCount++;
				}

				// 报告进度
				if (onProgress) {
					onProgress(sentCount, records.length, {
						name: record.recipientName,
						status: result.success
							? "成功"
							: result.error || "失败",
					});
				}

				// 为了避免触发服务商的频率限制，添加小延迟
				if (records.length > 10) {
					await new Promise((resolve) => setTimeout(resolve, 50));
				}
			} catch (error) {
				results.push({
					recordId: record.recordId,
					success: false,
					error: error instanceof Error ? error.message : "发送失败",
				});

				if (onProgress) {
					onProgress(sentCount, records.length, {
						name: record.recipientName,
						status: "发送异常",
					});
				}
			}
		}

		return {
			results,
			summary: {
				total: records.length,
				success: results.filter((r) => r.success).length,
				failed: results.filter((r) => !r.success).length,
			},
		};
	}
}
