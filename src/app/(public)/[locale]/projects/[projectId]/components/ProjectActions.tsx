import { Button } from "@/components/ui/button";
import { ProjectBookmarkButton } from "@/components/ui/project-bookmark-button";
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
				<Button asChild variant="outline" size="sm" className="w-full">
					<Link
						href={`/app/projects/${projectId}/edit`}
						className="inline-flex items-center justify-center gap-2"
					>
						<EditIcon className="h-4 w-4" />
						编辑
					</Link>
				</Button>
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
				<Button asChild size="sm" className="w-full">
					<a
						href={projectUrl}
						target="_blank"
						rel="noopener noreferrer"
						className="inline-flex items-center justify-center gap-2"
					>
						访问作品
						<ExternalLinkIcon className="h-4 w-4" />
					</a>
				</Button>
			)}
		</div>
	);
}
