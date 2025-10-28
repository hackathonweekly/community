import { PrismaClient } from "@prisma/client";

/**
 * Prisma database client for HackathonWeekly
 * Uses singleton pattern to prevent connection pool exhaustion
 */

/**
 * Creates a new Prisma client instance
 */
function createPrismaClient() {
	return new PrismaClient();
}

// Type for global Prisma instance
type PrismaClientInstance = ReturnType<typeof createPrismaClient>;

declare global {
	// Allow global Prisma instance in development
	var prismaInstance: PrismaClientInstance | undefined;
}

// Use existing instance or create new one
const client = globalThis.prismaInstance ?? createPrismaClient();

// Cache instance in development to persist across hot reloads
if (process.env.NODE_ENV !== "production") {
	globalThis.prismaInstance = client;
}

export { client as db };
