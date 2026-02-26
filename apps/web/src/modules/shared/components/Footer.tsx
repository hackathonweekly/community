"use client";

import { config } from "@community/config";
import { cn } from "@community/lib-shared/utils";
import { useContactFormConfig } from "@/hooks/useSiteConfig";
import { Logo } from "@community/ui/shared/Logo";
import { useTranslations } from "next-intl";
import Link from "next/link";

interface FooterProps {
	variant?: "minimal" | "full";
}

export function Footer({ variant = "full" }: FooterProps) {
	const t = useTranslations();
	const { data: contactFormConfig } = useContactFormConfig();

	if (variant === "minimal") {
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
						Powered by 01MVP
					</a>
				</span>
				<span className="opacity-50"> | </span>
				<Link href="/legal/privacy-policy">
					{t("common.menu.privacy")}
				</Link>
				<span className="opacity-50"> | </span>
				<Link href="/legal/terms">{t("common.menu.terms")}</Link>
			</footer>
		);
	}

	return (
		<footer className="border-t border-border bg-background pb-24 pt-8 text-[11px] text-muted-foreground lg:pb-8">
			<div className="container flex flex-col gap-6">
				<div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
					<div>
						<Logo className="[&_img]:h-8 [&_img]:md:h-8" />
						<p className="mt-2">
							© {new Date().getFullYear()} {config.appName}.{" "}
							{t("common.menu.allrights")}
						</p>
					</div>
					<div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-semibold uppercase tracking-wider">
						<Link href="/blog">{t("common.menu.blog")}</Link>
						<Link href="/changelog">
							{t("common.menu.changelog")}
						</Link>
						<Link href="/legal/privacy-policy">
							{t("common.menu.privacy")}
						</Link>
						<Link href="/legal/terms">
							{t("common.menu.terms")}
						</Link>
						{contactFormConfig.enabled ? (
							<Link href="/contact">
								{t("common.menu.contact")}
							</Link>
						) : null}
					</div>
				</div>

				<div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px]">
					<a
						href="https://beian.miit.gov.cn"
						target="_blank"
						rel="noopener noreferrer"
						className="hover:text-foreground"
					>
						粤ICP备2022122081号-3
					</a>
					<a
						href="http://www.beian.gov.cn/portal/registerSystemInfo?recordcode=44030002007778"
						target="_blank"
						rel="noopener noreferrer"
						className="hover:text-foreground"
					>
						粤公网安备44030002007778号
					</a>
					<a
						href="https://01mvp.com"
						target="_blank"
						rel="noopener noreferrer"
						className="hover:text-foreground"
					>
						Powered by 01MVP
					</a>
				</div>
			</div>
		</footer>
	);
}
