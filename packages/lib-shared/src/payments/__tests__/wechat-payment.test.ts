import { describe, test, expect } from "vitest";
import {
	WECHAT_PAYMENT_CHANNELS,
	WECHAT_PAYMENT_ERROR_CODES,
	resolveWechatPaymentChannel,
} from "../wechat-payment";

describe("resolveWechatPaymentChannel", () => {
	test("returns mini program bridge channel when capability is supported", () => {
		const result = resolveWechatPaymentChannel({
			clientContext: {
				environmentType: "miniprogram",
				miniProgramBridgeSupported: true,
				miniProgramBridgeVersion: "1.2.0",
			},
		});

		expect(result.ok).toBe(true);
		if (!result.ok) {
			return;
		}
		expect(result.channel).toBe(WECHAT_PAYMENT_CHANNELS.MINIPROGRAM_BRIDGE);
	});

	test("returns bridge required error when mini program bridge is missing", () => {
		const result = resolveWechatPaymentChannel({
			clientContext: {
				environmentType: "miniprogram",
				miniProgramBridgeSupported: false,
			},
		});

		expect(result.ok).toBe(false);
		if (result.ok) {
			return;
		}
		expect(result.errorCode).toBe(
			WECHAT_PAYMENT_ERROR_CODES.MINI_PROGRAM_BRIDGE_REQUIRED,
		);
		expect(result.requiresUpgrade).toBe(true);
	});

	test("returns wechat jsapi channel in wechat browser", () => {
		const result = resolveWechatPaymentChannel({
			userAgent:
				"Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 MicroMessenger/8.0.0",
		});

		expect(result.ok).toBe(true);
		if (!result.ok) {
			return;
		}
		expect(result.channel).toBe(WECHAT_PAYMENT_CHANNELS.WECHAT_JSAPI);
	});

	test("returns wechat native channel in non-wechat browser", () => {
		const result = resolveWechatPaymentChannel({
			userAgent:
				"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/122.0.0.0 Safari/537.36",
		});

		expect(result.ok).toBe(true);
		if (!result.ok) {
			return;
		}
		expect(result.channel).toBe(WECHAT_PAYMENT_CHANNELS.WECHAT_NATIVE);
	});
});
