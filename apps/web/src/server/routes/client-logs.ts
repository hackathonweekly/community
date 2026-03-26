import { createModuleLogger } from "@community/lib-server/logs";
import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { z } from "zod";

const logger = createModuleLogger("client-logs");

const payloadSchema = z.object({
	message: z.string().min(1),
	level: z.enum(["info", "warn", "error"]).optional(),
	category: z.string().optional(),
	stack: z.string().optional(),
	source: z.string().optional(),
	line: z.number().optional(),
	column: z.number().optional(),
	path: z.string().optional(),
	userAgent: z.string().optional(),
	meta: z.record(z.string(), z.any()).optional(),
});

export const clientLogsRouter = new Hono().post(
	"/client-logs",
	describeRoute({
		tags: ["Monitoring"],
		summary: "Collect client-side runtime errors",
		responses: {
			200: {
				description: "Logged",
			},
			400: {
				description: "Invalid payload",
			},
		},
	}),
	async (c) => {
		const body = await c.req.json().catch(() => null);
		const parsed = payloadSchema.safeParse(body);

		if (!parsed.success) {
			return c.json({ error: "Invalid payload" }, 400);
		}

		const payload = parsed.data;
		const message = payload.category
			? `[${payload.category}] ${payload.message}`
			: payload.message;
		const metadata = {
			...payload,
			stack: payload.stack?.slice(0, 2000),
			path: payload.path || c.req.path,
			userAgent: payload.userAgent || c.req.header("user-agent"),
		};

		switch (payload.level) {
			case "info":
				logger.info(message, metadata);
				break;
			case "warn":
				logger.warn(message, metadata);
				break;
			default:
				logger.error(message, metadata);
				break;
		}

		return c.json({ success: true });
	},
);
