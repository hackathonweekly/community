import { z } from "zod";

/**
 * Subscription plan pricing schemas for HackathonWeekly
 */

/**
 * Pricing variant for a subscription plan (e.g., monthly, yearly)
 */
export const SubscriptionPlanVariantModel = z.object({
	/** Unique variant identifier from payment provider */
	id: z.string(),
	/** Price amount in smallest currency unit (e.g., cents) */
	price: z.number(),
	/** Currency code (e.g., USD, EUR) */
	currency: z.string(),
	/** Billing interval (e.g., month, year) */
	interval: z.string(),
	/** Number of intervals between billings */
	interval_count: z.number(),
});

/**
 * Complete subscription plan with all pricing variants
 */
export const SubscriptionPlanModel = z.object({
	/** Unique plan identifier */
	id: z.string(),
	/** Display name of the plan */
	name: z.string(),
	/** Plan description for marketing */
	description: z.string().nullable().optional(),
	/** Payment provider store identifier */
	storeId: z.string().nullable().optional(),
	/** Available pricing variants for this plan */
	variants: z.array(SubscriptionPlanVariantModel),
});

export type SubscriptionPlan = z.infer<typeof SubscriptionPlanModel>;
export type SubscriptionPlanVariant = z.infer<
	typeof SubscriptionPlanVariantModel
>;
