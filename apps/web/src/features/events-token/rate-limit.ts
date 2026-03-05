export class EventsTokenRateLimitError extends Error {
	retryAfter: number;
	constructor(retryAfter: number) {
		super("Events token rate limit exceeded");
		this.retryAfter = retryAfter;
	}
}

const WINDOW_MS = 5 * 60 * 1000; // 5 minutes
const MAX_REQUESTS = 60;

type RateLimitEntry = {
	count: number;
	resetTime: number;
};

const usageStore = new Map<string, RateLimitEntry>();

export function enforceEventsTokenRateLimit(tokenId: string) {
	const now = Date.now();
	const entry = usageStore.get(tokenId);

	if (!entry || entry.resetTime <= now) {
		usageStore.set(tokenId, {
			count: 1,
			resetTime: now + WINDOW_MS,
		});
		return;
	}

	entry.count += 1;

	if (entry.count > MAX_REQUESTS) {
		const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
		throw new EventsTokenRateLimitError(retryAfter);
	}
}
