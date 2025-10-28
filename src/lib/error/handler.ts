import { toast } from "sonner";

export enum ErrorType {
	NETWORK = "NETWORK",
	AUTHENTICATION = "AUTHENTICATION",
	PERMISSION = "PERMISSION",
	VALIDATION = "VALIDATION",
	NOT_FOUND = "NOT_FOUND",
	SERVER = "SERVER",
	RATE_LIMIT = "RATE_LIMIT",
	UNKNOWN = "UNKNOWN",
}

export interface AppError extends Error {
	type: ErrorType;
	code?: string | number;
	details?: any;
	userMessage?: string;
}

export class AppErrorHandler {
	static createError(
		type: ErrorType,
		message: string,
		userMessage?: string,
		code?: string | number,
		details?: any,
	): AppError {
		const error = new Error(message) as AppError;
		error.type = type;
		error.code = code;
		error.details = details;
		error.userMessage =
			userMessage || AppErrorHandler.getDefaultUserMessage(type);
		return error;
	}

	static getDefaultUserMessage(type: ErrorType): string {
		switch (type) {
			case ErrorType.NETWORK:
				return "网络连接失败，请检查网络后重试";
			case ErrorType.AUTHENTICATION:
				return "登录已过期，请重新登录";
			case ErrorType.PERMISSION:
				return "您没有权限执行此操作";
			case ErrorType.VALIDATION:
				return "输入的信息有误，请检查后重试";
			case ErrorType.NOT_FOUND:
				return "请求的资源不存在";
			case ErrorType.SERVER:
				return "服务器出现问题，请稍后重试";
			case ErrorType.RATE_LIMIT:
				return "请求过于频繁，请稍后再试";
			default:
				return "发生未知错误，请稍后重试";
		}
	}

	static handleError(error: Error | AppError, showToast = true): AppError {
		console.error("Application Error:", error);

		let appError: AppError;

		if ("type" in error) {
			appError = error as AppError;
		} else {
			// Convert generic Error to AppError
			appError = AppErrorHandler.createError(
				ErrorType.UNKNOWN,
				error.message,
				AppErrorHandler.getDefaultUserMessage(ErrorType.UNKNOWN),
			);
		}

		if (showToast) {
			AppErrorHandler.showErrorToast(appError);
		}

		return appError;
	}

	static showErrorToast(error: AppError): void {
		const title = AppErrorHandler.getErrorTitle(error.type);
		const message = error.userMessage || error.message;

		// For rate limit errors, provide more specific info if available
		if (error.type === ErrorType.RATE_LIMIT) {
			const retryAfter = error.details?.retryAfter;
			const enhancedMessage = retryAfter
				? `${message}，请等待 ${retryAfter} 秒后再试`
				: message;

			toast.error(title, {
				description: enhancedMessage,
				duration: 8000, // Longer duration for rate limit errors
				action: {
					label: "知道了",
					onClick: () => {},
				},
			});
			return;
		}

		toast.error(title, {
			description: message,
			duration: 5000,
			action:
				error.type === ErrorType.NETWORK
					? {
							label: "重试",
							onClick: () => window.location.reload(),
						}
					: undefined,
		});
	}

	static getErrorTitle(type: ErrorType): string {
		switch (type) {
			case ErrorType.NETWORK:
				return "网络错误";
			case ErrorType.AUTHENTICATION:
				return "认证失败";
			case ErrorType.PERMISSION:
				return "权限不足";
			case ErrorType.VALIDATION:
				return "输入错误";
			case ErrorType.NOT_FOUND:
				return "资源不存在";
			case ErrorType.SERVER:
				return "服务器错误";
			case ErrorType.RATE_LIMIT:
				return "请求频率限制";
			default:
				return "系统错误";
		}
	}

	static fromFetchResponse(
		response: Response,
		customMessage?: string,
	): AppError {
		if (response.status === 401) {
			return AppErrorHandler.createError(
				ErrorType.AUTHENTICATION,
				"Unauthorized",
				customMessage || "登录已过期，请重新登录",
			);
		}

		if (response.status === 403) {
			return AppErrorHandler.createError(
				ErrorType.PERMISSION,
				"Forbidden",
				customMessage || "您没有权限执行此操作",
			);
		}

		if (response.status === 404) {
			return AppErrorHandler.createError(
				ErrorType.NOT_FOUND,
				"Not Found",
				customMessage || "请求的资源不存在",
			);
		}

		if (response.status === 429) {
			return AppErrorHandler.createError(
				ErrorType.RATE_LIMIT,
				"Too Many Requests",
				customMessage || "请求过于频繁，请稍后再试",
				response.status,
			);
		}

		if (response.status >= 400 && response.status < 500) {
			return AppErrorHandler.createError(
				ErrorType.VALIDATION,
				`Client Error: ${response.status}`,
				customMessage || "请求参数有误",
			);
		}

		if (response.status >= 500) {
			return AppErrorHandler.createError(
				ErrorType.SERVER,
				`Server Error: ${response.status}`,
				customMessage || "服务器出现问题，请稍后重试",
			);
		}

		return AppErrorHandler.createError(
			ErrorType.UNKNOWN,
			`HTTP Error: ${response.status}`,
			customMessage || "发生未知错误",
		);
	}

	static isNetworkError(error: Error): boolean {
		return (
			error.message.includes("fetch") ||
			error.message.includes("network") ||
			error.message.includes("Failed to fetch")
		);
	}

	/**
	 * Helper to handle API responses and extract retry-after info from 429 errors
	 */
	static async fromAPIResponse(
		response: Response,
		customMessage?: string,
	): Promise<AppError> {
		if (response.status === 429) {
			let retryAfter: number | undefined;

			// Try to get retry-after from headers
			const retryAfterHeader = response.headers.get("Retry-After");
			if (retryAfterHeader) {
				retryAfter = Number.parseInt(retryAfterHeader, 10);
			}

			// Try to get retry-after from response body
			try {
				const responseData = await response.json();
				if (responseData.retryAfter) {
					retryAfter = responseData.retryAfter;
				}
			} catch (e) {
				// Ignore JSON parsing errors
			}

			return AppErrorHandler.createError(
				ErrorType.RATE_LIMIT,
				"Too Many Requests",
				customMessage || "请求过于频繁，请稍后再试",
				response.status,
				{ retryAfter },
			);
		}

		return AppErrorHandler.fromFetchResponse(response, customMessage);
	}

	/**
	 * Helper to detect and handle 429 errors from any error object
	 */
	static handleRateLimitError(error: any): AppError | null {
		// Check if it's a 429 error
		if (
			error.status === 429 ||
			error.code === 429 ||
			error.code === "TOO_MANY_REQUESTS" ||
			error.message?.includes("Too Many Requests") ||
			error.message?.includes("rate limit") ||
			error.message?.includes("请求过于频繁")
		) {
			const retryAfter = error.retryAfter || error.details?.retryAfter;
			return AppErrorHandler.createError(
				ErrorType.RATE_LIMIT,
				error.message || "Too Many Requests",
				"请求过于频繁，请稍后再试",
				429,
				{ retryAfter },
			);
		}

		return null;
	}
}
