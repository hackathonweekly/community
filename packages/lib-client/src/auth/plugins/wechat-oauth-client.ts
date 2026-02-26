/**
 * 微信OAuth客户端插件
 *
 * 提供客户端的微信登录功能，包括：
 * 1. 设备检测和自动选择合适的provider
 * 2. 便捷的登录方法
 * 3. 与Better Auth客户端的完整集成
 */

import { getWeChatProviderId } from "@community/lib-shared/utils/wechat-environment";
import type { BetterAuthClientPlugin } from "better-auth/client";

export interface WeChatSignInOptions {
	/** 登录成功后的回调URL */
	callbackURL?: string;
	/** 错误回调URL */
	errorCallbackURL?: string;
	/** 新用户回调URL */
	newUserCallbackURL?: string;
	/** 是否禁用重定向 */
	disableRedirect?: boolean;
	/** 强制指定provider类型 */
	forceProvider?: "wechat-pc" | "wechat-mobile";
}

export function wechatOAuthClient(): BetterAuthClientPlugin {
	return {
		id: "wechat-oauth-client",

		// 扩展authClient的方法
		getActions: ($fetch) => ({
			/**
			 * 微信登录 - 自动检测设备类型
			 */
			signInWithWeChat: async (options: WeChatSignInOptions = {}) => {
				// 确定使用哪个provider
				const providerId =
					options.forceProvider || getWeChatProviderId();

				// 调用Better Auth的OAuth登录
				return $fetch("/sign-in/oauth2", {
					method: "POST",
					body: {
						providerId,
						callbackURL:
							options.callbackURL ||
							`${window?.location.origin}/`,
						errorCallbackURL: options.errorCallbackURL,
						newUserCallbackURL: options.newUserCallbackURL,
						disableRedirect: options.disableRedirect,
					},
				});
			},

			/**
			 * PC端微信登录（QR码）
			 */
			signInWithWeChatPC: async (
				options: Omit<WeChatSignInOptions, "forceProvider"> = {},
			) => {
				return $fetch("/sign-in/oauth2", {
					method: "POST",
					body: {
						providerId: "wechat-pc",
						callbackURL:
							options.callbackURL ||
							`${window?.location.origin}/`,
						errorCallbackURL: options.errorCallbackURL,
						newUserCallbackURL: options.newUserCallbackURL,
						disableRedirect: options.disableRedirect,
					},
				});
			},

			/**
			 * 移动端微信登录
			 */
			signInWithWeChatMobile: async (
				options: Omit<WeChatSignInOptions, "forceProvider"> = {},
			) => {
				return $fetch("/sign-in/oauth2", {
					method: "POST",
					body: {
						providerId: "wechat-mobile",
						callbackURL:
							options.callbackURL ||
							`${window?.location.origin}/`,
						errorCallbackURL: options.errorCallbackURL,
						newUserCallbackURL: options.newUserCallbackURL,
						disableRedirect: options.disableRedirect,
					},
				});
			},

			/**
			 * PC端微信账号链接（QR码）
			 */
			linkWeChatPC: async (
				options: Omit<WeChatSignInOptions, "forceProvider"> = {},
			) => {
				return $fetch("/link-social", {
					method: "POST",
					body: {
						provider: "wechat-pc",
						callbackURL:
							options.callbackURL ||
							`${window?.location.origin}${window?.location.pathname}`,
						errorCallbackURL: options.errorCallbackURL,
						disableRedirect: options.disableRedirect,
					},
				});
			},

			/**
			 * 移动端微信账号链接
			 */
			linkWeChatMobile: async (
				options: Omit<WeChatSignInOptions, "forceProvider"> = {},
			) => {
				return $fetch("/link-social", {
					method: "POST",
					body: {
						provider: "wechat-mobile",
						callbackURL:
							options.callbackURL ||
							`${window?.location.origin}${window?.location.pathname}`,
						errorCallbackURL: options.errorCallbackURL,
						disableRedirect: options.disableRedirect,
					},
				});
			},

			/**
			 * 检查当前环境是否支持微信登录
			 */
			isWeChatLoginAvailable: () => {
				if (typeof window === "undefined") {
					return true; // SSR环境默认支持
				}

				const userAgent = window.navigator.userAgent;
				const isWeChat = /MicroMessenger/i.test(userAgent);
				const isMiniProgram = userAgent
					.toLowerCase()
					.includes("miniprogram");
				const isMobile =
					/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
						userAgent,
					);

				return {
					isWeChat,
					isMobile,
					isMiniProgram,
					weChatEnvironmentType: isMiniProgram
						? "miniprogram"
						: isWeChat
							? "wechat"
							: "none",
					recommendedProvider: getWeChatProviderId(userAgent),
					availableProviders: ["wechat-pc", "wechat-mobile"] as const,
				};
			},
		}),
	};
}
