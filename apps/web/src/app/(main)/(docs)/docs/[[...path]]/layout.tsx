import { config } from "@community/config";
import { TabBar } from "@/modules/public/shared/components/TabBar";
import { DocsLayout } from "fumadocs-ui/layouts/docs";
import { getLocale, getTranslations } from "next-intl/server";
import Image from "next/image";
import type { PropsWithChildren } from "react";
import { docsSource } from "../../../../docs-source";

export default async function DocumentationLayout({
	children,
}: PropsWithChildren) {
	const t = await getTranslations();
	const locale = await getLocale();
	const tree =
		docsSource.pageTree[locale] ??
		docsSource.pageTree[config.i18n.defaultLocale];

	if (!tree) {
		throw new Error(`Missing docs page tree for locale: ${locale}`);
	}

	if (!tree.$id) {
		tree.$id = `docs-${locale}`;
	}

	return (
		<>
			<div className="pb-20 lg:pb-0">
				<DocsLayout
					tree={tree}
					i18n={false}
					githubUrl="https://github.com/hackathonweekly/community"
					nav={{
						title: (
							<>
								<Image
									src="/images/logo-black.png"
									alt="Logo"
									width={120}
									height={32}
									className="dark:hidden"
								/>
								<Image
									src="/images/logo-white.png"
									alt="Logo"
									width={120}
									height={32}
									className="hidden dark:block"
								/>
							</>
						),
						url: "/",
					}}
					sidebar={{
						defaultOpenLevel: 0,
						collapsible: true,
						tabs: false,
					}}
				>
					{children}
				</DocsLayout>
			</div>
			<TabBar />
		</>
	);
}
