import { db } from "@community/lib-server/database/prisma/client";
import type { EventSeriesSubscription } from "@prisma/client";

export async function getEventSeriesSubscription(params: {
	seriesId: string;
	userId: string;
}) {
	return db.eventSeriesSubscription.findUnique({
		where: {
			seriesId_userId: {
				seriesId: params.seriesId,
				userId: params.userId,
			},
		},
	});
}

export async function upsertEventSeriesSubscription(params: {
	seriesId: string;
	userId: string;
	notifyEmail?: boolean;
	notifyInApp?: boolean;
}): Promise<EventSeriesSubscription> {
	return db.eventSeriesSubscription.upsert({
		where: {
			seriesId_userId: {
				seriesId: params.seriesId,
				userId: params.userId,
			},
		},
		create: {
			seriesId: params.seriesId,
			userId: params.userId,
			notifyEmail: params.notifyEmail ?? true,
			notifyInApp: params.notifyInApp ?? true,
		},
		update: {
			notifyEmail: params.notifyEmail ?? true,
			notifyInApp: params.notifyInApp ?? true,
		},
	});
}

export async function removeEventSeriesSubscription(params: {
	seriesId: string;
	userId: string;
}) {
	return db.eventSeriesSubscription.deleteMany({
		where: {
			seriesId: params.seriesId,
			userId: params.userId,
		},
	});
}

export interface EventSeriesSubscriberContact {
	userId: string;
	email: string | null;
	name: string;
	locale: string | null;
	notifyEmail: boolean;
	notifyInApp: boolean;
	canReceiveEmail: boolean;
}

export async function getEventSeriesSubscribers(
	seriesId: string,
): Promise<EventSeriesSubscriberContact[]> {
	const subscriptions = await db.eventSeriesSubscription.findMany({
		where: {
			seriesId,
		},
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

	return subscriptions.map((item) => {
		const emailPreference = item.user.emailPreference;
		const canReceiveEmail =
			Boolean(item.user.email) &&
			!emailPreference?.unsubscribedAt &&
			emailPreference?.subscribeEvents !== false;

		return {
			userId: item.user.id,
			email: item.user.email ?? null,
			name: item.user.name,
			locale: item.user.locale ?? null,
			notifyEmail: item.notifyEmail,
			notifyInApp: item.notifyInApp,
			canReceiveEmail,
		};
	});
}
