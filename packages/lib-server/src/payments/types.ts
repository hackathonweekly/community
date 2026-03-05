/**
 * Payment provider type definitions for HackathonWeekly
 * Supports event ticket purchases and subscription management
 */

/**
 * Parameters for creating a checkout session
 */
interface CheckoutLinkParams {
	/** Payment type: one-time for event tickets or subscription */
	type: "subscription" | "one-time";
	/** Payment provider product/price ID */
	productId: string;
	/** Customer email (optional for new customers) */
	email?: string;
	/** Customer name (optional for new customers) */
	name?: string;
	/** URL to redirect after successful payment */
	redirectUrl?: string;
	/** Existing customer ID from payment provider */
	customerId?: string;
	/** Organization ID for team/org purchases */
	organizationId?: string;
	/** User ID for individual purchases */
	userId?: string;
	/** Trial period in days for subscriptions */
	trialPeriodDays?: number;
	/** Number of seats/tickets to purchase */
	seats?: number;
}

/**
 * Creates a checkout session URL
 * @returns Checkout URL or null on failure
 */
export type CreateCheckoutLink = (
	params: CheckoutLinkParams,
) => Promise<string | null>;

/**
 * Parameters for creating a customer portal link
 */
interface CustomerPortalParams {
	/** Optional subscription ID to focus on */
	subscriptionId?: string;
	/** Customer ID in payment provider system */
	customerId: string;
	/** URL to return to after managing subscription */
	redirectUrl?: string;
}

/**
 * Generates a customer portal URL for subscription management
 * @returns Portal URL or null on failure
 */
export type CreateCustomerPortalLink = (
	params: CustomerPortalParams,
) => Promise<string | null>;

/**
 * Updates subscription quantity
 */
export type SetSubscriptionSeats = (params: {
	/** Subscription ID */
	id: string;
	/** New number of seats */
	seats: number;
}) => Promise<void>;

/**
 * Processes webhook events from payment provider
 */
export type WebhookHandler = (req: Request) => Promise<Response>;

/**
 * Payment provider interface
 * Implementations: Stripe, LemonSqueezy, Polar
 */
export interface PaymentProvider {
	createCheckoutLink: CreateCheckoutLink;
	createCustomerPortalLink: CreateCustomerPortalLink;
	webhookHandler: WebhookHandler;
}
