import type { Post as ContentCollectionsPost } from "content-collections";

export type Post = ContentCollectionsPost & {
	path: string;
	locale: string;
	excerpt?: string;
	authorName?: string;
	authorImage?: string;
	body?: string;
};
