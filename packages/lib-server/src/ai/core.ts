import {
	generateText as aiGenerateText,
	streamText as aiStreamText,
	generateObject as aiGenerateObject,
	embed as aiEmbed,
	embedMany as aiEmbedMany,
} from "ai";
import type {
	AIConfig,
	EmbedOptions,
	GenerateObjectOptions,
	GenerateTextOptions,
	StreamTextOptions,
} from "./types";
import { createAIClient, getModelName } from "./client";

/**
 * Generate text completion
 *
 * @example
 * const { text } = await generateText({
 *   prompt: "What is the meaning of life?",
 *   temperature: 0.7,
 * });
 */
export async function generateText(
	prompt: string,
	options?: GenerateTextOptions,
	config?: Partial<AIConfig>,
) {
	const client = createAIClient(config);
	const model = getModelName(config);

	return aiGenerateText({
		model: client.chat(model),
		prompt,
		temperature: options?.temperature,
		maxOutputTokens: options?.maxOutputTokens,
		topP: options?.topP,
		frequencyPenalty: options?.frequencyPenalty,
		presencePenalty: options?.presencePenalty,
		stopSequences: options?.stopSequences,
	});
}

/**
 * Stream text completion
 *
 * @example
 * const { textStream } = await streamText({
 *   prompt: "Write a story about a robot",
 *   temperature: 0.9,
 * });
 *
 * for await (const chunk of textStream) {
 *   process.stdout.write(chunk);
 * }
 */
export async function streamText(
	prompt: string,
	options?: StreamTextOptions,
	config?: Partial<AIConfig>,
) {
	const client = createAIClient(config);
	const model = getModelName(config);

	return aiStreamText({
		model: client.chat(model),
		prompt,
		temperature: options?.temperature,
		maxOutputTokens: options?.maxOutputTokens,
		topP: options?.topP,
		frequencyPenalty: options?.frequencyPenalty,
		presencePenalty: options?.presencePenalty,
		stopSequences: options?.stopSequences,
		onFinish: options?.onFinish
			? async (event) => {
					// Adapt the AI SDK callback to our simpler signature
					await options.onFinish?.(event.text);
				}
			: undefined,
	});
}

/**
 * Generate structured object with Zod schema
 *
 * @example
 * import { z } from "zod";
 *
 * const schema = z.object({
 *   name: z.string(),
 *   age: z.number(),
 * });
 *
 * const { object } = await generateObject({
 *   prompt: "Generate a user profile",
 *   schema,
 * });
 */
export async function generateObject<T>(
	prompt: string,
	options: GenerateObjectOptions<T>,
	config?: Partial<AIConfig>,
) {
	const client = createAIClient(config);
	const model = getModelName(config);

	return aiGenerateObject({
		model: client.chat(model),
		prompt,
		schema: options.schema as any, // Type cast for compatibility with AI SDK v4
		temperature: options.temperature,
		maxOutputTokens: options.maxOutputTokens,
		topP: options.topP,
		frequencyPenalty: options.frequencyPenalty,
		presencePenalty: options.presencePenalty,
	});
}

/**
 * Generate embeddings for semantic search
 *
 * @example
 * const { embedding } = await embed({
 *   value: "Hello, world!",
 * });
 *
 * // For multiple texts
 * const { embeddings } = await embed({
 *   value: ["text1", "text2", "text3"],
 * });
 */
export async function embedText(
	value: string,
	options?: EmbedOptions,
	config?: Partial<AIConfig>,
): ReturnType<typeof aiEmbed>;
export async function embedText(
	value: string[],
	options?: EmbedOptions,
	config?: Partial<AIConfig>,
): ReturnType<typeof aiEmbedMany>;
export async function embedText(
	value: string | string[],
	options?: EmbedOptions,
	config?: Partial<AIConfig>,
) {
	const client = createAIClient(config);
	const model = getModelName(config);

	if (Array.isArray(value)) {
		return aiEmbedMany({
			model: client.textEmbeddingModel(model),
			values: value,
		});
	}

	return aiEmbed({
		model: client.textEmbeddingModel(model),
		value,
	});
}
