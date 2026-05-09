import { handlePaymentWebhook } from "@community/lib-server/payments";
import { Hono } from "hono";
import { describeRoute } from "hono-openapi";

// Module-level variable to avoid mutating process.env per-request
let preferredPaymentProvider: string | undefined =
	process.env.PREFERRED_PAYMENT_PROVIDER;

export const webhooksRouter = new Hono()
	.post(
		"/webhooks/payments",
		describeRoute({
			tags: ["Webhooks"],
			summary: "Handle payments webhook",
			description:
				"Handle webhook callbacks from payment providers (Stripe, WeChat Pay)",
		}),
		(c) => {
			return handlePaymentWebhook(c.req.raw);
		},
	)
	.post(
		"/webhooks/wechatpay",
		describeRoute({
			tags: ["Webhooks"],
			summary: "Handle WeChat Pay webhook",
			description:
				"Handle webhook callbacks specifically from WeChat Pay",
		}),
		(c) => {
			// 强制使用微信支付处理器
			preferredPaymentProvider = "wechatpay";
			return handlePaymentWebhook(c.req.raw);
		},
	);
