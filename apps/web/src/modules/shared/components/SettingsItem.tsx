import { cn } from "@community/lib-shared/utils";
import type { PropsWithChildren, ReactNode } from "react";

export function SettingsItem({
	children,
	title,
	description,
	danger,
	layout = "split",
}: PropsWithChildren<{
	title: string | ReactNode;
	description?: string | ReactNode;
	danger?: boolean;
	layout?: "split" | "stacked";
}>) {
	const isStacked = layout === "stacked";

	return (
		<section
			className={cn(
				"@container rounded-lg border bg-card",
				"border-border",
				"p-2.5 sm:p-3 shadow-sm",
				danger &&
					"border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/20",
			)}
		>
			<div
				className={cn(
					"grid grid-cols-1 gap-3",
					isStacked
						? "md:gap-4"
						: "md:grid-cols-[minmax(180px,240px)_minmax(0,1fr)] md:gap-6",
				)}
			>
				<div
					className={cn(
						"flex flex-col gap-1",
						isStacked && "md:max-w-2xl",
					)}
				>
					<h3
						className={cn(
							"m-0 font-brand font-bold leading-tight text-sm text-foreground",
							danger && "text-red-600 dark:text-red-400",
						)}
					>
						{title}
					</h3>
					{description && (
						<p className="m-0 text-xs text-muted-foreground leading-relaxed">
							{description}
						</p>
					)}
				</div>
				<div className="min-w-0">
					<div className="space-y-3 text-sm text-foreground">
						{children}
					</div>
				</div>
			</div>
		</section>
	);
}
