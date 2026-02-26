import {
	getPurchasesByOrganizationId,
	getPurchasesByUserId,
} from "@community/lib-server/database";

/**
 * Purchase retrieval utilities for HackathonWeekly
 * Fetches purchase records for users or organizations
 */

type EntitySelector = { organizationId: string } | { userId: string };

/**
 * Retrieves all purchases for a given user or organization
 * @param entityId - Object with either organizationId or userId
 * @returns Array of purchase records sorted by creation date
 */
export async function getPurchases(entityId: EntitySelector) {
	// Handle organization purchases
	if ("organizationId" in entityId) {
		return await getPurchasesByOrganizationId(entityId.organizationId);
	}

	// Handle user purchases
	return await getPurchasesByUserId(entityId.userId);
}
