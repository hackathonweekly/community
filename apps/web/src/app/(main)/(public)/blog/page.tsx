import { PostListItem } from "@/modules/public/blog/components/PostListItem";
import { getAllPosts } from "@/modules/public/blog/utils/lib/posts";
import { getLocale, getTranslations } from "next-intl/server";

export async function generateMetadata() {
	const t = await getTranslations();
	return {
		title: t("blog.title"),
	};
}

export default async function BlogListPage() {
	const locale = await getLocale();
	const t = await getTranslations();

	const posts = await getAllPosts();

	return (
		<div className="container max-w-6xl pt-16 pb-12 md:pt-20">
			<div className="mb-6 rounded-lg border border-border bg-card p-4 shadow-subtle md:p-5">
				<p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
					Blog
				</p>
				<h1 className="mt-1.5 font-brand text-2xl font-semibold tracking-tight md:text-3xl">
					{t("blog.title")}
				</h1>
				<p className="mt-1.5 text-sm text-muted-foreground">
					{t("blog.description")}
				</p>
			</div>

			<div className="grid gap-4 md:grid-cols-2">
				{posts
					.filter((post) => post.published && locale === post.locale)
					.sort(
						(a, b) =>
							new Date(b.date).getTime() -
							new Date(a.date).getTime(),
					)
					.map((post) => (
						<PostListItem post={post} key={post.path} />
					))}
			</div>
		</div>
	);
}
