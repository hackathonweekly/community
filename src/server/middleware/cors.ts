import { getBaseUrl } from "@/lib/utils";
import { cors } from "hono/cors";

/**
 * CORS middleware configuration for HackathonWeekly API
 *
 * Restricts API access to the application's base URL only
 * to prevent unauthorized cross-origin requests
 */

export const corsMiddleware = cors({
	origin: getBaseUrl(),
	allowHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
	allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
	exposeHeaders: ["Content-Length", "X-Request-Id"],
	maxAge: 86400, // 24 hours preflight cache
	credentials: true,
});
