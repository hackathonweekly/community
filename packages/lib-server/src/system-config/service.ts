import { db } from "@community/lib-server/database/prisma/client";

export class SystemConfigService {
	/**
	 * 获取系统配置
	 */
	static async get<T = any>(key: string, defaultValue?: T): Promise<T> {
		try {
			const config = await db.systemConfig.findUnique({
				where: { key },
			});

			if (!config) {
				return defaultValue as T;
			}

			return config.value as T;
		} catch (error) {
			console.error(`获取系统配置失败 [${key}]:`, error);
			return defaultValue as T;
		}
	}

	/**
	 * 设置系统配置
	 */
	static async set(
		key: string,
		value: any,
		updatedBy: string,
		description?: string,
	): Promise<void> {
		try {
			await db.systemConfig.upsert({
				where: { key },
				update: {
					value,
					updatedBy,
					description,
				},
				create: {
					key,
					value,
					updatedBy,
					description,
				},
			});
		} catch (error) {
			console.error(`设置系统配置失败 [${key}]:`, error);
			throw error;
		}
	}

	/**
	 * 批量获取系统配置
	 */
	static async getMultiple(keys: string[]): Promise<Record<string, any>> {
		try {
			const configs = await db.systemConfig.findMany({
				where: {
					key: { in: keys },
				},
			});

			const result: Record<string, any> = {};
			for (const config of configs) {
				result[config.key] = config.value;
			}

			return result;
		} catch (error) {
			console.error("批量获取系统配置失败:", error);
			return {};
		}
	}

	/**
	 * 获取所有系统配置
	 */
	static async getAll(): Promise<Record<string, any>> {
		try {
			const configs = await db.systemConfig.findMany();
			const result: Record<string, any> = {};

			for (const config of configs) {
				result[config.key] = config.value;
			}

			return result;
		} catch (error) {
			console.error("获取所有系统配置失败:", error);
			return {};
		}
	}

	/**
	 * 删除系统配置
	 */
	static async delete(key: string): Promise<void> {
		try {
			await db.systemConfig.delete({
				where: { key },
			});
		} catch (error) {
			console.error(`删除系统配置失败 [${key}]:`, error);
			throw error;
		}
	}

	/**
	 * 评论系统相关配置
	 */
	static async getCommentConfig() {
		const keys = [
			"comments.enabled",
			"comments.require_approval",
			"comments.max_length",
			"comments.allow_anonymous",
			"comments.rate_limit",
		];

		const configs = await SystemConfigService.getMultiple(keys);

		return {
			enabled: configs["comments.enabled"] ?? true,
			requireApproval: configs["comments.require_approval"] ?? false,
			maxLength: configs["comments.max_length"] ?? 2000,
			allowAnonymous: configs["comments.allow_anonymous"] ?? false,
			rateLimit: configs["comments.rate_limit"] ?? 60, // 每分钟最多评论数
		};
	}

	/**
	 * 设置评论系统配置
	 */
	static async setCommentConfig(
		config: {
			enabled?: boolean;
			requireApproval?: boolean;
			maxLength?: number;
			allowAnonymous?: boolean;
			rateLimit?: number;
		},
		updatedBy: string,
	) {
		const updates: Array<{ key: string; value: any; description: string }> =
			[];

		if (config.enabled !== undefined) {
			updates.push({
				key: "comments.enabled",
				value: config.enabled,
				description: "是否启用评论功能",
			});
		}

		if (config.requireApproval !== undefined) {
			updates.push({
				key: "comments.require_approval",
				value: config.requireApproval,
				description: "评论是否需要审核",
			});
		}

		if (config.maxLength !== undefined) {
			updates.push({
				key: "comments.max_length",
				value: config.maxLength,
				description: "评论最大长度",
			});
		}

		if (config.allowAnonymous !== undefined) {
			updates.push({
				key: "comments.allow_anonymous",
				value: config.allowAnonymous,
				description: "是否允许匿名评论",
			});
		}

		if (config.rateLimit !== undefined) {
			updates.push({
				key: "comments.rate_limit",
				value: config.rateLimit,
				description: "评论频率限制（每分钟）",
			});
		}

		// 批量更新
		await Promise.all(
			updates.map((update) =>
				SystemConfigService.set(
					update.key,
					update.value,
					updatedBy,
					update.description,
				),
			),
		);
	}

	/**
	 * 初始化默认配置
	 */
	static async initializeDefaults(adminUserId: string) {
		const defaultConfigs = [
			{
				key: "comments.enabled",
				value: true,
				description: "是否启用评论功能",
			},
			{
				key: "comments.require_approval",
				value: false,
				description: "评论是否需要审核",
			},
			{
				key: "comments.max_length",
				value: 2000,
				description: "评论最大长度",
			},
			{
				key: "comments.allow_anonymous",
				value: false,
				description: "是否允许匿名评论",
			},
			{
				key: "comments.rate_limit",
				value: 60,
				description: "评论频率限制（每分钟）",
			},
		];

		for (const config of defaultConfigs) {
			const existing = await db.systemConfig.findUnique({
				where: { key: config.key },
			});

			if (!existing) {
				await SystemConfigService.set(
					config.key,
					config.value,
					adminUserId,
					config.description,
				);
			}
		}
	}
}
