import {
	QueryClient,
	defaultShouldDehydrateQuery,
} from "@tanstack/react-query";

export function createQueryClient() {
	return new QueryClient({
		defaultOptions: {
			queries: {
				// 默认缓存时间设置
				staleTime: 2 * 60 * 1000, // 2分钟 - 数据被认为是新鲜的时间
				gcTime: 10 * 60 * 1000, // 10分钟 - 垃圾回收时间

				// 网络重试策略
				retry: (failureCount, error) => {
					// 对于认证错误不重试
					if (
						error instanceof Error &&
						error.message.includes("401")
					) {
						return false;
					}
					// 最多重试2次
					return failureCount < 2;
				},
				retryDelay: (attemptIndex) =>
					Math.min(1000 * 2 ** attemptIndex, 30000),

				// 重新获取策略
				refetchOnWindowFocus: true,
				refetchOnReconnect: true,
				refetchOnMount: true,

				// 请求去重
				networkMode: "online",
			},
			mutations: {
				// Mutation 重试策略
				retry: 1,
				retryDelay: 1000,
				networkMode: "online",
			},
			dehydrate: {
				shouldDehydrateQuery: (query) =>
					defaultShouldDehydrateQuery(query) ||
					query.state.status === "pending",
			},
		},
	});
}

export function createQueryKeyWithParams(
	key: string | string[],
	params: Record<string, string | number>,
) {
	return [
		...(Array.isArray(key) ? key : [key]),
		Object.entries(params)
			.reduce((acc, [key, value]) => {
				acc.push(`${key}:${value}`);
				return acc;
			}, [] as string[])
			.join("_"),
	] as const;
}
