"use client";

import { useBannerLayout } from "@/lib/hooks/use-banner-layout";
import { useLocalePathname } from "@i18n/routing";
import type { PropsWithChildren } from "react";

export function DynamicLayoutWrapper({ children }: PropsWithChildren) {
	const { publicMainPadding } = useBannerLayout();
	const localePathname = useLocalePathname();

	// Hide top padding for immersive detail pages (no navbar)
	const shouldRemovePadding =
		localePathname.startsWith("/events/") ||
		localePathname.startsWith("/projects/") ||
		localePathname.startsWith("/u/");

	return (
		<main
			className={`min-h-screen transition-all duration-200 ${shouldRemovePadding ? "" : publicMainPadding}`}
		>
			{children}
		</main>
	);
}
