import { createOpenAI } from "@ai-sdk/openai";
import type { AIConfig } from "./types";
import { getAIConfig } from "./config";

/**
 * Create OpenAI-compatible AI client
 *
 * All major AI providers support OpenAI-compatible API format.
 *
 * @example
 * // Use environment variables (AI_API_KEY, AI_MODEL, AI_BASE_URL)
 * const client = createAIClient();
 *
 * @example
 * // Override with DeepSeek
 * const client = createAIClient({
 *   apiKey: "sk-...",
 *   baseURL: "https://api.deepseek.com/v1",
 *   model: "deepseek-chat"
 * });
 *
 * @example
 * // Override with 通义千问
 * const client = createAIClient({
 *   apiKey: "sk-...",
 *   baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1",
 *   model: "qwen-turbo"
 * });
 */
export function createAIClient(config?: Partial<AIConfig>) {
	const { apiKey, baseURL } = getAIConfig(config);

	return createOpenAI({
		apiKey,
		baseURL,
	});
}

/**
 * Get the model name for the current configuration
 */
export function getModelName(config?: Partial<AIConfig>): string {
	return getAIConfig(config).model;
}
