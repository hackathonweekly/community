import type { Metadata } from "next";
import { db } from "@community/lib-server/database";
import { PostDetail } from "@/modules/public/posts/components/PostDetail";

interface PostDetailPageProps {
	params: Promise<{ postId: string }>;
}

export async function generateMetadata({
	params,
}: PostDetailPageProps): Promise<Metadata> {
	const { postId } = await params;
	const post = await db.post.findUnique({
		where: { id: postId },
		select: { title: true, content: true },
	});

	const title = post?.title || post?.content?.slice(0, 50) || "帖子详情";

	return {
		title: `${title} - 社区动态`,
		description: post?.content?.slice(0, 160),
	};
}

export default async function PostDetailPage({ params }: PostDetailPageProps) {
	const { postId } = await params;

	return (
		<div className="mx-auto max-w-2xl px-4 py-5 pb-20 lg:px-8 lg:py-6 lg:pb-16">
			<PostDetail postId={postId} />
		</div>
	);
}
