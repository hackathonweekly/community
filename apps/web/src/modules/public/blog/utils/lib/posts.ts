import type { Post } from "@/modules/public/blog/types";
import { allPosts } from "content-collections";

// Transform content collection posts to our Post type
function transformPost(post: (typeof allPosts)[number]): Post {
	// Extract locale and path from _meta
	// For posts, the file structure is: name.locale.mdx or name.mdx
	// _meta.path could be like "community-announcement.zh" or just "community-announcement"
	const fileName = post._meta.fileName.replace(/\.mdx?$/, "");
	const parts = fileName.split(".");

	// If filename has locale (e.g., "community-announcement.zh"), extract it
	const locale = parts.length > 1 ? parts[parts.length - 1] : "en";
	const path = parts.length > 1 ? parts.slice(0, -1).join(".") : fileName;

	return {
		...post,
		path,
		locale,
		body: post.mdx,
		excerpt: post.description, // Use description as excerpt
		authorName: post.author,
		authorImage: undefined, // Not in schema, can be added later
	};
}

export async function getAllPosts(): Promise<Post[]> {
	// ... add a custom loader here for your posts and map it to the post schema

	return Promise.resolve(allPosts.map(transformPost));
}

export async function getPostBySlug(
	slug: string,
	options?: {
		locale?: string;
	},
): Promise<Post | null> {
	// ... add a custom loader here for your posts and map it to the post schema

	const posts = allPosts.map(transformPost);
	return Promise.resolve(
		posts.find(
			(post) =>
				post.path === slug &&
				(!options?.locale || post.locale === options.locale),
		) ?? null,
	);
}
