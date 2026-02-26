import assert from "node:assert/strict";
import test from "node:test";
import { Prisma } from "@prisma/client";
import { withPrismaReadRetry } from "../retry";

function createKnownRequestError(code: string) {
	return new Prisma.PrismaClientKnownRequestError("mock error", {
		code,
		clientVersion: "test-client",
	});
}

test("withPrismaReadRetry retries once when Prisma connection is closed", async () => {
	let attempts = 0;

	const result = await withPrismaReadRetry(async () => {
		attempts += 1;
		if (attempts === 1) {
			throw createKnownRequestError("P1017");
		}

		return "ok";
	});

	assert.equal(result, "ok");
	assert.equal(attempts, 2);
});

test("withPrismaReadRetry does not retry non-retryable Prisma errors", async () => {
	let attempts = 0;

	await assert.rejects(async () => {
		await withPrismaReadRetry(async () => {
			attempts += 1;
			throw createKnownRequestError("P2025");
		});
	});

	assert.equal(attempts, 1);
});

test("withPrismaReadRetry stops after exhausting retries", async () => {
	let attempts = 0;

	await assert.rejects(async () => {
		await withPrismaReadRetry(
			async () => {
				attempts += 1;
				throw createKnownRequestError("P1017");
			},
			{ maxRetries: 2 },
		);
	});

	assert.equal(attempts, 3);
});
