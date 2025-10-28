import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { cacheConfig, requestDeduplicator } from "@/lib/cache-config";
import {
	fetchEventsList,
	fetchEventsOrganizations,
	type EventListItem,
	type EventOrganizationSummary,
} from "./api-fetchers";
import { queryKeys } from "@/lib/query-keys";

// Profile API Hook
export function useProfileQuery() {
	return useQuery({
		queryKey: queryKeys.profile(),
		queryFn: async () => {
			const key = "profile";
			return requestDeduplicator.deduplicate(key, async () => {
				const response = await fetch("/api/profile");
				if (!response.ok) {
					throw new Error("Failed to fetch profile");
				}
				const data = await response.json();
				return data.user;
			});
		},
		...cacheConfig.stable, // 用户资料变化较少，使用稳定缓存策略
		retry: (failureCount, error) => {
			// 如果是认证错误，不重试
			if (
				error instanceof Error &&
				(error.message.includes("401") ||
					error.message.includes("Unauthorized"))
			) {
				return false;
			}
			return failureCount < 2;
		},
	});
}

// Projects API Hook
export function useProjectsQuery(userId?: string) {
	return useQuery({
		queryKey: queryKeys.projects(userId ? { userId } : undefined),
		queryFn: async () => {
			const key = `projects-${userId || "all"}`;
			return requestDeduplicator.deduplicate(key, async () => {
				const url = userId
					? `/api/projects?userId=${userId}`
					: "/api/projects";
				const response = await fetch(url);
				if (!response.ok) {
					throw new Error("Failed to fetch projects");
				}
				const data = await response.json();
				return data.projects || [];
			});
		},
		...cacheConfig.moderate, // 项目数据中等变化频率
		retry: (failureCount, error) => {
			// 如果是认证错误，不重试
			if (
				error instanceof Error &&
				(error.message.includes("401") ||
					error.message.includes("Unauthorized"))
			) {
				return false;
			}
			return failureCount < 2;
		},
	});
}

// Participated Projects API Hook
export function useParticipatedProjectsQuery() {
	return useQuery({
		queryKey: queryKeys.participatedProjects(),
		queryFn: async () => {
			const key = "projects-participated";
			return requestDeduplicator.deduplicate(key, async () => {
				const response = await fetch("/api/projects/participated");
				if (!response.ok) {
					throw new Error("Failed to fetch participated projects");
				}
				const data = await response.json();
				return data.projects || [];
			});
		},
		...cacheConfig.moderate, // 参与的项目数据中等变化频率
	});
}

// Notifications API Hooks
export function useNotificationsQuery(
	page = 1,
	limit = 20,
	options?: { enabled?: boolean },
) {
	return useQuery({
		queryKey: queryKeys.notifications.list(page, limit),
		queryFn: async () => {
			const key = `notifications-${page}-${limit}`;
			return requestDeduplicator.deduplicate(key, async () => {
				const response = await fetch(
					`/api/notifications?page=${page}&limit=${limit}`,
				);
				if (!response.ok) {
					throw new Error("Failed to fetch notifications");
				}
				return response.json();
			});
		},
		...cacheConfig.realtime, // 通知数据实时性要求高
		enabled: options?.enabled ?? true,
	});
}

export function useUnreadNotificationsCountQuery(options?: {
	enabled?: boolean;
}) {
	return useQuery({
		queryKey: queryKeys.notifications.unreadCount(),
		queryFn: async () => {
			const key = "notifications-unread-count";
			return requestDeduplicator.deduplicate(key, async () => {
				const response = await fetch("/api/notifications/unread-count");
				if (!response.ok) {
					throw new Error("Failed to fetch unread count");
				}
				const data = await response.json();
				return data.data.unreadCount;
			});
		},
		...cacheConfig.realtime, // 未读数量需要实时更新
		refetchInterval: 15 * 1000, // 减少轮询频率到15秒，减轻服务器压力
		enabled: options?.enabled ?? true,
	});
}

// Following API Hooks
export function useUserFollowingQuery() {
	return useQuery({
		queryKey: queryKeys.following.users(),
		queryFn: async () => {
			const response = await fetch("/api/user/following");
			if (!response.ok) {
				throw new Error("Failed to fetch user following");
			}
			const data = await response.json();
			return data?.data?.users || [];
		},
		staleTime: 2 * 60 * 1000, // 2分钟
		gcTime: 10 * 60 * 1000,
	});
}

export function useUserFollowersQuery() {
	return useQuery({
		queryKey: queryKeys.following.followers(),
		queryFn: async () => {
			const response = await fetch("/api/user/followers");
			if (!response.ok) {
				throw new Error("Failed to fetch user followers");
			}
			const data = await response.json();
			return data?.data?.users || [];
		},
		staleTime: 2 * 60 * 1000,
		gcTime: 10 * 60 * 1000,
	});
}

export function useEventBookmarksQuery() {
	return useQuery({
		queryKey: queryKeys.bookmarks.events(),
		queryFn: async () => {
			const response = await fetch("/api/user/event-bookmarks");
			if (!response.ok) {
				throw new Error("Failed to fetch event bookmarks");
			}
			const data = await response.json();
			return data?.bookmarks || [];
		},
		...cacheConfig.realtime, // 活动收藏状态需要实时更新
	});
}

