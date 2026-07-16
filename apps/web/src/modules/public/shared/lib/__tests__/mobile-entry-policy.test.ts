import assert from "node:assert/strict";
import test from "node:test";
import {
	CATEGORY_PREFIXES,
	getGuestTabKeys,
	getMobileHomeHref,
	getUserTabKeys,
	isDiscoveryRoute,
	shouldShowVisitorLoginBanner,
} from "../mobile-entry-policy";

test("mobile home href points to the community home", () => {
	assert.equal(getMobileHomeHref(false), "/");
	assert.equal(getMobileHomeHref(true), "/");
});

test("guest tabs prioritize events over unmaintained docs and keep login", () => {
	assert.deepEqual(getGuestTabKeys(), [
		"home",
		"events",
		"create",
		"notifications",
		"login",
	]);
});

test("authenticated tabs keep me entry", () => {
	assert.deepEqual(getUserTabKeys(), [
		"home",
		"events",
		"create",
		"notifications",
		"me",
	]);
});

test("discovery routes cover all category list pages", () => {
	for (const prefix of CATEGORY_PREFIXES) {
		assert.equal(isDiscoveryRoute(prefix), true);
	}
	assert.equal(isDiscoveryRoute("/"), false);
});

test("visitor login banner is shown only when unauthenticated", () => {
	assert.equal(shouldShowVisitorLoginBanner(false), true);
	assert.equal(shouldShowVisitorLoginBanner(true), false);
});
