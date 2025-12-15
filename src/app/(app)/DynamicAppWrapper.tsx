"use client";

import { useBannerLayout } from "@/lib/hooks/use-banner-layout";
import type { PropsWithChildren } from "react";

export function DynamicAppWrapper({ children }: PropsWithChildren) {
	const { appMainPadding } = useBannerLayout();

	return (
		<div className={`transition-all duration-200 ${appMainPadding}`}>
			{children}
		</div>
	);
}
