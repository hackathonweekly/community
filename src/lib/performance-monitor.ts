import type { QueryClient } from "@tanstack/react-query";

// 性能监控工具
export class ApiPerformanceMonitor {
	private static instance: ApiPerformanceMonitor;
	private requestLog: Map<
		string,
		{
			count: number;
			totalTime: number;
			lastRequest: number;
		}
	> = new Map();

	static getInstance(): ApiPerformanceMonitor {
		if (!ApiPerformanceMonitor.instance) {
			ApiPerformanceMonitor.instance = new ApiPerformanceMonitor();
		}
		return ApiPerformanceMonitor.instance;
	}

	logRequest(endpoint: string, duration: number) {
		const now = Date.now();
		const existing = this.requestLog.get(endpoint);

		if (existing) {
			existing.count += 1;
			existing.totalTime += duration;
			existing.lastRequest = now;
		} else {
			this.requestLog.set(endpoint, {
				count: 1,
				totalTime: duration,
				lastRequest: now,
			});
		}
	}

	getStats() {
		const stats: Array<{
			endpoint: string;
			count: number;
			avgTime: number;
			lastRequest: Date;
		}> = [];

		for (const [endpoint, data] of Array.from(this.requestLog.entries())) {
			stats.push({
				endpoint,
				count: data.count,
				avgTime: Math.round(data.totalTime / data.count),
				lastRequest: new Date(data.lastRequest),
			});
		}

		return stats.sort((a, b) => b.count - a.count);
	}

	reset() {
		this.requestLog.clear();
	}

	// 检查是否有重复请求
	checkDuplicateRequests() {
		const recentRequests = Array.from(this.requestLog.entries())
			.filter(([_, data]) => Date.now() - data.lastRequest < 5000) // 5秒内
			.filter(([_, data]) => data.count > 3) // 超过3次请求
			.map(([endpoint, data]) => ({ endpoint, count: data.count }));

		if (recentRequests.length > 0) {
			console.warn("🚨 发现重复请求:", recentRequests);
		}

		return recentRequests;
	}
}

// 请求监控装饰器
export function withPerformanceMonitoring<T extends any[], R>(
	endpoint: string,
	fn: (...args: T) => Promise<R>,
) {
	return async (...args: T): Promise<R> => {
		const startTime = performance.now();
		const monitor = ApiPerformanceMonitor.getInstance();

		try {
			const result = await fn(...args);
			const duration = performance.now() - startTime;
			monitor.logRequest(endpoint, duration);
			return result;
		} catch (error) {
			const duration = performance.now() - startTime;
			monitor.logRequest(`${endpoint} (error)`, duration);
			throw error;
		}
	};
}

// QueryClient 监控插件
export function setupQueryClientMonitoring(queryClient: QueryClient) {
	// 监控所有查询
	queryClient.getQueryCache().config.onSuccess = (data, query) => {
		const monitor = ApiPerformanceMonitor.getInstance();
		const endpoint = query.queryKey.join("-");

		// 记录查询成功
		if (query.state.dataUpdatedAt) {
			const duration = Date.now() - query.state.dataUpdatedAt;
			monitor.logRequest(`query:${endpoint}`, duration);
		}
	};

	// 监控所有变更
	queryClient.getMutationCache().config.onSuccess = (
		data,
		variables,
		context,
		mutation,
	) => {
		const monitor = ApiPerformanceMonitor.getInstance();
		const endpoint =
			mutation.options.mutationKey?.join("-") || "unknown-mutation";

		if (mutation.state.submittedAt) {
			const duration = Date.now() - mutation.state.submittedAt;
			monitor.logRequest(`mutation:${endpoint}`, duration);
		}
	};

	// 定期检查重复请求
	if (typeof window !== "undefined") {
		const checkInterval = setInterval(() => {
			ApiPerformanceMonitor.getInstance().checkDuplicateRequests();
		}, 10000); // 每10秒检查一次

		// 清理定时器
		window.addEventListener("beforeunload", () => {
			clearInterval(checkInterval);
		});
	}
}

// 开发模式下的性能报告
export function generatePerformanceReport() {
	if (process.env.NODE_ENV !== "development") {
		return;
	}

	const monitor = ApiPerformanceMonitor.getInstance();
	const stats = monitor.getStats();

	if (stats.length === 0) {
		console.log("📊 暂无API请求统计数据");
		return;
	}

	console.group("📊 API 性能报告");
	console.table(stats);

	// 找出最频繁的请求
	const mostFrequent = stats.slice(0, 3);
	console.log(
		"🔥 最频繁的请求:",
		mostFrequent.map((s) => `${s.endpoint} (${s.count}次)`).join(", "),
	);

	// 找出最慢的请求
	const slowest = [...stats]
		.sort((a, b) => b.avgTime - a.avgTime)
		.slice(0, 3);
	console.log(
		"🐌 最慢的请求:",
		slowest.map((s) => `${s.endpoint} (${s.avgTime}ms)`).join(", "),
	);

	console.groupEnd();
}

// 在开发模式下，定期生成性能报告
if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
	// 页面加载30秒后生成首次报告
	setTimeout(() => {
		generatePerformanceReport();
	}, 30000);

	// 之后每分钟生成一次报告
	setInterval(() => {
		generatePerformanceReport();
	}, 60000);
}
