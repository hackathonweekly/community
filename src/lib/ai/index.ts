/**
 * AI Library - Unified AI/LLM Integration
 *
 * All AI providers use OpenAI-compatible API format.
 *
 * Environment variables:
 * - AI_API_KEY: Your API key (required)
 * - AI_MODEL: Model name (required)
 * - AI_BASE_URL: (Optional) Custom API base URL
 *
 * @example
 * // Use environment variables
 * import { generateText } from "@/lib/ai";
 * const { text } = await generateText("Hello, world!");
 *
 * @example
 * // Override with custom config
 * import { generateText } from "@/lib/ai";
 * const { text } = await generateText("Hello!", {}, {
 *   apiKey: "sk-...",
 *   baseURL: "https://api.deepseek.com/v1",
 *   model: "deepseek-chat"
 * });
 */

// Core functions
export { generateText, streamText, generateObject, embedText } from "./core";

// Client factory
export { createAIClient, getModelName } from "./client";

// Configuration
export { getAIConfig } from "./config";

// Types
export type {
	AIConfig,
	GenerateTextOptions,
	StreamTextOptions,
	GenerateObjectOptions,
	EmbedOptions,
} from "./types";

// Re-export Vercel AI SDK utilities
export * from "ai";
