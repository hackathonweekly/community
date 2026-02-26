"use client";

import { ProjectBookmarkButton } from "@community/ui/ui/project-bookmark-button";
import { ExternalLinkIcon } from "lucide-react";
import { ProjectInteractions } from "../ProjectInteractions";
import { useKeyboardDetection } from "@community/lib-client/hooks/use-keyboard-detection";
import { cn } from "@community/lib-shared/utils";

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
