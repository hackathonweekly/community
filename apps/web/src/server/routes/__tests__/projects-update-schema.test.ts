import assert from "node:assert/strict";
import test from "node:test";
import { updateProjectSchema } from "../projects-schemas";

test("updateProjectSchema does not inject create defaults", () => {
	const result = updateProjectSchema.safeParse({ id: "project-1" });

	assert.equal(result.success, true);
	if (result.success) {
		assert.equal(Object.hasOwn(result.data, "tags"), false);
		assert.equal(Object.hasOwn(result.data, "screenshots"), false);
		assert.equal(Object.hasOwn(result.data, "projectTags"), false);
	}
});

test("updateProjectSchema keeps legacy fields only when provided", () => {
	const result = updateProjectSchema.safeParse({
		id: "project-1",
		imageUrl: "https://example.com/cover.png",
		tags: ["ai", "community"],
	});

	assert.equal(result.success, true);
	if (result.success) {
		assert.deepEqual(result.data.tags, ["ai", "community"]);
		assert.equal(result.data.imageUrl, "https://example.com/cover.png");
	}
});
