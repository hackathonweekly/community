"use client";

import { useBannerLayout } from "@/lib/hooks/use-banner-layout";
import { useLocalePathname } from "@i18n/routing";
import type { PropsWithChildren } from "react";

export function DynamicLayoutWrapper({ children }: PropsWithChildren) {
	const { publicMainPadding, appMainPadding } = useBannerLayout();
	const localePathname = useLocalePathname();

	// Pages that hide the NavBar should not reserve NavBar height.
	// Still respect BetaBanner height when it is visible.
	const shouldUseAppPadding =
		localePathname.startsWith("/events/") ||
		localePathname.startsWith("/eventsnew/") ||
		localePathname.startsWith("/projects/") ||
		localePathname.startsWith("/u/");

	const mainPadding = shouldUseAppPadding
		? appMainPadding
		: publicMainPadding;

	return (
		<main
			className={`min-h-screen transition-all duration-200 ${mainPadding}`}
		>
			{children}
		</main>
	);
}
