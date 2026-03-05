"use client";

import Script from "next/script";

const umamiWebsiteId = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID as string;
const umamiScriptUrl =
	(process.env.NEXT_PUBLIC_UMAMI_SCRIPT_URL as string) ||
	"https://cloud.umami.is/script.js";

export function AnalyticsScript() {
	if (!umamiWebsiteId) {
		return null;
	}

	return (
		<Script defer src={umamiScriptUrl} data-website-id={umamiWebsiteId} />
	);
}

export function useAnalytics() {
	const trackEvent = (event: string, data?: Record<string, unknown>) => {
		if (typeof window === "undefined" || !(window as any).umami) {
			return;
		}

		(window as any).umami.track(event, data);
	};

	return {
		trackEvent,
	};
}
