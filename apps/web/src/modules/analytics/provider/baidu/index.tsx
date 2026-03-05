"use client";

import Script from "next/script";

const baiduAnalyticsId = process.env.NEXT_PUBLIC_BAIDU_ANALYTICS_ID as string;

export function AnalyticsScript() {
	if (!baiduAnalyticsId) {
		return null;
	}

	return (
		<Script
			id="baidu-analytics"
			strategy="afterInteractive"
			dangerouslySetInnerHTML={{
				__html: `
var _hmt = _hmt || [];
(function() {
  var hm = document.createElement("script");
  hm.src = "https://hm.baidu.com/hm.js?${baiduAnalyticsId}";
  var s = document.getElementsByTagName("script")[0];
  s.parentNode.insertBefore(hm, s);
})();
`,
			}}
		/>
	);
}

export function useAnalytics() {
	const trackEvent = (event: string, data?: Record<string, unknown>) => {
		if (typeof window === "undefined" || !(window as any)._hmt) {
			return;
		}

		// 百度统计事件追踪
		// _hmt.push(['_trackEvent', category, action, opt_label, opt_value]);
		(window as any)._hmt.push([
			"_trackEvent",
			data?.category || "custom",
			event,
			data?.label || "",
			data?.value || "",
		]);
	};

	return {
		trackEvent,
	};
}
