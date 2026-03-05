import { getOrganizationWithPurchasesAndMembersCount } from "@community/lib-server/database";
import type { PurchaseSchema } from "@community/lib-server/database/prisma/zod";
import { logger } from "@community/lib-server/logs";
import { setSubscriptionSeats } from "@community/lib-server/payments";
import type { z } from "zod";

type Purchase = z.infer<typeof PurchaseSchema>;

export async function updateSeatsInOrganizationSubscription(
	organizationId: string,
) {
	const organization =
		await getOrganizationWithPurchasesAndMembersCount(organizationId);

	if (!organization?.purchases.length) {
		return;
	}

	const activeSubscription = organization.purchases.find(
		(purchase: Purchase) => purchase.type === "SUBSCRIPTION",
	);

	if (!activeSubscription?.subscriptionId) {
		return;
	}

	try {
		await setSubscriptionSeats({
			id: activeSubscription.subscriptionId,
			seats: organization.membersCount,
		});
	} catch (error) {
		logger.error("Could not update seats in organization subscription", {
			organizationId,
			error,
		});
	}
}
