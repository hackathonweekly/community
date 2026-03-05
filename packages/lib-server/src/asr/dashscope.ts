import type {
	OpenAICompatibleAsrClient,
	OpenAICompatibleAsrClientOptions,
	OpenAICompatibleAsrResponse,
	OpenAICompatibleAsrTranscribeOptions,
} from "./types";

const DEFAULT_OPENAI_COMPATIBLE_BASE_URL =
	"https://dashscope.aliyuncs.com/compatible-mode/v1";
const LEGACY_DASHSCOPE_HTTP_PATH =
	"/api/v1/services/aigc/multimodal-generation/generation";
const LEGACY_DASHSCOPE_AUDIO_PATH = "/api/v1/services/audio/asr/transcription";
const DEFAULT_ASR_MODEL = "qwen3-asr-flash";
const DEFAULT_TIMEOUT_MS = 60_000;

function parseBoolean(value: string | undefined): boolean | undefined {
	if (value == null) {
		return undefined;
	}

	const normalized = value.trim().toLowerCase();
	if (["1", "true", "yes", "on"].includes(normalized)) {
		return true;
	}
	if (["0", "false", "no", "off"].includes(normalized)) {
		return false;
	}
	return undefined;
}

function normalizeBaseURL(baseURL?: string): string {
	if (!baseURL || baseURL.trim().length === 0) {
		return DEFAULT_OPENAI_COMPATIBLE_BASE_URL;
	}

	const trimmed = baseURL.trim().replace(/\/+$/, "");
	if (trimmed.endsWith("/chat/completions")) {
		return trimmed.slice(0, -"/chat/completions".length);
	}

	if (
		trimmed.endsWith(LEGACY_DASHSCOPE_HTTP_PATH) ||
		trimmed.endsWith(LEGACY_DASHSCOPE_AUDIO_PATH)
	) {
		const legacyPath = trimmed.endsWith(LEGACY_DASHSCOPE_HTTP_PATH)
			? LEGACY_DASHSCOPE_HTTP_PATH
			: LEGACY_DASHSCOPE_AUDIO_PATH;
		return `${trimmed.slice(0, -legacyPath.length)}/compatible-mode/v1`;
	}

	return trimmed.includes("/v1") ? trimmed : `${trimmed}/v1`;
}

export function extractTranscriptFromOpenAICompatibleResponse(
	payload: unknown,
): string | null {
	if (!payload || typeof payload !== "object") {
		return null;
	}

	const data = payload as Record<string, unknown>;

	if (typeof data.text === "string" && data.text.trim().length > 0) {
		return data.text.trim();
	}

	const output = data.output as Record<string, unknown> | undefined;
	if (
		output &&
		typeof output.text === "string" &&
		output.text.trim().length > 0
	) {
		return output.text.trim();
	}

	const directMessage = data.message as Record<string, unknown> | undefined;
	if (directMessage && typeof directMessage.content === "string") {
		const directContent = directMessage.content.trim();
		if (directContent.length > 0) {
			return directContent;
		}
	}

	const choices =
		(Array.isArray(data.choices) ? data.choices : output?.choices) ?? [];
	if (!Array.isArray(choices) || choices.length === 0) {
		return null;
	}

	const firstChoice = choices[0] as Record<string, unknown>;
	const message = firstChoice.message as Record<string, unknown> | undefined;
	if (!message) {
		return null;
	}

	const content = message.content;
	if (typeof content === "string" && content.trim().length > 0) {
		return content.trim();
	}

	const audio = message.audio as Record<string, unknown> | undefined;
	if (audio && typeof audio.transcript === "string") {
		const audioTranscript = audio.transcript.trim();
		if (audioTranscript.length > 0) {
			return audioTranscript;
		}
	}

	if (Array.isArray(content)) {
		const texts: string[] = [];
		for (const item of content) {
			if (typeof item === "string" && item.trim().length > 0) {
				texts.push(item.trim());
				continue;
			}

			if (!item || typeof item !== "object") {
				continue;
			}

			const typedItem = item as Record<string, unknown>;
			const text =
				typeof typedItem.text === "string"
					? typedItem.text
					: typeof typedItem.content === "string"
						? typedItem.content
						: null;

			if (text && text.trim().length > 0) {
				texts.push(text.trim());
			}
		}

		if (texts.length > 0) {
			return texts.join("\n");
		}
	}

	return null;
}

