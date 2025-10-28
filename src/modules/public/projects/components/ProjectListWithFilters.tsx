"use client";

import { AdvancedFilters } from "@/app/(public)/[locale]/projects/AdvancedFilters";
import { ProjectCard } from "@/app/(public)/[locale]/projects/ProjectCard";
import { SearchAndSort } from "@/app/(public)/[locale]/projects/SearchAndSort";
import {
	usePrefetchProjects,
	useProjects,
} from "@/app/(public)/[locale]/projects/hooks/useProjectQueries";
import {
	buildProjectsUrl,
	mergeProjectUrlParams,
} from "@/app/(public)/[locale]/projects/lib/url-utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { LocaleLink } from "@i18n/routing";
import { ProjectStage } from "@prisma/client";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef } from "react";

interface ProjectListWithFiltersProps {
	initialProjects: any[];
	initialStats: { stats: any[]; totalProjects: number };
	initialOrganizations: any[];
	searchParams: {
		stage?: string;
		search?: string;
		organization?: string;
		sort?: string;
		sortOrder?: "asc" | "desc";
	};
}

export function ProjectListWithFilters({
	initialProjects,
	initialStats,
	initialOrganizations,
	searchParams,
}: ProjectListWithFiltersProps) {
	const t = useTranslations("projects");
	const urlSearchParams = useSearchParams();

	// 从 URL 中读取当前参数，而不是使用 useState
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

	// 使用 useMemo 缓存 prefetch 函数，避免不必要的重新创建
	const { prefetchProjects, prefetchSmartSuggestions } =
		usePrefetchProjects();

	// 使用 ref 来存储预取状态，避免重复预取
	const prefetchedFilters = useRef(new Set<string>());

	// 使用 useMemo 缓存初始数据，避免不必要的重新渲染
	const initialData = useMemo(
		() => ({
			projects: initialProjects,
			stats: initialStats,
			organizations: initialOrganizations,
		}),
		[initialProjects, initialStats, initialOrganizations],
	);

	// 使用优化的 TanStack Query hooks 来获取数据
	const {
		data: projectsData,
		isLoading,
		error,
		isFetching,
	} = useProjects(currentParams, initialData);

	// 使用 useMemo 缓存解构的数据，避免不必要的重新渲染
	const { projects, stats, organizations } = useMemo(
		() => ({
			projects: projectsData?.projects || initialProjects,
			stats: projectsData?.stats || initialStats,
			organizations: projectsData?.organizations || initialOrganizations,
		}),
		[projectsData, initialProjects, initialStats, initialOrganizations],
	);

	// 优化的预取逻辑 - 使用防抖和缓存
	const prefetchCommonFilters = useCallback(() => {
		// 使用智能预取策略
		prefetchSmartSuggestions(currentParams);
	}, [currentParams, prefetchSmartSuggestions]);

	// 使用防抖的预取，避免频繁请求
	useEffect(() => {
		const timer = setTimeout(() => {
			prefetchCommonFilters();
		}, 500); // 增加防抖时间到500ms，减少不必要的请求

		return () => clearTimeout(timer);
	}, [prefetchCommonFilters]);

	// Parse stage parameter，使用 useMemo 缓存
	const stageParam = currentParams.stage;

	// 优化 stageStats 计算，使用 Map 提高查找效率
	const stageStats = useMemo(() => {
		if (!stats.stats) return [];

		// 创建 Map 用于快速查找
		const statsMap = new Map(
			stats.stats.map((s: any) => [s.stage, s._count.stage]),
		);

		return Object.values(ProjectStage).map((stageValue) => ({
			stage: stageValue,
			count: statsMap.get(stageValue) || 0,
		}));
	}, [stats.stats]);

	// 缓存早期项目和成熟项目的计数
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

		const earlyCount = stageStats
			.filter((s) => earlyStages.includes(s.stage))
			.reduce((sum, s) => sum + s.count, 0);

		const matureCount = stageStats
			.filter((s) => matureStages.includes(s.stage))
			.reduce((sum, s) => sum + s.count, 0);

		return {
			earlyProjectsCount: earlyCount,
			matureProjectsCount: matureCount,
		};
	}, [stageStats]);

	const { totalProjects } = stats;

	// 错误处理
	if (error) {
		return (
			<div className="container max-w-6xl pt-8">
				<div className="text-center py-12">
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

	return (
		<div className="w-full">
			{/* 搜索和筛选 */}
			<SearchAndSort
				search={currentParams.search}
				sort={currentParams.sort}
				sortOrder={currentParams.sortOrder}
				stageParam={stageParam}
				organization={currentParams.organization}
			/>

			{/* 主要筛选按钮 - 横向滚动优化 */}
			<div className="mb-6 -mx-4 sm:mx-0">
				<div className="overflow-x-auto scrollbar-hide">
					<div className="flex gap-2 px-4 sm:px-0 sm:justify-center min-w-max sm:min-w-0">
						<LocaleLink
							href={buildProjectsUrl(
								mergeProjectUrlParams(currentParams, {
									stage: undefined,
								}),
							)}
						>
							<Badge
								variant={!stageParam ? "default" : "secondary"}
								className={`cursor-pointer text-sm px-4 py-2 hover:shadow-md transition-all duration-200 whitespace-nowrap ${
									!stageParam
										? "bg-blue-600 text-white hover:bg-blue-700"
										: "bg-gray-100 text-gray-700 hover:bg-gray-200"
								}`}
							>
								全部作品 ({totalProjects})
							</Badge>
						</LocaleLink>

						<LocaleLink
							href={buildProjectsUrl(
								mergeProjectUrlParams(currentParams, {
									stage: "featured",
								}),
							)}
						>
							<Badge
								variant="secondary"
								className={`cursor-pointer text-sm px-4 py-2 hover:shadow-md transition-all duration-200 whitespace-nowrap ${
									stageParam === "featured"
										? "bg-yellow-600 text-white hover:bg-yellow-700"
										: "bg-yellow-50 text-yellow-700 border border-yellow-200 hover:bg-yellow-100"
								}`}
							>
								✨ 精选作品
							</Badge>
						</LocaleLink>

						<LocaleLink
							href={buildProjectsUrl(
								mergeProjectUrlParams(currentParams, {
									stage: "recruiting",
								}),
							)}
						>
							<Badge
								variant="secondary"
								className={`cursor-pointer text-sm px-4 py-2 hover:shadow-md transition-all duration-200 whitespace-nowrap ${
									stageParam === "recruiting"
										? "bg-blue-600 text-white hover:bg-blue-700"
										: "bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100"
								}`}
							>
								👥 寻找团队
							</Badge>
						</LocaleLink>

						<LocaleLink
							href={buildProjectsUrl(
								mergeProjectUrlParams(currentParams, {
									stage: "early",
								}),
							)}
						>
							<Badge
								variant="secondary"
								className={`cursor-pointer text-sm px-4 py-2 hover:shadow-md transition-all duration-200 whitespace-nowrap ${
									stageParam === "early"
										? "bg-green-600 text-white hover:bg-green-700"
										: "bg-green-50 text-green-700 border border-green-200 hover:bg-green-100"
								}`}
							>
								🌱 早期项目 ({earlyProjectsCount})
							</Badge>
						</LocaleLink>

						<LocaleLink
							href={buildProjectsUrl(
								mergeProjectUrlParams(currentParams, {
									stage: "mature",
								}),
							)}
						>
							<Badge
								variant="secondary"
								className={`cursor-pointer text-sm px-4 py-2 hover:shadow-md transition-all duration-200 whitespace-nowrap ${
									stageParam === "mature"
										? "bg-purple-600 text-white hover:bg-purple-700"
										: "bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100"
								}`}
							>
								🚀 成熟项目 ({matureProjectsCount})
							</Badge>
						</LocaleLink>
					</div>
				</div>
			</div>

			{/* 高级筛选选项 */}
			<AdvancedFilters
				stageParam={stageParam}
				organization={currentParams.organization}
				search={currentParams.search}
				stageStats={stageStats}
				organizations={organizations}
			/>

			{/* Projects Grid - 优化间距和响应式 */}
			{isLoading && !projectsData ? (
				// 初始加载状态
				<div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4">
					{Array.from({ length: 8 }).map((_, i) => (
						<ProjectCardSkeleton key={i} />
					))}
				</div>
			) : (
				<div className="relative">
					{/* 顶部进度条 - 非阻塞式加载指示 */}
					{isFetching && projectsData && (
						<div className="fixed top-0 left-0 right-0 z-50 h-1 bg-primary/20">
							<div
								className="h-full bg-primary animate-[loading_1s_ease-in-out_infinite]"
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

					<div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4">
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

			{/* Empty State - 优化版 */}
			{!isLoading && projects.length === 0 && (
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
						没有找到相关项目
					</h3>
					<p className="text-muted-foreground mb-6 max-w-md mx-auto">
						{t("empty.message")}
					</p>
					<div className="flex gap-3 justify-center">
						<LocaleLink href="/projects">
							<Button variant="outline">
								{t("empty.viewAll")}
							</Button>
						</LocaleLink>
						<Button asChild>
							<a href="/app/projects/create">创建项目</a>
						</Button>
					</div>
				</div>
			)}
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
