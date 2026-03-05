/**
 * 微信环境检测工具函数
 * 用于检测当前是否在微信浏览器、小程序webview等环境中
 */

export type WeChatEnvironment = "miniprogram" | "wechat" | "none";
export type WeChatProviderType = "wechat-pc" | "wechat-mobile";

export interface WeChatEnvironmentInfo {
	/** 是否在微信浏览器中 */
	isWeChat: boolean;
	/** 是否在移动设备上 */
	isMobile: boolean;
	/** 是否在小程序webview中 */
	isMiniProgram: boolean;
	/** 微信环境类型 */
	environmentType: WeChatEnvironment;
	/** 推荐使用的provider类型 */
	recommendedProvider: WeChatProviderType;
	/** 用户代理字符串 */
	userAgent: string;
}

/**
 * 获取微信环境信息
 */
export function getWeChatEnvironmentInfo(
	userAgentOverride?: string,
): WeChatEnvironmentInfo {
	const userAgent =
		userAgentOverride ??
		(typeof window === "undefined" ? "" : window.navigator.userAgent);

	if (!userAgent) {
		return {
			isWeChat: false,
			isMobile: false,
			isMiniProgram: false,
			environmentType: "none",
			recommendedProvider: "wechat-pc",
			userAgent: "",
		};
	}

	const isWeChat = /MicroMessenger/i.test(userAgent);
	const isMiniProgram =
		userAgent.toLowerCase().includes("miniprogram") && isWeChat;
	const isMobile =
		/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
			userAgent,
		);

	let environmentType: WeChatEnvironment = "none";
	if (isMiniProgram) {
		environmentType = "miniprogram";
	} else if (isWeChat) {
		environmentType = "wechat";
	}

	// 小程序webview和微信移动端浏览器都使用mobile配置
	const recommendedProvider: WeChatProviderType =
		isMiniProgram || (isWeChat && isMobile) ? "wechat-mobile" : "wechat-pc";

	return {
		isWeChat,
		isMobile,
		isMiniProgram,
		environmentType,
		recommendedProvider,
		userAgent,
	};
}

/**
 * 判断是否应该使用移动端微信登录配置
 */
export function shouldUseMobileWeChatLogin(): boolean {
	const info = getWeChatEnvironmentInfo();
	return info.isMiniProgram || (info.isWeChat && info.isMobile);
}

/**
 * 获取微信登录的provider ID
 */
export function getWeChatProviderId(
	userAgentOverride?: string,
): WeChatProviderType {
	return getWeChatEnvironmentInfo(userAgentOverride).recommendedProvider;
}

/**
 * 检测是否在小程序webview中
 */
export function isWeChatMiniProgramWebview(): boolean {
	return getWeChatEnvironmentInfo().isMiniProgram;
}

/**
 * 检测是否在微信浏览器中
 */
export function isWeChatBrowser(): boolean {
	return getWeChatEnvironmentInfo().isWeChat;
}
