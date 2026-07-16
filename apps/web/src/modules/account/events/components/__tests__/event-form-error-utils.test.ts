import assert from "node:assert/strict";
import test from "node:test";
import {
	getEventFormValidationMessages,
	getTicketTypeValidationMessages,
} from "../event-form-error-utils";

test("formats nested ticket errors with a visible ticket index and field", () => {
	assert.deepEqual(
		getTicketTypeValidationMessages({
			0: { name: { message: "票种名称必填" } },
			1: { quantity: { message: "数量必须大于0" } },
		}),
		["票种 1 · 票种名称：票种名称必填", "票种 2 · 票数量：数量必须大于0"],
	);
});

test("combines visible basic-field and nested ticket errors", () => {
	assert.deepEqual(
		getEventFormValidationMessages({
			title: { message: "Title is required", type: "too_small" },
			ticketTypes: {
				0: { name: { message: "票种名称必填", type: "too_small" } },
			},
		} as any),
		["活动标题：Title is required", "票种 1 · 票种名称：票种名称必填"],
	);
});
