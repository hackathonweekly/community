import { getBaseUrl } from "@community/lib-shared/utils";
import { redirect } from "next/navigation";
import { PostContent } from "@/modules/public/blog/components/PostContent";
import { getPostBySlug } from "@/modules/public/blog/utils/lib/posts";
import { getActivePathFromUrlParam } from "@community/lib-shared/content";
import { getLocale, getTranslations } from "next-intl/server";
import Image from "next/image";
import Link from "next/link";

// Enable ISR: Revalidate every 24 hours for blog posts (content rarely changes)
export const revalidate = 86400;

type Params = {
	path: string;
};

export async function generateMetadata(props: { params: Promise<Params> }) {
	const params = await props.params;

	const { path } = params;

	const locale = await getLocale();
	const slug = getActivePathFromUrlParam(path);
	const post = await getPostBySlug(slug, { locale });

	return {
		title: post?.title,
		description: post?.excerpt,
		openGraph: {
			title: post?.title,
			description: post?.excerpt,
			images: post?.image
				? [
						post.image.startsWith("http")
							? post.image
							: new URL(post.image, getBaseUrl()).toString(),
					]
				: [],
		},
	};
}

export default async function BlogPostPage(props: { params: Promise<Params> }) {
	const { path } = await props.params;
	const locale = await getLocale();

	const t = await getTranslations();

	const slug = getActivePathFromUrlParam(path);
	const post = await getPostBySlug(slug, { locale });

	if (!post) {
		redirect("/blog");
	}

	const { title, date, authorName, authorImage, tags, image, mdx } = post;

	return (
		<div className="container max-w-6xl pt-32 pb-24">
			<div className="mx-auto max-w-2xl">
				<div className="mb-12">
					<Link href="/blog">&larr; {t("blog.back")}</Link>
				</div>

				<h1 className="font-bold text-4xl">{title}</h1>

				<div className="mt-4 flex items-center justify-start gap-6">
					{authorName && (
						<div className="flex items-center">
							{authorImage && (
								<div className="relative mr-2 size-8 overflow-hidden rounded-full">
									<Image
										src={authorImage}
										alt={authorName}
										fill
										sizes="96px"
										className="object-cover object-center"
									/>
								</div>
							)}
							<div>
								<p className="font-semibold text-sm opacity-50">
									{authorName}
								</p>
							</div>
						</div>
					)}

					<div className="mr-0 ml-auto">
						<p className="text-sm opacity-30">
							{Intl.DateTimeFormat("en-US").format(
								new Date(date),
							)}
						</p>
					</div>

					{tags && (
						<div className="flex flex-1 flex-wrap gap-2">
							{tags.map((tag) => (
								<span
									key={tag}
									className="font-semibold text-primary text-xs uppercase tracking-wider"
								>
									#{tag}
								</span>
							))}
						</div>
					)}
				</div>
			</div>

			{image && (
				<div className="relative mt-6 aspect-16/9 overflow-hidden rounded-xl">
					<Image
						src={image}
						alt={title}
						fill
						sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
						className="object-cover object-center"
					/>
				</div>
			)}

			<div className="pb-8">
				<PostContent content={mdx} />
			</div>
		</div>
	);
}
