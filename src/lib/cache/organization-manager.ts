import { clearOrganizationsCache } from "@/lib/cache/organizations";

/**
 * 组织管理工具函数
 * 在组织数据发生变化时自动清理相关缓存
 */
export class OrganizationCacheManager {
	/**
	 * 在创建新组织时调用
	 */
	static async onOrganizationCreated() {
		clearOrganizationsCache();
		console.log("Organizations cache cleared after organization creation");
	}

	/**
	 * 在更新组织信息时调用
	 */
	static async onOrganizationUpdated(organizationId: string) {
		clearOrganizationsCache();
		console.log(
			`Organizations cache cleared after organization ${organizationId} update`,
		);
	}

	/**
	 * 在删除组织时调用
	 */
	static async onOrganizationDeleted(organizationId: string) {
		clearOrganizationsCache();
		console.log(
			`Organizations cache cleared after organization ${organizationId} deletion`,
		);
	}

	/**
	 * 批量清理缓存（例如在数据迁移后）
	 */
	static async clearAllCaches() {
		clearOrganizationsCache();
		console.log("All organization caches cleared");
	}
}

/**
 * 装饰器函数，自动在组织数据变更后清理缓存
 * 使用示例：
 *
 * @clearOrganizationCache
 * async function updateOrganization(id: string, data: any) {
 *   // 更新组织逻辑
 * }
 */
export function clearOrganizationCache(
	target: any,
	propertyName: string,
	descriptor: PropertyDescriptor,
) {
	const method = descriptor.value;

	descriptor.value = async function (...args: any[]) {
		const result = await method.apply(this, args);
		clearOrganizationsCache();
		return result;
	};

	return descriptor;
}
