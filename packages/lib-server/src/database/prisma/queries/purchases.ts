import { Prisma } from "@prisma/client";
import { db } from "../client";

/**
 * Purchase management queries for HackathonWeekly platform
 * Handles subscription and one-time purchase records
 */

/**
 * Retrieves a purchase by its unique ID
 */
export async function getPurchaseById(id: string) {
	return db.purchase.findUnique({
		where: { id },
	});
}

/**
 * Gets all purchases for a specific organization
 */
export async function getPurchasesByOrganizationId(organizationId: string) {
	return db.purchase.findMany({
		where: { organizationId },
		orderBy: { createdAt: "desc" },
	});
}

/**
 * Gets all purchases for a specific user
 */
export async function getPurchasesByUserId(userId: string) {
	return db.purchase.findMany({
		where: { userId },
		orderBy: { createdAt: "desc" },
	});
}

/**
 * Finds a purchase by subscription ID (for recurring payments)
 */
export async function getPurchaseBySubscriptionId(subscriptionId: string) {
	return db.purchase.findFirst({
		where: { subscriptionId },
	});
}

/**
 * Creates a new purchase record
 * @returns The created purchase with all fields populated
 */
export async function createPurchase(
	purchase: Prisma.PurchaseUncheckedCreateInput,
) {
	const created = await db.purchase.create({
		data: purchase,
	});

	return getPurchaseById(created.id);
}

/**
 * Updates an existing purchase record
 * @returns The updated purchase with all fields populated
 */
export async function updatePurchase(
	purchase: Prisma.PurchaseUncheckedUpdateInput & {
		id: string;
	},
) {
	const { id, ...updateData } = purchase;

	const updated = await db.purchase.update({
		where: { id },
		data: updateData,
	});

	return getPurchaseById(updated.id);
}

/**
 * Deletes a purchase by its subscription ID
 * Used when a subscription is cancelled
 */
export async function deletePurchaseBySubscriptionId(subscriptionId: string) {
	await db.purchase.delete({
		where: { subscriptionId },
	});
}