export function extractTranscriptFromDashScopeResponse(payload: unknown) {
	return extractTranscriptFromOpenAICompatibleResponse(payload);
}

export function createOpenAICompatibleAsrClient(
	options: OpenAICompatibleAsrClientOptions = {},
): OpenAICompatibleAsrClient {
	const baseURL = normalizeBaseURL(
		options.baseURL ??
			options.endpoint ??
			process.env.OPENAI_ASR_BASE_URL ??
			process.env.OPENAI_BASE_URL ??
			process.env.AI_BASE_URL ??
			process.env.DASHSCOPE_ASR_HTTP_URL,
	);
	const model =
		options.model ??
		process.env.OPENAI_ASR_MODEL ??
		process.env.DASHSCOPE_ASR_MODEL ??
		DEFAULT_ASR_MODEL;
	const language = options.language ?? process.env.OPENAI_ASR_LANGUAGE;
	const enableItn =
		options.enableItn ??
		parseBoolean(process.env.OPENAI_ASR_ENABLE_ITN) ??
		parseBoolean(process.env.DASHSCOPE_ASR_ENABLE_ITN) ??
		false;
	const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;

	return {
		async transcribeAudioUrl(
			audioUrl: string,
			transcribeOptions: OpenAICompatibleAsrTranscribeOptions = {},
		): Promise<OpenAICompatibleAsrResponse> {
			const apiKey =
				options.apiKey ??
				process.env.OPENAI_ASR_API_KEY ??
				process.env.OPENAI_API_KEY ??
				process.env.AI_API_KEY ??
				process.env.DASHSCOPE_API_KEY;
			if (!apiKey) {
				throw new Error(
					"缺少 OPENAI_API_KEY / OPENAI_ASR_API_KEY（或 DASHSCOPE_API_KEY）配置",
				);
			}

			const requestModel = transcribeOptions.model ?? model;
			const requestEnableItn = transcribeOptions.enableItn ?? enableItn;
			const requestLanguage = transcribeOptions.language ?? language;

			const abortController = new AbortController();
			const timeoutHandle = setTimeout(() => {
				abortController.abort();
			}, timeoutMs);

			try {
				const response = await fetch(`${baseURL}/chat/completions`, {
					method: "POST",
					headers: {
						Authorization: `Bearer ${apiKey}`,
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						model: requestModel,
						messages: [
							{
								role: "user",
								content: [
									{
										type: "input_audio",
										input_audio: {
											data: audioUrl,
										},
									},
								],
							},
						],
						stream: false,
						extra_body: {
							asr_options: {
								enable_itn: requestEnableItn,
								...(requestLanguage
									? { language: requestLanguage }
									: {}),
							},
						},
					}),
					signal: abortController.signal,
				});

				const responseText = await response.text();
				let parsed: unknown = null;

				try {
					parsed = responseText ? JSON.parse(responseText) : null;
				} catch {
					parsed = null;
				}

				if (!response.ok) {
					throw new Error(
						`语音识别请求失败(${response.status}): ${
							parsed ? JSON.stringify(parsed) : responseText
						}`,
					);
				}

				const transcript =
					extractTranscriptFromOpenAICompatibleResponse(parsed);
				if (!transcript) {
					throw new Error(
						`语音识别结果为空: ${
							parsed ? JSON.stringify(parsed) : responseText
						}`,
					);
				}

				return {
					transcript,
					raw: parsed,
				};
			} finally {
				clearTimeout(timeoutHandle);
			}
		},
	};
}

export function createDashScopeAsrClient(
	options: OpenAICompatibleAsrClientOptions = {},
): OpenAICompatibleAsrClient {
	return createOpenAICompatibleAsrClient(options);
}
