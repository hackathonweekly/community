import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface PageHeroProps {
	title: ReactNode;
	description?: ReactNode;
	actions?: ReactNode;
	className?: string;
	descriptionClassName?: string;
	actionsClassName?: string;
}

export function PageHero({
	title,
	description,
	actions,
	className,
	descriptionClassName,
	actionsClassName,
}: PageHeroProps) {
	return (
		<div
			className={cn(
				"mb-6 md:mb-12 pt-2 md:pt-8 text-left md:text-center px-4 md:px-0",
				className,
			)}
		>
			<h1 className="mb-2 text-3xl sm:text-4xl md:text-5xl font-bold text-foreground">
				{title}
			</h1>
			{description ? (
				<p
					className={cn(
						"text-base md:text-lg text-muted-foreground max-w-2xl md:mx-auto",
						descriptionClassName,
					)}
				>
					{description}
				</p>
			) : null}
			{actions ? (
				<div
					className={cn(
						"mt-6 flex flex-col items-stretch gap-3 md:flex-row md:items-center md:justify-center",
						actionsClassName,
					)}
				>
					{actions}
				</div>
			) : null}
		</div>
	);
}
