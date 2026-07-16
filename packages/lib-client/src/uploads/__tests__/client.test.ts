import assert from "node:assert/strict";
import test from "node:test";
import { buildPublicUrl } from "../client";

test("buildPublicUrl uses the explicit public asset domain", () => {
	assert.equal(
		buildPublicUrl(
			"/events/demo/video.mp4",
			"https://assets.hackathonweekly.com/",
		),
		"https://assets.hackathonweekly.com/events/demo/video.mp4",
	);
});

test("buildPublicUrl never needs a signed S3 API origin", () => {
	assert.equal(
		buildPublicUrl(
			"public/event-templates/cover.jpeg",
			"https://assets.hackathonweekly.com",
		),
		"https://assets.hackathonweekly.com/public/event-templates/cover.jpeg",
	);
});
