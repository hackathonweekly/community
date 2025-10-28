import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { projectStageColors, projectStageLabels } from "@/lib/project-stage";
import type { ProjectStage } from "@prisma/client";
import {
	CalendarIcon,
	EditIcon,
	EyeIcon,
	MessageCircleIcon,
} from "lucide-react";
import Link from "next/link";

interface ProjectHeroProps {
	project: {
		id: string;
		title: string;
		subtitle?: string | null;
		featured: boolean;
		viewCount: number;
		createdAt: string;
		stage?: string | null;
		pricingType?: string | null;
		projectTags: string[];
		_count: {
			comments: number;
		};
	};
	isOwner: boolean;
}

export function ProjectHero({ project, isOwner }: ProjectHeroProps) {
	return (
		<div className="mb-8">
			<div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 mb-6">
				<div className="flex-1 max-w-4xl">
					{/* Edit Button for Mobile - Top Right */}
					{isOwner && (
						<Button
							asChild
							variant="outline"
							size="sm"
							className="md:hidden w-fit self-end my-2"
						>
							<Link
								href={`/app/projects/${project.id}/edit`}
								className="inline-flex items-center gap-2"
							>
								<EditIcon className="h-4 w-4" />
								编辑
							</Link>
						</Button>
					)}
					{/* Title and Featured with Edit Button for Mobile */}
					<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
						<div className="flex flex-col sm:flex-row sm:items-center gap-3">
							<h1 className="text-2xl sm:text-4xl font-bold tracking-tight break-words">
								{project.title}
							</h1>
							{project.featured && (
								<Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 w-fit">
									精选作品
								</Badge>
							)}
						</div>
					</div>

					{/* Subtitle */}
					{project.subtitle && (
						<p className="text-lg sm:text-xl text-muted-foreground mb-6 leading-relaxed break-words">
							{project.subtitle}
						</p>
					)}

					{/* Meta Info */}
					<div className="flex flex-wrap items-center gap-4 sm:gap-6 text-sm text-muted-foreground mb-6">
						<div className="flex items-center gap-2">
							<EyeIcon className="h-4 w-4" />
							<span>{project.viewCount} 次浏览</span>
						</div>
						<div className="flex items-center gap-2">
							<MessageCircleIcon className="h-4 w-4" />
							<span>{project._count.comments} 条评论</span>
						</div>
						<div className="flex items-center gap-2">
							<CalendarIcon className="h-4 w-4" />
							<span>
								{new Date(project.createdAt).toLocaleDateString(
									"zh-CN",
								)}
							</span>
						</div>
					</div>

					{/* Status and Tags */}
					<div className="flex flex-wrap items-center gap-2 mb-6">
						{project.stage ? (
							<Badge
								className={`${projectStageColors[project.stage as ProjectStage] || "bg-gray-100 text-gray-800 border-gray-200"} font-medium`}
							>
								{projectStageLabels[
									project.stage as ProjectStage
								] || project.stage}
							</Badge>
						) : null}
						{project.pricingType &&
							["FREE", "PAID", "FREEMIUM"].includes(
								project.pricingType,
							) && (
								<Badge
									variant="secondary"
									className="font-medium"
								>
									{project.pricingType === "FREE"
										? "免费"
										: project.pricingType === "PAID"
											? "付费"
											: "免费增值"}
								</Badge>
							)}
						{project.projectTags
							.slice(0, 5)
							.map((tag: string, index: number) => (
								<Badge
									key={index}
									variant="outline"
									className="text-xs border-muted-foreground/20 truncate max-w-[120px]"
								>
									{tag}
								</Badge>
							))}
						{project.projectTags.length > 5 && (
							<Badge
								variant="outline"
								className="text-xs border-muted-foreground/20 flex-shrink-0"
							>
								+{project.projectTags.length - 5}
							</Badge>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
