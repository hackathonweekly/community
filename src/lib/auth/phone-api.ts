/**
 * 手机验证码API客户端
 * 使用Better Auth原生phoneNumber插件
 */

import { AppErrorHandler } from "../error/handler";
import { authClient } from "./client";

interface PhoneAPIResponse {
	success: boolean;
	message?: string;
	error?: string;
}

/**
 * 发送手机验证码
 * @param phoneNumber 完整手机号 (如: +8613800138000)
 * @param type 验证类型: "LOGIN" | "REGISTRATION"
 */
export async function sendPhoneOTP(
	phoneNumber: string,
	type: "LOGIN" | "REGISTRATION" = "LOGIN",
): Promise<{ error?: { message: string; retryAfter?: number } }> {
	try {
		const { error } = await authClient.phoneNumber.sendOtp({
			phoneNumber,
		});

		if (error) {
			// Check if it's a rate limit error and handle it specifically
			const rateLimitError = AppErrorHandler.handleRateLimitError(error);
			if (rateLimitError) {
				return {
					error: {
						message:
							rateLimitError.userMessage ||
							"发送验证码过于频繁，请稍后再试",
						retryAfter: rateLimitError.details?.retryAfter,
					},
				};
			}

			return {
				error: {
					message: error.message || "发送验证码失败",
				},
			};
		}

		return {};
	} catch (error) {
		console.error("Send OTP error:", error);

		// Check if it's a rate limit error
		const rateLimitError = AppErrorHandler.handleRateLimitError(error);
		if (rateLimitError) {
			return {
				error: {
					message:
						rateLimitError.userMessage ||
						"发送验证码过于频繁，请稍后再试",
					retryAfter: rateLimitError.details?.retryAfter,
				},
			};
		}

		return {
			error: {
				message: "发送验证码时发生网络错误",
			},
		};
	}
}

/**
 * 验证手机验证码
 * @param phoneNumber 完整手机号
 * @param code 6位验证码
 * @param type 验证类型
 * @param updatePhoneNumber 是否更新用户手机号 (用于绑定场景)
 */
export async function verifyPhoneOTP(
	phoneNumber: string,
	code: string,
	type: "LOGIN" | "REGISTRATION" = "LOGIN",
	updatePhoneNumber = false,
): Promise<{ data?: any; error?: { message: string; retryAfter?: number } }> {
	try {
		const { data, error } = await authClient.phoneNumber.verify({
			phoneNumber,
			code,
			// 如果是绑定场景，更新现有用户的手机号且不创建新会话
			updatePhoneNumber: type === "REGISTRATION" || updatePhoneNumber,
			disableSession: type === "REGISTRATION",
		});

		if (error) {
			// Check if it's a rate limit error and handle it specifically
			const rateLimitError = AppErrorHandler.handleRateLimitError(error);
			if (rateLimitError) {
				return {
					error: {
						message:
							rateLimitError.userMessage ||
							"验证请求过于频繁，请稍后再试",
						retryAfter: rateLimitError.details?.retryAfter,
					},
				};
			}

			return {
				error: {
					message: error.message || "验证码验证失败",
				},
			};
		}

		return {
			data,
		};
	} catch (error) {
		console.error("Verify OTP error:", error);

		// Check if it's a rate limit error
		const rateLimitError = AppErrorHandler.handleRateLimitError(error);
		if (rateLimitError) {
			return {
				error: {
					message:
						rateLimitError.userMessage ||
						"验证请求过于频繁，请稍后再试",
					retryAfter: rateLimitError.details?.retryAfter,
				},
			};
		}

		return {
			error: {
				message: "验证验证码时发生网络错误",
			},
		};
	}
}

/**
 * 获取手机验证状态
 */
export async function getPhoneVerificationStatus(): Promise<{
	authenticated: boolean;
	needsPhoneVerification: boolean;
	user?: {
		id: string;
		phoneNumber?: string;
		phoneNumberVerified?: boolean;
		email?: string;
		loginMethod: "wechat" | "email" | "phone";
	};
}> {
	try {
		// 使用 Better Auth 的 session 获取用户信息
		const { data: session } = await authClient.getSession();

		if (!session) {
			return {
				authenticated: false,
				needsPhoneVerification: false,
			};
		}

		const user = session.user;

		// 检查登录方式
		const hasEmailLogin =
			user.email &&
			!user.email.includes("@wechat.app") &&
			!user.email.includes("@sms.hackathonweekly.com");
		const hasSmsLogin = user.phoneNumber && user.phoneNumberVerified;
		const hasWechatLogin = user.email?.includes("@wechat.app");

		const loginMethod = hasWechatLogin
			? "wechat"
			: hasSmsLogin && !hasEmailLogin
				? "phone"
				: "email";

		// 基于配置决定是否需要手机验证
		// 这里可以根据你的 config.auth.requirePhoneVerification 逻辑来判断
		const needsPhoneVerification = false; // 先简化，后续可以根据配置调整

		return {
			authenticated: true,
			needsPhoneVerification,
			user: {
				id: user.id,
				phoneNumber: user.phoneNumber || undefined,
				phoneNumberVerified: user.phoneNumberVerified || false,
				email: user.email,
				loginMethod,
			},
		};
	} catch (error) {
		console.error("Check verification status error:", error);
		return {
			authenticated: false,
			needsPhoneVerification: false,
		};
	}
}
