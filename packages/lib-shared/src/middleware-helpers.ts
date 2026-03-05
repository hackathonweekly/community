import type { NextRequest } from "next/server";

export interface Session {
	user?: { id?: string | null; role?: string | null } | null;
	[key: string]: unknown;
}

export interface Organization {
	id?: string;
	slug?: string;
	[key: string]: unknown;
}

/**
 * In PaaS/Docker environments the container only serves HTTP, so fetching
 * the external HTTPS origin from inside causes SSL errors. Use localhost
 * instead, but forward the original Host and client-IP headers so that
 * rate-limiters and auth libraries work correctly.
 */
function getInternalOrigin(requestOrigin: string): string {
	if (requestOrigin.startsWith("http://")) {
		return requestOrigin;
	}
	return `http://localhost:${process.env.PORT ?? 3000}`;
}

function buildHeaders(req: NextRequest): Record<string, string> {
	const h: Record<string, string> = {
		cookie: req.headers.get("cookie") || "",
	};
	const host = req.headers.get("host");
	if (host) h.host = host;
	const xff = req.headers.get("x-forwarded-for");
	if (xff) h["x-forwarded-for"] = xff;
	const cfIp = req.headers.get("cf-connecting-ip");
	if (cfIp) h["cf-connecting-ip"] = cfIp;
	return h;
}

export const getSession = async (req: NextRequest): Promise<Session | null> => {
	const origin = getInternalOrigin(req.nextUrl.origin);
	try {
		const response = await fetch(
			new URL("/api/auth/get-session?disableCookieCache=true", origin),
			{ headers: buildHeaders(req) },
		);

		if (!response.ok) {
			return null;
		}

		return await response.json();
	} catch (error) {
		console.error("Error fetching session:", error);
		return null;
	}
};

export const getOrganizationsForSession = async (
	req: NextRequest,
): Promise<Organization[]> => {
	const origin = getInternalOrigin(req.nextUrl.origin);
	try {
		const response = await fetch(
			new URL("/api/auth/organization/list", origin),
			{ headers: buildHeaders(req) },
		);

		if (!response.ok) {
			return [];
		}

		return (await response.json()) ?? [];
	} catch (error) {
		console.error("Error fetching organizations:", error);
		return [];
	}
};
