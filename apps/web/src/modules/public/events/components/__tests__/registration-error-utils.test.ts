import assert from "node:assert/strict";
import test from "node:test";

import { parseRegistrationErrorPayload } from "../registrationErrorUtils";

test("parseRegistrationErrorPayload preserves pending order recovery data", async () => {
	const pendingOrder = {
		orderId: "order-id",
		orderNo: "ORDER-1",
		totalAmount: 9.9,
		expiredAt: "2026-07-16T12:00:00.000Z",
		channel: "MINIPROGRAM_BRIDGE",
	};
	const response = new Response(
		JSON.stringify({
			success: false,
			error: "需要绑定小程序 OpenID",
			code: "WECHAT_OPENID_REQUIRED",
			data: pendingOrder,
		}),
		{ status: 400, headers: { "Content-Type": "application/json" } },
	);

	assert.deepEqual(
		await parseRegistrationErrorPayload(response, "fallback"),
		{
			message: "需要绑定小程序 OpenID",
			code: "WECHAT_OPENID_REQUIRED",
			data: pendingOrder,
		},
	);
});
