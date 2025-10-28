"use client";

import {
	createOptimizedQueryClient,
	prefetchStrategies,
} from "@/lib/cache-config";
import { setupQueryClientMonitoring } from "@/lib/performance-monitor";
import { type QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { PropsWithChildren } from "react";
import { useEffect } from "react";

let clientQueryClientSingleton: QueryClient;
function getQueryClient() {
	if (typeof window === "undefined") {
		return createOptimizedQueryClient();
	}

	if (!clientQueryClientSingleton) {
		clientQueryClientSingleton = createOptimizedQueryClient();
		// 设置性能监控
		setupQueryClientMonitoring(clientQueryClientSingleton);
	}

	return clientQueryClientSingleton;
}

export function ApiClientProvider({ children }: PropsWithChildren) {
	const queryClient = getQueryClient();

	// 在客户端预加载关键数据
	useEffect(() => {
		if (typeof window !== "undefined") {
			// 延迟预加载，避免阻塞首屏渲染
			setTimeout(() => {
				prefetchStrategies.prefetchUserData(queryClient);
			}, 1000);
		}
	}, [queryClient]);

	return (
		<QueryClientProvider client={queryClient}>
			{children}
		</QueryClientProvider>
	);
}
