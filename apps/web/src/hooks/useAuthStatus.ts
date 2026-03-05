"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { cacheInvalidation } from "@community/lib-client/cache-config";
import { useEffect, useRef } from "react";

interface UserSession {
	user?: {
		id: string;
		name: string;
		email: string;
		image?: string;
	};
}

export function useAuthStatus() {
	const queryClient = useQueryClient();
	const prevUserIdRef = useRef<string | null>(null);

	const query = useQuery({
		queryKey: ["auth", "session"],
		queryFn: async (): Promise<UserSession | null> => {
			const response = await fetch(
				"/api/auth/get-session?disableCookieCache=true",
			);
			if (!response.ok) {
				return null;
			}
			return response.json();
		},
		staleTime: 30 * 1000, // 缩短到30秒，Auth状态变化应该更快反映
		gcTime: 1000 * 60 * 5, // 5 minutes
		retry: false,
		refetchOnWindowFocus: true,
	});

	// 监听用户状态变化，处理缓存清理
	useEffect(() => {
		const currentUserId = query.data?.user?.id || null;
		const prevUserId = prevUserIdRef.current;

		// 检测到用户变化（登录、退出或切换账号）
		if (prevUserId !== currentUserId) {
			if (prevUserId && !currentUserId) {
				// 用户退出登录
				cacheInvalidation.onAuthChange(queryClient, false);
			} else if (!prevUserId && currentUserId) {
				// 用户登录
				cacheInvalidation.onAuthChange(queryClient, true);
			} else if (
				prevUserId &&
				currentUserId &&
				prevUserId !== currentUserId
			) {
				// 用户切换账号，先清除之前用户的数据，再重新获取新用户数据
				cacheInvalidation.onAuthChange(queryClient, false);
				// 短暂延迟后触发新用户数据获取
				setTimeout(() => {
					cacheInvalidation.onAuthChange(queryClient, true);
				}, 100);
			}

			// 更新 ref
			prevUserIdRef.current = currentUserId;
		}
	}, [query.data?.user?.id, queryClient]);

	return {
		user: query.data?.user,
		isLoading: query.isLoading,
		error: query.error,
		refetch: query.refetch,
	};
}
