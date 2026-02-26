import { db } from "@community/lib-server/database/prisma/client";
import { nanoid } from "nanoid";
import type { EventInvite, EventInviteType } from "@prisma/client";

const INVITE_CODE_LENGTH = 8;
const MAX_CODE_GENERATION_ATTEMPTS = 5;
const NEW_USER_WINDOW_MS = 10 * 60 * 1000; // 10 minutes

function generateCandidateCode() {
	// Lowercase the nanoid to keep URLs tidy
	return nanoid(INVITE_CODE_LENGTH).toLowerCase();
}

async function createInviteWithUniqueCode(data: {
	eventId: string;
	type: EventInviteType;
	label?: string | null;
	issuedByUserId?: string | null;
}) {
	for (
		let attempt = 0;
		attempt < MAX_CODE_GENERATION_ATTEMPTS;
		attempt += 1
	) {
		const code = generateCandidateCode();

		try {
			return await db.eventInvite.create({
				data: {
					code,
					eventId: data.eventId,
					type: data.type,
					label: data.label ?? null,
					issuedByUserId: data.issuedByUserId ?? null,
				},
				include: {
					issuedByUser: {
						select: {
							id: true,
							name: true,
							image: true,
							username: true,
						},
					},
				},
			});
		} catch (error) {
			// Unique constraint violation, try a new code
			if (
				error instanceof Error &&
				"code" in error &&
				(error as { code?: string }).code === "P2002"
			) {
				continue;
			}

			throw error;
		}
	}

	throw new Error("Failed to generate unique invite code");
}

export async function getOrCreateUserInvite(eventId: string, userId: string) {
	const existing = await db.eventInvite.findFirst({
		where: {
			eventId,
			type: "USER_SHARE",
			issuedByUserId: userId,
		},
		include: {
			issuedByUser: {
				select: {
					id: true,
					name: true,
					image: true,
					username: true,
				},
			},
		},
	});

	if (existing) {
		return existing;
	}

	return createInviteWithUniqueCode({
		eventId,
		type: "USER_SHARE",
		issuedByUserId: userId,
	});
}

export async function createChannelInvite(data: {
	eventId: string;
	createdByUserId: string;
	label: string;
}) {
	return createInviteWithUniqueCode({
		eventId: data.eventId,
		type: "CHANNEL",
		label: data.label,
		issuedByUserId: data.createdByUserId,
	});
}

export async function findEventInviteByCode(eventId: string, code: string) {
	return db.eventInvite.findFirst({
		where: {
			eventId,
			code,
		},
		include: {
			issuedByUser: {
				select: {
					id: true,
					name: true,
					image: true,
					username: true,
				},
			},
		},
	});
}

export type EventInviteWithStats = EventInvite & {
	issuedByUser?: {
		id: string;
		name: string | null;
		image: string | null;
		username: string | null;
	} | null;
	stats: {
		totalRegistrations: number;
		newUserRegistrations: number;
		lastRegistrationAt: Date | null;
	};
};

export async function listEventInvitesWithStats(eventId: string) {
	const invites = await db.eventInvite.findMany({
		where: { eventId },
		include: {
			issuedByUser: {
				select: {
					id: true,
					name: true,
					image: true,
					username: true,
				},
			},
			registrations: {
				select: {
					id: true,
					registeredAt: true,
					user: {
						select: {
							id: true,
							name: true,
							createdAt: true,
						},
					},
				},
				orderBy: { registeredAt: "desc" },
			},
		},
		orderBy: {
			createdAt: "asc",
		},
	});

	return invites.map((invite) => {
		const totalRegistrations = invite.registrations.length;
		let newUserRegistrations = 0;
		let lastRegistrationAt: Date | null = null;

		for (const registration of invite.registrations) {
			const registeredAt = registration.registeredAt;

			if (!lastRegistrationAt || registeredAt > lastRegistrationAt) {
				lastRegistrationAt = registeredAt;
			}

			const userCreatedAt = registration.user.createdAt;
			const delta = Math.abs(
				registeredAt.getTime() - userCreatedAt.getTime(),
			);
			if (delta <= NEW_USER_WINDOW_MS) {
				newUserRegistrations += 1;
			}
		}

		const { registrations, ...rest } = invite;

		return {
			...rest,
			stats: {
				totalRegistrations,
				newUserRegistrations,
				lastRegistrationAt,
			},
		} satisfies EventInviteWithStats;
	});
}
