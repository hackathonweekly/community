"use client";

import { useCallback, useState } from "react";
import { Badge } from "@community/ui/ui/badge";
import { UserAvatar } from "@community/ui/shared/UserAvatar";
import { CommentSection } from "@community/ui/ui/comments";
import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { POST_CHANNELS, type PostChannelKey } from "../lib/post-channels";
import { PostInteractions } from "./PostInteractions";
import { usePostDetail } from "../hooks/use-posts";
import { useSession } from "@community/lib-client/auth/client";
import { Loader2 } from "lucide-react";

interface PostDetailProps {
	postId: string;
}

export function PostDetail({ postId }: PostDetailProps) {
	const { data: post, isLoading } = usePostDetail(postId);
	const { data: session } = useSession();
	const [commentCount, setCommentCount] = useState<number | null>(null);
	const queryClient = useQueryClient();

	const handleCountChange = useCallback(
		(count: number) => {
			setCommentCount(count);
			// Sync comment count back to feed cache so PostCard shows updated count
			queryClient.setQueriesData(
				{ queryKey: ["posts", "feed"] },
				(oldData: any) => {
					if (!oldData?.pages) return oldData;
					return {
						...oldData,
						pages: oldData.pages.map((page: any) => ({
							...page,
							items: page.items?.map((p: any) =>
								p.id === postId
									? { ...p, commentCount: count }
									: p,
							),
						})),
					};
				},
			);
		},
		[postId, queryClient],
	);

	if (isLoading) {
		return (
			<div className="flex justify-center py-12">
				<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
			</div>
		);
	}

	if (!post) {
		return (
			<div className="py-12 text-center text-muted-foreground">
				帖子不存在或已被删除
			</div>
		);
	}

	const channel = POST_CHANNELS[post.channel as PostChannelKey];
	const ChannelIcon = channel?.icon;

	return (
		<div className="mx-auto max-w-2xl space-y-6">
			{/* Author header */}
			<div className="flex items-center gap-3">
				<Link
					href={post.user.username ? `/u/${post.user.username}` : "#"}
				>
					<UserAvatar
						name={post.user.name}
						avatarUrl={post.user.image}
						className="h-10 w-10"
					/>
				</Link>
				<div>
					<div className="flex items-center gap-2">
						<span className="font-medium">{post.user.name}</span>
						{channel && (
							<Badge
								variant="secondary"
								className="gap-1 px-1.5 py-0 text-[10px]"
							>
								{ChannelIcon && (
									<ChannelIcon
										className={`h-3 w-3 ${channel.color}`}
									/>
								)}
								{channel.label}
							</Badge>
						)}
					</div>
					<span className="text-xs text-muted-foreground">
						{new Date(post.createdAt).toLocaleString("zh-CN")}
					</span>
				</div>
			</div>

			{/* Title */}
			{post.title && (
				<h1 className="font-brand text-2xl font-bold">{post.title}</h1>
			)}

			{/* Content */}
			<div className="whitespace-pre-wrap text-foreground/90">
				{post.content}
			</div>

			{/* Images */}
			{post.images?.length > 0 && (
				<div className="grid gap-2">
					{post.images.map((img: string, i: number) => (
						<img
							key={i}
							src={img}
							alt=""
							className="w-full rounded-lg"
							loading="lazy"
						/>
					))}
				</div>
			)}

			{/* Linked entities */}
			{post.linkedProject && (
				<Link
					href={`/projects/${post.linkedProject.shortId || post.linkedProject.id}`}
					className="block rounded-lg border border-border bg-muted/50 p-3 text-sm hover:bg-muted"
				>
					关联项目: {post.linkedProject.title}
				</Link>
			)}

			{/* Interactions */}
			<div className="border-t border-border pt-4">
				<PostInteractions
					postId={post.id}
					likeCount={post.likeCount}
					commentCount={commentCount ?? post.commentCount}
					isLiked={post.likes?.length > 0}
					isBookmarked={post.bookmarks?.length > 0}
				/>
			</div>

			{/* Comments */}
			<div className="mt-6">
				<CommentSection
					entityType="POST"
					entityId={post.id}
					currentUserId={session?.user?.id}
					placeholder="说说你的想法..."
					showStats={true}
					allowReplies={true}
					onCountChange={handleCountChange}
				/>
			</div>
		</div>
	);
}
