import { logger } from "@community/lib-server/logs";
import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";

interface LogContext {
	requestId?: string;
	path?: string;
	method?: string;
	userId?: string;
	error?: string;
	stack?: string;
	[key: string]: any;
}

interface ErrorResponse {
	error: {
		message: string;
		code?: string;
		status: number;
	};
}

export const errorHandler = createMiddleware(async (c, next) => {
	try {
		await next();
	} catch (error) {
		const requestId = crypto.randomUUID();
		const logContext: LogContext = {
			requestId,
			path: c.req.path,
			method: c.req.method,
			userId: c.get("user")?.id,
		};

		if (error instanceof HTTPException) {
			// Log HTTP exceptions as warnings (they're expected errors)
			logger.warn(`HTTP Exception: ${error.message}`, {
				...logContext,
				status: error.status,
			});

			const response: ErrorResponse = {
				error: {
					message: error.message,
					status: error.status,
				},
			};

			return c.json(response, error.status);
		}

		// Log unexpected errors
		const errorMessage =
			error instanceof Error ? error.message : String(error);
		const errorStack = error instanceof Error ? error.stack : undefined;

		logger.error(`Unexpected error: ${errorMessage}`, {
			...logContext,
			error: errorMessage,
			stack: errorStack,
		});

		// Return generic error for security
		const response: ErrorResponse = {
			error: {
				message: "Internal Server Error",
				status: 500,
			},
		};

		return c.json(response, 500);
	}
});

// Helper function to create standardized HTTP exceptions
export const createError = (status: number, message: string, details?: any) => {
	const exception = new HTTPException(status as any, { message });
	if (details) {
		// Store details in the exception for potential use
		(exception as any).details = details;
	}
	return exception;
};

// Common error creators for convenience
export const errors = {
	unauthorized: (message = "Unauthorized") => createError(401, message),
	forbidden: (message = "Forbidden") => createError(403, message),
	notFound: (message = "Not found") => createError(404, message),
	badRequest: (message = "Bad request") => createError(400, message),
	conflict: (message = "Conflict") => createError(409, message),
	internal: (message = "Internal server error") => createError(500, message),
	tooManyRequests: (message = "Too many requests") =>
		createError(429, message),
} as const;
