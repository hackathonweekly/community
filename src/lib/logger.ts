export interface LogContext {
	requestId?: string;
	path?: string;
	method?: string;
	userId?: string;
	error?: string;
	stack?: string;
	[key: string]: any;
}

// Simple logger using console with structured output for production
export const logger = {
	info: (message: string, context?: LogContext) => {
		if (process.env.NODE_ENV === "development") {
			console.log(`[INFO] ${message}`, context || {});
		} else {
			console.log(
				JSON.stringify({
					level: "info",
					message,
					timestamp: new Date().toISOString(),
					...context,
				}),
			);
		}
	},

	error: (message: string, context?: LogContext) => {
		if (process.env.NODE_ENV === "development") {
			console.error(`[ERROR] ${message}`, context || {});
		} else {
			console.error(
				JSON.stringify({
					level: "error",
					message,
					timestamp: new Date().toISOString(),
					...context,
				}),
			);
		}
	},

	warn: (message: string, context?: LogContext) => {
		if (process.env.NODE_ENV === "development") {
			console.warn(`[WARN] ${message}`, context || {});
		} else {
			console.warn(
				JSON.stringify({
					level: "warn",
					message,
					timestamp: new Date().toISOString(),
					...context,
				}),
			);
		}
	},

	debug: (message: string, context?: LogContext) => {
		if (process.env.NODE_ENV === "development") {
			console.debug(`[DEBUG] ${message}`, context || {});
		}
		// Skip debug logs in production
	},
};
