"use client";

import { CommentSection } from "@community/ui/ui/comments";
import { Skeleton } from "@community/ui/ui/skeleton";
import { ArrowLeft, ExternalLinkIcon, VideoIcon } from "lucide-react";
import Link from "next/link";
import { EmptyState } from "@/modules/public/shared/components/EmptyState";
import { CreationExperience } from "./components/CreationExperience";
import { config } from "@community/config";
import { MobileBottomToolbar } from "./components/MobileBottomToolbar";
import { ProjectActions } from "./components/ProjectActions";
import { ProjectDescription } from "./components/ProjectDescription";
import { ProjectHero } from "./components/ProjectHero";
import { ProjectMilestones } from "./components/ProjectMilestones";
import { ProjectScreenshots } from "./components/ProjectScreenshots";
import { ProjectSidebar } from "./components/ProjectSidebar";
import { TeamRecruitment } from "./components/TeamRecruitment";
import {
	useProjectDetail,
	useRelatedProjects,
} from "./hooks/useProjectDetailQueries";

// 处理图片URL，确保有正确的协议前缀
const getImageUrl = (imageUrl: string | null) => {
	if (!imageUrl) {
		return null;
	}
	if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
		return imageUrl;
	}
	if (imageUrl.startsWith("/")) {
		return imageUrl;
	}
	const s3Endpoint = config.storage.endpoints.public;
	return `${s3Endpoint}/${imageUrl}`;
};

interface ProjectDetailClientProps {
	projectId: string;
	currentUserId?: string;
	initialData?: any;
}

export function ProjectDetailClient({
	projectId,
	currentUserId,
	initialData,
}: ProjectDetailClientProps) {
	const {
		data: project,
		isLoading,
		error,
		isFetching,
	} = useProjectDetail(projectId, initialData);
	const {
		data: relatedProjects,
		isLoading: isLoadingRelated,
		error: relatedError,
	} = useRelatedProjects(projectId);

	if (isLoading) {
		return <ProjectDetailSkeleton />;
	}

	if (error) {
		return (
			<div className="min-h-screen bg-[#FAFAFA]">
				<ProjectPageHeader title="项目详情" />
				<div className="max-w-6xl mx-auto px-4 lg:px-8 py-5 lg:py-6">
					<EmptyState
						title="加载项目失败"
						description="请检查网络后重试。"
						action={
							<button
								onClick={() => window.location.reload()}
								className="bg-white border border-gray-200 text-black px-4 py-1.5 rounded-full text-xs font-bold hover:bg-gray-50 transition-colors"
							>
								重新加载
							</button>
						}
					/>
				</div>
			</div>
		);
	}

	if (!project) {
		return (
			<div className="min-h-screen bg-[#FAFAFA]">
				<ProjectPageHeader title="项目详情" />
				<div className="max-w-6xl mx-auto px-4 lg:px-8 py-5 lg:py-6">
					<EmptyState
						title="项目不存在"
						description="该项目可能已被删除，或链接已失效。"
						action={
							<Link
								href="/projects"
								className="bg-white border border-gray-200 text-black px-4 py-1.5 rounded-full text-xs font-bold hover:bg-gray-50 transition-colors"
							>
								返回作品列表
							</Link>
						}
					/>
				</div>
			</div>
		);
	}

	const isOwner = currentUserId === project.userId;

	return (
		<div className="min-h-screen bg-[#FAFAFA]">
			<ProjectPageHeader title={project.title} />
			<div className="max-w-6xl mx-auto px-4 lg:px-8 py-5 lg:py-6 pb-24 lg:pb-6">
				{/* Fetching indicator */}
				{isFetching && project && (
					<div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
						<div className="flex items-center gap-3">
							<div className="animate-spin h-4 w-4 border-2 border-gray-400 border-t-transparent rounded-full" />
							<span className="text-[11px] text-gray-500 font-mono">
								正在更新项目信息...
							</span>
						</div>
					</div>
				)}

				{/* 12-col grid: content 8 + sidebar 4 */}
				<div className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative">
					{/* Left: Content (8 cols) */}
					<div className="lg:col-span-8">
						{/* Hero with Desktop Actions */}
						<div className="flex items-start justify-between gap-4">
							<div className="flex-1">
								<ProjectHero
									project={project}
									isOwner={isOwner}
								/>
							</div>
							<ProjectActions
								projectId={project.id}
								projectUrl={project.url}
								isOwner={isOwner}
								currentUserId={currentUserId}
								userLike={project.userLike}
								likeCount={project._count.likes}
								userBookmark={project.userBookmark}
							/>
						</div>

						{/* Banner Image / Screenshots */}
						<div className="mb-8">
							<ProjectScreenshots
								screenshots={project.screenshots || []}
								projectTitle={project.title}
							/>
						</div>

						{/* Demo Video */}
						{project.demoVideoUrl && (
							<div className="mb-8">
								<a
									href={project.demoVideoUrl}
									target="_blank"
									rel="noopener noreferrer"
									className="inline-flex items-center gap-2 bg-black text-white px-4 py-1.5 rounded-full text-xs font-bold shadow-sm hover:bg-gray-800 transition-colors"
								>
									<VideoIcon className="h-3.5 w-3.5" />
									观看演示视频
									<ExternalLinkIcon className="h-3.5 w-3.5" />
								</a>
							</div>
						)}

						{/* Content sections */}
						<div className="space-y-8">
							<ProjectDescription
								description={project.description}
							/>
							<ProjectMilestones
								milestones={project.milestones || []}
							/>
							<TeamRecruitment
								isRecruiting={project.isRecruiting}
								teamDescription={project.teamDescription}
								teamSkills={project.teamSkills || []}
								teamSize={
									project.teamSize
										? Number(project.teamSize)
										: null
								}
								contactInfo={project.contactInfo}
							/>
							<CreationExperience
								creationExperience={project.creationExperience}
							/>
						</div>
					</div>

					{/* Right: Sticky Sidebar (4 cols, desktop only) */}
					<ProjectSidebar
						project={project}
						relatedProjects={relatedProjects}
						isLoadingRelated={isLoadingRelated}
						relatedError={relatedError}
						getImageUrl={getImageUrl}
					/>
				</div>

				{/* Comments */}
				<div className="mt-12">
					{/* <div className="flex items-center gap-3 mb-4">
						<h3 className="font-brand text-sm font-bold uppercase tracking-wide text-gray-400">
							评论
						</h3>
						<div className="h-px bg-gray-100 flex-1" />
					</div> */}
					<CommentSection
						entityType="PROJECT"
						entityId={project.id}
						currentUserId={currentUserId}
						placeholder="分享你对这个作品的想法..."
						showStats={true}
						allowReplies={true}
					/>
				</div>
			</div>

			{/* Mobile Bottom Toolbar */}
			<MobileBottomToolbar
				projectId={project.id}
				projectUrl={project.url}
				isOwner={isOwner}
				currentUserId={currentUserId}
				userLike={project.userLike}
				likeCount={project._count.likes}
				userBookmark={project.userBookmark}
			/>
		</div>
	);
}

