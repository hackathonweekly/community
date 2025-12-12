import Link from "next/link";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";

interface SubmissionPageShellProps {
	eyebrow: string;
	title: string;
	backHref: string;
	backLabel: string;
	children: ReactNode;
}

export function SubmissionPageShell({
	eyebrow,
	title,
	backHref,
	backLabel,
	children,
}: SubmissionPageShellProps) {
	return (
		<div className="container mx-auto max-w-4xl space-y-5 py-8">
			<div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
				<div className="space-y-1">
					<p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
						{eyebrow}
					</p>
					<h1 className="text-xl font-semibold leading-tight">
						{title}
					</h1>
				</div>
				<Button
					variant="outline"
					size="sm"
					asChild
					className="self-start"
				>
					<Link href={backHref}>{backLabel}</Link>
				</Button>
			</div>

			<div className="space-y-5">{children}</div>
		</div>
	);
}
