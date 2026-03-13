import assert from "node:assert/strict";
import test from "node:test";

test("resource nav keeps docs and about for signed-in users", async () => {
	const policy = await import("../sidebar-nav-policy").catch(() => null);

	assert.notEqual(policy, null);
	assert.deepEqual(policy.getResourceNavItemKeys(true), ["docs", "about"]);
});

test("resource nav keeps discovery orgs for guests and adds about", async () => {
	const policy = await import("../sidebar-nav-policy").catch(() => null);

	assert.notEqual(policy, null);
	assert.deepEqual(policy.getResourceNavItemKeys(false), [
		"docs",
		"organizations",
		"about",
	]);
});
