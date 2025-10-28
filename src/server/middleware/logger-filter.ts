import { createMiddleware } from "hono/factory";

export const filteredLogger = createMiddleware(async (c, next) => {
	// 检查是否完全禁用HTTP日志
	if (process.env.DISABLE_HTTP_LOGGING === "true") {
		return next();
	}

	// 过滤特定的健康检查或频繁调用
	const skipPaths = [
		"/api/notifications/unread-count",
		"/api/health",
		"/api/ping",
		"/api/users/me",
		"/api/heartbeat",
	];

	const shouldSkip = skipPaths.some((path) => c.req.path.includes(path));

	if (shouldSkip) {
		return next();
	}

	// 对于其他路由，记录日志但限制详细信息
	const start = Date.now();
	await next();
	const ms = Date.now() - start;

	// 只记录非 2xx 状态码或较慢的请求
	if (c.res.status >= 300 || ms > 100) {
		console.log(`${c.req.method} ${c.req.path} ${c.res.status} ${ms}ms`);
	}
});
