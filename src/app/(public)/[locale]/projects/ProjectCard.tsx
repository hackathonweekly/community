"use client";

import { Badge } from "@/components/ui/badge";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	getProjectStageLabel,
	projectStageColors,
	projectStageDescriptions,
	projectStageLabels,
} from "@/lib/project-stage";
import { UserAvatar } from "@/components/shared/UserAvatar";
import type { ProjectStage } from "@prisma/client";
import {
	ExternalLinkIcon,
	EyeIcon,
	HeartIcon,
	MessageCircleIcon,
	UsersIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { ProjectInteractions } from "./ProjectInteractions";

export { projectStageLabels, projectStageColors, projectStageDescriptions };

interface Project {
	id: string;
	title: string;
	description: string | null; // Made optional to match database schema
	subtitle?: string | null;
	stage: ProjectStage;
	featured: boolean;
	projectTags: string[];
	url?: string | null;
	screenshots?: string[];
	viewCount: number;
	likeCount: number;
	commentCount: number;
	likes?: Array<{ id: string }>;
	bookmarks?: Array<{ id: string }>;

	// Team recruitment fields
	isRecruiting?: boolean;
	recruitmentTags?: string[];
	recruitmentStatus?: string | null;

	user: {
		id: string;
		name: string;
		username: string | null;
		image?: string | null;
		userRole?: string | null;
		customRole?: string | null;
		primarySkills?: string[] | null;
		availabilityStatus?: string | null;
		members?: Array<{
			organization: {
				id: string;
				name: string;
				slug: string;
				logo?: string | null;
			};
		}> | null;
	};
}

interface ProjectCardProps {
	project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
	const t = useTranslations();
	const mainImage = project.screenshots?.[0];

	return (
		<Card className="group hover:shadow-lg transition-shadow cursor-pointer overflow-hidden flex flex-col h-full">
			<Link
				href={`/projects/${project.id}`}
				className="flex flex-col h-full"
			>
				{/* Project Image */}
				{mainImage && (
					<div className="aspect-video relative overflow-hidden">
						<img
							src={mainImage}
							alt={project.title}
							className="w-full h-full object-cover"
						/>
						{/* 作品徽章 */}
						<div className="absolute top-3 left-3 flex gap-2">
							{project.featured && (
								<Badge className="bg-yellow-500 text-yellow-900 border-yellow-400">
									精选
								</Badge>
							)}
							{project.isRecruiting && (
								<Badge className="bg-blue-500 text-white border-blue-400 flex items-center gap-1">
									<UsersIcon className="h-3 w-3" />
									正在招募
								</Badge>
							)}
						</div>
						{/* 悬浮的点赞和收藏按钮 */}
						<div
							className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
							onClick={(e) => {
								e.preventDefault();
								e.stopPropagation();
							}}
						>
							<ProjectInteractions
								projectId={project.id}
								initialLikeCount={project.likeCount}
								initialIsLiked={
									project.likes
										? project.likes.length > 0
										: false
								}
								initialIsBookmarked={
									project.bookmarks
										? project.bookmarks.length > 0
										: false
								}
								variant="overlay"
							/>
						</div>
					</div>
				)}

				<CardHeader className="pb-2 pt-3 px-4">
					<div className="flex items-start justify-between gap-2 mb-2">
						<CardTitle className="text-base sm:text-lg line-clamp-1 flex-1 min-w-0">
							{project.title}
						</CardTitle>
						{project.stage && (
							<Badge
								variant="outline"
								className={`flex-shrink-0 text-xs ${
									projectStageColors[project.stage] ||
									"bg-gray-100 text-gray-800 border-gray-200"
								}`}
							>
								{getProjectStageLabel(project.stage, t)}
							</Badge>
						)}
					</div>
					<CardDescription className="line-clamp-2 text-sm">
						{project.subtitle || project.description || "暂无描述"}
					</CardDescription>
				</CardHeader>

				<CardContent className="pt-0 px-4 flex-1 flex flex-col">
					{/* Team Recruitment Info - 简化版本 */}
					{project.isRecruiting && (
						<div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded-md">
							<div className="flex items-center gap-1.5">
								<UsersIcon className="h-3.5 w-3.5 text-blue-600 flex-shrink-0" />
								<span className="text-xs font-medium text-blue-900">
									正在招募
								</span>
								{project.recruitmentTags &&
									project.recruitmentTags.length > 0 && (
										<div className="flex gap-1 flex-wrap">
											{project.recruitmentTags
												.slice(0, 2)
												.map((tag, index) => (
													<Badge
														key={index}
														variant="outline"
														className="text-xs px-1.5 py-0 bg-blue-100 text-blue-800 border-blue-300 h-5"
													>
														{tag}
													</Badge>
												))}
											{(project.recruitmentTags?.length ||
												0) > 2 && (
												<Badge
													variant="outline"
													className="text-xs px-1.5 py-0 text-blue-600 h-5"
												>
													+
													{(project.recruitmentTags
														?.length || 0) - 2}
												</Badge>
											)}
										</div>
									)}
							</div>
						</div>
					)}

					{/* Project Tags */}
					{project.projectTags && project.projectTags.length > 0 && (
						<div className="flex flex-wrap gap-1 mb-3">
							{project.projectTags
								.slice(0, 3)
								.map((tag, index) => (
									<Badge
										key={index}
										variant="outline"
										className="text-xs bg-blue-50 text-blue-700 border-blue-200"
									>
										{tag}
									</Badge>
								))}
							{project.projectTags.length > 3 && (
								<Badge variant="outline" className="text-xs">
									+{project.projectTags.length - 3}
								</Badge>
							)}
						</div>
					)}

					{/* Spacer to push bottom content down */}
					<div className="flex-1" />

					{/* Project Stats */}
					<div className="flex items-center justify-between mb-3">
						<div className="flex items-center gap-4 text-sm text-muted-foreground">
							<div className="flex items-center gap-1">
								<HeartIcon className="h-3 w-3" />
								{project.likeCount}
							</div>
							<div className="flex items-center gap-1">
								<EyeIcon className="h-3 w-3" />
								{project.viewCount}
							</div>
							<div className="flex items-center gap-1">
								<MessageCircleIcon className="h-3 w-3" />
								{project.commentCount}
							</div>
						</div>
					</div>

					{/* Bottom section with creator and external link */}
					<div className="flex items-center justify-between">
						<div
							onClick={(e) => {
								e.preventDefault();
								e.stopPropagation();
							}}
							onKeyDown={(e) => {
								if (e.key === "Enter" || e.key === " ") {
									e.preventDefault();
									e.stopPropagation();
								}
							}}
							className="flex-1"
						>
							<Link
								href={
									project.user.username
										? `/u/${project.user.username}`
										: "#"
								}
								className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
							>
								<UserAvatar
									name={project.user.name}
									avatarUrl={project.user.image}
									className="w-6 h-6"
								/>
								<span className="font-medium">
									{project.user.name}
								</span>
							</Link>
						</div>

						{project.url && (
							<div
								onClick={(e) => {
									e.preventDefault();
									e.stopPropagation();
								}}
								onKeyDown={(e) => {
									if (e.key === "Enter" || e.key === " ") {
										e.preventDefault();
										e.stopPropagation();
									}
								}}
							>
								<a
									href={project.url}
									target="_blank"
									rel="noopener noreferrer"
									className="inline-flex items-center text-sm text-primary hover:underline"
								>
									<ExternalLinkIcon className="h-3 w-3" />
								</a>
							</div>
						)}
					</div>
				</CardContent>
			</Link>
		</Card>
	);
}
