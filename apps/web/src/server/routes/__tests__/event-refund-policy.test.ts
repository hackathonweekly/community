import assert from "node:assert/strict";
import test from "node:test";
import {
	ORGANIZER_FULL_REFUND_ONLY_MESSAGE,
	requiresRefundBeforeOrganizerCancellation,
	resolveOrganizerRefundAmount,
} from "../events/refund-policy";

test("requires refund workflow for paid registration cancellations", () => {
	assert.equal(requiresRefundBeforeOrganizerCancellation("PAID"), true);
	assert.equal(
		requiresRefundBeforeOrganizerCancellation("REFUND_PENDING"),
		true,
	);
	assert.equal(requiresRefundBeforeOrganizerCancellation("REFUNDED"), false);
});

test("organizer refunds are full-amount only", () => {
	const invalidAmount = resolveOrganizerRefundAmount({
		orderStatus: "PAID",
		orderTotalAmount: 299,
		requestedAmount: 199,
	});

	assert.equal(invalidAmount.ok, false);
	if (!invalidAmount.ok) {
		assert.equal(invalidAmount.error, ORGANIZER_FULL_REFUND_ONLY_MESSAGE);
	}

	const fullAmount = resolveOrganizerRefundAmount({
		orderStatus: "PAID",
		orderTotalAmount: 299,
		requestedAmount: 299,
	});
	assert.equal(fullAmount.ok, true);
	if (fullAmount.ok) {
		assert.equal(fullAmount.refundAmount, 299);
	}
});

test("refund initiation guard rejects non-paid orders", () => {
	const nonPaid = resolveOrganizerRefundAmount({
		orderStatus: "REFUND_PENDING",
		orderTotalAmount: 299,
	});
	assert.equal(nonPaid.ok, false);
});
