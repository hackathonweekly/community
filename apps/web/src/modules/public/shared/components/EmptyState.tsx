import type { ReactNode } from "react";

interface EmptyStateProps {
	icon?: ReactNode;
	title: string;
	description?: string;
	action?: ReactNode;
}

export function EmptyState({
	icon,
	title,
	description,
	action,
}: EmptyStateProps) {
	return (
		<div className="rounded-lg border border-dashed border-border bg-card px-4 py-8 text-center">
			{icon ? (
				<div className="mx-auto mb-3 flex h-9 w-9 items-center justify-center rounded-md bg-muted text-muted-foreground">
					{icon}
				</div>
			) : null}
			<h3 className="font-brand text-lg font-bold tracking-tight text-foreground">
				{title}
			</h3>
			{description ? (
				<p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
					{description}
				</p>
			) : null}
			{action ? <div className="mt-4">{action}</div> : null}
		</div>
	);
}
