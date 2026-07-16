import assert from "node:assert/strict";
import test from "node:test";

import { resolveMiniProgramNavigationContext } from "../wechat-payment-client-context";

test("navigateTo is the authoritative mini-program payment capability", () => {
	assert.deepEqual(
		resolveMiniProgramNavigationContext({
			hasNavigateTo: true,
			bootstrapContext: {
				miniProgramBridgeSupported: false,
			},
		}),
		{
			miniProgramBridgeSupported: true,
			miniProgramBridgeVersion: "1.3.0",
			shellVersion: undefined,
		},
	);
});

test("navigation capability preserves shell metadata", () => {
	assert.deepEqual(
		resolveMiniProgramNavigationContext({
			hasNavigateTo: true,
			bootstrapContext: {
				miniProgramBridgeSupported: true,
				miniProgramBridgeVersion: "1.4.2",
				shellVersion: "2.6.0",
			},
		}),
		{
			miniProgramBridgeSupported: true,
			miniProgramBridgeVersion: "1.4.2",
			shellVersion: "2.6.0",
		},
	);
});

test("missing navigateTo does not claim navigation payment support", () => {
	assert.equal(
		resolveMiniProgramNavigationContext({ hasNavigateTo: false }),
		null,
	);
});
