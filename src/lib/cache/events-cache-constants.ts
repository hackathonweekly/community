/**
 * 缓存标签和路径常量定义
 * 可在客户端和服务端安全使用
 */

/**
 * 缓存标签定义
 */
export const CACHE_TAGS = {
	// 活动相关
	events: "events",
	eventsList: "events-list",
	eventDetails: (id: string) => `event-${id}`,

	// 组织相关
	organizations: "organizations",
	eventsOrganizations: "events-organizations",

	// 用户相关
	userRegistrations: "user-registrations",
	userEvents: "user-events",

	// 页面级别
	eventsPage: "events-page",
} as const;

/**
 * 缓存路径定义
 */
export const CACHE_PATHS = {
	events: "/events",
	eventsWithLocale: (locale: string) => `/${locale}/events`,
} as const;

/**
 * 缓存性能监控
 */
export class CacheMonitor {
	private static metrics: Map<string, { hits: number; misses: number }> =
		new Map();

	static recordHit(tag: string) {
		const current = CacheMonitor.metrics.get(tag) || { hits: 0, misses: 0 };
		current.hits++;
		CacheMonitor.metrics.set(tag, current);
	}

	static recordMiss(tag: string) {
		const current = CacheMonitor.metrics.get(tag) || { hits: 0, misses: 0 };
		current.misses++;
		CacheMonitor.metrics.set(tag, current);
	}

	static getMetrics() {
		const result: Record<
			string,
			{ hits: number; misses: number; hitRate: number }
		> = {};

		for (const [tag, metrics] of CacheMonitor.metrics) {
			const total = metrics.hits + metrics.misses;
			result[tag] = {
				...metrics,
				hitRate: total > 0 ? metrics.hits / total : 0,
			};
		}

		return result;
	}

	static reset() {
		CacheMonitor.metrics.clear();
	}
}
