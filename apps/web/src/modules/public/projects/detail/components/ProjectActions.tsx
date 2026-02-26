import { ProjectBookmarkButton } from "@community/ui/ui/project-bookmark-button";
import { EditIcon, ExternalLinkIcon } from "lucide-react";
import Link from "next/link";
import { ProjectInteractions } from "../ProjectInteractions";

interface ProjectActionsProps {
	projectId: string;
	projectUrl?: string | null;
	isOwner: boolean;
	currentUserId?: string;
	userLike: boolean;
	likeCount: number;
	userBookmark: boolean;
}

export function ProjectActions({
	projectId,
	projectUrl,
	isOwner,
	currentUserId,
	userLike,
	likeCount,
	userBookmark,
}: ProjectActionsProps) {
	return (
		<div className="hidden md:flex flex-col gap-3 lg:ml-6 lg:w-auto">
			{isOwner && (
				<Link
					href={`/projects/${projectId}/edit`}
					className="inline-flex items-center justify-center gap-2 bg-white border border-gray-200 text-black px-4 py-1.5 rounded-full text-xs font-bold hover:bg-gray-50 transition-colors"
				>
					<EditIcon className="h-3.5 w-3.5" />
					编辑
				</Link>
			)}
			<div className="flex flex-col gap-2">
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
			</div>
			{projectUrl && (
				<a
					href={projectUrl}
					target="_blank"
					rel="noopener noreferrer"
					className="inline-flex items-center justify-center gap-2 bg-black text-white px-4 py-1.5 rounded-full text-xs font-bold shadow-sm hover:bg-gray-800 transition-colors"
				>
					访问作品
					<ExternalLinkIcon className="h-3.5 w-3.5" />
				</a>
			)}
		</div>
	);
}
