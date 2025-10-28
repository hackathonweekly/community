/**
 * Prisma ORM exports for HackathonWeekly
 * Provides database client, Zod schemas, and query functions
 */
export * from "./client";
export * from "./zod";
export * from "./queries";

// Global namespace for Prisma JSON fields
declare global {
	namespace PrismaJson {}
}
