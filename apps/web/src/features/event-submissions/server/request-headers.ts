import type { headers } from "next/headers";

export type RequestHeaderList = Awaited<ReturnType<typeof headers>>;

function getForwardedHeaderValue(value: string | null) {
	if (!value) {
		return null;
	}

	const [firstValue] = value.split(",");
	const normalizedValue = firstValue?.trim();
	return normalizedValue ? normalizedValue : null;
}

export function resolveRequestOrigin(headerList: RequestHeaderList) {
	const proto =
		getForwardedHeaderValue(headerList.get("x-forwarded-proto")) ?? "http";
	const host =
		getForwardedHeaderValue(headerList.get("x-forwarded-host")) ??
		getForwardedHeaderValue(headerList.get("host")) ??
		`localhost:${process.env.PORT ?? 3000}`;

	return `${proto}://${host}`;
}

export function buildForwardedAuthHeaders(
	headerList: RequestHeaderList,
): Record<string, string> {
	const forwardedHeaders: Record<string, string> = {};
	const cookie = headerList.get("cookie");
	if (cookie) {
		forwardedHeaders.cookie = cookie;
	}
	const authorization = headerList.get("authorization");
	if (authorization) {
		forwardedHeaders.authorization = authorization;
	}
	return forwardedHeaders;
}
