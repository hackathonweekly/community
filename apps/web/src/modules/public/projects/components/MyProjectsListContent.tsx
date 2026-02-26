"use client";

import { useQuery } from "@tanstack/react-query";
import { ProjectCard } from "./ProjectCard";
import { Skeleton } from "@community/ui/ui/skeleton";
import { Button } from "@community/ui/ui/button";
import { useTranslations } from "next-intl";

export function MyProjectsListContent() {
	const t = useTranslations("projects");

	// 获取用户的作品
	const { data, isLoading, error } = useQuery({
		queryKey: ["my-projects"],
		queryFn: async () => {
			const res = await fetch("/api/projects/my-projects");
			if (!res.ok) throw new Error("Failed to fetch my projects");
			return res.json();
		},
	});

	const projects = data?.projects || [];

	if (isLoading) {
		return (
			<div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4">
				{Array.from({ length: 6 }).map((_, i) => (
					<ProjectCardSkeleton key={i} />
				))}
			</div>
		);
	}

	if (error) {
		return (
			<div className="text-center py-12">
				<p className="text-red-500 mb-4">
					{t("projects.myProjects.loadingError")}
				</p>
				<Button
					onClick={() => window.location.reload()}
					variant="outline"
				>
					{t("projects.myProjects.reload")}
				</Button>
			</div>
		);
	}

	if (projects.length === 0) {
		return (
			<div className="text-center py-16">
				<div className="mb-6">
					<svg
						className="mx-auto h-24 w-24 text-muted-foreground/40"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						aria-hidden="true"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={1.5}
							d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
						/>
					</svg>
				</div>
				<h3 className="text-lg font-semibold text-foreground mb-2">
					{t("projects.myProjects.noProjects")}
				</h3>
				<p className="text-muted-foreground mb-6 max-w-md mx-auto">
					{t("projects.myProjects.noProjectsDesc")}
				</p>
				<p className="text-sm text-muted-foreground">
					前往项目管理页面创建您的第一个作品
				</p>
			</div>
		);
	}

	return (
		<div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4">
			{projects.map((project: any) => (
				<ProjectCard
					key={project.id}
					project={{
						...project,
						user: {
							...project.user,
							members:
								project.user.members?.map((member: any) => ({
									...member,
									organization: {
										...member.organization,
										slug:
											member.organization.slug ||
											member.organization.id,
									},
								})) || null,
						},
					}}
				/>
			))}
		</div>
	);
}

// 项目卡片骨架屏组件
function ProjectCardSkeleton() {
	return (
		<div className="animate-pulse">
			<Skeleton className="aspect-video w-full rounded-lg mb-4" />
			<Skeleton className="h-4 w-full mb-2" />
			<Skeleton className="h-3 w-3/4 mb-3" />
			<div className="flex items-center gap-2 mb-2">
				<Skeleton className="h-6 w-16" />
				<Skeleton className="h-6 w-20" />
			</div>
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-2">
					<Skeleton className="w-6 h-6 rounded-full" />
					<Skeleton className="h-3 w-16" />
				</div>
				<Skeleton className="h-3 w-12" />
			</div>
		</div>
	);
}
