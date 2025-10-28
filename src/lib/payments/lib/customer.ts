import {
	getOrganizationById,
	getUserById,
	updateOrganization,
	updateUser,
} from "@/lib/database";

/**
 * Payment customer management for HackathonWeekly platform
 *
 * Manages the relationship between payment provider customer IDs
 * and HackathonWeekly users/organizations for event payments and sponsorships
 */

interface EntityIdentifiers {
	organizationId?: string;
	userId?: string;
}

/**
 * Links a payment provider's customer ID to a user or organization
 *
 * This enables:
 * - Tracking purchases and subscriptions
 * - Customer portal access
 * - Automated billing
 *
 * @param customerId - Payment provider customer ID (e.g., Stripe customer ID)
 * @param identifiers - Either organizationId or userId to link the customer to
 */
export async function setCustomerIdToEntity(
	customerId: string,
	{ organizationId, userId }: EntityIdentifiers,
): Promise<void> {
	// Organization takes precedence over user
	if (organizationId) {
		await updateOrganization({
			id: organizationId,
			paymentsCustomerId: customerId,
		});
		return;
	}

	// Link to user if no organization specified
	if (userId) {
		await updateUser({
			id: userId,
			paymentsCustomerId: customerId,
		});
		return;
	}

	throw new Error("Either organizationId or userId must be provided");
}

/**
 * Retrieves the payment customer ID for a user or organization
 *
 * Used to check if an entity already has a payment customer before creating one
 *
 * @param entityId - Object with either organizationId or userId
 * @returns Customer ID string, or null if not found
 */
export async function getCustomerIdFromEntity(
	entityId: { organizationId: string } | { userId: string },
): Promise<string | null> {
	if ("organizationId" in entityId) {
		const org = await getOrganizationById(entityId.organizationId);
		return org?.paymentsCustomerId || null;
	}

	const user = await getUserById(entityId.userId);
	return user?.paymentsCustomerId || null;
}
