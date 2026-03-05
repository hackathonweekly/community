import type { Metadata } from "next";
import { PostFeed } from "@/modules/public/posts/components/PostFeed";

export const metadata: Metadata = {
	title: "动态 - 社区",
	description: "浏览社区动态，分享想法、学习笔记和作品",
};

export default function PostsPage() {
	return (
		<div className="mx-auto max-w-2xl px-4 pb-20 pt-5 lg:px-8 lg:pb-16 lg:pt-6">
			<PostFeed />
		</div>
	);
}
