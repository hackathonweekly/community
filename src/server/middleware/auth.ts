import { type Session, type User, auth } from "@/lib/auth";
import { createMiddleware } from "hono/factory";

/**
 * Authentication middleware for HackathonWeekly API routes
 * Validates session and attaches user info to request context
 */

export const authMiddleware = createMiddleware<{
	Variables: {
		session: Session["session"];
		user: User;
	};
}>(async (context, next) => {
	// Retrieve session from request headers
	const authSession = await auth.api.getSession({
		headers: context.req.raw.headers,
	});

	// Reject unauthenticated requests
	if (!authSession) {
		return context.json({ error: "Unauthorized" }, 401);
	}

	// Attach session and user to context for downstream handlers
	context.set("session", authSession.session);
	context.set("user", authSession.user as User);

	await next();
});