function ProjectPageHeader({ title }: { title: string }) {
	return (
		<nav className="sticky top-0 z-50 flex h-12 items-center justify-between border-b border-border bg-background/95 px-4 backdrop-blur lg:px-8">
			<div className="flex items-center gap-3">
				<Link
					href="/projects"
					className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-accent"
					aria-label="返回作品列表"
				>
					<ArrowLeft className="h-4 w-4" />
				</Link>
				<span className="max-w-[180px] truncate text-sm font-semibold text-foreground sm:max-w-xs">
					{title}
				</span>
			</div>
		</nav>
	);
}

function ProjectDetailSkeleton() {
	return (
		<div className="min-h-screen bg-[#FAFAFA]">
			<div className="max-w-6xl mx-auto px-4 lg:px-8 py-5 lg:py-6">
				<Skeleton className="h-3 w-24 mb-5" />

				<div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
					<div className="lg:col-span-8">
						{/* Hero skeleton */}
						<div className="mb-6 pb-6 border-b border-gray-100">
							<div className="flex gap-2 mb-3">
								<Skeleton className="h-5 w-16 rounded-md" />
								<Skeleton className="h-5 w-12 rounded-md" />
							</div>
							<Skeleton className="h-10 w-3/4 mb-3" />
							<Skeleton className="h-5 w-1/2 mb-4" />
							<div className="flex gap-3">
								<Skeleton className="h-3 w-20" />
								<Skeleton className="h-3 w-16" />
								<Skeleton className="h-3 w-16" />
							</div>
						</div>
						{/* Screenshots skeleton */}
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
							<Skeleton className="aspect-video w-full rounded-xl" />
							<Skeleton className="aspect-video w-full rounded-xl" />
						</div>
						{/* Content skeleton */}
						<div className="space-y-3">
							<Skeleton className="h-4 w-full" />
							<Skeleton className="h-4 w-full" />
							<Skeleton className="h-4 w-3/4" />
						</div>
					</div>

					{/* Sidebar skeleton */}
					<div className="hidden lg:block lg:col-span-4">
						<div className="bg-white border border-gray-200 rounded-lg p-5 space-y-4">
							<Skeleton className="h-10 w-full rounded-md" />
							<div className="flex items-center gap-3">
								<Skeleton className="w-10 h-10 rounded-full" />
								<div className="space-y-1.5">
									<Skeleton className="h-3 w-20" />
									<Skeleton className="h-2.5 w-14" />
								</div>
							</div>
							<Skeleton className="h-3 w-full" />
							<Skeleton className="h-3 w-full" />
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
