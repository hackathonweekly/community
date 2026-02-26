import { app } from "@/server";
import { handle } from "hono/vercel";

/**
 * API route handler for HackathonWeekly
 * Delegates all API requests to Hono server with OpenAPI documentation
 */

const requestHandler = handle(app);

// Export handlers for all HTTP methods
export const GET = requestHandler;
export const POST = requestHandler;
export const PUT = requestHandler;
export const PATCH = requestHandler;
export const DELETE = requestHandler;
export const OPTIONS = requestHandler;
