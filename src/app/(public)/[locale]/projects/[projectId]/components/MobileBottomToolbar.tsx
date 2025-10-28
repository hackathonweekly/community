"use client";

import { Button } from "@/components/ui/button";
import { ProjectBookmarkButton } from "@/components/ui/project-bookmark-button";
import { ExternalLinkIcon } from "lucide-react";
import { ProjectInteractions } from "../ProjectInteractions";
import { useKeyboardDetection } from "@/lib/hooks/use-keyboard-detection";
import { cn } from "@/lib/utils";

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
	// 使用自定义 hook 检测键盘是否弹出
	const isKeyboardVisible = useKeyboardDetection();

	return (
		<div
			className={cn(
				"md:hidden fixed bottom-0 left-0 right-0 bg-background border-t border-border p-4 z-50 transition-transform duration-300",
				// 键盘弹出时隐藏底部工具栏
				isKeyboardVisible ? "translate-y-full" : "translate-y-0",
			)}
		>
			<div className="flex items-center justify-center gap-3 max-w-sm mx-auto px-2">
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
					<Button asChild size="sm" className="flex-1 min-w-0">
						<a
							href={projectUrl}
							target="_blank"
							rel="noopener noreferrer"
							className="inline-flex items-center justify-center gap-2 truncate"
						>
							访问作品
							<ExternalLinkIcon className="h-4 w-4 flex-shrink-0" />
						</a>
					</Button>
				)}
			</div>
		</div>
	);
}
