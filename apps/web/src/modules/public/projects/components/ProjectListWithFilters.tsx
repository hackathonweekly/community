"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@community/ui/ui/button";
import { ProjectStage } from "@community/lib-shared/prisma-enums";
import { useProjects } from "../hooks/useProjectQueries";
import { buildProjectsUrl, mergeProjectUrlParams } from "../lib/url-utils";
import { ProjectCard } from "./ProjectCard";
import { CardSkeleton } from "@/modules/public/shared/components/CardSkeleton";
import { EmptyState } from "@/modules/public/shared/components/EmptyState";

export function ProjectListWithFilters() {
	const t = useTranslations("projects");
	const urlSearchParams = useSearchParams();

	const currentParams = useMemo(
		() => ({
			stage: urlSearchParams?.get("stage") || undefined,
			search: urlSearchParams?.get("search") || undefined,
			organization: urlSearchParams?.get("organization") || undefined,
			sort: urlSearchParams?.get("sort") || undefined,
			sortOrder:
				(urlSearchParams?.get("sortOrder") as "asc" | "desc") ||
				undefined,
		}),
		[urlSearchParams],
	);

	const {
		data: projectsData,
		isLoading,
		error,
		isFetching,
	} = useProjects(currentParams);

	const projects = projectsData?.projects ?? [];
	const stats = projectsData?.stats ?? { stats: [], totalProjects: 0 };

	const stageParam = currentParams.stage;

	const stageStats = useMemo(() => {
		if (!stats.stats) return [];
		const statsMap = new Map(
			stats.stats.map((s: any) => [s.stage, s._count.stage]),
		);
		return Object.values(ProjectStage).map((stageValue) => ({
			stage: stageValue,
			count: statsMap.get(stageValue) || 0,
		}));
	}, [stats.stats]);

	const { earlyProjectsCount, matureProjectsCount } = useMemo(() => {
		const earlyStages: ProjectStage[] = [
			ProjectStage.IDEA_VALIDATION,
			ProjectStage.DEVELOPMENT,
			ProjectStage.LAUNCH,
		];
		const matureStages: ProjectStage[] = [
			ProjectStage.GROWTH,
			ProjectStage.MONETIZATION,
			ProjectStage.FUNDING,
			ProjectStage.COMPLETED,
		];
		return {
			earlyProjectsCount: stageStats
				.filter((s) => earlyStages.includes(s.stage))
				.reduce((sum, s) => sum + s.count, 0),
			matureProjectsCount: stageStats
				.filter((s) => matureStages.includes(s.stage))
				.reduce((sum, s) => sum + s.count, 0),
		};
	}, [stageStats]);

	const { totalProjects } = stats;

	if (error) {
		return (
			<div className="rounded-lg border border-border bg-card p-3 text-center">
				<p className="mb-4 text-muted-foreground">加载项目时出错</p>
				<Button
					onClick={() => window.location.reload()}
					variant="outline"
				>
					重新加载
				</Button>
			</div>
		);
	}

	const filterOptions = [
		{
			value: undefined,
			label: `${t("filters.allProjects")} (${totalProjects})`,
			active: !stageParam,
		},
		{
			value: "featured",
			label: t("filters.featured") || "精选作品",
			active: stageParam === "featured",
		},
		{
			value: "recruiting",
			label: t("filters.recruiting") || "寻找团队",
			active: stageParam === "recruiting",
		},
		{
			value: "early",
			label: `${t("filters.early") || "早期项目"} (${earlyProjectsCount})`,
			active: stageParam === "early",
		},
		{
			value: "mature",
			label: `${t("filters.mature") || "成熟项目"} (${matureProjectsCount})`,
			active: stageParam === "mature",
		},
	];

	return (
		<div className="w-full space-y-4">
			<div className="flex items-center gap-2 overflow-x-auto pb-1">
				{filterOptions.map((option) => (
					<Link
						key={option.value ?? "all"}
						href={buildProjectsUrl(
							mergeProjectUrlParams(currentParams, {
								stage: option.value,
							}),
						)}
					>
						<Button
							variant={option.active ? "default" : "outline"}
							size="sm"
							className="flex-shrink-0 rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-wider"
						>
							{option.label}
						</Button>
					</Link>
				))}
			</div>

			{isLoading && !projectsData ? (
				<CardSkeleton
					count={6}
					className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
				/>
			) : (
				<div className="relative">
					{isFetching && projectsData && (
						<div className="fixed left-0 right-0 top-0 z-50 h-0.5 bg-primary/20">
							<div
								className="h-full bg-primary"
								style={{
									animation:
										"loading 1s ease-in-out infinite",
									background:
										"linear-gradient(90deg, transparent, currentColor, transparent)",
									backgroundSize: "50% 100%",
								}}
							/>
						</div>
					)}

					<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
						{projects.map((project: any) => (
							<ProjectCard
								key={project.id}
								project={{
									...project,
									user: {
										...project.user,
										members:
											project.user.members?.map(
												(member: any) => ({
													...member,
													organization: {
														...member.organization,
														slug:
															member.organization
																.slug ||
															member.organization
																.id,
													},
												}),
											) || null,
									},
								}}
							/>
						))}
					</div>
				</div>
			)}

			{!isLoading && projects.length === 0 && (
				<EmptyState
					title="没有找到相关项目"
					description={t("empty.message")}
					action={
						<div className="flex items-center justify-center gap-2">
							<Button asChild variant="outline">
								<Link href="/projects">
									{t("empty.viewAll")}
								</Link>
							</Button>
							<Button asChild>
								<Link href="/projects/create">创建项目</Link>
							</Button>
						</div>
					}
				/>
			)}
		</div>
	);
}
