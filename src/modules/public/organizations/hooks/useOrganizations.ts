"use client";

import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import {
	fetchMarketingOrganizations,
	type MarketingOrganizationListParams,
	type MarketingOrganizationListResponse,
} from "@/lib/api/api-fetchers";

export function useOrganizations(params: MarketingOrganizationListParams = {}) {
	const { search, tags, page = 1, limit = 12 } = params;

	return useQuery<MarketingOrganizationListResponse>({
		queryKey: ["organizations", { search, tags, page, limit }],
		queryFn: () =>
			fetchMarketingOrganizations({
				search,
				tags,
				page,
				limit,
			}),
		staleTime: 1000 * 60 * 30, // 30分钟 - 增加客户端缓存时间
		gcTime: 1000 * 60 * 60, // 1小时 - 增加垃圾回收时间
	});
}

export function useInfiniteOrganizations(
	params: Omit<MarketingOrganizationListParams, "page"> = {},
) {
	const { search, tags, limit = 12 } = params;

	return useInfiniteQuery({
		queryKey: ["organizations", "infinite", { search, tags, limit }],
		queryFn: async ({
			pageParam = 1,
		}): Promise<MarketingOrganizationListResponse> => {
			return fetchMarketingOrganizations({
				search,
				tags,
				limit,
				page: pageParam,
			});
		},
		getNextPageParam: (lastPage) => {
			const { page, totalPages } = lastPage.pagination;
			return page < totalPages ? page + 1 : undefined;
		},
		initialPageParam: 1,
		staleTime: 1000 * 60 * 5,
		gcTime: 1000 * 60 * 10,
	});
}

// 移除用户组织查询 hook - 改为在服务端预取
