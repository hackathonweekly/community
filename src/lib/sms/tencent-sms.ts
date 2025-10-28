import { logger } from "@/lib/logs";

// 腾讯云短信服务配置接口
interface TencentSMSConfig {
	secretId: string;
	secretKey: string;
	region: string;
	sdkAppId: string;
	signName: string;
	templateId: string;
	eventApprovedTemplateId?: string; // 活动审核通过模板ID
	eventRejectedTemplateId?: string; // 活动审核拒绝模板ID
}

// 短信发送响应接口
interface SMSResponse {
	success: boolean;
	message?: string;
	requestId?: string;
}

/**
 * 腾讯云短信服务类
 */
export class TencentSMSService {
	private config: TencentSMSConfig;

	constructor(config: TencentSMSConfig) {
		this.config = config;
	}

	/**
	 * 发送验证码短信
	 * @param phoneNumber 手机号码（包含国家代码，如 +86）
	 * @param code 验证码
	 * @returns Promise<SMSResponse>
	 */
	async sendVerificationCode(
		phoneNumber: string,
		code: string,
	): Promise<SMSResponse> {
		try {
			// 导入腾讯云 SDK
			const tencentcloud = require("tencentcloud-sdk-nodejs");
			const SmsClient = tencentcloud.sms.v20210111.Client;

			// 实例化一个认证对象
			const clientConfig = {
				credential: {
					secretId: this.config.secretId,
					secretKey: this.config.secretKey,
				},
				region: this.config.region,
				profile: {
					httpProfile: {
						endpoint: "sms.tencentcloudapi.com",
					},
				},
			};

			// 实例化要请求产品的client对象
			const client = new SmsClient(clientConfig);

			// 处理手机号码格式
			const formattedPhone = this.formatPhoneNumber(phoneNumber);

			// 实例化一个请求对象
			const params = {
				PhoneNumberSet: [formattedPhone],
				SmsSdkAppId: this.config.sdkAppId,
				SignName: this.config.signName,
				TemplateId: this.config.templateId,
				TemplateParamSet: [code], // 验证码作为模板参数
			};

			// 通过client对象调用想要访问的接口
			const response = await client.SendSms(params);

			logger.info(`SMS sent successfully to ${phoneNumber}`, {
				requestId: response.RequestId,
				phoneNumber: formattedPhone,
			});

			return {
				success: true,
				requestId: response.RequestId,
				message: "验证码发送成功",
			};
		} catch (error) {
			logger.error(`Failed to send SMS to ${phoneNumber}:`, error);

			return {
				success: false,
				message:
					error instanceof Error ? error.message : "发送短信失败",
			};
		}
	}

	/**
	 * 格式化手机号码
	 * @param phoneNumber 原始手机号码
	 * @returns 格式化后的手机号码
	 */
	private formatPhoneNumber(phoneNumber: string): string {
		// 使用统一的格式化函数
		const { normalizePhoneNumber } = require("@/lib/utils/phone-format");
		return normalizePhoneNumber(phoneNumber);
	}

