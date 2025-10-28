import { config } from "@/config";
import { DocsLayout } from "fumadocs-ui/layouts/docs";
import { getTranslations } from "next-intl/server";
import type { PropsWithChildren } from "react";
import { docsSource } from "../../../../docs-source";

export default async function DocumentationLayout({
	children,
	params,
}: PropsWithChildren<{
	params: Promise<{ locale: string }>;
}>) {
	const t = await getTranslations();
	const { locale } = await params;
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
		<DocsLayout
			tree={tree}
			i18n={false}
			githubUrl="https://github.com/hackathonweekly"
			nav={{
				title: <strong>{t("documentation.title")}</strong>,
				url: `/${locale}/docs`,
			}}
			sidebar={{
				defaultOpenLevel: 0,
				collapsible: true,
				tabs: false,
			}}
			containerProps={{
				className: "pb-16 md:pb-0",
			}}
		>
			{children}
		</DocsLayout>
	);
}
