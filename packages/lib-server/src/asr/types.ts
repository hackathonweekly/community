export interface OpenAICompatibleAsrClientOptions {
	apiKey?: string;
	baseURL?: string;
	/**
	 * @deprecated Use `baseURL` instead. Kept only for backward compatibility.
	 */
	endpoint?: string;
	model?: string;
	language?: string;
	enableItn?: boolean;
	timeoutMs?: number;
}

export interface OpenAICompatibleAsrTranscribeOptions {
	systemPrompt?: string;
	enableItn?: boolean;
	model?: string;
	language?: string;
}

export interface OpenAICompatibleAsrResponse {
	transcript: string;
	raw: unknown;
}

export interface OpenAICompatibleAsrClient {
	transcribeAudioUrl(
		audioUrl: string,
		options?: OpenAICompatibleAsrTranscribeOptions,
	): Promise<OpenAICompatibleAsrResponse>;
}

// Legacy type aliases for existing imports.
export type DashScopeAsrClientOptions = OpenAICompatibleAsrClientOptions;
export type DashScopeAsrTranscribeOptions =
	OpenAICompatibleAsrTranscribeOptions;
export type DashScopeAsrResponse = OpenAICompatibleAsrResponse;
export type DashScopeAsrClient = OpenAICompatibleAsrClient;
