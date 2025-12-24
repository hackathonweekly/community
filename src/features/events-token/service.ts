import { db } from "@/lib/database/prisma";
import { createModuleLogger } from "@/lib/logs";
import { createHash, randomBytes } from "crypto";

const TOKEN_PREFIX = "evt_";
const TOKEN_BYTE_LENGTH = 32;
const eventsTokenLogger = createModuleLogger("events-token");

export type EventsTokenStatus = "empty" | "active" | "revoked";

type EventsApiTokenRecord = {
	id: string;
	userId: string;
	tokenHash: string | null;
	tokenLastFour: string | null;
	createdAt: Date;
	createdByIp?: string | null;
	createdByUserAgent?: string | null;
	lastUsedAt?: Date | null;
	lastUsedIp?: string | null;
	lastUsedUserAgent?: string | null;
	revokedAt?: Date | null;
};

export interface EventsTokenSummary {
	status: EventsTokenStatus;
	tokenLastFour?: string | null;
	createdAt?: string;
	lastUsedAt?: string | null;
	lastUsedIp?: string | null;
	lastUsedUserAgent?: string | null;
	revokedAt?: string | null;
}

export interface EventsTokenOverview {
	summary: EventsTokenSummary;
}

export function generateEventsTokenValue() {
	const random = randomBytes(TOKEN_BYTE_LENGTH).toString("hex");
	return `${TOKEN_PREFIX}${random}`;
}

export function hashEventsToken(token: string) {
	return createHash("sha256").update(token).digest("hex");
}

export function buildEventsTokenSummary(
	record: EventsApiTokenRecord | null,
): EventsTokenSummary {
	if (!record) {
		return {
			status: "empty",
		};
	}

	if (!record.tokenHash) {
		return {
			status: record.revokedAt ? "revoked" : "empty",
			revokedAt: record.revokedAt?.toISOString() ?? null,
		};
	}

	return {
		status: "active",
		tokenLastFour: record.tokenLastFour,
		createdAt: record.createdAt.toISOString(),
		lastUsedAt: record.lastUsedAt?.toISOString() ?? null,
		lastUsedIp: record.lastUsedIp ?? null,
		lastUsedUserAgent: record.lastUsedUserAgent ?? null,
		revokedAt: record.revokedAt?.toISOString() ?? null,
	};
}

export async function getEventsTokenRecord(userId: string) {
	return (await db.eventsApiToken.findUnique({
		where: { userId },
	})) as EventsApiTokenRecord | null;
}

export async function getEventsTokenOverview(
	userId: string,
): Promise<EventsTokenOverview> {
	const record = await getEventsTokenRecord(userId);
	return {
		summary: buildEventsTokenSummary(record),
	};
}

export interface IssueTokenResult {
	token: string;
	record: EventsApiTokenRecord;
}

export async function issueEventsToken(options: {
	userId: string;
	ipAddress?: string | null;
	userAgent?: string | null;
}): Promise<IssueTokenResult> {
	const token = generateEventsTokenValue();
	const tokenHash = hashEventsToken(token);
	const tokenLastFour = token.slice(-4);
	const now = new Date();

	const record = await db.eventsApiToken.upsert({
		where: { userId: options.userId },
		update: {
			tokenHash,
			tokenLastFour,
			createdAt: now,
			createdByIp: options.ipAddress ?? null,
			createdByUserAgent: options.userAgent ?? null,
			lastUsedAt: null,
			lastUsedIp: null,
			lastUsedUserAgent: null,
			revokedAt: null,
		},
		create: {
			userId: options.userId,
			tokenHash,
			tokenLastFour,
			createdByIp: options.ipAddress ?? null,
			createdByUserAgent: options.userAgent ?? null,
		},
	});

	eventsTokenLogger.info("Events token issued", {
		userId: options.userId,
	});

	return { token, record };
}

export async function revokeEventsToken(options: {
	userId: string;
	reason?: string;
}) {
	const now = new Date();

	const record = await db.eventsApiToken.upsert({
		where: { userId: options.userId },
		update: {
			tokenHash: null,
			tokenLastFour: null,
			lastUsedAt: null,
			lastUsedIp: null,
			lastUsedUserAgent: null,
			revokedAt: now,
		},
		create: {
			userId: options.userId,
			tokenHash: null,
			tokenLastFour: null,
			revokedAt: now,
		},
	});

	eventsTokenLogger.info("Events token revoked", {
		userId: options.userId,
		reason: options.reason,
	});

	return record;
}

type EventsApiTokenLookup = Pick<
	EventsApiTokenRecord,
	| "id"
	| "userId"
	| "tokenLastFour"
	| "createdAt"
	| "lastUsedAt"
	| "lastUsedIp"
	| "lastUsedUserAgent"
>;

export async function findActiveEventsTokenByValue(token: string) {
	const tokenHash = hashEventsToken(token);
	return (await db.eventsApiToken.findFirst({
		where: {
			tokenHash,
			revokedAt: null,
		},
		select: {
			id: true,
			userId: true,
			tokenLastFour: true,
			createdAt: true,
			lastUsedAt: true,
			lastUsedIp: true,
			lastUsedUserAgent: true,
		},
	})) as EventsApiTokenLookup | null;
}

export async function recordEventsTokenUsage(options: {
	tokenId: string;
	ipAddress?: string | null;
	userAgent?: string | null;
}) {
	await db.eventsApiToken.update({
		where: { id: options.tokenId },
		data: {
			lastUsedAt: new Date(),
			lastUsedIp: options.ipAddress ?? null,
			lastUsedUserAgent: options.userAgent ?? null,
		},
	});
}
