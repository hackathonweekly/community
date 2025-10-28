import { getOrganizationMembership } from "@/lib/database";
import { HTTPException } from "hono/http-exception";

/**
 * Organization membership verification utilities for HackathonWeekly
 * Ensures users have proper access to organization resources
 */

/**
 * Validates that a user is a member of an organization
 * @param organizationId - Target organization ID
 * @param userId - User ID to verify
 * @returns Organization and member role information
 * @throws HTTPException 404 if user is not a member
 */
export async function verifyOrganizationMembership(
	organizationId: string,
	userId: string,
) {
	const memberRecord = await getOrganizationMembership(
		organizationId,
		userId,
	);

	if (!memberRecord) {
		throw new HTTPException(404, {
			message: "User is not a member of this organization",
		});
	}

	return {
		organization: memberRecord.organization,
		role: memberRecord.role,
	};
}
