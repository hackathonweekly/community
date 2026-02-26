# OpenAI-Compatible ASR Module

This module provides a reusable OpenAI-compatible ASR client for server-side audio transcription.

## Location

- `packages/lib-server/src/asr`

## Exports

- `createOpenAICompatibleAsrClient`
- `extractTranscriptFromOpenAICompatibleResponse`
- Backward-compatible exports: `createDashScopeAsrClient`, `extractTranscriptFromDashScopeResponse`
- Type exports from `types.ts`

## Environment Variables

- `OPENAI_API_KEY` (or `OPENAI_ASR_API_KEY`, required)
- `OPENAI_BASE_URL` (or `OPENAI_ASR_BASE_URL`, optional, default: Beijing endpoint)
- `OPENAI_ASR_MODEL` (optional, default: `qwen3-asr-flash`)
- `OPENAI_ASR_ENABLE_ITN` (optional, default: `false`)

Region endpoints examples:

- Beijing: `https://dashscope.aliyuncs.com/compatible-mode/v1`
- Singapore: `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`
- US: `https://dashscope-us.aliyuncs.com/compatible-mode/v1`

## Usage

```ts
import { createOpenAICompatibleAsrClient } from "@community/lib-server/asr";

const asrClient = createOpenAICompatibleAsrClient({
	apiKey: process.env.OPENAI_API_KEY,
	baseURL: process.env.OPENAI_BASE_URL,
	model: "qwen3-asr-flash",
	enableItn: false,
});

const { transcript } = await asrClient.transcribeAudioUrl(audioUrl, {
	systemPrompt: "请准确转写用户音频内容。",
});
```

## Recommended Integration Pattern

1. Upload user audio to object storage (COS/S3).
2. Get a public (or signed) URL for the audio object.
3. Pass the URL to `transcribeAudioUrl`.
4. Continue downstream NLP parsing in business code.

This keeps provider-specific API details inside `packages/lib-server/src/asr` and lets apps focus on business flow.
