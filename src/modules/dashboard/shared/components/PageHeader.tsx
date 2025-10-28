"use client";

import type { ReactNode } from "react";

export function PageHeader({
	title,
	subtitle,
	action,
}: {
	title: string;
	subtitle?: string;
	action?: ReactNode;
}) {
	return (
		<div className="mb-8">
			<div className="flex items-center justify-between">
				<div>
					<h2 className="font-bold text-2xl lg:text-3xl">{title}</h2>
					{subtitle && <p className="mt-1 opacity-60">{subtitle}</p>}
				</div>
				{action && <div>{action}</div>}
			</div>
		</div>
	);
}
