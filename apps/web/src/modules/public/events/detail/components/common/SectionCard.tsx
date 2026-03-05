"use client";

import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@community/ui/ui/card";
import { Button } from "@community/ui/ui/button";

export function SectionCard({
	id,
	title,
	ctaLabel,
	ctaHref,
	ctaOnClick,
	ctaDisabled,
	children,
}: {
	id: string;
	title: string;
	ctaLabel?: string;
	ctaHref?: string;
	ctaOnClick?: () => void;
	ctaDisabled?: boolean;
	children: React.ReactNode;
}) {
	return (
		<Card
			id={id}
			className="scroll-mt-24 rounded-lg border border-border shadow-subtle"
		>
			<CardHeader className="flex flex-row items-center justify-between gap-3 border-b border-border pb-3">
				<CardTitle className="text-lg">{title}</CardTitle>
				{ctaLabel ? (
					<Button
						variant="outline"
						size="sm"
						className="rounded-full"
						disabled={ctaDisabled}
						onClick={ctaOnClick}
						asChild={Boolean(ctaHref)}
					>
						{ctaHref ? <a href={ctaHref}>{ctaLabel}</a> : ctaLabel}
					</Button>
				) : null}
			</CardHeader>
			<CardContent className="space-y-4 pt-3">{children}</CardContent>
		</Card>
	);
}
