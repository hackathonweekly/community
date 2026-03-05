import {
	buildEventsTokenSummary,
	generateEventsTokenValue,
	hashEventsToken,
} from "../service";
import {
	EventsTokenRateLimitError,
	enforceEventsTokenRateLimit,
} from "../rate-limit";

describe("events token service helpers", () => {
	test("generateEventsTokenValue returns prefixed random string", () => {
		const tokenA = generateEventsTokenValue();
		const tokenB = generateEventsTokenValue();

		expect(tokenA).toMatch(/^evt_[A-Za-z0-9]+$/);
		expect(tokenB).toMatch(/^evt_[A-Za-z0-9]+$/);
		expect(tokenA).not.toEqual(tokenB);
	});

	test("hashEventsToken is deterministic", () => {
		const token = "evt_example";
		expect(hashEventsToken(token)).toEqual(hashEventsToken(token));
	});

	test("buildEventsTokenSummary reflects active vs revoked states", () => {
		const now = new Date();
		const active = buildEventsTokenSummary({
			id: "token-1",
			userId: "user-1",
			tokenHash: "hash",
			tokenLastFour: "1234",
			createdAt: now,
			lastUsedAt: now,
			lastUsedIp: "127.0.0.1",
			lastUsedUserAgent: "jest",
			revokedAt: null,
		});

		expect(active.status).toBe("active");
		expect(active.tokenLastFour).toBe("1234");
		expect(active.lastUsedIp).toBe("127.0.0.1");

		const revoked = buildEventsTokenSummary({
			id: "token-2",
			userId: "user-1",
			tokenHash: null,
			tokenLastFour: null,
			createdAt: now,
			lastUsedAt: null,
			lastUsedIp: null,
			lastUsedUserAgent: null,
			revokedAt: now,
		});

		expect(revoked.status).toBe("revoked");
		expect(revoked.revokedAt).toEqual(now.toISOString());
	});
});

describe("events token rate limit", () => {
	test("enforceEventsTokenRateLimit throws after repeated calls", () => {
		const tokenId = "rate-limit-token";
		// Exhaust the limit quickly
		for (let i = 0; i < 65; i++) {
			try {
				enforceEventsTokenRateLimit(tokenId);
			} catch (error: any) {
				expect(error).toBeInstanceOf(EventsTokenRateLimitError);
				expect(error.retryAfter).toBeGreaterThan(0);
				return;
			}
		}

		throw new Error("Expected rate limit error to be thrown");
	});
});
