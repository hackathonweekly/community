import type { CSSProperties, ReactNode } from "react";

import { cn } from "@community/lib-shared/utils";

type SidebarContentLayoutProps = {
	children: ReactNode;
	sidebar: ReactNode;
	sidebarPosition?: "left" | "right";
	sidebarOnTopMobile?: boolean;
	hideSidebarOnMobile?: boolean;
	stickySidebar?: boolean;
	stickyOffset?: number;
	sidebarWidth?: number | string;
	gap?: "sm" | "md" | "lg";
	wrapSidebar?: boolean;
	className?: string;
	contentClassName?: string;
	sidebarClassName?: string;
	sidebarInnerClassName?: string;
};

const GAP_CLASS_MAP: Record<
	NonNullable<SidebarContentLayoutProps["gap"]>,
	string
> = {
	sm: "gap-4",
	md: "gap-6",
	lg: "gap-8",
};

export function SidebarContentLayout({
	children,
	sidebar,
	sidebarPosition = "left",
	sidebarOnTopMobile = false,
	hideSidebarOnMobile = false,
	stickySidebar = true,
	stickyOffset = 96,
	sidebarWidth = "minmax(220px, 280px)",
	gap = "lg",
	wrapSidebar = true,
	className,
	contentClassName,
	sidebarClassName,
	sidebarInnerClassName,
}: SidebarContentLayoutProps) {
	const isRight = sidebarPosition === "right";
	const gapClass = GAP_CLASS_MAP[gap] ?? GAP_CLASS_MAP.lg;
	const sidebarWidthValue =
		typeof sidebarWidth === "number" ? `${sidebarWidth}px` : sidebarWidth;
	const gridTemplateColumns = isRight
		? `minmax(0, 1fr) ${sidebarWidthValue}`
		: `${sidebarWidthValue} minmax(0, 1fr)`;

	const stickyStyles: CSSProperties | undefined = stickySidebar
		? { top: stickyOffset }
		: undefined;

	const sidebarContent = wrapSidebar ? (
		<div
			className={cn(
				"rounded-lg border border-border/60 bg-background/80 p-3 shadow-sm backdrop-blur",
				sidebarInnerClassName,
			)}
		>
			{sidebar}
		</div>
	) : (
		<div className={sidebarInnerClassName}>{sidebar}</div>
	);

	const mobileSidebarOrderClass = sidebarOnTopMobile ? "order-1" : "order-2";
	const mobileContentOrderClass = sidebarOnTopMobile ? "order-2" : "order-1";
	const desktopSidebarOrderClass = isRight
		? "lg:order-2 lg:col-start-2"
		: "lg:order-1 lg:col-start-1";
	const desktopContentOrderClass = isRight
		? "lg:order-1 lg:col-start-1"
		: "lg:order-2 lg:col-start-2";

	return (
		<section
			className={cn("flex", "flex-col", gapClass, "lg:grid", className)}
			style={{ gridTemplateColumns }}
		>
			<div
				className={cn(
					"min-w-0",
					mobileContentOrderClass,
					desktopContentOrderClass,
					contentClassName,
				)}
			>
				{children}
			</div>

			<aside
				className={cn(
					hideSidebarOnMobile && "hidden lg:block",
					mobileSidebarOrderClass,
					desktopSidebarOrderClass,
					stickySidebar
						? "lg:sticky lg:self-start"
						: "lg:static lg:self-auto",
					sidebarClassName,
				)}
				style={stickyStyles}
			>
				{sidebarContent}
			</aside>
		</section>
	);
}
