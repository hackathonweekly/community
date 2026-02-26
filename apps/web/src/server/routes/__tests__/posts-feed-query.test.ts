import assert from "node:assert/strict";
import test from "node:test";
import { postsFeedQuerySchema } from "../posts";

test("postsFeedQuerySchema rejects invalid channel", () => {
	const result = postsFeedQuerySchema.safeParse({
		channel: "INVALID",
		sort: "new",
		limit: "20",
	});

	assert.equal(result.success, false);
});

test("postsFeedQuerySchema rejects invalid sort", () => {
	const result = postsFeedQuerySchema.safeParse({
		channel: "CHAT",
		sort: "oldest",
		limit: "20",
	});

	assert.equal(result.success, false);
});

test("postsFeedQuerySchema rejects out-of-range limit", () => {
	const result = postsFeedQuerySchema.safeParse({
		channel: "CHAT",
		sort: "new",
		limit: "0",
	});

	assert.equal(result.success, false);
});

test("postsFeedQuerySchema accepts valid query payload", () => {
	const result = postsFeedQuerySchema.safeParse({
		channel: "CHAT",
		sort: "hot",
		limit: "25",
		cursor: "post-1",
	});

	assert.equal(result.success, true);
	if (result.success) {
		assert.equal(result.data.channel, "CHAT");
		assert.equal(result.data.sort, "hot");
		assert.equal(result.data.limit, 25);
		assert.equal(result.data.cursor, "post-1");
	}
});
