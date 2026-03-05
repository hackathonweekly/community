"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

export function PageHeader({
	title,
	subtitle,
	action,
	backHref,
	backLabel = "返回",
}: {
	title: string;
	subtitle?: string;
	action?: ReactNode;
	backHref?: string;
	backLabel?: string;
}) {
	return (
		<>
			{/* Mobile sticky header with back button */}
			{backHref && (
				<nav className="sticky top-0 z-40 flex h-12 items-center gap-3 border-b border-border bg-background/95 px-4 backdrop-blur md:hidden">
					<Link
						href={backHref}
						className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-accent"
						aria-label={backLabel}
					>
						<ArrowLeft className="h-4 w-4" />
					</Link>
					<span className="flex-1 truncate text-sm font-semibold text-foreground">
						{title}
					</span>
				</nav>
			)}

			{/* Desktop header */}
			<div className={backHref ? "mb-5 hidden md:block" : "mb-5"}>
				<div className="flex flex-col items-start justify-between gap-3 md:flex-row md:items-end">
					<div className="space-y-1">
						{backHref && (
							<Link
								href={backHref}
								className="mb-2 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
							>
								<ArrowLeft className="h-3.5 w-3.5" />
								{backLabel}
							</Link>
						)}
						<h2 className="font-brand text-2xl font-bold leading-none tracking-tight text-foreground lg:text-3xl">
							{title}
						</h2>
						{subtitle && (
							<p className="max-w-2xl text-sm leading-relaxed text-muted-foreground dark:text-muted-foreground">
								{subtitle}
							</p>
						)}
					</div>
					{action && <div className="w-full md:w-auto">{action}</div>}
				</div>
			</div>
		</>
	);
}
