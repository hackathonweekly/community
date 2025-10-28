import {
	createPurchase,
	deletePurchaseBySubscriptionId,
	getPurchaseBySubscriptionId,
	updatePurchase,
} from "@/lib/database";
import { logger } from "@/lib/logs";
import Stripe from "stripe";
import { setCustomerIdToEntity } from "../../lib/customer";
import type {
	CreateCheckoutLink,
	CreateCustomerPortalLink,
	SetSubscriptionSeats,
	WebhookHandler,
} from "../../types";

/**
 * Stripe payment provider implementation for HackathonWeekly
 *
 * Features:
 * - Event ticket purchases (one-time payments)
 * - Hackathon sponsorship subscriptions
 * - Webhook processing for payment lifecycle
 * - Customer portal for subscription management
 */

// Cached Stripe client for reuse across requests
let cachedStripeClient: Stripe | null = null;

/**
 * Initializes and returns Stripe SDK client
 * Uses singleton pattern to avoid redundant initialization
 *
 * @throws {Error} When STRIPE_SECRET_KEY environment variable is missing
 */
export function getStripeClient(): Stripe {
	// Return cached instance if available
	if (cachedStripeClient) {
		return cachedStripeClient;
	}

	const apiKey = process.env.STRIPE_SECRET_KEY;

	if (!apiKey?.trim()) {
		throw new Error(
			"Stripe API key not configured. Set STRIPE_SECRET_KEY in environment.",
		);
	}

	cachedStripeClient = new Stripe(apiKey, {
		apiVersion: "2025-07-30.basil",
		typescript: true,
	});

	return cachedStripeClient;
}

/**
 * Generates a Stripe Checkout session URL for completing payment
 *
 * Supports two payment modes:
 * - one-time: Single payment for event tickets or services
 * - subscription: Recurring billing for sponsorships or memberships
 *
 * @param options - Checkout configuration including product, customer, and metadata
 * @returns Stripe Checkout URL or null if session creation fails
 */
export const createCheckoutLink: CreateCheckoutLink = async (options) => {
	const stripe = getStripeClient();

	const {
		type,
		productId,
		redirectUrl,
		customerId,
		organizationId,
		userId,
		trialPeriodDays,
		seats,
	} = options;

	// Build metadata to track purchase ownership in webhooks
	const ownershipMetadata: Record<string, string> = {};
	if (organizationId) ownershipMetadata.organization_id = organizationId;
	if (userId) ownershipMetadata.user_id = userId;

	// Configure checkout session based on payment type
	const sessionParams: Stripe.Checkout.SessionCreateParams = {
		mode: type === "subscription" ? "subscription" : "payment",
		success_url: redirectUrl || "",
		cancel_url: redirectUrl || "",
		line_items: [
			{
				price: productId,
				quantity: seats || 1,
			},
		],
		metadata: ownershipMetadata,
	};

	// Add customer if provided, otherwise create new customer
	if (customerId) {
		sessionParams.customer = customerId;
	} else {
		sessionParams.customer_creation = "always";
	}

	// Configure subscription-specific options
	if (type === "subscription") {
		sessionParams.subscription_data = {
			metadata: ownershipMetadata,
		};

		if (trialPeriodDays && trialPeriodDays > 0) {
			sessionParams.subscription_data.trial_period_days = trialPeriodDays;
		}
	} else {
		// Configure one-time payment options
		sessionParams.payment_intent_data = {
			metadata: ownershipMetadata,
		};
	}

	const session = await stripe.checkout.sessions.create(sessionParams);

	return session.url;
};

/**
 * Creates a Stripe Customer Portal session for self-service billing management
 *
 * @returns URL to customer portal where they can manage subscriptions and payment methods
 */
export const createCustomerPortalLink: CreateCustomerPortalLink = async ({
	customerId,
	redirectUrl,
}) => {
	const stripe = getStripeClient();

	const portal = await stripe.billingPortal.sessions.create({
		customer: customerId,
		return_url: redirectUrl || "",
	});

	return portal.url;
};

/**
 * Adjusts subscription seat count for organization team size changes
 *
 * @throws {Error} When subscription not found or has no line items
 */
export const setSubscriptionSeats: SetSubscriptionSeats = async ({
	id,
	seats,
}) => {
	const stripe = getStripeClient();

	const subscription = await stripe.subscriptions.retrieve(id);

	if (!subscription || subscription.items.data.length === 0) {
		throw new Error(`Subscription ${id} not found or has no items`);
	}

	const itemId = subscription.items.data[0]?.id;

	await stripe.subscriptions.update(id, {
		items: [
			{
				id: itemId,
				quantity: seats,
			},
		],
		proration_behavior: "create_prorations",
	});
};

