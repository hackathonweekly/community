"use client";

import { useKeyboardDetection } from "@community/lib-client/hooks/use-keyboard-detection";
import { cn } from "@community/lib-shared/utils";
import { ProjectBookmarkButton } from "@community/ui/ui/project-bookmark-button";
import { ExternalLinkIcon, Share2Icon } from "lucide-react";
import { toast } from "sonner";
import { ProjectInteractions } from "../ProjectInteractions";

interface MobileBottomToolbarProps {
	projectId: string;
	projectUrl?: string | null;
	isOwner: boolean;
	currentUserId?: string;
	userLike: boolean;
	likeCount: number;
	userBookmark: boolean;
}

export function MobileBottomToolbar({
	projectId,
	projectUrl,
	isOwner,
	currentUserId,
	userLike,
	likeCount,
	userBookmark,
}: MobileBottomToolbarProps) {
	const isKeyboardVisible = useKeyboardDetection();
	const handleShare = async () => {
		const shareUrl = window.location.href;

		if (navigator.share) {
			try {
				await navigator.share({
					title: "项目详情",
					text: "来看看这个作品",
					url: shareUrl,
				});
				return;
			} catch (error) {
				if (
					error instanceof DOMException &&
					error.name === "AbortError"
				) {
					return;
				}
			}
		}

		try {
			await navigator.clipboard.writeText(shareUrl);
			toast.success("链接已复制");
		} catch (error) {
			console.error("Error copying share link:", error);
			toast.error("分享失败，请稍后重试");
		}
	};

	return (
		<div
			className={cn(
				"lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur border-t border-gray-200 h-14 flex justify-center items-center z-50 px-4 transition-transform duration-300",
				isKeyboardVisible ? "translate-y-full" : "translate-y-0",
			)}
		>
			<div className="flex items-center gap-3 max-w-sm w-full">
				<ProjectInteractions
					projectId={projectId}
					initialLiked={userLike}
					initialLikeCount={likeCount}
					isLoggedIn={!!currentUserId}
				/>
				{!isOwner && (
					<ProjectBookmarkButton
						projectId={projectId}
						initialBookmarked={userBookmark}
						isLoggedIn={!!currentUserId}
					/>
				)}
				<button
					type="button"
					onClick={handleShare}
					className="inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 transition-colors hover:bg-gray-50"
					aria-label="分享作品"
				>
					<Share2Icon className="h-4 w-4" />
				</button>
				{projectUrl && (
					<a
						href={projectUrl}
						target="_blank"
						rel="noopener noreferrer"
						className="flex-1 min-w-0 inline-flex items-center justify-center gap-2 bg-black text-white px-4 py-1.5 rounded-full text-xs font-bold shadow-sm hover:bg-gray-800 transition-colors truncate"
					>
						访问作品
						<ExternalLinkIcon className="h-3.5 w-3.5 flex-shrink-0" />
					</a>
				)}
			</div>
		</div>
	);
}
