import assert from "node:assert/strict";
import test from "node:test";
import { shouldReconcilePaymentProvider } from "../payment-status-utils";

test("reconciles a pending order after the provider-query interval", () => {
	assert.equal(
		shouldReconcilePaymentProvider({
			status: "PENDING",
			now: 10_000,
			lastQueryAt: 3_000,
			isQueryInFlight: false,
		}),
		true,
	);
});

test("does not query paid orders or overlap an in-flight provider query", () => {
	assert.equal(
		shouldReconcilePaymentProvider({
			status: "PAID",
			now: 10_000,
			lastQueryAt: 0,
			isQueryInFlight: false,
		}),
		false,
	);
	assert.equal(
		shouldReconcilePaymentProvider({
			status: "PENDING",
			now: 10_000,
			lastQueryAt: 0,
			isQueryInFlight: true,
		}),
		false,
	);
});
