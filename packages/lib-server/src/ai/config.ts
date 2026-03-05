import type { AIConfig } from "./types";

/**
 * Get AI configuration from environment variables
 *
 * Priority: AI_* > OPENAI_* > ARK_*
 * No hardcoded defaults — missing model/baseURL will cause a runtime error.
 */
export function getAIConfig(overrides?: Partial<AIConfig>): Required<AIConfig> {
	const apiKey =
		overrides?.apiKey ??
		process.env.AI_API_KEY ??
		process.env.OPENAI_API_KEY ??
		process.env.ARK_API_KEY ??
		"";

	const rawBaseURL =
		overrides?.baseURL ??
		process.env.AI_BASE_URL ??
		process.env.OPENAI_BASE_URL ??
		process.env.ARK_BASE_URL ??
		"";

	let baseURL = "";
	if (rawBaseURL && rawBaseURL.trim().length > 0) {
		const normalizedBaseURL = rawBaseURL.trim().replace(/\/+$/, "");
		baseURL = /\/v\d+($|\/)/.test(normalizedBaseURL)
			? normalizedBaseURL
			: `${normalizedBaseURL}/v1`;
	}

	const model =
		overrides?.model ??
		process.env.AI_MODEL ??
		process.env.OPENAI_MODEL ??
		process.env.ARK_MODEL ??
		"";

	return {
		apiKey,
		baseURL,
		model,
	};
}
