import {
	projectStageColors,
	projectStageLabels,
} from "@community/lib-shared/project-stage";
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
		shortId?: string | null;
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
		<div className="mb-6 pb-6 border-b border-gray-100">
			{/* Mobile Edit */}
			{isOwner && (
				<Link
					href={`/projects/${project.shortId || project.id}/edit`}
					className="md:hidden inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-black transition-colors mb-3"
				>
					<EditIcon className="h-3.5 w-3.5" />
					编辑
				</Link>
			)}

			{/* Tags row */}
			<div className="flex flex-wrap items-center gap-2 mb-3">
				{project.featured && (
					<span className="px-2 py-0.5 bg-black text-white rounded-md text-[10px] font-bold uppercase tracking-wider">
						Featured
					</span>
				)}
				{project.stage && (
					<span
						className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${projectStageColors[project.stage as ProjectStage] || "bg-gray-100 text-gray-800 border-gray-200"}`}
					>
						{projectStageLabels[project.stage as ProjectStage] ||
							project.stage}
					</span>
				)}
				{project.pricingType &&
					["FREE", "PAID", "FREEMIUM"].includes(
						project.pricingType,
					) && (
						<span
							className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${
								project.pricingType === "PAID"
									? "bg-orange-50 text-orange-600 border-orange-100"
									: project.pricingType === "FREEMIUM"
										? "bg-purple-50 text-purple-600 border-purple-100"
										: "bg-green-50 text-green-700 border-green-100"
							}`}
						>
							{project.pricingType === "FREE"
								? "免费"
								: project.pricingType === "PAID"
									? "付费"
									: "免费增值"}
						</span>
					)}
			</div>

			{/* Title */}
			<h1 className="font-brand text-3xl lg:text-5xl font-bold leading-tight mb-3 text-black break-words">
				{project.title}
			</h1>

			{/* Subtitle */}
			{project.subtitle && (
				<p className="text-base text-gray-600 leading-relaxed max-w-2xl mb-4 break-words">
					{project.subtitle}
				</p>
			)}

			{/* Meta: mono style */}
			<div className="flex flex-wrap items-center gap-3 text-[11px] text-gray-500 font-mono">
				<span className="flex items-center gap-1">
					<CalendarIcon className="h-3.5 w-3.5" />
					{new Date(project.createdAt).toLocaleDateString("zh-CN")}
				</span>
				<span className="w-px h-3 bg-gray-200" />
				<span className="flex items-center gap-1">
					<EyeIcon className="h-3.5 w-3.5" />
					{project.viewCount} 浏览
				</span>
				<span className="w-px h-3 bg-gray-200" />
				<span className="flex items-center gap-1">
					<MessageCircleIcon className="h-3.5 w-3.5" />
					{project._count.comments} 评论
				</span>
			</div>

			{/* Project Tags */}
			{project.projectTags.length > 0 && (
				<div className="flex flex-wrap gap-1.5 mt-3">
					{project.projectTags
						.slice(0, 5)
						.map((tag: string, index: number) => (
							<span
								key={index}
								className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md text-[10px] font-bold uppercase tracking-wider border border-gray-200 truncate max-w-[120px]"
							>
								{tag}
							</span>
						))}
					{project.projectTags.length > 5 && (
						<span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md text-[10px] font-bold border border-gray-200">
							+{project.projectTags.length - 5}
						</span>
					)}
				</div>
			)}
		</div>
	);
}
