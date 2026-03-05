import { db } from "@community/lib-server/database";

// 内存缓存实现（简单且有效）
interface CacheEntry<T> {
	data: T;
	timestamp: number;
	ttl: number;
}

class MemoryCache {
	private cache = new Map<string, CacheEntry<any>>();

	set<T>(key: string, data: T, ttlSeconds: number): void {
		this.cache.set(key, {
			data,
			timestamp: Date.now(),
			ttl: ttlSeconds * 1000,
		});
	}

	get<T>(key: string): T | null {
		const entry = this.cache.get(key);
		if (!entry) {
			return null;
		}

		const now = Date.now();
		if (now - entry.timestamp > entry.ttl) {
			this.cache.delete(key);
			return null;
		}

		return entry.data as T;
	}

	delete(key: string): void {
		this.cache.delete(key);
	}

	clear(): void {
		this.cache.clear();
	}

	// 清理过期缓存
	cleanup(): void {
		const now = Date.now();
		for (const [key, entry] of this.cache.entries()) {
			if (now - entry.timestamp > entry.ttl) {
				this.cache.delete(key);
			}
		}
	}
}

// 全局缓存实例
const cache = new MemoryCache();

// 定期清理过期缓存（每10分钟）
if (typeof setInterval !== "undefined") {
	setInterval(
		() => {
			cache.cleanup();
		},
		10 * 60 * 1000,
	);
}

// 组织数据类型
export interface CachedOrganization {
	id: string;
	name: string;
	slug: string;
	logo?: string | null;
}

// 缓存键和TTL配置
const ORGANIZATIONS_CACHE_KEY = "organizations:list";
const ORGANIZATIONS_TTL = 3600; // 1小时缓存

/**
 * 获取缓存的组织列表
 * 如果缓存未命中，从数据库查询并缓存结果
 */
export async function getCachedOrganizations(): Promise<CachedOrganization[]> {
	// 尝试从缓存获取
	const cached = cache.get<CachedOrganization[]>(ORGANIZATIONS_CACHE_KEY);
	if (cached) {
		return cached;
	}

	// 缓存未命中，从数据库查询
	try {
		const organizations = await db.organization.findMany({
			select: {
				id: true,
				name: true,
				slug: true,
				logo: true,
			},
			orderBy: {
				name: "asc",
			},
		});

		// 存入缓存
		cache.set(ORGANIZATIONS_CACHE_KEY, organizations, ORGANIZATIONS_TTL);

		return organizations;
	} catch (error) {
		console.error("Error fetching organizations:", error);
		// 发生错误时返回空数组，避免阻断页面渲染
		return [];
	}
}

/**
 * 清除组织缓存
 * 在组织数据发生变化时调用
 */
export function clearOrganizationsCache(): void {
	cache.delete(ORGANIZATIONS_CACHE_KEY);
}

/**
 * 预热组织缓存
 * 可以在应用启动时调用
 */
export async function warmupOrganizationsCache(): Promise<void> {
	try {
		await getCachedOrganizations();
		console.log("Organizations cache warmed up successfully");
	} catch (error) {
		console.error("Error warming up organizations cache:", error);
	}
}

// 导出缓存实例供其他模块使用
export { cache };
