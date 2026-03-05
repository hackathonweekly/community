import { nanoid } from "nanoid";

const PROJECT_SHORT_ID_LENGTH = 8;

export function generateProjectShortId(): string {
	return nanoid(PROJECT_SHORT_ID_LENGTH);
}

/**
 * Resolve a project identifier that could be either a shortId or a CUID.
 * CUIDs are 25 chars starting with 'c'; shortIds are 8 chars.
 * Returns a Prisma where clause.
 */
export function resolveProjectIdentifier(identifier: string) {
	const isCuid = identifier.length === 25 && identifier.startsWith("c");
	return isCuid ? { id: identifier } : { shortId: identifier };
}
