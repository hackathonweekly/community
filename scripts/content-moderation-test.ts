#!/usr/bin/env tsx

import {
  ContentType,
  createContentValidator,
  moderateContent,
} from "../packages/lib-server/src/content-moderation/index";
import {
  createTencentTextModerationClientFromEnv,
  createTencentImageModerationClientFromEnv,
} from "../packages/lib-server/src/tencent-cloud/index";
import { resolve, dirname, isAbsolute } from "node:path";
import { fileURLToPath } from "node:url";
import { stat } from "node:fs/promises";

interface CliOptions {
  runValidation: boolean;
  runText: boolean;
  runImage: boolean;
  runErrorSimulation: boolean;
  customText?: string;
  customImagePath?: string;
}

const DEFAULT_TEXT_CASES = [
  "这是一段正常的测试文本",
  "Hello, this is a normal test text",
  "请输入需要测试的文本内容",
];

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = resolve(__dirname, "..");
const DEFAULT_IMAGE_PATH = resolve(PROJECT_ROOT, "public/images/icon.png");

const validateUserContent = createContentValidator({
  name: { type: ContentType.USER_NAME, skipIfEmpty: false },
  bio: { type: ContentType.USER_BIO },
  username: { type: ContentType.USER_USERNAME, skipIfEmpty: false },
});

const validateEventContent = createContentValidator({
  title: { type: ContentType.EVENT_TITLE, skipIfEmpty: false },
  shortDescription: { type: ContentType.EVENT_SHORT_DESCRIPTION },
  richContent: { type: ContentType.EVENT_RICH_CONTENT },
});

const validateProjectContent = createContentValidator({
  title: { type: ContentType.PROJECT_TITLE, skipIfEmpty: false },
  description: { type: ContentType.PROJECT_DESCRIPTION },
});

type ValidationFn<T> = (data: T) => Promise<{
  isValid: boolean;
  errors?: unknown;
}>;

type ModerationResult = Awaited<ReturnType<typeof moderateContent>>;

type Optional<T> = T | undefined;

function parseCliArgs(): CliOptions {
  const args = process.argv.slice(2);
  const requested = new Set<string>();
  let customText: Optional<string>;
  let customImagePath: Optional<string>;

  for (const rawArg of args) {
    const arg = rawArg.trim();
    if (arg === "--text" || arg === "-t") {
      requested.add("text");
    } else if (arg.startsWith("--text=")) {
      requested.add("text");
      customText = arg.slice("--text=".length);
    } else if (arg === "--image" || arg === "-i") {
      requested.add("image");
    } else if (arg.startsWith("--image-path=")) {
      requested.add("image");
      customImagePath = arg.slice("--image-path=".length);
    } else if (arg === "--validation" || arg === "-v") {
      requested.add("validation");
    } else if (arg === "--error" || arg === "-e") {
      requested.add("error");
    } else if (arg === "--all") {
      requested.clear();
      break;
    } else if (!arg.startsWith("--")) {
      // treat bare argument as custom text for quick testing
      requested.add("text");
      customText = arg;
    }
  }

  const runValidation = requested.size === 0 || requested.has("validation");
  const runText = requested.size === 0 || requested.has("text");
  const runImage = requested.size === 0 || requested.has("image");
  const runErrorSimulation = requested.has("error");

  return {
    runValidation,
    runText,
    runImage,
    runErrorSimulation,
    customText,
    customImagePath,
  };
}

function logHeading(title: string) {
  console.log(`\n${title}`);
  console.log("-".repeat(title.length + 1));
}

async function runValidationGroup<T extends Record<string, unknown>>(
  title: string,
  cases: Array<{ name: string; data: T }>,
  runner: ValidationFn<T>,
) {
  logHeading(title);

  for (const testCase of cases) {
    console.log(`\n▶ ${testCase.name}`);
    try {
      const result = await runner(testCase.data);
      console.log(`  结果: ${result.isValid ? "✅ 通过" : "❌ 未通过"}`);
      if (!result.isValid && result.errors) {
        console.log("  错误详情:", result.errors);
      }
    } catch (error) {
      console.error("  ❌ 执行异常:", error);
    }
  }
}

