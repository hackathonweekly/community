"use client";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useLocale, useTranslations } from "next-intl";

export function Footer() {
	const t = useTranslations();
	const locale = useLocale();
	return (
		<footer
			className={cn(
				"container max-w-6xl py-6 text-center text-foreground/60 text-xs pb-24 md:pb-6",
			)}
		>
			<span>
				<a
					href="https://01mvp.com"
					target="_blank"
					rel="noopener noreferrer"
				>
					Built with Love
				</a>
			</span>
			<span className="opacity-50"> | </span>
			<Link href={`/${locale}/legal/privacy-policy`}>
				{t("common.menu.privacy")}
			</Link>
			<span className="opacity-50"> | </span>
			<Link href={`/${locale}/legal/terms`}>
				{t("common.menu.terms")}
			</Link>
		</footer>
	);
}
