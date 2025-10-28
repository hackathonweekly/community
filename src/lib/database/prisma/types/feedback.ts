/**
 * Feedback Configuration Types
 *
 * These types define the structure for custom feedback questions
 * that can be configured for each event.
 */

export type QuestionType =
	| "text" // Single line text input
	| "textarea" // Multi-line text input
	| "rating" // 1-5 star rating
	| "single_choice" // Single option select (radio buttons)
	| "multiple_choice" // Multiple option select (checkboxes)
	| "yes_no"; // Boolean yes/no question

export interface FeedbackQuestion {
	id: string; // Unique identifier for the question
	type: QuestionType; // Question type
	label: string; // Question text
	placeholder?: string; // Input placeholder text (optional)
	required: boolean; // Whether this question is required
	options?: string[]; // Options for choice-type questions
	maxLength?: number; // Max length for text inputs
}

export interface FeedbackConfig {
	questions: FeedbackQuestion[];
}

/**
 * Custom Answers Types
 *
 * Structure for storing user answers to custom feedback questions
 */

export type Answer = string | number | boolean | string[];

export type CustomAnswers = Record<string, Answer>;

/**
 * Helper function to validate feedback config
 */
export function isValidFeedbackConfig(
	config: unknown,
): config is FeedbackConfig {
	if (!config || typeof config !== "object") return false;
	const cfg = config as Record<string, unknown>;

	if (!Array.isArray(cfg.questions)) return false;

	return cfg.questions.every((q) => {
		if (!q || typeof q !== "object") return false;
		const question = q as Record<string, unknown>;

		return (
			typeof question.id === "string" &&
			typeof question.label === "string" &&
			typeof question.required === "boolean" &&
			[
				"text",
				"textarea",
				"rating",
				"single_choice",
				"multiple_choice",
				"yes_no",
			].includes(question.type as string)
		);
	});
}

/**
 * Helper function to validate custom answers
 */
export function isValidCustomAnswers(
	answers: unknown,
): answers is CustomAnswers {
	if (!answers || typeof answers !== "object") return false;

	const ans = answers as Record<string, unknown>;

	return Object.values(ans).every((value) => {
		return (
			typeof value === "string" ||
			typeof value === "number" ||
			typeof value === "boolean" ||
			(Array.isArray(value) && value.every((v) => typeof v === "string"))
		);
	});
}

/**
 * Helper function to validate answers against config
 */
export function validateAnswersAgainstConfig(
	answers: CustomAnswers,
	config: FeedbackConfig,
): { valid: boolean; errors: string[] } {
	const errors: string[] = [];

	// Check required questions
	for (const question of config.questions) {
		if (question.required && !(question.id in answers)) {
			errors.push(
				`Required question "${question.label}" is not answered`,
			);
		}
	}

	// Validate answer types
	for (const [questionId, answer] of Object.entries(answers)) {
		const question = config.questions.find((q) => q.id === questionId);
		if (!question) {
			errors.push(`Unknown question ID: ${questionId}`);
			continue;
		}

		switch (question.type) {
			case "text":
			case "textarea":
				if (typeof answer !== "string") {
					errors.push(
						`Answer for "${question.label}" must be a string`,
					);
				} else if (
					question.maxLength &&
					answer.length > question.maxLength
				) {
					errors.push(
						`Answer for "${question.label}" exceeds maximum length of ${question.maxLength}`,
					);
				}
				break;

			case "rating":
				if (typeof answer !== "number" || answer < 1 || answer > 5) {
					errors.push(
						`Answer for "${question.label}" must be a number between 1 and 5`,
					);
				}
				break;

			case "yes_no":
				if (typeof answer !== "boolean") {
					errors.push(
						`Answer for "${question.label}" must be a boolean`,
					);
				}
				break;

			case "single_choice":
				if (typeof answer !== "string") {
					errors.push(
						`Answer for "${question.label}" must be a string`,
					);
				} else if (
					question.options &&
					!question.options.includes(answer)
				) {
					errors.push(
						`Answer for "${question.label}" must be one of: ${question.options.join(", ")}`,
					);
				}
				break;

			case "multiple_choice":
				if (!Array.isArray(answer)) {
					errors.push(
						`Answer for "${question.label}" must be an array`,
					);
				} else if (
					question.options &&
					!answer.every((a) =>
						typeof a === "string"
							? question.options?.includes(a)
							: false,
					)
				) {
					errors.push(
						`All answers for "${question.label}" must be from: ${question.options.join(", ")}`,
					);
				}
				break;
		}
	}

	return {
		valid: errors.length === 0,
		errors,
	};
}