async function runIndividualModerationTests() {
  logHeading("单字段审核测试");

  const testCases = [
    {
      name: "正常文本",
      content: "这是一个正常的测试文本",
      type: ContentType.USER_NAME,
    },
    {
      name: "空文本",
      content: "",
      type: ContentType.USER_BIO,
    },
    {
      name: "长文本",
      content: "这是一个很长的文本".repeat(200),
      type: ContentType.EVENT_TITLE,
    },
  ];

  for (const testCase of testCases) {
    console.log(`\n▶ ${testCase.name} (${testCase.type})`);
    try {
      const result: ModerationResult = await moderateContent(
        testCase.content,
        testCase.type,
      );
      console.log(`  审核结果: ${result.isApproved ? "✅ 通过" : "❌ 未通过"}`);
      console.log(`  建议: ${result.suggestion}`);
      if (result.reason) {
        console.log(`  原因: ${result.reason}`);
      }
    } catch (error) {
      console.error("  ❌ 审核异常:", error);
    }
  }
}

async function runTextModerationClientTests(customText?: string) {
  logHeading("腾讯云文本审核 API 测试");

  const client = createTencentTextModerationClientFromEnv();
  console.log("✅ 客户端初始化成功\n");

  const texts = customText ? [customText] : DEFAULT_TEXT_CASES;

  for (let i = 0; i < texts.length; i++) {
    const text = texts[i];
    console.log(`▶ 文本 ${i + 1}: "${text}"`);

    try {
      const result = await client.moderateText(text);
      console.log("  详细结果:", JSON.stringify(result, null, 2));

      const isSafe = await client.isTextSafe(text);
      console.log(`  是否安全: ${isSafe ? "✅ 是" : "❌ 否"}\n`);
    } catch (error) {
      console.error(`  ❌ 检测失败: ${error}\n`);
    }
  }

  if (texts.length > 1) {
    console.log("▶ 批量检测测试");
    try {
      const batchResults = await client.moderateTexts(texts);
      console.log("  批量结果:", JSON.stringify(batchResults, null, 2));
    } catch (error) {
      console.error("  ❌ 批量检测失败:", error);
    }
  }
}

async function runImageModerationTest(imagePathArg?: string) {
  logHeading("腾讯云图片审核 API 测试");

  const imagePath = imagePathArg
    ? isAbsolute(imagePathArg)
      ? imagePathArg
      : resolve(process.cwd(), imagePathArg)
    : DEFAULT_IMAGE_PATH;

  try {
    await stat(imagePath);
  } catch {
    throw new Error(`找不到要检测的图片: ${imagePath}`);
  }

  const client = createTencentImageModerationClientFromEnv();
  console.log("✅ 客户端初始化成功\n");
  console.log(`▶ 检测图片: ${imagePath}`);

  try {
    const result = await client.moderateImage({
      filePath: imagePath,
      bizType: "image_default",
    });

    console.log(`  建议: ${result.suggestion}`);
    console.log(
      `  标签: ${result.label}${
        result.subLabel ? ` (${result.subLabel})` : ""
      }，置信度 ${result.score}`,
    );

    if (result.labelResults.length > 0) {
      console.log(
        "  详细标签:",
        JSON.stringify(result.labelResults, null, 2),
      );
    }

    if (result.ocrResults.length > 0) {
      console.log("  OCR 结果:", JSON.stringify(result.ocrResults, null, 2));
    }

    if (result.objectResults.length > 0) {
      console.log(
        "  物体识别详情:",
        JSON.stringify(result.objectResults, null, 2),
      );
    }
  } catch (error) {
    console.error("  ❌ 图片检测失败:", error);
  }
}

