export interface RequestClientMetadata {
	ipAddress?: string | null;
	userAgent?: string | null;
}

export function getRequestClientMetadata(
	request: Request,
): RequestClientMetadata {
	const headers = request.headers;
	const ipHeader =
		headers.get("cf-connecting-ip") ??
		headers.get("x-forwarded-for") ??
		headers.get("x-real-ip");
	const ip = ipHeader?.split(",")[0]?.trim();

	return {
		ipAddress: ip ?? null,
		userAgent: headers.get("user-agent") ?? null,
	};
}
