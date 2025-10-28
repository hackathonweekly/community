import { QueryClient } from "@tanstack/react-query";

// 缓存策略配置
export const cacheConfig = {
	// 快速变化的数据 - 短时间缓存
	realtime: {
		staleTime: 5 * 1000, // 5秒 - 进一步缩短实时数据的过期时间
		gcTime: 1 * 60 * 1000, // 1分钟
	},
	// 中等变化的数据 - 中等时间缓存
	moderate: {
		staleTime: 2 * 60 * 1000, // 2分钟
		gcTime: 10 * 60 * 1000, // 10分钟
	},
	// 慢变化的数据 - 长时间缓存
	stable: {
		staleTime: 5 * 60 * 1000, // 5分钟
		gcTime: 30 * 60 * 1000, // 30分钟
	},
	// 极少变化的数据 - 更长时间缓存
	static: {
		staleTime: 15 * 60 * 1000, // 15分钟
		gcTime: 60 * 60 * 1000, // 1小时
	},
} as const;

// 请求去重器
class RequestDeduplicator {
	private pendingRequests = new Map<string, Promise<any>>();

	async deduplicate<T>(key: string, requestFn: () => Promise<T>): Promise<T> {
		if (this.pendingRequests.has(key)) {
			return this.pendingRequests.get(key) as Promise<T>;
		}

		const promise = requestFn().finally(() => {
			this.pendingRequests.delete(key);
		});

		this.pendingRequests.set(key, promise);
		return promise;
	}

	clear(key?: string) {
		if (key) {
			this.pendingRequests.delete(key);
		} else {
			this.pendingRequests.clear();
		}
	}
}

export const requestDeduplicator = new RequestDeduplicator();

// QueryClient 扩展功能
export function createOptimizedQueryClient() {
	const queryClient = new QueryClient({
		defaultOptions: {
			queries: {
				...cacheConfig.moderate,
				retry: (failureCount, error) => {
					// 对于认证错误不重试
					if (
						error instanceof Error &&
						error.message.includes("401")
					) {
						return false;
					}
					// 对于404错误不重试
					if (
						error instanceof Error &&
						error.message.includes("404")
					) {
						return false;
					}
					// 最多重试2次
					return failureCount < 2;
				},
				retryDelay: (attemptIndex) =>
					Math.min(1000 * 2 ** attemptIndex, 30000),
				refetchOnWindowFocus: true,
				refetchOnReconnect: true,
				refetchOnMount: true,
				networkMode: "online",
			},
			mutations: {
				retry: 1,
				retryDelay: 1000,
				networkMode: "online",
			},
		},
	});

	// 添加全局错误处理
	queryClient.getQueryCache().config.onError = (error) => {
		console.error("Query error:", error);
	};

	queryClient.getMutationCache().config.onError = (error) => {
		console.error("Mutation error:", error);
	};

	return queryClient;
}

// 智能缓存失效策略
export const cacheInvalidation = {
	// 用户资料相关
	onProfileUpdate: (queryClient: QueryClient) => {
		queryClient.invalidateQueries({ queryKey: ["profile"] });
	},

	// 项目相关
	onProjectUpdate: (queryClient: QueryClient, userId?: string) => {
		queryClient.invalidateQueries({ queryKey: ["projects"] });
		if (userId) {
			queryClient.invalidateQueries({
				queryKey: ["projects", { userId }],
			});
		}
	},

	// 通知相关
	onNotificationUpdate: (queryClient: QueryClient) => {
		queryClient.invalidateQueries({ queryKey: ["notifications"] });
	},

	// 书签相关
	onBookmarkUpdate: (queryClient: QueryClient) => {
		queryClient.invalidateQueries({ queryKey: ["bookmarks"] });
	},

	// 用户互动相关
	onUserInteractionUpdate: (queryClient: QueryClient) => {
		queryClient.invalidateQueries({
			queryKey: ["user", "interactive-users"],
		});
		queryClient.invalidateQueries({ queryKey: ["bookmarks"] });
	},

	// 活动相关
	onEventUpdate: (queryClient: QueryClient, eventId?: string) => {
		// 使所有事件列表查询无效
		queryClient.invalidateQueries({ queryKey: ["events", "list"] });
		// 如果提供了具体的事件ID，也使该事件的详情无效
		if (eventId) {
			queryClient.invalidateQueries({
				queryKey: ["events", "detail", eventId],
			});
			queryClient.invalidateQueries({
				queryKey: ["events", "engagement", eventId],
			});
		}
		// 使用户相关的事件数据无效
		queryClient.invalidateQueries({
			queryKey: ["user", "registrations"],
		});
		queryClient.invalidateQueries({
			queryKey: ["user", "events"],
		});
		queryClient.invalidateQueries({
			queryKey: ["bookmarks", "events"],
		});
	},

	// 组织相关 - 新增
	onOrganizationUpdate: (queryClient: QueryClient, userId?: string) => {
		queryClient.invalidateQueries({ queryKey: ["organizations"] });
		queryClient.invalidateQueries({ queryKey: ["user-organizations"] });
		if (userId) {
			queryClient.invalidateQueries({
				queryKey: ["user-organizations", userId],
			});
		}
		// 也失效事件相关查询，因为组织变化可能影响活动创建权限
		queryClient.invalidateQueries({ queryKey: ["events"] });
	},

	// 认证状态相关 - 关键：用户登录/退出时的缓存管理
	onAuthChange: (queryClient: QueryClient, isLoggedIn: boolean) => {
		if (!isLoggedIn) {
			// 用户退出登录时，清除所有用户相关的缓存数据
			queryClient.invalidateQueries({ queryKey: ["auth"] });
			queryClient.invalidateQueries({ queryKey: ["profile"] });
			queryClient.invalidateQueries({ queryKey: ["projects"] });
			queryClient.invalidateQueries({ queryKey: ["bookmarks"] });
			queryClient.invalidateQueries({ queryKey: ["notifications"] });
			queryClient.invalidateQueries({ queryKey: ["user"] });
			queryClient.invalidateQueries({ queryKey: ["organizations"] });
			queryClient.invalidateQueries({ queryKey: ["user-organizations"] });

			// 清除缓存数据而不是仅仅使其失效
			queryClient.removeQueries({ queryKey: ["auth"] });
			queryClient.removeQueries({ queryKey: ["profile"] });
			queryClient.removeQueries({ queryKey: ["projects"] });
			queryClient.removeQueries({ queryKey: ["bookmarks"] });
			queryClient.removeQueries({ queryKey: ["notifications"] });
			queryClient.removeQueries({ queryKey: ["user"] });
			queryClient.removeQueries({ queryKey: ["organizations"] });
			queryClient.removeQueries({ queryKey: ["user-organizations"] });
		} else {
			// 用户登录时，清除认证相关缓存并触发重新获取
			queryClient.invalidateQueries({ queryKey: ["auth", "session"] });
			queryClient.invalidateQueries({ queryKey: ["profile"] });
		}
	},
} as const;

