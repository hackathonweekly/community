"use client";
import { config } from "@/config";
import { LocaleLink } from "@i18n/routing";
import { useContactFormConfig } from "@/hooks/useSiteConfig";
import { Logo } from "@/components/shared/Logo";
import { useTranslations } from "next-intl";

export function Footer() {
	const t = useTranslations();
	const { data: contactFormConfig } = useContactFormConfig();
	return (
		<footer className="border-t py-8 text-foreground/60 text-sm pb-24 md:pb-8">
			<div className="container grid grid-cols-1 gap-6 lg:grid-cols-3">
				<div>
					<Logo className="opacity-70 grayscale" />
					<p className="mt-3 text-sm opacity-70">
						© {new Date().getFullYear()} {config.appName}.{" "}
						{t("common.menu.allrights")}
						<a
							href="https://01mvp.com"
							target="_blank"
							rel="noopener noreferrer"
						>
							Built with Love
						</a>
						.
					</p>
					<a
						href="https://beian.miit.gov.cn"
						target="_blank"
						rel="noopener noreferrer"
						className="mt-2 block opacity-70 hover:opacity-100"
					>
						粤ICP备2022122081号-3
					</a>
					<a
						href="http://www.beian.gov.cn/portal/registerSystemInfo?recordcode=44030002007778"
						target="_blank"
						rel="noopener noreferrer"
						className="mt-1 block opacity-70 hover:opacity-100"
					>
						粤公网安备44030002007778号
					</a>
				</div>

				<div className="grid grid-cols-4 gap-4">
					<LocaleLink href="/blog" className="block">
						{t("common.menu.blog")}
					</LocaleLink>

					<a href="#features" className="block">
						{t("common.menu.features")}
					</a>

					<a href="/#pricing" className="block">
						{t("common.menu.pricing")}
					</a>

					<a href="/#faq" className="block">
						{t("common.menu.faq")}
					</a>

					<LocaleLink href="/changelog" className="block">
						{t("common.menu.changelog")}
					</LocaleLink>

					<LocaleLink href="/legal/privacy-policy" className="block">
						{t("common.menu.privacy")}
					</LocaleLink>

					<LocaleLink href="/legal/terms" className="block">
						{t("common.menu.terms")}
					</LocaleLink>

					{contactFormConfig.enabled && (
						<LocaleLink href="/contact" className="block">
							{t("common.menu.contact")}
						</LocaleLink>
					)}
				</div>

				{/* <div className="flex flex-col gap-2">
					<LocaleLink href="/legal/privacy-policy" className="block">
						{t("common.menu.privacy")}
					</LocaleLink>

					<LocaleLink href="/legal/terms" className="block">
						{t("common.menu.terms")}
					</LocaleLink>
				</div> */}
			</div>
		</footer>
	);
}
