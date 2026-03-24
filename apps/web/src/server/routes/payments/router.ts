import {
	getOrganizationMembership,
	getOrganizationById,
	getPurchaseById,
} from "@community/lib-server/database";
import { db } from "@community/lib-server/database/prisma/client";
import { PurchaseSchema } from "@community/lib-server/database/prisma/zod";
import { logger } from "@community/lib-server/logs";
import {
	createCheckoutLink,
	createCustomerPortalLink,
	getCustomerIdFromEntity,
} from "@community/lib-server/payments";
import {
	prepareEventTicketWechatPayment,
	type WechatPrepareHttpStatus,
} from "./lib/wechat-prepare";
import { randomBytes } from "crypto";
import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { resolver, validator } from "hono-openapi/zod";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";
import { authMiddleware } from "../../middleware/auth";
import { getPurchases } from "./lib/purchases";

const MINI_BIND_TOKEN_TTL_MS = 5 * 60 * 1000;
const miniBindTokens = new Map<
	string,
	{
		userId: string;
		expiresAt: number;
	}
>();

const cleanupExpiredMiniBindTokens = () => {
	const now = Date.now();
	for (const [token, payload] of miniBindTokens.entries()) {
		if (payload.expiresAt <= now) {
			miniBindTokens.delete(token);
		}
	}
};

const issueMiniBindToken = (userId: string) => {
	cleanupExpiredMiniBindTokens();
	const token = randomBytes(24).toString("hex");
	const expiresAt = Date.now() + MINI_BIND_TOKEN_TTL_MS;
	miniBindTokens.set(token, { userId, expiresAt });
	return {
		bindToken: token,
		expiresAt: new Date(expiresAt).toISOString(),
	};
};

const consumeMiniBindToken = (bindToken: string) => {
	cleanupExpiredMiniBindTokens();
	const payload = miniBindTokens.get(bindToken);
	if (!payload || payload.expiresAt <= Date.now()) {
		miniBindTokens.delete(bindToken);
		return null;
	}
	miniBindTokens.delete(bindToken);
	return payload;
};

const exchangeMiniProgramCode = async (code: string) => {
	const appId = process.env.WECHAT_MINIPROGRAM_APP_ID;
	const appSecret = process.env.WECHAT_MINIPROGRAM_APP_SECRET;
	if (!appId || !appSecret) {
		return {
			success: false as const,
			status: 500 as const,
			error: "Mini program not configured",
		};
	}

	const url = new URL("https://api.weixin.qq.com/sns/jscode2session");
	url.searchParams.set("appid", appId);
	url.searchParams.set("secret", appSecret);
	url.searchParams.set("js_code", code);
	url.searchParams.set("grant_type", "authorization_code");

	const res = await fetch(url.toString());
	const data = await res.json();

	if (data.errcode || !data.openid) {
		logger.warn("Mini program code2session failed", {
			errcode: data.errcode,
			errmsg: data.errmsg,
		});
		return {
			success: false as const,
			status: 400 as const,
			error: data.errmsg || "code2session failed",
		};
	}

	return {
		success: true as const,
		openid: data.openid as string,
	};
};

