/**
 * 检测是否在微信浏览器中
 */
export function isWeChatBrowser(): boolean {
	if (typeof window === "undefined") {
		return false;
	}

	const userAgent = window.navigator.userAgent.toLowerCase();
	return userAgent.includes("micromessenger");
}

/**
 * 检测是否在微信小程序webview中
 * 小程序webview的User-Agent特征：包含 MicroMessenger 和 miniProgram
 */
export function isWeChatMiniProgramWebview(): boolean {
	if (typeof window === "undefined") {
		return false;
	}

	const userAgent = window.navigator.userAgent.toLowerCase();
	// 检测小程序webview的特征
	return (
		userAgent.includes("micromessenger") &&
		userAgent.includes("miniprogram")
	);
}

/**
 * 检测微信环境类型
 */
export function getWeChatEnvironmentType(): "miniprogram" | "wechat" | "none" {
	if (typeof window === "undefined") {
		return "none";
	}

	const userAgent = window.navigator.userAgent.toLowerCase();

	if (!userAgent.includes("micromessenger")) {
		return "none";
	}

	if (userAgent.includes("miniprogram")) {
		return "miniprogram";
	}

	return "wechat";
}

/**
 * 检测设备类型（移动端/PC端）
 */
export function isMobileDevice(): boolean {
	if (typeof window === "undefined") {
		return false;
	}

	const userAgent = window.navigator.userAgent;
	return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
		userAgent,
	);
}
