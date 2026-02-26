import { AppErrorHandler, ErrorType } from "../error/handler";

export interface ApiRequestOptions extends RequestInit {
	timeout?: number;
	retry?: number;
	retryDelay?: number;
}

export interface ApiResponse<T = any> {
	data: T;
	success: boolean;
	message?: string;
	error?: string;
}

export class ApiClient {
	private static defaultTimeout = 10000; // 10 seconds
	private static defaultRetry = 3;
	private static defaultRetryDelay = 1000; // 1 second

	static async request<T = any>(
		url: string,
		options: ApiRequestOptions = {},
	): Promise<T> {
		const {
			timeout = ApiClient.defaultTimeout,
			retry = ApiClient.defaultRetry,
			retryDelay = ApiClient.defaultRetryDelay,
			...fetchOptions
		} = options;

		let lastError: Error;

		for (let attempt = 0; attempt <= retry; attempt++) {
			try {
				const controller = new AbortController();
				const timeoutId = setTimeout(() => controller.abort(), timeout);

				const response = await fetch(url, {
					...fetchOptions,
					signal: controller.signal,
					headers: {
						"Content-Type": "application/json",
						...fetchOptions.headers,
					},
				});

				clearTimeout(timeoutId);

				if (!response.ok) {
					throw AppErrorHandler.fromFetchResponse(response);
				}

				const result: ApiResponse<T> = await response.json();

				if (!result.success) {
					throw AppErrorHandler.createError(
						ErrorType.SERVER,
						result.error || "API request failed",
						result.message || result.error,
					);
				}

				return result.data;
			} catch (error) {
				lastError = error as Error;

				if (error instanceof Error && error.name === "AbortError") {
					throw AppErrorHandler.createError(
						ErrorType.NETWORK,
						"Request timeout",
						"请求超时，请检查网络连接",
					);
				}

				if (AppErrorHandler.isNetworkError(error as Error)) {
					const networkError = AppErrorHandler.createError(
						ErrorType.NETWORK,
						(error as Error).message,
						"网络连接失败，请检查网络后重试",
					);
					lastError = networkError;
				}

				// Don't retry for certain types of errors
				if (error && typeof error === "object" && "type" in error) {
					const appError = error as any;
					if (
						appError.type === ErrorType.AUTHENTICATION ||
						appError.type === ErrorType.PERMISSION ||
						appError.type === ErrorType.NOT_FOUND
					) {
						throw error;
					}
				}

				// If this isn't the last attempt, wait before retrying
				if (attempt < retry) {
					await new Promise((resolve) =>
						setTimeout(resolve, retryDelay * (attempt + 1)),
					);
				}
			}
		}

		throw lastError!;
	}

	static async get<T = any>(
		url: string,
		options?: ApiRequestOptions,
	): Promise<T> {
		return ApiClient.request<T>(url, { ...options, method: "GET" });
	}

	static async post<T = any>(
		url: string,
		data?: any,
		options?: ApiRequestOptions,
	): Promise<T> {
		return ApiClient.request<T>(url, {
			...options,
			method: "POST",
			body: data ? JSON.stringify(data) : undefined,
		});
	}

	static async put<T = any>(
		url: string,
		data?: any,
		options?: ApiRequestOptions,
	): Promise<T> {
		return ApiClient.request<T>(url, {
			...options,
			method: "PUT",
			body: data ? JSON.stringify(data) : undefined,
		});
	}

	static async patch<T = any>(
		url: string,
		data?: any,
		options?: ApiRequestOptions,
	): Promise<T> {
		return ApiClient.request<T>(url, {
			...options,
			method: "PATCH",
			body: data ? JSON.stringify(data) : undefined,
		});
	}

	static async delete<T = any>(
		url: string,
		options?: ApiRequestOptions,
	): Promise<T> {
		return ApiClient.request<T>(url, { ...options, method: "DELETE" });
	}
}
