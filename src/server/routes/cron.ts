import { cancelExpiredOrders } from "@/lib/events/event-orders";
import { Hono } from "hono";

const verifyCronSecret = (c: any): boolean => {
	const secret = process.env.CRON_SECRET;

	// 生产环境强制要求 CRON_SECRET
	if (process.env.NODE_ENV === "production" && !secret) {
		return false;
	}

	// 如果设置了 secret，验证请求头
	if (secret) {
		const provided =
			c.req.header("x-cron-secret") ||
			c.req.header("authorization")?.replace("Bearer ", "");
		return provided === secret;
	}

	// 开发环境且未设置 secret 时允许访问
	return process.env.NODE_ENV !== "production";
};

export const cronRouter = new Hono().post(
	"/cron/cancel-expired-orders",
	async (c) => {
		if (!verifyCronSecret(c)) {
			return c.json(
				{
					success: false,
					error: "Unauthorized: CRON_SECRET is required in production",
				},
				401,
			);
		}

		const result = await cancelExpiredOrders();
		return c.json({ success: true, data: result });
	},
);