/**
 * Webhook handler for Stripe payment events
 *
 * Supported events:
 * - checkout.session.completed: One-time payment completed
 * - customer.subscription.created: New subscription started
 * - customer.subscription.updated: Subscription changed (plan/status)
 * - customer.subscription.deleted: Subscription cancelled
 *
 * @param req - Request object containing webhook payload and signature
 * @returns Response indicating webhook processing status
 */
export const webhookHandler: WebhookHandler = async (req) => {
	const stripe = getStripeClient();

	if (!req.body) {
		return new Response("Request body required", { status: 400 });
	}

	// Verify webhook authenticity
	const signature = req.headers.get("stripe-signature");
	const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

	if (!signature || !webhookSecret) {
		logger.error("Missing webhook signature or secret");
		return new Response("Webhook configuration error", { status: 500 });
	}

	let event: Stripe.Event;

	try {
		event = await stripe.webhooks.constructEventAsync(
			await req.text(),
			signature,
			webhookSecret,
		);
	} catch (error) {
		logger.error("Webhook signature verification failed:", error);
		return new Response("Invalid webhook signature", { status: 401 });
	}

	// Route webhook event to appropriate handler
	try {
		const { type, data } = event;

		switch (type) {
			case "checkout.session.completed":
				await handleCheckoutCompleted(stripe, data.object);
				break;

			case "customer.subscription.created":
				await handleSubscriptionCreated(data.object);
				break;

			case "customer.subscription.updated":
				await handleSubscriptionUpdated(data.object);
				break;

			case "customer.subscription.deleted":
				await handleSubscriptionDeleted(data.object);
				break;

			default:
				// Log unhandled events for monitoring
				logger.info(`Unhandled webhook event type: ${type}`);
				return new Response("Event type not handled", { status: 200 });
		}

		return new Response(null, { status: 204 });
	} catch (error) {
		const message =
			error instanceof Error ? error.message : "Unknown error";
		logger.error(`Webhook processing failed: ${message}`, error);
		return new Response(`Webhook error: ${message}`, { status: 500 });
	}
};

/**
 * Handles completed checkout sessions for one-time payments
 */
async function handleCheckoutCompleted(
	stripe: Stripe,
	session: Stripe.Checkout.Session,
): Promise<void> {
	const { mode, metadata, customer, id } = session;

	// Subscriptions are handled by subscription.created event
	if (mode === "subscription") {
		return;
	}

	// Fetch line items to get product details
	const fullSession = await stripe.checkout.sessions.retrieve(id, {
		expand: ["line_items"],
	});

	const priceId = fullSession.line_items?.data[0]?.price?.id;

	if (!priceId) {
		throw new Error("Checkout session missing price ID");
	}

	// Record one-time purchase
	await createPurchase({
		organizationId: metadata?.organization_id || null,
		userId: metadata?.user_id || null,
		customerId: customer as string,
		type: "ONE_TIME",
		productId: priceId,
	});

	// Associate customer with user/org
	await setCustomerIdToEntity(customer as string, {
		organizationId: metadata?.organization_id,
		userId: metadata?.user_id,
	});
}

/**
 * Handles new subscription creation
 */
async function handleSubscriptionCreated(
	subscription: Stripe.Subscription,
): Promise<void> {
	const { metadata, customer, items, id, status } = subscription;

	const priceId = items.data[0]?.price?.id;

	if (!priceId) {
		throw new Error("Subscription missing price ID");
	}

	await createPurchase({
		subscriptionId: id,
		organizationId: metadata?.organization_id || null,
		userId: metadata?.user_id || null,
		customerId: customer as string,
		type: "SUBSCRIPTION",
		productId: priceId,
		status,
	});

	await setCustomerIdToEntity(customer as string, {
		organizationId: metadata?.organization_id,
		userId: metadata?.user_id,
	});
}

/**
 * Handles subscription updates (plan changes, status changes)
 */
async function handleSubscriptionUpdated(
	subscription: Stripe.Subscription,
): Promise<void> {
	const purchase = await getPurchaseBySubscriptionId(subscription.id);

	if (!purchase) {
		logger.warn(`Purchase not found for subscription ${subscription.id}`);
		return;
	}

	const updatedPriceId = subscription.items.data[0]?.price?.id;

	await updatePurchase({
		id: purchase.id,
		status: subscription.status,
		productId: updatedPriceId,
	});
}

/**
 * Handles subscription cancellations
 */
async function handleSubscriptionDeleted(
	subscription: Stripe.Subscription,
): Promise<void> {
	await deletePurchaseBySubscriptionId(subscription.id);
}
