/**
 * AI Configuration from Environment Variables
 *
 * All providers use OpenAI-compatible API format.
 *
 * Required env vars:
 * - AI_API_KEY: Your API key
 * - AI_MODEL: Model name (e.g., gpt-4o-mini, deepseek-chat, qwen-turbo, glm-4-flash)
 *
 * Optional env vars:
 * - AI_BASE_URL: Custom API base URL (默认使用火山引擎 Ark: https://ark.cn-beijing.volces.com/api/v3)
 *
 * Supported providers:
 *
 * International:
 * - OpenAI: gpt-4o, gpt-4o-mini, gpt-3.5-turbo, etc.
 *   Base URL: https://api.openai.com/v1
 *
 * Chinese (国内):
 * - 智谱AI (GLM): glm-4, glm-4-flash, glm-4-air, etc.
 *   Base URL: https://open.bigmodel.cn/api/paas/v4
 *
 * - 通义千问 (Qwen): qwen-turbo, qwen-plus, qwen-max, etc.
 *   Base URL: https://dashscope.aliyuncs.com/compatible-mode/v1
 *
 * - DeepSeek: deepseek-chat, deepseek-coder, etc.
 *   Base URL: https://api.deepseek.com/v1
 *
 * - 月之暗面 (Kimi/Moonshot): moonshot-v1-8k, moonshot-v1-32k, etc.
 *   Base URL: https://api.moonshot.cn/v1
 *
 * - 百度文心一言: ernie-bot-turbo, ernie-bot-4, etc.
 *   Base URL: https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop
 *
 * - 讯飞星火: spark-lite, spark-pro, etc.
 *   Base URL: https://spark-api.xf-yun.com/v1
 *
 * - MiniMax: abab6-chat, abab5.5-chat, etc.
 *   Base URL: https://api.minimax.chat/v1
 *
 * - 零一万物 (01.AI): yi-large, yi-medium, etc.
 *   Base URL: https://api.lingyiwanwu.com/v1
 *
 * - 字节豆包 (Doubao): doubao-pro, doubao-lite, etc.
 *   Base URL: https://ark.cn-beijing.volces.com/api/v3
 */

/**
 * AI Client Configuration
 */
export interface AIConfig {
	apiKey?: string; // Override env AI_API_KEY
	baseURL?: string; // Override env AI_BASE_URL (defaults to Ark)
	model?: string; // Override env AI_MODEL
}

/**
 * Text Generation Options
 */
export interface GenerateTextOptions {
	temperature?: number;
	maxOutputTokens?: number;
	topP?: number;
	frequencyPenalty?: number;
	presencePenalty?: number;
	stopSequences?: string[];
}

/**
 * Stream Text Options
 */
export interface StreamTextOptions extends GenerateTextOptions {
	onChunk?: (chunk: string) => void;
	onFinish?: (text: string) => void | Promise<void>;
}

/**
 * Generate Object Options with Zod schema
 */
export interface GenerateObjectOptions<T> extends GenerateTextOptions {
	schema: T;
}

/**
 * Embedding Options
 */
export interface EmbedOptions {
	dimensions?: number;
}
