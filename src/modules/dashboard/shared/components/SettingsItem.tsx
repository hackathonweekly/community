import { cn } from "@/lib/utils";
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
				"@container rounded-xl border border-border bg-card text-card-foreground",
				"px-6 py-6 shadow-sm md:px-8 md:py-8",
				danger && "border-destructive/50 bg-destructive/5",
			)}
		>
			<div
				className={cn(
					"grid grid-cols-1 gap-5",
					isStacked
						? "md:gap-6"
						: "md:grid-cols-[minmax(200px,280px)_minmax(0,1fr)] md:gap-10",
				)}
			>
				<div
					className={cn(
						"flex flex-col gap-2",
						isStacked && "md:max-w-2xl",
					)}
				>
					<h3
						className={cn(
							"m-0 font-semibold leading-tight text-sm text-foreground md:text-base",
							danger && "text-destructive",
						)}
					>
						{title}
					</h3>
					{description && (
						<p className="m-0 text-xs text-foreground/60 md:text-sm">
							{description}
						</p>
					)}
				</div>
				<div className="min-w-0">
					<div className="space-y-4 text-sm text-foreground md:text-base">
						{children}
					</div>
				</div>
			</div>
		</section>
	);
}
