import { db } from "@community/lib-server/database/prisma/client";
import type { EventHostSubscription } from "@prisma/client";

export type EventHostSubscriptionTarget =
	| { type: "organization"; organizationId: string }
	| { type: "user"; hostUserId: string };

function resolveTarget(params: {
	organizationId?: string | null;
	hostUserId?: string | null;
}): EventHostSubscriptionTarget {
	const organizationId = params.organizationId?.trim();
	const hostUserId = params.hostUserId?.trim();
	const hasOrganization = !!organizationId;
	const hasHostUser = !!hostUserId;

	if (hasOrganization === hasHostUser) {
		throw new Error(
			"Exactly one of organizationId or hostUserId must be provided when managing event host subscriptions.",
		);
	}

	if (hasOrganization) {
		return { type: "organization", organizationId: organizationId! };
	}

	return { type: "user", hostUserId: hostUserId! };
}

function buildTargetWhereClause(
	userId: string,
	target: EventHostSubscriptionTarget,
) {
	if (target.type === "organization") {
		return {
			userId,
			organizationId: target.organizationId,
			hostUserId: null as string | null,
		};
	}

	return {
		userId,
		organizationId: null as string | null,
		hostUserId: target.hostUserId,
	};
}

export async function getEventHostSubscription(params: {
	userId: string;
	organizationId?: string | null;
	hostUserId?: string | null;
}): Promise<EventHostSubscription | null> {
	const target = resolveTarget(params);
	const where = buildTargetWhereClause(params.userId, target);

	return db.eventHostSubscription.findFirst({
		where,
	});
}

export async function subscribeToEventHost(params: {
	userId: string;
	organizationId?: string | null;
	hostUserId?: string | null;
}): Promise<EventHostSubscription> {
	const target = resolveTarget(params);
	const where = buildTargetWhereClause(params.userId, target);

	const existing = await db.eventHostSubscription.findFirst({
		where,
	});

	if (existing) {
		if (existing.unsubscribedAt) {
			return db.eventHostSubscription.update({
				where: { id: existing.id },
				data: { unsubscribedAt: null },
			});
		}
		return existing;
	}

	return db.eventHostSubscription.create({
		data: {
			userId: params.userId,
			organizationId:
				target.type === "organization" ? target.organizationId : null,
			hostUserId: target.type === "user" ? target.hostUserId : null,
		},
	});
}

export async function unsubscribeFromEventHost(params: {
	userId: string;
	organizationId?: string | null;
	hostUserId?: string | null;
}): Promise<EventHostSubscription | null> {
	const target = resolveTarget(params);
	const where = buildTargetWhereClause(params.userId, target);

	const existing = await db.eventHostSubscription.findFirst({
		where,
	});

	if (!existing) {
		return null;
	}

	if (existing.unsubscribedAt) {
		return existing;
	}

	return db.eventHostSubscription.update({
		where: { id: existing.id },
		data: { unsubscribedAt: new Date() },
	});
}

export async function isSubscribedToEventHost(params: {
	userId: string;
	organizationId?: string | null;
	hostUserId?: string | null;
}): Promise<boolean> {
	const subscription = await getEventHostSubscription(params);
	return !!subscription && !subscription.unsubscribedAt;
}

export interface EventHostSubscriberContact {
	userId: string;
	email: string;
	name: string;
	locale: string | null;
}

export async function getActiveEventHostSubscribers(params: {
	organizationId?: string | null;
	hostUserId?: string | null;
	excludeUserIds?: string[];
}): Promise<EventHostSubscriberContact[]> {
	const target = resolveTarget(params);
	const where = {
		unsubscribedAt: null,
		organizationId:
			target.type === "organization"
				? target.organizationId
				: (null as string | null),
		hostUserId:
			target.type === "user"
				? target.hostUserId
				: (null as string | null),
		userId: params.excludeUserIds
			? {
					notIn: params.excludeUserIds,
				}
			: undefined,
	};

	const subscriptions = await db.eventHostSubscription.findMany({
		where,
		include: {
			user: {
				select: {
					id: true,
					name: true,
					email: true,
					locale: true,
					emailPreference: {
						select: {
							subscribeEvents: true,
							unsubscribedAt: true,
						},
					},
				},
			},
		},
	});

	return subscriptions
		.filter((subscription) => {
			const user = subscription.user;
			if (!user?.email) {
				return false;
			}

			const emailPreference = user.emailPreference;
			if (emailPreference?.unsubscribedAt) {
				return false;
			}
			if (emailPreference && emailPreference.subscribeEvents === false) {
				return false;
			}

			return true;
		})
		.map((subscription) => {
			const user = subscription.user!;
			return {
				userId: user.id,
				email: user.email!,
				name: user.name,
				locale: user.locale ?? null,
			};
		});
}
