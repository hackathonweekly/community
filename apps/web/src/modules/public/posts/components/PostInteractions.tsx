"use client";

import { Heart, MessageCircle, Bookmark } from "lucide-react";
import { Button } from "@community/ui/ui/button";
import { useTogglePostLike, useTogglePostBookmark } from "../hooks/use-posts";

interface PostInteractionsProps {
	postId: string;
	likeCount: number;
	commentCount: number;
	isLiked?: boolean;
	isBookmarked?: boolean;
	onCommentClick?: () => void;
}

export function PostInteractions({
	postId,
	likeCount,
	commentCount,
	isLiked,
	isBookmarked,
	onCommentClick,
}: PostInteractionsProps) {
	const likeMutation = useTogglePostLike();
	const bookmarkMutation = useTogglePostBookmark();

	return (
		<div className="flex items-center gap-1">
			<Button
				variant="ghost"
				size="sm"
				className="h-8 gap-1 px-2 text-xs text-muted-foreground hover:text-red-500"
				onClick={(e) => {
					e.preventDefault();
					e.stopPropagation();
					likeMutation.mutate(postId);
				}}
				disabled={likeMutation.isPending}
			>
				<Heart
					className={`h-4 w-4 ${isLiked ? "fill-red-500 text-red-500" : ""}`}
				/>
				<span>{likeCount}</span>
			</Button>

			<Button
				variant="ghost"
				size="sm"
				className="h-8 gap-1 px-2 text-xs text-muted-foreground"
				onClick={(e) => {
					e.preventDefault();
					e.stopPropagation();
					onCommentClick?.();
				}}
			>
				<MessageCircle className="h-4 w-4" />
				<span>{commentCount}</span>
			</Button>

			<Button
				variant="ghost"
				size="sm"
				className="h-8 px-2 text-xs text-muted-foreground hover:text-amber-500"
				onClick={(e) => {
					e.preventDefault();
					e.stopPropagation();
					bookmarkMutation.mutate(postId);
				}}
				disabled={bookmarkMutation.isPending}
			>
				<Bookmark
					className={`h-4 w-4 ${isBookmarked ? "fill-amber-500 text-amber-500" : ""}`}
				/>
			</Button>
		</div>
	);
}