// 批量预加载策略
export const prefetchStrategies = {
	// 预加载用户相关数据
	async prefetchUserData(queryClient: QueryClient) {
		const prefetchPromises = [
			// 预加载用户资料
			queryClient.prefetchQuery({
				queryKey: ["profile"],
				queryFn: async () => {
					const response = await fetch("/api/profile");
					if (!response.ok) {
						throw new Error("Failed to fetch profile");
					}
					const data = await response.json();
					return data.user;
				},
				staleTime: cacheConfig.stable.staleTime,
			}),
			// 预加载未读通知数量
			queryClient.prefetchQuery({
				queryKey: ["notifications", "unread-count"],
				queryFn: async () => {
					const response = await fetch(
						"/api/notifications/unread-count",
					);
					if (!response.ok) {
						throw new Error("Failed to fetch unread count");
					}
					const data = await response.json();
					return data.data.unreadCount;
				},
				staleTime: cacheConfig.realtime.staleTime,
			}),
		];

		await Promise.allSettled(prefetchPromises);
	},

	// 预加载仪表板数据
	async prefetchDashboardData(queryClient: QueryClient) {
		const prefetchPromises = [
			// 预加载项目数据
			queryClient.prefetchQuery({
				queryKey: ["projects"],
				queryFn: async () => {
					const response = await fetch("/api/projects");
					if (!response.ok) {
						throw new Error("Failed to fetch projects");
					}
					const data = await response.json();
					return data.projects || [];
				},
				staleTime: cacheConfig.moderate.staleTime,
			}),
			// 预加载书签数据
			queryClient.prefetchQuery({
				queryKey: ["bookmarks", "combined"],
				queryFn: async () => {
					const response = await fetch("/api/user/bookmarks");
					if (!response.ok) {
						throw new Error("Failed to fetch user bookmarks");
					}
					const data = await response.json();
					return {
						events: data?.data?.events || [],
						projects: data?.data?.projects || [],
					};
				},
				staleTime: cacheConfig.moderate.staleTime,
			}),
			// 预加载用户注册的活动
			queryClient.prefetchQuery({
				queryKey: ["user", "registrations"],
				queryFn: async () => {
					const response = await fetch("/api/user/registrations");
					if (!response.ok) {
						throw new Error("Failed to fetch user registrations");
					}
					const data = await response.json();
					return data?.data?.registrations || [];
				},
				staleTime: cacheConfig.moderate.staleTime,
			}),
			// 预加载互关好友数据
			queryClient.prefetchQuery({
				queryKey: ["user", "mutual-friends", 1],
				queryFn: async () => {
					const response = await fetch(
						"/api/user/mutual-friends?limit=1",
					);
					if (!response.ok) {
						throw new Error("Failed to fetch mutual friends");
					}
					const data = await response.json();
					return {
						users: data?.data?.users || [],
						totalCount: data?.data?.pagination?.total || 0,
					};
				},
				staleTime: cacheConfig.moderate.staleTime,
			}),
		];

		await Promise.allSettled(prefetchPromises);
	},
} as const;
