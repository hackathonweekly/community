import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";

/**
 * Prisma database client for HackathonWeekly
 * Uses singleton pattern to prevent connection pool exhaustion
 */

/**
 * Creates a new Prisma client instance
 */
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);

function createPrismaClient() {
	return new PrismaClient({ adapter });
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
