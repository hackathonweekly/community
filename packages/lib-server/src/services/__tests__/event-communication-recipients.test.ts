import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
	COMMUNICATION_RECIPIENT_SCOPE,
	resolveScopedRecipients,
} from "../event-communication-recipients";

const recipientCandidates = [
	{
		userId: "u_approved_1",
		status: "APPROVED",
		checkedIn: false,
		email: "approved1@example.com",
	},
	{
		userId: "u_approved_2",
		status: "APPROVED",
		checkedIn: true,
		email: "approved2@example.com",
	},
	{
		userId: "u_pending_1",
		status: "PENDING",
		checkedIn: false,
		email: "pending1@example.com",
	},
] as const;

describe("event communication recipient scope", () => {
	it("filters approved participants only", () => {
		const result = resolveScopedRecipients({
			recipients: recipientCandidates,
			scope: COMMUNICATION_RECIPIENT_SCOPE.APPROVED_ONLY,
		});

		assert.deepEqual(
			result.recipients.map((item) => item.userId),
			["u_approved_1", "u_approved_2"],
		);
		assert.equal(result.scopeExcludedCount, 1);
	});

	it("filters unchecked-in approved participants", () => {
		const result = resolveScopedRecipients({
			recipients: recipientCandidates,
			scope: COMMUNICATION_RECIPIENT_SCOPE.UNCHECKED_IN_ONLY,
		});

		assert.deepEqual(
			result.recipients.map((item) => item.userId),
			["u_approved_1"],
		);
		assert.equal(result.scopeExcludedCount, 2);
	});

	it("supports selected participants and reports unmatched ids", () => {
		const result = resolveScopedRecipients({
			recipients: recipientCandidates,
			scope: COMMUNICATION_RECIPIENT_SCOPE.SELECTED,
			selectedRecipientIds: ["u_pending_1", "u_missing"],
		});

		assert.deepEqual(
			result.recipients.map((item) => item.userId),
			["u_pending_1"],
		);
		assert.equal(result.unmatchedSelectedCount, 1);
	});

	it("throws when selected scope is empty", () => {
		assert.throws(() =>
			resolveScopedRecipients({
				recipients: recipientCandidates,
				scope: COMMUNICATION_RECIPIENT_SCOPE.SELECTED,
				selectedRecipientIds: [],
			}),
		);
	});
});