// Payment router - primarily for event ticket purchases
// Subscription billing has been removed
export const paymentsRouter = new Hono()
	.basePath("/payments")
	.post(
		"/wechat/prepare",
		authMiddleware,
		validator(
			"json",
			z.object({
				bizType: z.literal("EVENT_TICKET"),
				bizId: z.string(),
				clientContext: z
					.object({
						environmentType: z
							.enum(["miniprogram", "wechat", "none"])
							.optional(),
						miniProgramBridgeSupported: z.boolean().optional(),
						miniProgramBridgeVersion: z.string().optional(),
						shellVersion: z.string().optional(),
					})
					.optional(),
			}),
		),
		describeRoute({
			tags: ["Payments"],
			summary: "Prepare WeChat payment payload",
			description:
				"Returns channelized WeChat payment payload for a business order (initially EVENT_TICKET).",
			responses: {
				200: {
					description: "Prepared WeChat payment payload",
				},
			},
		}),
		async (c) => {
			const user = c.get("user");
			const payload = c.req.valid("json");
			const result = await prepareEventTicketWechatPayment({
				orderId: payload.bizId,
				userId: user.id,
				userAgent: c.req.header("user-agent"),
				clientContext: payload.clientContext,
			});

			if (!result.success) {
				return c.json(
					{
						success: false,
						error: result.error,
						code: result.code,
						requiresUpgrade: result.requiresUpgrade,
						minBridgeVersion: result.minBridgeVersion,
					},
					result.status as WechatPrepareHttpStatus,
				);
			}

			return c.json({
				success: true,
				data: result.data,
			});
		},
	)
	.post(
		"/wechat/mini-bind-token",
		authMiddleware,
		describeRoute({
			tags: ["Payments"],
			summary: "Issue mini program bind token",
			description:
				"Create a short-lived token that allows the mini program shell to bind the current user's mini program OpenID.",
			responses: {
				200: { description: "Bind token issued successfully" },
			},
		}),
		async (c) => {
			const user = c.get("user");
			return c.json({
				success: true,
				data: issueMiniBindToken(user.id),
			});
		},
	)
	.post(
		"/wechat/bind-mini-openid",
		authMiddleware,
		validator(
			"json",
			z.object({
				code: z.string().min(1),
			}),
		),
		describeRoute({
			tags: ["Payments"],
			summary: "Bind mini program OpenID",
			description:
				"Exchange a wx.login() code for the user's mini program OpenID and save it.",
			responses: {
				200: { description: "OpenID bound successfully" },
			},
		}),
		async (c) => {
			const user = c.get("user");
			const { code } = c.req.valid("json");
			const result = await exchangeMiniProgramCode(code);

			if (!result.success) {
				return c.json(
					{ success: false, error: result.error },
					result.status,
				);
			}

			await db.user.update({
				where: { id: user.id },
				data: { wechatMiniOpenId: result.openid },
			});

			return c.json({ success: true });
		},
	)
	.post(
		"/wechat/bind-mini-openid-with-token",
		validator(
			"json",
			z.object({
				bindToken: z.string().min(1),
				code: z.string().min(1),
				eventId: z.string().optional(),
			}),
		),
		describeRoute({
			tags: ["Payments"],
			summary: "Bind mini program OpenID with token",
			description:
				"Consume a short-lived bind token and save the user's mini program OpenID.",
			responses: {
				200: { description: "OpenID bound successfully" },
			},
		}),
		async (c) => {
			const { bindToken, code, eventId } = c.req.valid("json");
			const tokenPayload = consumeMiniBindToken(bindToken);
			if (!tokenPayload) {
				return c.json(
					{ success: false, error: "Bind token expired" },
					401,
				);
			}

			const result = await exchangeMiniProgramCode(code);
			if (!result.success) {
				return c.json(
					{ success: false, error: result.error },
					result.status,
				);
			}

			await db.user.update({
				where: { id: tokenPayload.userId },
				data: { wechatMiniOpenId: result.openid },
			});

			if (!eventId) {
				return c.json({ success: true, data: { bound: true } });
			}

			const pendingOrder = await db.eventOrder.findFirst({
				where: {
					eventId,
					userId: tokenPayload.userId,
					status: "PENDING",
					expiredAt: { gt: new Date() },
				},
				select: { id: true },
				orderBy: { createdAt: "desc" },
			});

			if (!pendingOrder) {
				return c.json({
					success: true,
					data: { bound: true },
				});
			}

			const prepareResult = await prepareEventTicketWechatPayment({
				orderId: pendingOrder.id,
				userId: tokenPayload.userId,
				userAgent: c.req.header("user-agent"),
				clientContext: {
					environmentType: "miniprogram",
					miniProgramBridgeSupported: true,
					miniProgramBridgeVersion: "1.3.0",
				},
				isExisting: true,
			});

			if (!prepareResult.success) {
				return c.json(
					{
						success: false,
						error: prepareResult.error,
						code: prepareResult.code,
					},
					prepareResult.status as WechatPrepareHttpStatus,
				);
			}

			return c.json({
				success: true,
				data: {
					bound: true,
					payment: prepareResult.data,
				},
			});
		},
	)
	.get(
		authMiddleware,
		validator(
			"query",
			z.object({
				organizationId: z.string().optional(),
			}),
		),
		describeRoute({
			tags: ["Payments"],
			summary: "Get purchases",
			description:
				"Get all purchases of the current user or the provided organization",
			responses: {
				200: {
					description: "Purchases",
					content: {
						"application/json": {
							schema: resolver(z.array(PurchaseSchema)),
						},
					},
				},
			},
		}),
		async (c) => {
			const { organizationId } = c.req.valid("query");
			const user = c.get("user");

			const purchases = await getPurchases(
				organizationId
					? {
							organizationId,
						}
					: { userId: user.id },
			);

			return c.json(purchases);
		},
	)
	.post(
		"/create-checkout-link",
		authMiddleware,
		validator(
			"query",
			z.object({
				type: z.enum(["one-time", "subscription"]),
				productId: z.string(),
				redirectUrl: z.string().optional(),
				organizationId: z.string().optional(),
			}),
		),
		describeRoute({
			tags: ["Payments"],
			summary: "Create a checkout link",
			description:
				"Creates a checkout link for a one-time or subscription product (primarily for event tickets)",
			responses: {
				200: {
					description: "Checkout link",
				},
			},
		}),
		async (c) => {
			const { productId, redirectUrl, type, organizationId } =
				c.req.valid("query");
			const user = c.get("user");

			const customerId = await getCustomerIdFromEntity(
				organizationId
					? {
							organizationId,
						}
					: {
							userId: user.id,
						},
			);

			const organization = organizationId
				? await getOrganizationById(organizationId)
				: undefined;

			if (organization === null) {
				throw new HTTPException(404);
			}

			try {
				const checkoutLink = await createCheckoutLink({
					type,
					productId,
					email: user.email,
					name: user.name ?? "",
					redirectUrl,
					...(organizationId
						? { organizationId }
						: { userId: user.id }),
					customerId: customerId ?? undefined,
				});

				if (!checkoutLink) {
					throw new HTTPException(500);
				}

				return c.json({ checkoutLink });
			} catch (e) {
				logger.error(e);
				throw new HTTPException(500);
			}
		},
	)
	.post(
		"/create-customer-portal-link",
		authMiddleware,
		validator(
			"query",
			z.object({
				purchaseId: z.string(),
				redirectUrl: z.string().optional(),
			}),
		),
		describeRoute({
			tags: ["Payments"],
			summary: "Create a customer portal link",
			description:
				"Creates a customer portal link for the customer or team. If a purchase is provided, the link will be created for the customer of the purchase.",
			responses: {
				200: {
					description: "Customer portal link",
				},
			},
		}),
		async (c) => {
			const { purchaseId, redirectUrl } = c.req.valid("query");
			const user = c.get("user");

			const purchase = await getPurchaseById(purchaseId);

			if (!purchase) {
				throw new HTTPException(403);
			}

			if (purchase.organizationId) {
				const userOrganizationMembership =
					await getOrganizationMembership(
						purchase.organizationId,
						user.id,
					);
				if (userOrganizationMembership?.role !== "owner") {
					throw new HTTPException(403);
				}
			}

			if (purchase.userId && purchase.userId !== user.id) {
				throw new HTTPException(403);
			}

			try {
				const customerPortalLink = await createCustomerPortalLink({
					subscriptionId: purchase.subscriptionId ?? undefined,
					customerId: purchase.customerId,
					redirectUrl,
				});

				if (!customerPortalLink) {
					throw new HTTPException(500);
				}

				return c.json({ customerPortalLink });
			} catch (e) {
				logger.error("Could not create customer portal link", e);
				throw new HTTPException(500);
			}
		},
	);
