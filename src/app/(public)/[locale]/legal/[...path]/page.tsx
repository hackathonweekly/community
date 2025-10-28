import { localeRedirect } from "@i18n/routing";
import { PostContent } from "@/modules/public/blog/components/PostContent";
import {
	getActivePathFromUrlParam,
	getLocalizedDocumentWithFallback,
} from "@/lib/content";
import { allLegalPages } from "content-collections";
import { getLocale } from "next-intl/server";

// Enable ISR: Revalidate every 7 days for legal pages (content changes very rarely)
export const revalidate = 604800;

type Params = {
	path: string;
	locale: string;
};

export async function generateMetadata(props: {
	params: Promise<Params>;
}) {
	const params = await props.params;

	const { path } = params;

	const locale = await getLocale();
	const activePath = getActivePathFromUrlParam(path);
	const page = getLocalizedDocumentWithFallback(
		allLegalPages,
		activePath,
		locale,
	);

	return {
		title: page?.title,
		openGraph: {
			title: page?.title,
		},
	};
}

export default async function BlogPostPage(props: {
	params: Promise<Params>;
}) {
	const params = await props.params;

	const { path } = params;

	const locale = await getLocale();
	const activePath = getActivePathFromUrlParam(path);
	const page = getLocalizedDocumentWithFallback(
		allLegalPages,
		activePath,
		locale,
	);

	if (!page) {
		localeRedirect({ href: "/", locale });
	}

	const { title, mdx } = page;

	return (
		<div className="container max-w-6xl pt-32 pb-24">
			<div className="mx-auto mb-12 max-w-2xl">
				<h1 className="text-center font-bold text-4xl">{title}</h1>
			</div>

			<PostContent content={mdx} />
		</div>
	);
}