async function runErrorSimulation() {
  logHeading("异常场景模拟 (凭证错误)");

  const contentTypes = [ContentType.USER_NAME, ContentType.EVENT_TITLE];
  const content = "这是一个测试文本";

  const originalSecretId = process.env.TENCENT_CLOUD_SECRET_ID;
  const originalSecretKey = process.env.TENCENT_CLOUD_SECRET_KEY;

  try {
    process.env.TENCENT_CLOUD_SECRET_ID = "invalid_id";
    process.env.TENCENT_CLOUD_SECRET_KEY = "invalid_key";

    for (const type of contentTypes) {
      console.log(`\n▶ ${type}`);
      try {
        const result = await moderateContent(content, type);
        console.log(`  审核建议: ${result.suggestion}`);
        console.log(`  是否允许通过: ${result.isApproved ? "✅ 是" : "❌ 否"}`);
        if (result.reason) {
          console.log(`  原因: ${result.reason}`);
        }
      } catch (error) {
        console.error("  ❌ 审核异常:", error);
      }
    }
  } finally {
    if (originalSecretId) {
      process.env.TENCENT_CLOUD_SECRET_ID = originalSecretId;
    }
    if (originalSecretKey) {
      process.env.TENCENT_CLOUD_SECRET_KEY = originalSecretKey;
    }
  }
}

async function runValidationSuite() {
  await runValidationGroup(
    "用户信息校验",
    [
      {
        name: "正常用户信息",
        data: {
          name: "张三",
          bio: "我是一名前端开发工程师，热爱编程和开源项目",
          username: "zhangsan123",
        },
      },
      {
        name: "空用户名",
        data: {
          name: "",
          bio: "测试空用户名的情况",
          username: "test",
        },
      },
      {
        name: "用户名过长",
        data: {
          name: "这是一个非常非常非常非常非常非常非常非常长的用户名测试",
          bio: "测试用户名过长",
          username: "test",
        },
      },
    ],
    validateUserContent,
  );

  await runValidationGroup(
    "活动信息校验",
    [
      {
        name: "正常活动信息",
        data: {
          title: "HackathonWeekly 社区聚会",
          shortDescription: "这是一个关于技术分享和交流的社区活动",
          richContent: "活动将包含技术分享、项目展示和自由交流等环节",
        },
      },
      {
        name: "活动标题过长",
        data: {
          title:
            "这是一个非常非常非常非常非常非常非常非常非常非常非常非常长的活动标题测试",
          shortDescription: "测试标题过长",
        },
      },
      {
        name: "空活动标题",
        data: {
          title: "",
          shortDescription: "测试空标题",
        },
      },
    ],
    validateEventContent,
  );

  await runValidationGroup(
    "作品信息校验",
    [
      {
        name: "正常作品信息",
        data: {
          title: "AI 写作助手",
          description:
            "这是一个基于AI技术的写作辅助工具，可以帮助用户提高写作效率",
        },
      },
      {
        name: "作品标题过长",
        data: {
          title:
            "这是一个非常非常非常非常非常非常非常非常非常非常非常非常长的作品标题测试",
          description: "测试标题过长",
        },
      },
      {
        name: "空作品标题",
        data: {
          title: "",
          description: "测试空标题",
        },
      },
    ],
    validateProjectContent,
  );

  await runIndividualModerationTests();
}

async function main() {
  const options = parseCliArgs();

  console.log("🚀 内容审核能力综合测试\n");

  if (options.runValidation) {
    await runValidationSuite();
  }

  if (options.runText) {
    await runTextModerationClientTests(options.customText);
  }

  if (options.runImage) {
    await runImageModerationTest(options.customImagePath);
  }

  if (options.runErrorSimulation) {
    await runErrorSimulation();
  }

  console.log("\n🎉 测试完成");
}

main().catch((error) => {
  console.error("❌ 测试失败:", error);
  process.exit(1);
});
