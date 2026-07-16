import type { FeedbackQuestion } from "@community/lib-server/database/prisma/types/feedback";

export const cloneFeedbackQuestions = (questions: FeedbackQuestion[]) =>
	questions.map((question) => ({
		...question,
		options: question.options ? [...question.options] : undefined,
	}));

export const moveFeedbackQuestion = (
	questions: FeedbackQuestion[],
	fromIndex: number,
	toIndex: number,
) => {
	if (
		fromIndex === toIndex ||
		fromIndex < 0 ||
		toIndex < 0 ||
		fromIndex >= questions.length ||
		toIndex >= questions.length
	) {
		return questions;
	}

	const nextQuestions = [...questions];
	const [question] = nextQuestions.splice(fromIndex, 1);
	if (!question) return questions;
	nextQuestions.splice(toIndex, 0, question);
	return nextQuestions;
};
