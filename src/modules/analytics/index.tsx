// 根据环境变量选择统计服务
// 优先级: Umami > Google Analytics > Baidu Analytics
// 配置环境变量:
// - NEXT_PUBLIC_UMAMI_WEBSITE_ID (默认推荐)
// - NEXT_PUBLIC_GOOGLE_ANALYTICS_ID
// - NEXT_PUBLIC_BAIDU_ANALYTICS_ID

const provider = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID
	? "umami"
	: process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID
		? "google"
		: process.env.NEXT_PUBLIC_BAIDU_ANALYTICS_ID
			? "baidu"
			: null;

// Umami Analytics
export {
	AnalyticsScript as UmamiAnalyticsScript,
	useAnalytics as useUmamiAnalytics,
} from "./provider/umami";

// Google Analytics
export {
	AnalyticsScript as GoogleAnalyticsScript,
	useAnalytics as useGoogleAnalytics,
} from "./provider/google";

// Baidu Analytics
export {
	AnalyticsScript as BaiduAnalyticsScript,
	useAnalytics as useBaiduAnalytics,
} from "./provider/baidu";

// 默认导出（根据环境变量自动选择）
export function AnalyticsScript() {
	if (provider === "umami") {
		const { AnalyticsScript: Script } = require("./provider/umami");
		return Script();
	}
	if (provider === "google") {
		const { AnalyticsScript: Script } = require("./provider/google");
		return Script();
	}
	if (provider === "baidu") {
		const { AnalyticsScript: Script } = require("./provider/baidu");
		return Script();
	}
	return null;
}

export function useAnalytics() {
	if (provider === "umami") {
		const { useAnalytics: hook } = require("./provider/umami");
		return hook();
	}
	if (provider === "google") {
		const { useAnalytics: hook } = require("./provider/google");
		return hook();
	}
	if (provider === "baidu") {
		const { useAnalytics: hook } = require("./provider/baidu");
		return hook();
	}
	return {
		trackEvent: () => {},
	};
}
