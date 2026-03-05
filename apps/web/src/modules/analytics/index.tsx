"use client";

import {
	AnalyticsScript as UmamiAnalyticsScript,
	useAnalytics as useUmamiAnalytics,
} from "./provider/umami";
import {
	AnalyticsScript as GoogleAnalyticsScript,
	useAnalytics as useGoogleAnalytics,
} from "./provider/google";
import {
	AnalyticsScript as BaiduAnalyticsScript,
	useAnalytics as useBaiduAnalytics,
} from "./provider/baidu";

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

const AnalyticsScriptImpl =
	provider === "umami"
		? UmamiAnalyticsScript
		: provider === "google"
			? GoogleAnalyticsScript
			: provider === "baidu"
				? BaiduAnalyticsScript
				: null;

export const useAnalytics =
	provider === "umami"
		? useUmamiAnalytics
		: provider === "google"
			? useGoogleAnalytics
			: provider === "baidu"
				? useBaiduAnalytics
				: () => ({
						trackEvent: () => {},
					});

export function AnalyticsScript() {
	if (!AnalyticsScriptImpl) {
		return null;
	}

	return <AnalyticsScriptImpl />;
}

export {
	BaiduAnalyticsScript,
	GoogleAnalyticsScript,
	UmamiAnalyticsScript,
	useBaiduAnalytics,
	useGoogleAnalytics,
	useUmamiAnalytics,
};
