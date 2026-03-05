import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
	fetchPublicProjects,
	type ProjectSearchParams,
	type PublicProjectsResponse,
} from "@community/lib-shared/api/api-fetchers";
import { useCallback, useRef } from "react";

export type { ProjectSearchParams };

export function useProjects(
	params: ProjectSearchParams,
	initialData?: PublicProjectsResponse,
) {
	return useQuery({
		queryKey: ["projects", params],
		queryFn: () => fetchPublicProjects(params),
		initialData,
		staleTime: 5 * 60 * 1000, // 5分钟缓存
		gcTime: 10 * 60 * 1000, // 10分钟垃圾回收
		refetchOnWindowFocus: false,
		retry: 3,
		retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
		// 添加网络模式控制，离线时使用缓存
		networkMode: "offlineFirst",
		// 添加占位符数据，提升用户体验
		placeholderData: (previousData) => previousData,
	});
}

// 预取函数，用于预先加载常用筛选条件的数据
export function usePrefetchProjects() {
	const queryClient = useQueryClient();
	// 使用 ref 来跟踪预取状态，避免重复预取
	const prefetchCache = useRef(new Map<string, number>());

	const prefetchProjects = useCallback(
		(params: ProjectSearchParams) => {
			const cacheKey = JSON.stringify(params);
			const now = Date.now();
			const lastPrefetch = prefetchCache.current.get(cacheKey);

			// 如果最近5分钟内已经预取过，则跳过
			if (lastPrefetch && now - lastPrefetch < 5 * 60 * 1000) {
				return;
			}

			// 检查是否已有缓存数据
			const existingData = queryClient.getQueryData(["projects", params]);
			if (existingData) {
				// 如果数据仍然新鲜，不需要预取
				const queryState = queryClient.getQueryState([
					"projects",
					params,
				]);
				if (
					queryState?.dataUpdatedAt &&
					now - queryState.dataUpdatedAt < 5 * 60 * 1000
				) {
					return;
				}
			}

			// 记录预取时间
			prefetchCache.current.set(cacheKey, now);

			// 执行预取
			queryClient.prefetchQuery({
				queryKey: ["projects", params],
				queryFn: () => fetchPublicProjects(params),
				staleTime: 5 * 60 * 1000,
				gcTime: 10 * 60 * 1000,
			});
		},
		[queryClient],
	);

	// 智能预取策略：根据用户行为预测可能需要的数据
	const prefetchSmartSuggestions = useCallback(
		(currentParams: ProjectSearchParams) => {
			// 如果用户查看"全部"，预取"精选"和"招募中"
			if (!currentParams.stage) {
				prefetchProjects({ ...currentParams, stage: "featured" });
				prefetchProjects({ ...currentParams, stage: "recruiting" });
			}
			// 如果用户查看"早期项目"，预取"成熟项目"
			else if (currentParams.stage === "early") {
				prefetchProjects({ ...currentParams, stage: "mature" });
			}
			// 如果用户查看"成熟项目"，预取"早期项目"
			else if (currentParams.stage === "mature") {
				prefetchProjects({ ...currentParams, stage: "early" });
			}
			// 如果用户有搜索词，预取无搜索词的相同筛选条件
			if (currentParams.search) {
				const { search, ...paramsWithoutSearch } = currentParams;
				prefetchProjects(paramsWithoutSearch);
			}
		},
		[prefetchProjects],
	);

	return { prefetchProjects, prefetchSmartSuggestions };
}

// 获取项目统计数据的单独 hook（已弃用 - 统计数据现在包含在主API响应中）
// export function useProjectStats(initialStats?: {
// 	stats: any[];
// 	totalProjects: number;
// }) {
// 	return useQuery({
// 		queryKey: ["project-stats"],
// 		queryFn: async () => {
// 			const response = await fetch("/api/projects/stats");
// 			if (!response.ok) {
// 				throw new Error("Failed to fetch project stats");
// 			}
// 			return response.json();
// 		},
// 		initialData: initialStats,
// 		staleTime: 10 * 60 * 1000, // 统计数据可以缓存更久
// 		gcTime: 30 * 60 * 1000,
// 	});
// }
