// 设备检测工具函数
export function isMobileDevice(): boolean {
	if (typeof window === "undefined") {
		return false;
	}
	return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
		navigator.userAgent,
	);
}

export function isWechatBrowser(): boolean {
	if (typeof window === "undefined") {
		return false;
	}
	return /micromessenger/i.test(navigator.userAgent);
}
