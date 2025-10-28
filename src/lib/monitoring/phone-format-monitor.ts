/**
 * 手机号格式监控和日志系统
 */

import {
	normalizePhoneNumber,
	isStandardPhoneNumber,
} from "../utils/phone-format";

interface PhoneFormatLog {
	timestamp: Date;
	level: "info" | "warn" | "error";
	source: string;
	originalPhone?: string;
	normalizedPhone?: string;
	userId?: string;
	action: string;
	metadata?: Record<string, any>;
}

class PhoneFormatMonitor {
	private logs: PhoneFormatLog[] = [];
	private maxLogs = 1000; // 内存中保存的最大日志数

	/**
	 * 记录手机号格式化日志
	 */
	log(options: {
		level: "info" | "warn" | "error";
		source: string;
		originalPhone?: string;
		normalizedPhone?: string;
		userId?: string;
		action: string;
		metadata?: Record<string, any>;
	}) {
		const log: PhoneFormatLog = {
			timestamp: new Date(),
			...options,
		};

		// 添加到内存日志
		this.logs.push(log);

		// 保持日志数量限制
		if (this.logs.length > this.maxLogs) {
			this.logs = this.logs.slice(-this.maxLogs);
		}

		// 输出到控制台
		const message = this.formatLogMessage(log);
		switch (log.level) {
			case "info":
				console.log(`📱 [PHONE_FORMAT] ${message}`);
				break;
			case "warn":
				console.warn(`⚠️ [PHONE_FORMAT] ${message}`);
				break;
			case "error":
				console.error(`❌ [PHONE_FORMAT] ${message}`);
				break;
		}

		// 如果是错误级别，可以发送到外部监控服务
		if (log.level === "error") {
			this.sendToMonitoring(log);
		}
	}

	/**
	 * 记录手机号格式化操作
	 */
	logNormalization(options: {
		source: string;
		originalPhone: string;
		userId?: string;
		metadata?: Record<string, any>;
	}) {
		const normalizedPhone = normalizePhoneNumber(options.originalPhone);
		const changed = options.originalPhone !== normalizedPhone;

		this.log({
			level: changed ? "warn" : "info",
			source: options.source,
			originalPhone: options.originalPhone,
			normalizedPhone,
			userId: options.userId,
			action: "normalization",
			metadata: {
				...options.metadata,
				changed,
				wasStandard: isStandardPhoneNumber(options.originalPhone),
				isNowStandard: isStandardPhoneNumber(normalizedPhone),
			},
		});
	}

	/**
	 * 记录验证操作
	 */
	logValidation(options: {
		source: string;
		phone: string;
		isValid: boolean;
		reason?: string;
		userId?: string;
		metadata?: Record<string, any>;
	}) {
		this.log({
			level: options.isValid ? "info" : "warn",
			source: options.source,
			originalPhone: options.phone,
			userId: options.userId,
			action: "validation",
			metadata: {
				...options.metadata,
				isValid: options.isValid,
				reason: options.reason,
				isStandard: isStandardPhoneNumber(options.phone),
			},
		});
	}

	/**
	 * 记录存储操作
	 */
	logStorage(options: {
		source: string;
		phone: string;
		userId?: string;
		action: "create" | "update" | "delete";
		metadata?: Record<string, any>;
	}) {
		const isValid = isStandardPhoneNumber(options.phone);

		this.log({
			level: isValid ? "info" : "error",
			source: options.source,
			originalPhone: options.phone,
			userId: options.userId,
			action: `storage_${options.action}`,
			metadata: {
				...options.metadata,
				isValid,
				isStandard: isStandardPhoneNumber(options.phone),
			},
		});
	}

	/**
	 * 记录格式冲突
	 */
	logConflict(options: {
		source: string;
		phone: string;
		conflictType: "duplicate" | "invalid_format" | "validation_failed";
		userId?: string;
		metadata?: Record<string, any>;
	}) {
		this.log({
			level: "error",
			source: options.source,
			originalPhone: options.phone,
			userId: options.userId,
			action: "conflict",
			metadata: {
				...options.metadata,
				conflictType: options.conflictType,
				isStandard: isStandardPhoneNumber(options.phone),
			},
		});
	}

	/**
	 * 获取统计信息
	 */
	getStats(timeRange?: { start: Date; end: Date }) {
		let filteredLogs = this.logs;

		if (timeRange) {
			filteredLogs = this.logs.filter(
				(log) =>
					log.timestamp >= timeRange.start &&
					log.timestamp <= timeRange.end,
			);
		}

		const stats = {
			total: filteredLogs.length,
			byLevel: {
				info: filteredLogs.filter((log) => log.level === "info").length,
				warn: filteredLogs.filter((log) => log.level === "warn").length,
				error: filteredLogs.filter((log) => log.level === "error")
					.length,
			},
			bySource: {} as Record<string, number>,
			byAction: {} as Record<string, number>,
			recentErrors: filteredLogs
				.filter((log) => log.level === "error")
				.slice(-10)
				.map((log) => ({
					timestamp: log.timestamp,
					source: log.source,
					action: log.action,
					originalPhone: log.originalPhone,
					metadata: log.metadata,
				})),
		};

		// 按来源统计
		filteredLogs.forEach((log) => {
			stats.bySource[log.source] = (stats.bySource[log.source] || 0) + 1;
		});

		// 按操作统计
		filteredLogs.forEach((log) => {
			stats.byAction[log.action] = (stats.byAction[log.action] || 0) + 1;
		});

		return stats;
	}

