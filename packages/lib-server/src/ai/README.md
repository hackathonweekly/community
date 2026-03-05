# AI Library

统一的 AI/LLM 集成库，基于 OpenAI-compatible API 格式，支持国际和国内主流 AI 服务商。

## 快速开始

### 1. 环境变量配置

在 `apps/web/.env.local` 中配置：

```bash
# 必需
AI_API_KEY=sk-xxx         # API key
AI_MODEL=gpt-4o-mini      # 模型名称

# 可选（不设置则使用 OpenAI 的 API）
AI_BASE_URL=https://api.openai.com/v1  # 自定义 API 地址
```

### 2. 基础使用

```typescript
import { generateText, streamText, generateObject, embedText } from "@community/lib-server/ai";

// 文本生成
const { text } = await generateText("介绍一下 Next.js");

// 流式生成
const { textStream } = await streamText("写一个故事");
for await (const chunk of textStream) {
  process.stdout.write(chunk);
}

// 结构化输出
import { z } from "zod";
const schema = z.object({
  name: z.string(),
  tags: z.array(z.string()),
});
const { object } = await generateObject("生成项目信息", { schema });

// 嵌入向量（语义搜索）
const { embedding } = await embedText("Hello world");
const { embeddings } = await embedText(["text1", "text2", "text3"]);
```

### 3. 运行时配置覆盖

```typescript
// 临时切换 provider 或配置
const { text } = await generateText(
  "你好",
  { temperature: 0.7 },
  {
    apiKey: "sk-xxx",
    baseURL: "https://api.deepseek.com/v1",
    model: "deepseek-chat"
  }
);
```

## 支持的 AI 提供商

所有提供商都使用 OpenAI-compatible API 格式，只需配置对应的 `AI_BASE_URL` 和 `AI_MODEL` 即可。

### 国际服务商

| Provider | 默认模型 | Base URL | 官网 |
|----------|---------|----------|------|
| **OpenAI** | gpt-4o-mini | `https://api.openai.com/v1` | https://platform.openai.com |

**可用模型**: gpt-4o, gpt-4o-mini, gpt-3.5-turbo, 等

### 国内服务商

| Provider | 默认模型 | Base URL | 官网 |
|----------|---------|----------|------|
| **智谱AI (GLM)** | glm-4-flash | `https://open.bigmodel.cn/api/paas/v4` | https://open.bigmodel.cn |
| **通义千问 (Qwen)** | qwen-turbo | `https://dashscope.aliyuncs.com/compatible-mode/v1` | https://dashscope.aliyun.com |
| **DeepSeek** | deepseek-chat | `https://api.deepseek.com/v1` | https://platform.deepseek.com |
| **月之暗面 (Kimi)** | moonshot-v1-8k | `https://api.moonshot.cn/v1` | https://platform.moonshot.cn |
| **百度文心一言** | ernie-bot-turbo | `https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop` | https://cloud.baidu.com |
| **讯飞星火** | spark-lite | `https://spark-api.xf-yun.com/v1` | https://xinghuo.xfyun.cn |
| **MiniMax** | abab6-chat | `https://api.minimax.chat/v1` | https://www.minimaxi.com |
| **零一万物 (01.AI)** | yi-large | `https://api.lingyiwanwu.com/v1` | https://www.01.ai |
| **字节豆包 (Doubao)** | doubao-pro | `https://ark.cn-beijing.volces.com/api/v3` | https://www.volcengine.com |

### 配置示例

#### OpenAI (默认)

```bash
AI_API_KEY=sk-xxx
AI_MODEL=gpt-4o-mini
# AI_BASE_URL 可以不设置，默认使用 OpenAI
```

#### DeepSeek

```bash
AI_API_KEY=sk-xxx
AI_BASE_URL=https://api.deepseek.com/v1
AI_MODEL=deepseek-chat
```

#### 通义千问

```bash
AI_API_KEY=sk-xxx
AI_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
AI_MODEL=qwen-turbo
```

