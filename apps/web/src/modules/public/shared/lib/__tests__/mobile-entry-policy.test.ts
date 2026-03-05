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

test("mobile home href always points to events", () => {
	assert.equal(getMobileHomeHref(false), "/events");
	assert.equal(getMobileHomeHref(true), "/events");
});

test("guest tabs remove organizations and keep login", () => {
	assert.deepEqual(getGuestTabKeys(), [
		"home",
		"docs",
		"create",
		"notifications",
		"login",
	]);
});

test("authenticated tabs keep me entry", () => {
	assert.deepEqual(getUserTabKeys(), [
		"home",
		"docs",
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
