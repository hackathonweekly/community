import { Hono } from "hono";
import { describeRoute } from "hono-openapi";

/**
 * Health check endpoint for HackathonWeekly API
 *
 * Used by:
 * - Load balancers for readiness probes
 * - Monitoring systems for uptime checks
 * - DevOps for deployment verification
 */

export const healthRouter = new Hono().get(
	"/health",
	describeRoute({
		tags: ["System"],
		summary: "API health check",
		description:
			"Returns 200 OK if the server is running and accepting requests",
		responses: {
			200: {
				description: "Server is healthy and operational",
			},
		},
	}),
	(ctx) => ctx.text("OK", 200),
);
