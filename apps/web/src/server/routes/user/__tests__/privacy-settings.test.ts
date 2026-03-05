import assert from "node:assert/strict";
import test from "node:test";
import { createPrivacySettingsRouter } from "../privacy-settings";

test("PATCH /privacy-settings returns 401 when unauthenticated", async () => {
	const router = createPrivacySettingsRouter({
		auth: async (c) => {
			return c.json({ error: "Unauthorized" }, 401);
		},
	});

	const response = await router.request("/privacy-settings", {
		method: "PATCH",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			profilePublic: true,
		}),
	});

	assert.equal(response.status, 401);
});

test("PATCH /privacy-settings updates privacy settings for authenticated user", async () => {
	const calls: Array<{ userId: string; payload: Record<string, unknown> }> =
		[];

	const router = createPrivacySettingsRouter({
		auth: async (c, next) => {
			c.set("session", {} as any);
			c.set("user", { id: "user-1" } as any);
			await next();
		},
		updatePrivacySettings: async (userId, payload) => {
			calls.push({
				userId,
				payload: payload as Record<string, unknown>,
			});
			return {
				profilePublic: false,
				showEmail: true,
				showWechat: false,
			};
		},
	});

	const response = await router.request("/privacy-settings", {
		method: "PATCH",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			profilePublic: false,
			showEmail: true,
			showWechat: false,
		}),
	});

	assert.equal(response.status, 200);

	const body = await response.json();
	assert.equal(body.success, true);
	assert.deepEqual(body.data, {
		profilePublic: false,
		showEmail: true,
		showWechat: false,
	});
	assert.equal(calls.length, 1);
	assert.deepEqual(calls[0], {
		userId: "user-1",
		payload: {
			profilePublic: false,
			showEmail: true,
			showWechat: false,
		},
	});
});
