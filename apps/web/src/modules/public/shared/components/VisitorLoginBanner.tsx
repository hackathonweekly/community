"use client";

import { cn } from "@community/lib-shared/utils";
import { Button } from "@community/ui/ui/button";
import { ArrowRightIcon } from "@heroicons/react/24/outline";
import { useTranslations } from "next-intl";
import Link from "next/link";

interface VisitorLoginBannerProps {
	href: string;
	className?: string;
}

export function VisitorLoginBanner({
	href,
	className,
}: VisitorLoginBannerProps) {
	const t = useTranslations("visitorLoginBanner");

	return (
		<div
			className={cn(
				"mb-4 rounded-xl border border-border bg-muted/40 px-4 py-3 lg:hidden",
				className,
			)}
		>
			<p className="text-sm font-semibold text-foreground">
				{t("title")}
			</p>
			<p className="mt-1 text-xs text-muted-foreground">
				{t("description")}
			</p>
			<Button asChild size="sm" variant="secondary" className="mt-3 h-8">
				<Link href={href}>
					{t("cta")}
					<ArrowRightIcon className="ml-1 h-3.5 w-3.5" />
				</Link>
			</Button>
		</div>
	);
}