#### 智谱 GLM

```bash
AI_API_KEY=xxx
AI_BASE_URL=https://open.bigmodel.cn/api/paas/v4
AI_MODEL=glm-4-flash
```

## API 参考

### generateText

生成文本完成。

```typescript
await generateText(
  prompt: string,
  options?: {
    temperature?: number;
    maxTokens?: number;
    topP?: number;
    frequencyPenalty?: number;
    presencePenalty?: number;
    stopSequences?: string[];
  },
  config?: Partial<AIConfig>
)
```

### streamText

流式文本生成。

```typescript
await streamText(
  prompt: string,
  options?: GenerateTextOptions & {
    onChunk?: (chunk: string) => void;
  },
  config?: Partial<AIConfig>
)
```

### generateObject

使用 Zod schema 生成结构化对象。

```typescript
await generateObject(
  prompt: string,
  options: {
    schema: ZodSchema;
    // ...其他 GenerateTextOptions
  },
  config?: Partial<AIConfig>
)
```

### embedText

生成文本嵌入向量。

```typescript
await embedText(
  value: string | string[],
  options?: {
    dimensions?: number;
  },
  config?: Partial<AIConfig>
)
```

## 高级用法

### 自定义 API 地址

适用于使用代理或自建服务的场景：

```bash
# apps/web/.env.local
AI_API_KEY=sk-xxx
AI_MODEL=gpt-4o-mini
AI_BASE_URL=https://your-proxy.com/v1  # 自定义地址
```

### 多个 AI 配置

如果需要同时使用多个 AI 服务：

```typescript
import { createAIClient, getModelName } from "@community/lib-server/ai";
import { generateText as aiGenerateText } from "ai";

// 客户端 1: DeepSeek（便宜）
const deepseekClient = createAIClient({
  baseURL: "https://api.deepseek.com/v1",
  apiKey: "sk-xxx",
});
const deepseekModel = getModelName({ model: "deepseek-chat" });

// 客户端 2: GPT-4（高质量）
const gpt4Client = createAIClient({
  baseURL: "https://api.openai.com/v1",
  apiKey: "sk-xxx",
});
const gpt4Model = getModelName({ model: "gpt-4o" });

// 使用不同客户端
const cheapResult = await aiGenerateText({
  model: deepseekClient(deepseekModel),
  prompt: "简单任务"
});

const qualityResult = await aiGenerateText({
  model: gpt4Client(gpt4Model),
  prompt: "复杂任务"
});
```

## 常见使用场景

### 1. 内容审核

```typescript
const { text } = await generateText(
  `请判断以下内容是否违规：${userContent}`,
  { temperature: 0.1 }
);
```

### 2. 内容摘要

```typescript
const { text } = await generateText(
  `总结以下文章的核心要点：\n\n${article}`,
  { maxTokens: 500 }
);
```

### 3. 智能推荐

```typescript
const schema = z.object({
  recommendations: z.array(z.object({
    title: z.string(),
    reason: z.string(),
  }))
});

const { object } = await generateObject(
  `基于用户兴趣 ${userInterests} 推荐项目`,
  { schema }
);
```

### 4. 语义搜索

```typescript
// 生成查询向量
const { embedding: queryEmbedding } = await embedText(userQuery);

// 生成文档向量（批量）
const { embeddings: docEmbeddings } = await embedText(documents);

// 计算相似度并排序...
```

## 注意事项

1. **API Key 安全**: 永远不要在客户端代码中直接使用 API key，仅在服务端使用
2. **费用控制**: 注意设置 `maxTokens` 限制，避免产生过高费用
3. **速率限制**: 不同 provider 有不同的 API 调用限制，请查阅官方文档
4. **模型能力**: 不是所有模型都支持所有功能（如 function calling、vision 等）

## 依赖

本库基于 [Vercel AI SDK](https://sdk.vercel.ai/docs) 构建，自动支持流式响应、结构化输出等高级特性。
