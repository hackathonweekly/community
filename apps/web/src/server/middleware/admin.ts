import { type Session, auth } from "@community/lib-server/auth";
import { isAdmin } from "@community/lib-shared/auth/permissions";
import { createMiddleware } from "hono/factory";

export const adminMiddleware = createMiddleware<{
	Variables: {
		session: Session["session"];
		user: Session["user"];
	};
}>(async (c, next) => {
	const session = await auth.api.getSession({
		headers: c.req.raw.headers,
		query: {
			disableCookieCache: true,
		},
	});

	if (!session) {
		return c.json({ error: "Unauthorized" }, 401);
	}

	if (!isAdmin(session.user)) {
		return c.json({ error: "Forbidden" }, 403);
	}

	c.set("session", session.session);
	c.set("user", session.user);

	await next();
});
