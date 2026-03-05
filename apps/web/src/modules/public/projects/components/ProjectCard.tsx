"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { EyeIcon, HeartIcon, UsersIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Card } from "@community/ui/ui/card";
import {
	getProjectStageLabel,
	projectStageColors,
	projectStageDescriptions,
	projectStageLabels,
} from "@community/lib-shared/project-stage";
import { UserAvatar } from "@community/ui/shared/UserAvatar";
import type { ProjectStage } from "@community/lib-shared/prisma-enums";
import { ProjectInteractions } from "./ProjectInteractions";
import { getStageBadgeStyle } from "@/modules/shared/lib/badge-styles";

export { projectStageLabels, projectStageColors, projectStageDescriptions };

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

interface ProjectCardProps {
	project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
	const t = useTranslations();
	const router = useRouter();
	const mainImage = project.screenshots?.[0];
	const projectHref = `/projects/${project.shortId || project.id}`;

	return (
		<Card
			className="group w-full cursor-pointer overflow-hidden rounded-lg border border-border bg-card p-0 shadow-subtle transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift"
			tabIndex={0}
			role="article"
			aria-label={project.title}
			onClick={() => router.push(projectHref)}
		>
			<div className="flex min-h-[44px] flex-col">
				{/* Cover image */}
				<div className="relative h-32 overflow-hidden border-b border-border/50 bg-muted">
					{mainImage ? (
						<img
							src={mainImage}
							alt={project.title}
							className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
						/>
					) : (
						<div className="flex h-full w-full items-center justify-center bg-muted text-muted-foreground/30">
							<svg
								className="h-10 w-10"
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
					{/* Badges - bottom left */}
					<div className="absolute bottom-2 left-2 flex items-center gap-1">
						{project.featured ? (
							<span className="rounded-md bg-black/80 px-2 py-0.5 text-[10px] font-bold uppercase tracking-tight text-white shadow-sm backdrop-blur border border-white/10">
								精选
							</span>
						) : null}
						{project.isRecruiting ? (
							<span className="rounded bg-white/90 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-tight text-foreground/80 shadow-sm backdrop-blur border border-border flex items-center gap-1">
								<UsersIcon className="h-3 w-3" />
								招募中
							</span>
						) : null}
					</div>
					{/* Interactions - top right, on hover */}
					<div
						className="absolute right-2 top-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
						onClick={(e) => {
							e.preventDefault();
							e.stopPropagation();
						}}
					>
						<ProjectInteractions
							projectId={project.id}
							initialLikeCount={project.likeCount}
							initialIsLiked={
								project.likes ? project.likes.length > 0 : false
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

				{/* Content */}
				<div className="flex flex-1 flex-col p-3">
					{/* Title + stage badge */}
					<div className="mb-1 flex items-start justify-between gap-2">
						<h3 className="line-clamp-1 font-brand text-base font-bold leading-tight text-foreground transition-colors group-hover:text-foreground/70">
							{project.title}
						</h3>
						{project.stage ? (
							<span
								className={`shrink-0 rounded border px-1.5 py-0.5 text-[10px] font-bold ${getStageBadgeStyle(project.stage)}`}
							>
								{getProjectStageLabel(project.stage, t)}
							</span>
						) : null}
					</div>

					{/* Tags as mono meta line (like EventCard date+location) */}
					<div className="mb-2 truncate text-[11px] font-mono text-muted-foreground">
						{project.projectTags.length > 0
							? project.projectTags.slice(0, 3).join(" · ")
							: project.subtitle ||
								project.description ||
								"暂无描述"}
					</div>

					{/* Footer */}
					<div className="mt-auto flex items-center justify-between border-t border-border/50 pt-2">
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
								className="flex items-center gap-1.5 truncate text-[10px] font-medium text-muted-foreground transition-colors hover:text-foreground"
							>
								<UserAvatar
									name={project.user.name}
									avatarUrl={project.user.image}
									className="h-5 w-5"
								/>
								<span className="truncate">
									{project.user.name}
								</span>
							</Link>
						</div>
						<div className="flex items-center gap-2 font-mono text-[10px] font-bold text-muted-foreground">
							<span className="flex items-center gap-0.5">
								<HeartIcon className="h-3 w-3" />
								{project.likeCount}
							</span>
							<span className="flex items-center gap-0.5">
								<EyeIcon className="h-3 w-3" />
								{project.viewCount}
							</span>
						</div>
					</div>
				</div>
			</div>
		</Card>
	);
}
