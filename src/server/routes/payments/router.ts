import { getOrganizationMembership } from "@/lib/database";
import {
	PurchaseSchema,
	getOrganizationById,
	getPurchaseById,
} from "@/lib/database";
import { logger } from "@/lib/logs";
import {
	createCheckoutLink,
	createCustomerPortalLink,
	getCustomerIdFromEntity,
} from "@/lib/payments";
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
