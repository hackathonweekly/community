import assert from "node:assert/strict";
import test from "node:test";

import type { FeedbackQuestion } from "@community/lib-server/database/prisma/types/feedback";
import {
	cloneFeedbackQuestions,
	moveFeedbackQuestion,
} from "../feedback-config-utils";

const questions: FeedbackQuestion[] = [
	{ id: "first", type: "text", label: "第一个问题", required: false },
	{
		id: "second",
		type: "single_choice",
		label: "第二个问题",
		required: true,
		options: ["A", "B"],
	},
	{ id: "third", type: "rating", label: "第三个问题", required: false },
];

test("moveFeedbackQuestion reorders questions without mutating the source", () => {
	const reordered = moveFeedbackQuestion(questions, 1, 0);

	assert.deepEqual(
		reordered.map((question) => question.id),
		["second", "first", "third"],
	);
	assert.deepEqual(
		questions.map((question) => question.id),
		["first", "second", "third"],
	);
});

test("moveFeedbackQuestion ignores an out-of-range destination", () => {
	assert.equal(moveFeedbackQuestion(questions, 0, -1), questions);
	assert.equal(moveFeedbackQuestion(questions, 2, 3), questions);
});

test("cloneFeedbackQuestions isolates option edits from saved form state", () => {
	const cloned = cloneFeedbackQuestions(questions);
	cloned[1]?.options?.push("C");

	assert.deepEqual(questions[1]?.options, ["A", "B"]);
	assert.deepEqual(cloned[1]?.options, ["A", "B", "C"]);
});
