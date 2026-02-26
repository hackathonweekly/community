"use client";

import { Card } from "@community/ui/ui/card";
import { UserAvatar } from "@community/ui/shared/UserAvatar";
import { Badge } from "@community/ui/ui/badge";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { POST_CHANNELS, type PostChannelKey } from "../lib/post-channels";
import { PostInteractions } from "./PostInteractions";

interface PostCardProps {
	post: {
		id: string;
		title?: string | null;
		content: string;
		images: string[];
		channel: string;
		likeCount: number;
		commentCount: number;
		viewCount: number;
		pinned: boolean;
		createdAt: string;
		user: {
			id: string;
			name: string;
			username?: string | null;
			image?: string | null;
		};
		linkedProject?: {
			id: string;
			title: string;
			shortId?: string | null;
		} | null;
		linkedEvent?: {
			id: string;
			title: string;
			shortId?: string | null;
		} | null;
		likes?: { id: string }[];
		bookmarks?: { id: string }[];
	};
}

export function PostCard({ post }: PostCardProps) {
	const channel = POST_CHANNELS[post.channel as PostChannelKey];
	const ChannelIcon = channel?.icon;
	const timeAgo = getRelativeTime(post.createdAt);
	const router = useRouter();

	return (
		<Card className="overflow-hidden rounded-lg border border-border bg-card p-3 shadow-subtle transition-all duration-200 hover:shadow-lift sm:p-4">
			{/* Header: avatar + name + channel + time */}
			<div className="mb-3 flex items-center gap-2">
				<Link
					href={post.user.username ? `/u/${post.user.username}` : "#"}
				>
					<UserAvatar
						name={post.user.name}
						avatarUrl={post.user.image}
						className="h-8 w-8"
					/>
				</Link>
				<div className="flex flex-1 flex-col">
					<div className="flex items-center gap-2">
						<span className="text-sm font-medium">
							{post.user.name}
						</span>
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
						{post.pinned && (
							<Badge
								variant="destructive"
								className="px-1.5 py-0 text-[10px]"
							>
								置顶
							</Badge>
						)}
					</div>
					<span className="text-[11px] font-mono text-muted-foreground">
						{timeAgo}
					</span>
				</div>
			</div>

			{/* Content */}
			<Link href={`/posts/${post.id}`} className="block">
				{post.title && (
					<h3 className="mb-1 font-brand text-base font-bold">
						{post.title}
					</h3>
				)}
				<p className="line-clamp-4 whitespace-pre-wrap text-sm text-foreground/90">
					{post.content}
				</p>

				{/* Images */}
				{post.images.length > 0 && (
					<div
						className={`mt-3 grid gap-2 ${post.images.length === 1 ? "grid-cols-1" : post.images.length === 2 ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-3"}`}
					>
						{post.images.slice(0, 3).map((img, i) => (
							<div
								key={i}
								className="relative aspect-square overflow-hidden rounded-md bg-muted"
							>
								<img
									src={img}
									alt=""
									className="h-full w-full object-cover"
									loading="lazy"
								/>
								{i === 2 && post.images.length > 3 && (
									<div className="absolute inset-0 flex items-center justify-center bg-black/40 text-lg font-bold text-white">
										+{post.images.length - 3}
									</div>
								)}
							</div>
						))}
					</div>
				)}

				{/* Linked project/event */}
				{post.linkedProject && (
					<div className="mt-2 rounded-md border border-border/50 bg-muted/50 px-3 py-1.5 text-xs text-muted-foreground">
						关联项目: {post.linkedProject.title}
					</div>
				)}
				{post.linkedEvent && (
					<div className="mt-2 rounded-md border border-border/50 bg-muted/50 px-3 py-1.5 text-xs text-muted-foreground">
						关联活动: {post.linkedEvent.title}
					</div>
				)}
			</Link>

			{/* Interactions */}
			<div className="mt-3 border-t border-border/50 pt-2">
				<PostInteractions
					postId={post.id}
					likeCount={post.likeCount}
					commentCount={post.commentCount}
					isLiked={post.likes && post.likes.length > 0}
					isBookmarked={post.bookmarks && post.bookmarks.length > 0}
					onCommentClick={() => router.push(`/posts/${post.id}`)}
				/>
			</div>
		</Card>
	);
}

function getRelativeTime(dateStr: string): string {
	const now = Date.now();
	const date = new Date(dateStr).getTime();
	const diff = now - date;
	const minutes = Math.floor(diff / 60000);
	if (minutes < 1) return "刚刚";
	if (minutes < 60) return `${minutes}分钟前`;
	const hours = Math.floor(minutes / 60);
	if (hours < 24) return `${hours}小时前`;
	const days = Math.floor(hours / 24);
	if (days < 30) return `${days}天前`;
	return new Date(dateStr).toLocaleDateString("zh-CN");
}
