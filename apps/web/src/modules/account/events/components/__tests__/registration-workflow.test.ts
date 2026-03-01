import assert from "node:assert/strict";
import test from "node:test";
import {
	canShowDirectCancellation,
	canShowRefundAndCancelAction,
	isRefundPending,
} from "../registration-workflow";

test("blocks direct cancellation for paid and refund-pending orders", () => {
	assert.equal(canShowDirectCancellation("PAID"), false);
	assert.equal(canShowDirectCancellation("REFUND_PENDING"), false);
	assert.equal(canShowDirectCancellation("PENDING"), true);
	assert.equal(canShowDirectCancellation(undefined), true);
});

test("shows refund action only for paid orders", () => {
	assert.equal(canShowRefundAndCancelAction("PAID"), true);
	assert.equal(canShowRefundAndCancelAction("REFUND_PENDING"), false);
	assert.equal(canShowRefundAndCancelAction("REFUNDED"), false);
});

test("exposes refund-pending status hint state", () => {
	assert.equal(isRefundPending("REFUND_PENDING"), true);
	assert.equal(isRefundPending("PAID"), false);
});
