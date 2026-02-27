import {
	getOrganizationMembership,
	getOrganizationById,
	getPurchaseById,
} from "@community/lib-server/database";
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
import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { resolver, validator } from "hono-openapi/zod";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";
import { authMiddleware } from "../../middleware/auth";
import { getPurchases } from "./lib/purchases";

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
	.get(
		"/purchases",
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
