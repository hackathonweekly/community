"use client";

import { NavBar } from "@dashboard/shared/components/NavBar";
import { TabBar } from "@/modules/public/shared/components/TabBar";
import { cn } from "@/lib/utils";
import { config } from "@/config";
import type { PropsWithChildren } from "react";

export function AppWrapper({ children }: PropsWithChildren) {
	const { useSidebarLayout } = config.ui.saas;

	return (
		<div
			className={cn(
				"bg-[radial-gradient(farthest-corner_at_0%_0%,color-mix(in_oklch,var(--color-primary),transparent_95%)_0%,var(--color-background)_50%)] dark:bg-[radial-gradient(farthest-corner_at_0%_0%,color-mix(in_oklch,var(--color-primary),transparent_90%)_0%,var(--color-background)_50%)]",
			)}
		>
			<NavBar />
			<div
				className={cn(
					"flex min-h-[calc(100vh)]",
					useSidebarLayout ? "md:ml-[280px]" : "md:ml-0",
				)}
			>
				<main
					className={cn(
						"py-6 border bg-card px-4 md:p-8 min-h-full w-full",
					)}
				>
					<div className="container px-0">{children}</div>
				</main>
			</div>
			<TabBar />
		</div>
	);
}
