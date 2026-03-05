"use client";

import { createOptimizedQueryClient } from "@community/lib-client/cache-config";
import { setupQueryClientMonitoring } from "@community/lib-client/performance-monitor";
import { type QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { PropsWithChildren } from "react";

let clientQueryClientSingleton: QueryClient;
function getQueryClient() {
	if (typeof window === "undefined") {
		return createOptimizedQueryClient();
	}

	if (!clientQueryClientSingleton) {
		clientQueryClientSingleton = createOptimizedQueryClient();
		// 设置性能监控（仅开发环境）
		if (process.env.NODE_ENV === "development") {
			setupQueryClientMonitoring(clientQueryClientSingleton);
		}
	}

	return clientQueryClientSingleton;
}

export function ApiClientProvider({ children }: PropsWithChildren) {
	const queryClient = getQueryClient();

	return (
		<QueryClientProvider client={queryClient}>
			{children}
		</QueryClientProvider>
	);
}