	/**
	 * 获取最近的日志
	 */
	getRecentLogs(limit = 50, level?: "info" | "warn" | "error") {
		let logs = [...this.logs].reverse();

		if (level) {
			logs = logs.filter((log) => log.level === level);
		}

		return logs.slice(0, limit);
	}

	/**
	 * 清空日志
	 */
	clearLogs() {
		this.logs = [];
		this.log({
			level: "info",
			source: "monitor",
			action: "logs_cleared",
		});
	}

	/**
	 * 格式化日志消息
	 */
	private formatLogMessage(log: PhoneFormatLog): string {
		const parts = [log.timestamp.toISOString(), log.source, log.action];

		if (log.userId) {
			parts.push(`user:${log.userId}`);
		}

		if (log.originalPhone) {
			parts.push(`phone:${log.originalPhone}`);
		}

		if (log.originalPhone !== log.normalizedPhone && log.normalizedPhone) {
			parts.push(`→${log.normalizedPhone}`);
		}

		if (log.metadata) {
			const metaStr = Object.entries(log.metadata)
				.map(([key, value]) => `${key}=${value}`)
				.join(",");
			parts.push(`[${metaStr}]`);
		}

		return parts.join(" ");
	}

	/**
	 * 发送到外部监控服务
	 */
	private sendToMonitoring(log: PhoneFormatLog) {
		// 这里可以集成 Sentry、LogRocket 等监控服务
		// 目前只是输出到控制台，但保留扩展性

		if (typeof window === "undefined") {
			// 服务端环境，可以发送到监控服务
			// 目前暂不集成外部监控服务，保留扩展性
			// TODO: 集成 Sentry 或其他监控服务时取消注释
			/*
			try {
				// 示例：发送到错误监控服务
				Sentry.captureException(new Error(`Phone format error: ${log.action}`), {
					tags: { source: log.source },
					extra: log
				});
			} catch (error) {
				console.error("Failed to send to monitoring service:", error);
			}
			*/
		}
	}

	/**
	 * 导出日志数据
	 */
	exportLogs(format: "json" | "csv" = "json") {
		const data = this.getRecentLogs(1000);

		if (format === "csv") {
			const headers = [
				"timestamp",
				"level",
				"source",
				"action",
				"userId",
				"originalPhone",
				"normalizedPhone",
				"metadata",
			];
			const csvRows = [
				headers.join(","),
				...data.map((log) =>
					[
						log.timestamp.toISOString(),
						log.level,
						log.source,
						log.action,
						log.userId || "",
						log.originalPhone || "",
						log.normalizedPhone || "",
						JSON.stringify(log.metadata || {}),
					]
						.map((field) => `"${field}"`)
						.join(","),
				),
			];
			return csvRows.join("\n");
		}

		return JSON.stringify(data, null, 2);
	}
}

// 创建全局监控实例
export const phoneMonitor = new PhoneFormatMonitor();

/**
 * 装饰器函数，用于自动监控函数中的手机号格式化
 */
export function monitorPhoneFormat(source: string) {
	return (
		target: any,
		propertyName: string,
		descriptor: PropertyDescriptor,
	) => {
		const method = descriptor.value;

		descriptor.value = function (...args: any[]) {
			// 查找手机号相关的参数
			const phoneArgs = args.filter((arg, index) => {
				if (typeof arg === "string" && arg.includes("+")) {
					return true;
				}
				return false;
			});

			// 如果有手机号参数，记录日志
			if (phoneArgs.length > 0) {
				phoneArgs.forEach((phone) => {
					phoneMonitor.logNormalization({
						source,
						originalPhone: phone,
						metadata: {
							method: propertyName,
							argsCount: args.length,
						},
					});
				});
			}

			// 执行原方法
			const result = method.apply(this, args);

			return result;
		};

		return descriptor;
	};
}

/**
 * 高阶函数，用于监控手机号相关的异步操作
 */
export function withPhoneMonitoring<T extends any[], R>(
	fn: (...args: T) => Promise<R>,
	options: {
		source: string;
		getPhone?: (...args: T) => string | undefined;
		getUserId?: (...args: T) => string | undefined;
	},
) {
	return async (...args: T): Promise<R> => {
		const phone = options.getPhone?.(...args);
		const userId = options.getUserId?.(...args);

		if (phone) {
			phoneMonitor.logNormalization({
				source: options.source,
				originalPhone: phone,
				userId,
				metadata: { argsCount: args.length },
			});
		}

		try {
			const result = await fn(...args);
			return result;
		} catch (error) {
			if (phone) {
				phoneMonitor.logConflict({
					source: options.source,
					phone,
					conflictType: "validation_failed",
					userId,
					metadata: {
						error:
							error instanceof Error
								? error.message
								: "Unknown error",
					},
				});
			}
			throw error;
		}
	};
}
