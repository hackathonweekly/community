import { Children, type ReactNode } from "react";

import { cn } from "@community/lib-shared/utils";

type SettingsListProps = {
	children: ReactNode;
	className?: string;
	columns?: 1 | 2;
	bleed?: boolean;
};

export function SettingsList({
	children,
	className,
	columns = 1,
	bleed = false,
}: SettingsListProps) {
	const items = Children.toArray(children).filter(Boolean);
	const layoutClass =
		columns === 2
			? "grid gap-3 sm:gap-4 md:grid-cols-2"
			: "flex flex-col gap-3 sm:gap-4";

	return (
		<div className={cn(layoutClass, className)}>
			{items.map((child, index) => (
				<div
					key={`settings-list-item-${index}`}
					className={cn(bleed ? "-mx-2 md:mx-0" : undefined)}
				>
					{child}
				</div>
			))}
		</div>
	);
}
