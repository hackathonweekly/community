import type { AIConfig } from "./types";

/**
 * Get AI configuration from environment variables
 *
 * Environment variables:
 * - AI_API_KEY: API key (required)
 * - AI_MODEL: Model name (required)
 * - AI_BASE_URL: (Optional) Custom API base URL, defaults to OpenAI's API
 */
export function getAIConfig(overrides?: Partial<AIConfig>): Required<AIConfig> {
	const apiKey = overrides?.apiKey ?? process.env.AI_API_KEY ?? "";
	const baseURL =
		overrides?.baseURL ??
		process.env.AI_BASE_URL ??
		"https://api.openai.com/v1";
	const model = overrides?.model ?? process.env.AI_MODEL ?? "gpt-4o-mini";

	return {
		apiKey,
		baseURL,
		model,
	};
}
