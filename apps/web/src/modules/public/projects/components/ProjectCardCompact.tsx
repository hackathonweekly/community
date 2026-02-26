"use client";

import Link from "next/link";
import { EyeIcon, HeartIcon, UsersIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { getProjectStageLabel } from "@community/lib-shared/project-stage";
import { UserAvatar } from "@community/ui/shared/UserAvatar";
import type { ProjectStage } from "@community/lib-shared/prisma-enums";
import { getStageBadgeStyle } from "@/modules/shared/lib/badge-styles";

interface Project {
	id: string;
	shortId?: string | null;
	title: string;
	description: string | null;
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

interface ProjectCardCompactProps {
	project: Project;
}

export function ProjectCardCompact({ project }: ProjectCardCompactProps) {
	const t = useTranslations();
	const mainImage = project.screenshots?.[0];
	const projectHref = `/projects/${project.shortId || project.id}`;

	return (
		<Link
			href={projectHref}
			className="group flex items-center gap-3 bg-card rounded-lg border border-border p-3 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
		>
			{/* Thumbnail */}
			<div className="relative h-16 w-16 shrink-0 overflow-hidden rounded border border-border/50 bg-muted">
				{mainImage ? (
					<img
						src={mainImage}
						alt={project.title}
						className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
					/>
				) : (
					<div className="flex h-full w-full items-center justify-center bg-muted text-muted-foreground/30">
						<svg
							className="h-6 w-6"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							strokeWidth={1}
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
							/>
						</svg>
					</div>
				)}
				{/* Badges overlay */}
				{(project.featured || project.isRecruiting) && (
					<div className="absolute inset-0 flex items-end justify-start p-1 gap-1">
						{project.featured && (
							<span className="rounded bg-black/80 px-1 py-0.5 text-[8px] font-bold uppercase tracking-tight text-white shadow-sm backdrop-blur border border-white/10">
								精选
							</span>
						)}
						{project.isRecruiting && (
							<span className="rounded bg-white/90 px-1 py-0.5 text-[8px] font-bold uppercase tracking-tight text-foreground/80 shadow-sm backdrop-blur border border-border flex items-center gap-0.5">
								<UsersIcon className="h-2 w-2" />
								招募
							</span>
						)}
					</div>
				)}
			</div>

			{/* Content */}
			<div className="min-w-0 flex-1">
				{/* Title + stage badge */}
				<div className="mb-1 flex items-start justify-between gap-2">
					<h3 className="line-clamp-1 font-brand text-sm font-bold leading-tight text-foreground transition-colors group-hover:text-foreground/70">
						{project.title}
					</h3>
					{project.stage && (
						<span
							className={`shrink-0 rounded border px-1 py-0.5 text-[9px] font-bold ${getStageBadgeStyle(project.stage)}`}
						>
							{getProjectStageLabel(project.stage, t)}
						</span>
					)}
				</div>

				{/* Tags/description */}
				<div className="mb-1.5 truncate text-[10px] font-mono text-muted-foreground">
					{project.projectTags.length > 0
						? project.projectTags.slice(0, 2).join(" · ")
						: project.subtitle || project.description || "暂无描述"}
				</div>

				{/* Footer */}
				<div className="flex items-center justify-between">
					<div
						onClick={(e) => {
							e.preventDefault();
							e.stopPropagation();
						}}
						className="min-w-0"
					>
						<Link
							href={
								project.user.username
									? `/u/${project.user.username}`
									: "#"
							}
							className="flex items-center gap-1 truncate text-[10px] font-medium text-muted-foreground transition-colors hover:text-foreground"
						>
							<UserAvatar
								name={project.user.name}
								avatarUrl={project.user.image}
								className="h-4 w-4"
							/>
							<span className="truncate">
								{project.user.name}
							</span>
						</Link>
					</div>
					<div className="flex items-center gap-2 font-mono text-[9px] font-bold text-muted-foreground">
						<span className="flex items-center gap-0.5">
							<HeartIcon className="h-2.5 w-2.5" />
							{project.likeCount}
						</span>
						<span className="flex items-center gap-0.5">
							<EyeIcon className="h-2.5 w-2.5" />
							{project.viewCount}
						</span>
					</div>
				</div>
			</div>
		</Link>
	);
}
