import { createMiddleware } from "hono/factory";

interface RateLimitStore {
	[key: string]: {
		count: number;
		resetTime: number;
	};
}

interface RateLimitOptions {
	windowMs: number; // Time window in milliseconds
	maxRequests: number; // Max requests per window
	keyGenerator?: (c: any) => string; // Function to generate rate limit key
}

// In-memory store (consider using Redis in production)
const store: RateLimitStore = {};

// Clean up expired entries periodically
setInterval(() => {
	const now = Date.now();
	Object.keys(store).forEach((key) => {
		if (store[key].resetTime <= now) {
			delete store[key];
		}
	});
}, 60000); // Clean up every minute

export function rateLimit(options: RateLimitOptions) {
	return createMiddleware(async (c, next) => {
		// 开发环境或本地环境跳过 rate limit
		if (process.env.NODE_ENV === "development" || !process.env.NODE_ENV) {
			await next();
			return;
		}

		const key = options.keyGenerator
			? options.keyGenerator(c)
			: c.req.header("x-forwarded-for") ||
				c.req.header("cf-connecting-ip") ||
				"anonymous";

		const now = Date.now();
		const entry = store[key];

		if (!entry || entry.resetTime <= now) {
			// Reset or create new entry
			store[key] = {
				count: 1,
				resetTime: now + options.windowMs,
			};
		} else {
			// Increment counter
			entry.count++;

			if (entry.count > options.maxRequests) {
				const retryAfter = Math.ceil((entry.resetTime - now) / 1000);

				return c.json(
					{
						error: "Too Many Requests",
						message: "Rate limit exceeded. Please try again later.",
						retryAfter,
					},
					429,
					{
						"Retry-After": retryAfter.toString(),
						"X-RateLimit-Limit": options.maxRequests.toString(),
						"X-RateLimit-Remaining": "0",
						"X-RateLimit-Reset": Math.ceil(
							entry.resetTime / 1000,
						).toString(),
					},
				);
			}
		}

		// Add rate limit headers
		const remaining = Math.max(0, options.maxRequests - store[key].count);
		c.header("X-RateLimit-Limit", options.maxRequests.toString());
		c.header("X-RateLimit-Remaining", remaining.toString());
		c.header(
			"X-RateLimit-Reset",
			Math.ceil(store[key].resetTime / 1000).toString(),
		);

		await next();
	});
}

// Pre-configured rate limiters for common use cases
export const authRateLimit = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	maxRequests: 50, // Allow 50 authentication attempts per 15 minutes (increased from 10)
	keyGenerator: (c) => {
		const ip =
			c.req.header("x-forwarded-for") ||
			c.req.header("cf-connecting-ip") ||
			"anonymous";
		return `auth:${ip}`;
	},
});

export const apiRateLimit = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	maxRequests: 1000, // Allow 1000 API requests per 15 minutes
});
