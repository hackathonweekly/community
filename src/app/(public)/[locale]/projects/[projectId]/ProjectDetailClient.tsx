"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { CommentSection } from "@/components/ui/comments";
import { Skeleton } from "@/components/ui/skeleton";
import { ExternalLinkIcon, VideoIcon } from "lucide-react";
import Link from "next/link";
import { CreationExperience } from "./components/CreationExperience";
import { config } from "@/config";
import { MobileBottomToolbar } from "./components/MobileBottomToolbar";
import { ProjectActions } from "./components/ProjectActions";
import { ProjectDescription } from "./components/ProjectDescription";
import { ProjectHero } from "./components/ProjectHero";
import { ProjectMilestones } from "./components/ProjectMilestones";
import { ProjectScreenshots } from "./components/ProjectScreenshots";
import { ScrollBackButton } from "./components/ScrollBackButton";
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
	// 如果是相对路径，需要拼接云存储的完整域名
	if (imageUrl.startsWith("/")) {
		return imageUrl; // Next.js会自动处理相对路径
	}
	// 如果是云存储的文件名，需要拼接完整域名（统一从全局 config 读取）
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
			<div className="min-h-screen bg-background flex items-center justify-center">
				<div className="text-center">
					<p className="text-red-500 mb-4">加载项目时出错</p>
					<Button
						onClick={() => window.location.reload()}
						variant="outline"
					>
						重新加载
					</Button>
				</div>
			</div>
		);
	}

	if (!project) {
		return (
			<div className="min-h-screen bg-background flex items-center justify-center">
				<div className="text-center">
					<p className="text-muted-foreground">项目不存在</p>
				</div>
			</div>
		);
	}

	const isOwner = currentUserId === project.userId;

	return (
		<div className="min-h-screen bg-background">
			{/* 移动端滚动返回按钮 */}
			<ScrollBackButton />

			<div className="container max-w-6xl mx-auto py-8 px-4 pb-24 md:pb-8">
				{/* 数据获取中的顶部提示 */}
				{isFetching && project && (
					<div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
						<div className="flex items-center gap-3">
							<div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full" />
							<span className="text-sm text-blue-800">
								正在更新项目信息...
							</span>
						</div>
					</div>
				)}

				{/* Breadcrumb */}
				<Link
					href="/projects"
					className="text-sm text-muted-foreground hover:text-primary mb-6 inline-flex items-center gap-1"
				>
					← 返回作品列表
				</Link>

				{/* Hero Section with Desktop Actions */}
				<div className="mb-8">
					<div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
						<div className="flex-1">
							<ProjectHero project={project} isOwner={isOwner} />
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
				</div>

				{/* Main Content */}
				<div className="grid gap-8 lg:grid-cols-4">
					<div className="lg:col-span-3 space-y-8">
						{/* Project Screenshots */}
						<ProjectScreenshots
							screenshots={project.screenshots || []}
							projectTitle={project.title}
						/>

						{/* Demo Video - Inline with description if exists */}
						{project.demoVideoUrl && (
							<div className="mb-6">
								<a
									href={project.demoVideoUrl}
									target="_blank"
									rel="noopener noreferrer"
									className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
								>
									<VideoIcon className="h-4 w-4" />
									观看演示视频
									<ExternalLinkIcon className="h-4 w-4" />
								</a>
							</div>
						)}

						{/* Project Description */}
						<ProjectDescription description={project.description} />

						{/* Project Milestones */}
						<ProjectMilestones
							milestones={project.milestones || []}
						/>

						{/* Team Recruitment */}
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

						{/* Creation Experience */}
						<CreationExperience
							creationExperience={project.creationExperience}
						/>
					</div>

					{/* Sidebar */}
					<ProjectSidebar
						project={project}
						relatedProjects={relatedProjects}
						isLoadingRelated={isLoadingRelated}
						relatedError={relatedError}
						getImageUrl={getImageUrl}
					/>
				</div>

				{/* Comments Section - Direct display */}
				<div className="mt-12 max-w-6xl mx-auto">
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

function ProjectDetailSkeleton() {
	return (
		<div className="min-h-screen bg-background">
			<div className="container max-w-6xl mx-auto py-8 px-4 pb-24 md:pb-8">
				<Skeleton className="h-4 w-32 mb-6" />

				<div className="mb-8">
					<div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 mb-6">
						<div className="flex-1 max-w-4xl space-y-4">
							<Skeleton className="h-8 w-3/4" />
							<Skeleton className="h-6 w-1/2" />
							<div className="flex gap-4">
								<Skeleton className="h-4 w-24" />
								<Skeleton className="h-4 w-24" />
								<Skeleton className="h-4 w-24" />
							</div>
							<div className="flex gap-2">
								<Skeleton className="h-6 w-16" />
								<Skeleton className="h-6 w-16" />
								<Skeleton className="h-6 w-16" />
							</div>
						</div>
						<div className="hidden md:flex flex-col gap-3 w-32">
							<Skeleton className="h-10 w-full" />
							<Skeleton className="h-10 w-full" />
							<Skeleton className="h-10 w-full" />
						</div>
					</div>
				</div>

				<div className="grid gap-8 lg:grid-cols-4">
					<div className="lg:col-span-3 space-y-8">
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<Skeleton className="aspect-video w-full" />
							<Skeleton className="aspect-video w-full" />
						</div>
						<Card>
							<CardHeader>
								<Skeleton className="h-6 w-24" />
							</CardHeader>
							<CardContent>
								<div className="space-y-2">
									<Skeleton className="h-4 w-full" />
									<Skeleton className="h-4 w-full" />
									<Skeleton className="h-4 w-3/4" />
								</div>
							</CardContent>
						</Card>
					</div>
					<div className="space-y-6">
						<Card>
							<CardHeader>
								<Skeleton className="h-6 w-24" />
							</CardHeader>
							<CardContent>
								<div className="flex items-center gap-3">
									<Skeleton className="w-12 h-12 rounded-full" />
									<div className="space-y-2">
										<Skeleton className="h-4 w-24" />
										<Skeleton className="h-3 w-16" />
									</div>
								</div>
							</CardContent>
						</Card>
					</div>
				</div>
			</div>
		</div>
	);
}