export function useProjectBookmarksQuery() {
	return useQuery({
		queryKey: queryKeys.bookmarks.projects(),
		queryFn: async () => {
			const response = await fetch("/api/user/project-bookmarks");
			if (!response.ok) {
				throw new Error("Failed to fetch project bookmarks");
			}
			const data = await response.json();
			return data?.data?.projects || [];
		},
		staleTime: 2 * 60 * 1000, // 2分钟
		gcTime: 10 * 60 * 1000,
	});
}

// User Events API Hooks
export function useUserRegistrationsQuery() {
	return useQuery({
		queryKey: queryKeys.user.registrations(),
		queryFn: async () => {
			const response = await fetch("/api/user/registrations");
			if (!response.ok) {
				throw new Error("Failed to fetch user registrations");
			}
			const data = await response.json();
			return data?.data?.registrations || [];
		},
		...cacheConfig.realtime, // 用户注册状态需要实时更新
	});
}

export function useUserEventsQuery() {
	return useQuery({
		queryKey: queryKeys.user.events(),
		queryFn: async () => {
			const response = await fetch("/api/user/events");
			if (!response.ok) {
				throw new Error("Failed to fetch user events");
			}
			const data = await response.json();
			return data?.data?.events || [];
		},
		...cacheConfig.realtime, // 用户活动列表需要实时更新
	});
}

export function useInteractiveUsersQuery(limit?: number) {
	return useQuery({
		queryKey: queryKeys.user.interactiveUsers(limit),
		queryFn: async () => {
			const url = limit
				? `/api/user/interactive-users?limit=${limit}`
				: "/api/user/interactive-users";
			const response = await fetch(url);
			if (!response.ok) {
				throw new Error("Failed to fetch interactive users");
			}
			const data = await response.json();
			return {
				users: data?.data?.users || [],
				totalCount: data?.data?.pagination?.total || 0,
			};
		},
		staleTime: 2 * 60 * 1000,
		gcTime: 10 * 60 * 1000,
	});
}

export function useMutualFriendsQuery(limit?: number) {
	return useQuery({
		queryKey: queryKeys.user.mutualFriends(limit),
		queryFn: async () => {
			const url = limit
				? `/api/user/mutual-friends?limit=${limit}`
				: "/api/user/mutual-friends";
			const response = await fetch(url);
			if (!response.ok) {
				throw new Error("Failed to fetch mutual friends");
			}
			const data = await response.json();
			return {
				users: data?.data?.users || [],
				totalCount: data?.data?.pagination?.total || 0,
			};
		},
		staleTime: 2 * 60 * 1000,
		gcTime: 10 * 60 * 1000,
	});
}

// Notification Mutations
export function useMarkNotificationAsReadMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (notificationId: string) => {
			const response = await fetch(
				`/api/notifications/${notificationId}/read`,
				{
					method: "POST",
				},
			);
			if (!response.ok) {
				throw new Error("Failed to mark notification as read");
			}
			return response.json();
		},
		onSuccess: () => {
			// 更新通知列表和未读计数
			queryClient.invalidateQueries({
				queryKey: queryKeys.notifications.all(),
			});
			queryClient.invalidateQueries({
				queryKey: queryKeys.notifications.unreadCount(),
			});
		},
	});
}

export function useMarkAllNotificationsAsReadMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async () => {
			const response = await fetch("/api/notifications/read-all", {
				method: "PUT",
			});
			if (!response.ok) {
				throw new Error("Failed to mark all notifications as read");
			}
			return response.json();
		},
		onSuccess: () => {
			// 更新通知列表和未读计数
			queryClient.invalidateQueries({
				queryKey: queryKeys.notifications.all(),
			});
			queryClient.setQueryData(queryKeys.notifications.unreadCount(), 0);
		},
	});
}

export function useDeleteNotificationMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (notificationId: string) => {
			const response = await fetch(
				`/api/notifications/${notificationId}`,
				{
					method: "DELETE",
				},
			);
			if (!response.ok) {
				throw new Error("Failed to delete notification");
			}
			return response.json();
		},
		onSuccess: () => {
			// 更新通知列表
			queryClient.invalidateQueries({
				queryKey: queryKeys.notifications.all(),
			});
		},
	});
}

export function useUserFollowingExcludingMutualQuery() {
	return useQuery({
		queryKey: ["following", "excluding-mutual"],
		queryFn: async () => {
			const response = await fetch(
				"/api/user/followed-users-excluding-mutual",
			);
			if (!response.ok) {
				throw new Error("Failed to fetch following excluding mutual");
			}
			const data = await response.json();
			return data?.data?.users || [];
		},
		staleTime: 2 * 60 * 1000,
		gcTime: 10 * 60 * 1000,
	});
}

export function useEventsListQuery(params?: {
	search?: string;
	type?: string;
	organizationId?: string;
	isOnline?: string;
	status?: string;
	showExpired?: boolean;
	hostType?: "organization" | "individual";
}) {
	return useQuery<EventListItem[]>({
		queryKey: queryKeys.events.list(params),
		queryFn: () => fetchEventsList(params),
		...cacheConfig.realtime, // 活动数据需要实时更新
		refetchOnWindowFocus: true,
		refetchOnReconnect: true,
	});
}

export function useEventsOrganizationsQuery() {
	return useQuery<EventOrganizationSummary[]>({
		queryKey: queryKeys.events.organizations(),
		queryFn: () => fetchEventsOrganizations(),
		staleTime: 10 * 60 * 1000, // 10 minutes - organizations change less frequently
		gcTime: 30 * 60 * 1000,
	});
}
