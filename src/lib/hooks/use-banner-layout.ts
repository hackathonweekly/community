"use client";

import { useBannerStore } from "@/lib/stores/banner-store";
import { useEffect, useMemo } from "react";

const BANNER_HEIGHT = 32; // Banner height in pixels

export function useBannerLayout() {
	const { isBetaBannerVisible, isHydrated } = useBannerStore();
	const isBannerVisible = isHydrated && isBetaBannerVisible;
	const bannerHeight = isBannerVisible ? BANNER_HEIGHT : 0;

	useEffect(() => {
		if (typeof document === "undefined") {
			return;
		}

		document.documentElement.style.setProperty(
			"--fd-banner-height-offset",
			isBannerVisible ? `${BANNER_HEIGHT}px` : "0px",
		);
	}, [isBannerVisible]);

	const styles = useMemo(() => {
		return {
			// Navbar positioning
			navbarTop: isBannerVisible ? "top-8" : "top-0", // 调整为 top-8 (32px)

			// Main content padding
			publicMainPadding: isBannerVisible ? "pt-20" : "pt-16", // navbar + banner (reduced)
			appMainPadding: isBannerVisible ? "pt-8" : "pt-0", // just banner (reduced)

			// CSS custom properties for dynamic calculations
			bannerHeightVar: `${bannerHeight}px`,
		};
	}, [bannerHeight, isBannerVisible]);

	return styles;
}
