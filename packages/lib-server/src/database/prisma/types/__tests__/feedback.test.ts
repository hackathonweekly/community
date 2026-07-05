import assert from "node:assert/strict";
import test from "node:test";

import {
	type FeedbackConfig,
	validateFeedbackAnswersForConfig,
} from "../feedback";

const config: FeedbackConfig = {
	questions: [
		{
			id: "q-required",
			type: "textarea",
			label: "活动最大的收获是什么？",
			required: true,
		},
		{
			id: "q-optional",
			type: "single_choice",
			label: "你更喜欢哪种形式？",
			required: false,
			options: ["分享", "工作坊"],
		},
		{
			id: "q-recommend",
			type: "yes_no",
			label: "是否愿意推荐？",
			required: true,
		},
	],
};

test("passes when no feedback config exists", () => {
	assert.deepEqual(validateFeedbackAnswersForConfig(null, undefined), {
		valid: true,
		errors: [],
	});
});

test("rejects omitted answers for required custom feedback questions", () => {
	const result = validateFeedbackAnswersForConfig(config, undefined);

	assert.equal(result.valid, false);
	assert.match(result.errors[0], /活动最大的收获是什么/);
});

test("rejects empty required string answers", () => {
	const result = validateFeedbackAnswersForConfig(config, {
		"q-required": "   ",
		"q-recommend": true,
	});

	assert.equal(result.valid, false);
	assert.match(result.errors[0], /活动最大的收获是什么/);
});

test("accepts valid answers and treats false as a present yes-no answer", () => {
	const result = validateFeedbackAnswersForConfig(config, {
		"q-required": "认识了新朋友",
		"q-optional": "分享",
		"q-recommend": false,
	});

	assert.deepEqual(result, {
		valid: true,
		errors: [],
	});
});

test("rejects unknown answer ids", () => {
	const result = validateFeedbackAnswersForConfig(config, {
		"q-required": "认识了新朋友",
		"q-recommend": true,
		"q-extra": "unexpected",
	});

	assert.equal(result.valid, false);
	assert.match(result.errors[0], /Unknown question ID/);
});

test("marks malformed feedback configs separately", () => {
	const result = validateFeedbackAnswersForConfig(
		{ questions: [{ id: "q1" }] },
		{},
	);

	assert.equal(result.valid, false);
	assert.equal(result.invalidConfig, true);
	assert.match(result.errors[0], /Invalid feedback configuration/);
});
