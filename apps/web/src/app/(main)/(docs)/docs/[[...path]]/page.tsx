import { MDXContent } from "@content-collections/mdx/react";
import { Cards, Card } from "fumadocs-ui/components/card";
import { File, Files, Folder } from "fumadocs-ui/components/files";
import { ImageZoom } from "fumadocs-ui/components/image-zoom";
import { Step, Steps } from "fumadocs-ui/components/steps";
import { Tab, Tabs } from "fumadocs-ui/components/tabs";

import defaultMdxComponents from "fumadocs-ui/mdx";
import { DocsBody, DocsPage } from "fumadocs-ui/page";
import { getLocale, getTranslations } from "next-intl/server";

import { notFound } from "next/navigation";
import { docsSource } from "../../../../docs-source";

export default async function DocumentationPage(props: {
	params: Promise<{ path?: string[] }>;
}) {
	const params = await props.params;
	const locale = await getLocale();
	const page = docsSource.getPage(params.path, locale);

	if (!page) {
		notFound();
	}

	return (
		<DocsPage
			breadcrumb={{
				enabled: true,
				includePage: true,
				includeSeparator: true,
			}}
			tableOfContent={{
				enabled: true,
			}}
			toc={page.data.toc ?? []}
		>
			<DocsBody>
				<h1 className="text-foreground">{page.data.title}</h1>
				{page.data.description && (
					<p className="-mt-6 text-foreground/50 text-lg lg:text-xl">
						{page.data.description}
					</p>
				)}
				<MDXContent
					code={page.data.mdx}
					// @ts-expect-error
					components={{
						...defaultMdxComponents,
						Cards,
						Card,
						Tabs,
						Tab,
						Steps,
						Step,
						File,
						Folder,
						Files,
						img: (props) => (
							<ImageZoom
								{...(props as any)}
								className="rounded-lg border-4 border-secondary/10"
							/>
						),
					}}
				/>
			</DocsBody>
		</DocsPage>
	);
}

export async function generateMetadata(props: {
	params: Promise<{ path?: string[] }>;
}) {
	const t = await getTranslations();
	const params = await props.params;
	const locale = await getLocale();
	const page = docsSource.getPage(params.path, locale);

	if (!page) {
		notFound();
	}

	return {
		title: `${page.data.title} | ${t("documentation.title")}`,
		description: page.data.description,
	};
}
