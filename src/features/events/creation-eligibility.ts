import { getVisitorRestrictionsConfig } from "@/config/visitor-restrictions";
import { db } from "@/lib/database/prisma";
import {
	RestrictedAction,
	canUserDoAction,
} from "@/features/permissions/visitor-restrictions";
import type { MembershipLevel } from "@prisma/client";

export interface EventCreationEligibility {
	allowed: boolean;
	reason?: string;
	status: number;
	user?: {
		id: string;
		membershipLevel: MembershipLevel | null;
	};
}

export async function getEventCreationEligibility(
	userId: string,
): Promise<EventCreationEligibility> {
	const user = await db.user.findUnique({
		where: { id: userId },
		select: { id: true, membershipLevel: true },
	});

	if (!user) {
		return {
			allowed: false,
			status: 404,
			reason: "User not found",
		};
	}

	const restrictions = await getVisitorRestrictionsConfig();
	const { allowed, reason } = canUserDoAction(
		{ membershipLevel: user.membershipLevel },
		RestrictedAction.CREATE_EVENT,
		restrictions,
	);

	if (!allowed) {
		return {
			allowed: false,
			reason,
			status: 403,
			user,
		};
	}

	return {
		allowed: true,
		status: 200,
		user,
	};
}