	/**
	 * 发送活动审核通知短信
	 * @param phoneNumber 手机号码（包含国家代码，如 +86）
	 * @param eventTitle 活动标题（不再使用，保留兼容性）
	 * @param status "APPROVED" 或 "REJECTED"
	 * @returns Promise<SMSResponse>
	 */
	async sendEventReviewNotification(
		phoneNumber: string,
		eventTitle: string,
		status: "APPROVED" | "REJECTED",
	): Promise<SMSResponse> {
		try {
			// 根据状态选择模板
			const templateId =
				status === "APPROVED"
					? this.config.eventApprovedTemplateId
					: this.config.eventRejectedTemplateId;

			if (!templateId) {
				throw new Error(
					`Missing template ID for ${status} notification`,
				);
			}

			// 导入腾讯云 SDK
			const tencentcloud = require("tencentcloud-sdk-nodejs");
			const SmsClient = tencentcloud.sms.v20210111.Client;

			// 实例化一个认证对象
			const clientConfig = {
				credential: {
					secretId: this.config.secretId,
					secretKey: this.config.secretKey,
				},
				region: this.config.region,
				profile: {
					httpProfile: {
						endpoint: "sms.tencentcloudapi.com",
					},
				},
			};

			// 实例化要请求产品的client对象
			const client = new SmsClient(clientConfig);

			// 处理手机号码格式
			const formattedPhone = this.formatPhoneNumber(phoneNumber);

			// 实例化一个请求对象 - 不传入任何模板参数
			const params = {
				PhoneNumberSet: [formattedPhone],
				SmsSdkAppId: this.config.sdkAppId,
				SignName: this.config.signName,
				TemplateId: templateId,
				// 不传入 TemplateParamSet，使用完全固定的模板
			};

			// 通过client对象调用想要访问的接口
			const response = await client.SendSms(params);

			logger.info(
				`Event review SMS sent successfully to ${phoneNumber}`,
				{
					requestId: response.RequestId,
					phoneNumber: formattedPhone,
					eventTitle, // 记录但不使用
					status,
				},
			);

			return {
				success: true,
				requestId: response.RequestId,
				message: `活动审核${status === "APPROVED" ? "通过" : "拒绝"}通知发送成功`,
			};
		} catch (error) {
			logger.error(
				`Failed to send event review SMS to ${phoneNumber}:`,
				error,
			);

			return {
				success: false,
				message:
					error instanceof Error
						? error.message
						: "发送活动审核通知短信失败",
			};
		}
	}

	/**
	 * 验证手机号码格式
	 * @param phoneNumber 手机号码
	 * @returns 是否有效
	 */
	static isValidPhoneNumber(phoneNumber: string): boolean {
		// 简单的手机号码验证（支持国际格式）
		const phoneRegex = /^\+?[1-9]\d{1,14}$/;
		return phoneRegex.test(phoneNumber.replace(/\s/g, ""));
	}
}

/**
 * 创建腾讯云短信服务实例
 */
export function createTencentSMSService(): TencentSMSService {
	const config: TencentSMSConfig = {
		secretId: process.env.TENCENT_CLOUD_SECRET_ID!,
		secretKey: process.env.TENCENT_CLOUD_SECRET_KEY!,
		region: process.env.TENCENT_SMS_REGION || "ap-guangzhou",
		sdkAppId: process.env.TENCENT_SMS_SDK_APP_ID!,
		signName: process.env.TENCENT_SMS_SIGN_NAME!,
		templateId: process.env.TENCENT_SMS_TEMPLATE_ID!,
		eventApprovedTemplateId:
			process.env.TENCENT_SMS_EVENT_APPROVED_TEMPLATE_ID,
		eventRejectedTemplateId:
			process.env.TENCENT_SMS_EVENT_REJECTED_TEMPLATE_ID,
	};

	// 验证必需的环境变量
	const requiredEnvVars = [
		"TENCENT_CLOUD_SECRET_ID",
		"TENCENT_CLOUD_SECRET_KEY",
		"TENCENT_SMS_SDK_APP_ID",
		"TENCENT_SMS_SIGN_NAME",
		"TENCENT_SMS_TEMPLATE_ID",
	];

	for (const envVar of requiredEnvVars) {
		if (!process.env[envVar]) {
			throw new Error(`Missing required environment variable: ${envVar}`);
		}
	}

	return new TencentSMSService(config);
}

/**
 * 发送验证码的便捷函数
 * @param phoneNumber 手机号码
 * @param code 验证码
 * @returns Promise<SMSResponse>
 */
export async function sendVerificationCodeSMS(
	phoneNumber: string,
	code: string,
): Promise<SMSResponse> {
	const smsService = createTencentSMSService();
	return smsService.sendVerificationCode(phoneNumber, code);
}

/**
 * 发送活动审核通知的便捷函数
 * @param phoneNumber 手机号码
 * @param eventTitle 活动标题
 * @param status "APPROVED" 或 "REJECTED"
 * @returns Promise<SMSResponse>
 */
export async function sendEventReviewNotificationSMS(
	phoneNumber: string,
	eventTitle: string,
	status: "APPROVED" | "REJECTED",
): Promise<SMSResponse> {
	const smsService = createTencentSMSService();
	return smsService.sendEventReviewNotification(
		phoneNumber,
		eventTitle,
		status,
	);
}
