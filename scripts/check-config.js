#!/usr/bin/env node

import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
	HeadBucketCommand,
	ListBucketsCommand,
	S3Client,
} from "@aws-sdk/client-s3";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { config } from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
config({ path: join(__dirname, "..", "apps", "web", ".env.local") });

const results = {
	passed: 0,
	failed: 0,
	skipped: 0,
	details: [],
	categories: {
		basic: { name: "基础配置", passed: 0, failed: 0, skipped: 0, items: [] },
		storage: { name: "存储配置", passed: 0, failed: 0, skipped: 0, items: [] },
		auth: { name: "认证配置", passed: 0, failed: 0, skipped: 0, items: [] },
		mail: { name: "邮件配置", passed: 0, failed: 0, skipped: 0, items: [] },
		sms: { name: "短信配置", passed: 0, failed: 0, skipped: 0, items: [] },
		payment: { name: "支付配置", passed: 0, failed: 0, skipped: 0, items: [] },
		ai: { name: "AI配置", passed: 0, failed: 0, skipped: 0, items: [] },
		analytics: { name: "分析配置", passed: 0, failed: 0, skipped: 0, items: [] },
		connections: { name: "连接测试", passed: 0, failed: 0, skipped: 0, items: [] }
	}
};

function logResult(test, status, details = "", category = "basic") {
	const icon = status === null ? "⚪" : (status ? "✅" : "❌");
	const statusText = status === null ? "跳过" : (status ? "通过" : "失败");
	console.log(`${icon} ${test}${details ? `: ${details}` : ""}`);

	const result = { test, status, details, statusText };
	results.details.push(result);
	
	if (results.categories[category]) {
		results.categories[category].items.push(result);
		if (status === null) {
			results.skipped++;
			results.categories[category].skipped++;
		} else if (status) {
			results.passed++;
			results.categories[category].passed++;
		} else {
			results.failed++;
			results.categories[category].failed++;
		}
	}
}

async function checkEnvVar(name, required = true, category = "basic") {
	const value = process.env[name];
	if (required && !value) {
		logResult(`环境变量 ${name}`, false, "未设置", category);
		return false;
	}
	if (value) {
		logResult(`环境变量 ${name}`, true, "已设置", category);
		return true;
	}
	logResult(`环境变量 ${name}`, null, "可选，未设置", category);
	return true;
}

async function checkDatabase() {
	try {
		const adapter = new PrismaPg(
			new Pool({ connectionString: process.env.DATABASE_URL }),
		);
		const prisma = new PrismaClient({ adapter });
		await prisma.$connect();
		await prisma.$queryRaw`SELECT 1`;
		await prisma.$disconnect();
		logResult("数据库连接", true, "连接成功", "connections");
		return true;
	} catch (error) {
		logResult("数据库连接", false, error.message, "connections");
		return false;
	}
}

async function checkS3() {
	try {
		// Check required S3 environment variables
		const s3Endpoint = process.env.S3_ENDPOINT;
		const s3AccessKey = process.env.S3_ACCESS_KEY_ID;
		const s3SecretKey = process.env.S3_SECRET_ACCESS_KEY;
		const s3Region = process.env.S3_REGION || "auto";

		if (!s3Endpoint || !s3AccessKey || !s3SecretKey) {
			logResult("S3 配置", false, "缺少必要的环境变量");
			return false;
		}

		// Test S3 connection
		const s3Client = new S3Client({
			region: s3Region,
			endpoint: s3Endpoint,
			forcePathStyle: true,
			credentials: {
				accessKeyId: s3AccessKey,
				secretAccessKey: s3SecretKey,
			},
		});

		// Test connection by listing buckets
		await s3Client.send(new ListBucketsCommand({}));
		logResult("S3 连接", true, "连接成功");

		// Check if bucket is accessible by testing file access
		const publicBucket = process.env.NEXT_PUBLIC_BUCKET_NAME;
		const publicEndpoint = process.env.NEXT_PUBLIC_S3_ENDPOINT;

		if (publicEndpoint) {
			try {
				// Test by trying to access the storage endpoint
				// Modern cloud storage uses: https://bucket-name.provider.com/file-path
				const testUrl = `${publicEndpoint}/test-file-that-probably-doesnt-exist`;
				const response = await fetch(testUrl, { method: "HEAD" });

				// If we get 404, it means the endpoint is accessible but file doesn't exist (which is good)
				// If we get 403, it means access is forbidden
				// If we get other errors, there might be configuration issues

				if (response.status === 404) {
					logResult(
						`存储端点 "${publicEndpoint}"`,
						true,
						"可访问（通过公开端点测试）",
					);
				} else if (response.status === 403) {
					logResult(
						`存储端点 "${publicEndpoint}"`,
						false,
						"访问被拒绝，检查权限配置",
					);
				} else {
					logResult(
						`存储端点 "${publicEndpoint}"`,
						true,
						`状态码 ${response.status}，似乎可访问`,
					);
				}
			} catch (error) {
				// Try the HeadBucket command as fallback only if we have a bucket name
				if (publicBucket) {
					try {
						await s3Client.send(
							new HeadBucketCommand({ Bucket: publicBucket }),
						);
						logResult(
							`S3 Bucket "${publicBucket}"`,
							true,
							"存在且可访问（通过 API 验证）",
						);
					} catch (apiError) {
						logResult(
							`S3 Bucket "${publicBucket}"`,
							false,
							`API 访问失败: ${apiError.message}`,
						);
					}
				} else {
					logResult(
						`存储端点 "${publicEndpoint}"`,
						false,
						`访问测试失败: ${error.message}`,
						"connections"
					);
				}
			}
		} else if (publicBucket) {
			// Fallback to HeadBucket if no public endpoint configured
			try {
				await s3Client.send(
					new HeadBucketCommand({ Bucket: publicBucket }),
				);
				logResult(`S3 Bucket "${publicBucket}"`, true, "存在且可访问");
			} catch (error) {
				logResult(
					`S3 Bucket "${publicBucket}"`,
					false,
					"不存在或无权限访问",
				);
			}
		}

		return true;
	} catch (error) {
		logResult("S3 连接", false, error.message);
		return false;
	}
}

async function checkLLMApi() {
	try {
		const apiKey =
			process.env.ARK_API_KEY ??
			process.env.AI_API_KEY ??
			process.env.OPENAI_API_KEY;
		const baseUrl = (
			process.env.ARK_BASE_URL ??
			process.env.AI_BASE_URL ??
			process.env.OPENAI_BASE_URL ??
			"https://ark.cn-beijing.volces.com/api/v3"
		).replace(/\/+$/, "");
		const model =
			process.env.ARK_MODEL ??
			process.env.AI_MODEL ??
			process.env.OPENAI_MODEL ??
			"doubao-seed-2-0-mini-260215";

		if (!apiKey) {
			logResult("LLM API", null, "未配置 API Key，跳过测试", "connections");
			return true;
		}

		// Test OpenAI-compatible API connection with a simple chat completion request
		const response = await fetch(`${baseUrl}/chat/completions`, {
			method: "POST",
			headers: {
				"Authorization": `Bearer ${apiKey}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				model: model,
				messages: [
					{
						role: "user",
						content: "Hello"
					}
				],
				max_tokens: 5,
				temperature: 0.1
			})
		});

		if (response.ok) {
			const data = await response.json();
			if (data.choices && data.choices.length > 0) {
				logResult("LLM API", true, `连接成功，模型 ${model} 可用`, "connections");
			} else {
				logResult("LLM API", false, `API 响应异常，未收到预期格式`, "connections");
			}
		} else {
			let errorMessage = `HTTP ${response.status}`;
			try {
				const errorData = await response.json();
				if (errorData.error && errorData.error.message) {
					errorMessage += `: ${errorData.error.message}`;
				} else if (errorData.error && errorData.error.code) {
					errorMessage += `: ${errorData.error.code}`;
				} else {
					errorMessage += `: ${response.statusText}`;
				}
			} catch {
				errorMessage += `: ${response.statusText}`;
			}
			
			if (response.status === 401) {
				logResult("LLM API", false, "API Key 无效或过期", "connections");
			} else if (response.status === 403) {
				logResult("LLM API", false, "API Key 权限不足或配额不足", "connections");
			} else if (response.status === 404) {
				const originalBaseUrl =
					process.env.ARK_BASE_URL ??
					process.env.AI_BASE_URL ??
					process.env.OPENAI_BASE_URL ??
					"https://ark.cn-beijing.volces.com/api/v3";
				logResult("LLM API", false, `端点不存在，请检查 Base URL 配置 (当前: ${originalBaseUrl})`, "connections");
			} else if (response.status === 422) {
				logResult("LLM API", false, `模型 "${model}" 不支持或参数错误`, "connections");
			} else {
				logResult("LLM API", false, errorMessage, "connections");
			}
		}

		return response.ok;
	} catch (error) {
		if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
			const originalBaseUrl =
				process.env.ARK_BASE_URL ??
				process.env.AI_BASE_URL ??
				process.env.OPENAI_BASE_URL ??
				"https://ark.cn-beijing.volces.com/api/v3";
			logResult("LLM API", false, `无法连接到服务器，请检查 Base URL (${originalBaseUrl})`, "connections");
		} else if (error.message.includes('fetch')) {
			logResult("LLM API", false, `网络请求失败: ${error.message}`, "connections");
		} else {
			logResult("LLM API", false, error.message, "connections");
		}
		return false;
	}
}

async function checkSiteConfig() {
	const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
	const s3Endpoint = process.env.NEXT_PUBLIC_S3_ENDPOINT;

	if (!siteUrl && process.env.NODE_ENV === "production") {
		logResult("NEXT_PUBLIC_SITE_URL", false, "生产环境需要设置");
	} else {
		logResult("NEXT_PUBLIC_SITE_URL", true, siteUrl || "开发环境自动检测");
	}

	if (!s3Endpoint) {
		logResult("NEXT_PUBLIC_S3_ENDPOINT", false, "S3 文件访问需要公开端点");
	} else {
		logResult("NEXT_PUBLIC_S3_ENDPOINT", true, "已设置");
	}
}

async function main() {
	console.log("🔍 检查环境配置...\n");

	// Check basic environment variables
	console.log("📋 基础环境变量:");
	await checkEnvVar("DATABASE_URL", true, "basic");
	await checkEnvVar("DIRECT_URL", false, "basic");
	await checkEnvVar("BETTER_AUTH_SECRET", true, "basic");
	await checkEnvVar("NEXT_PUBLIC_SITE_URL", false, "basic");
	await checkEnvVar("TRUSTED_ORIGINS", false, "basic");

	console.log("\n🗄️  S3 存储配置:");
	await checkEnvVar("S3_ENDPOINT", true, "storage");
	await checkEnvVar("S3_ACCESS_KEY_ID", true, "storage");
	await checkEnvVar("S3_SECRET_ACCESS_KEY", true, "storage");
	await checkEnvVar("S3_REGION", false, "storage");
	await checkEnvVar("NEXT_PUBLIC_BUCKET_NAME", true, "storage");
	await checkEnvVar("NEXT_PUBLIC_S3_ENDPOINT", true, "storage");

	console.log("\n🔐 认证配置:");
	// Social login disabled by default
	// await checkEnvVar("GITHUB_CLIENT_ID", false);
	// await checkEnvVar("GITHUB_CLIENT_SECRET", false);
	// await checkEnvVar("GOOGLE_CLIENT_ID", false);
	// await checkEnvVar("GOOGLE_CLIENT_SECRET", false);
	
	// WeChat OAuth (optional)
	await checkEnvVar("WECHAT_WEBSITE_APP_ID", false, "auth");
	await checkEnvVar("WECHAT_WEBSITE_APP_SECRET", false, "auth");
	await checkEnvVar("WECHAT_SERVICE_ACCOUNT_APP_ID", false, "auth");
	await checkEnvVar("WECHAT_SERVICE_ACCOUNT_APP_SECRET", false, "auth");

	console.log("\n📧 邮件配置:");
	await checkEnvVar("PLUNK_API_KEY", false, "mail");
	
	console.log("\n📱 短信配置:");
	await checkEnvVar("TENCENT_CLOUD_SECRET_ID", false, "sms");
	await checkEnvVar("TENCENT_CLOUD_SECRET_KEY", false, "sms");
	await checkEnvVar("TENCENT_CLOUD_REGION", false, "sms");
	await checkEnvVar("TENCENT_SMS_SDK_APP_ID", false, "sms");
	await checkEnvVar("TENCENT_SMS_SIGN_NAME", false, "sms");
	await checkEnvVar("TENCENT_SMS_TEMPLATE_ID", false, "sms");
	await checkEnvVar("TENCENT_SMS_EVENT_APPROVED_TEMPLATE_ID", false, "sms");
	await checkEnvVar("TENCENT_SMS_EVENT_REJECTED_TEMPLATE_ID", false, "sms");
	
	console.log("\n💳 支付配置:");
	await checkEnvVar("STRIPE_SECRET_KEY", false, "payment");
	await checkEnvVar("STRIPE_WEBHOOK_SECRET", false, "payment");
	await checkEnvVar("NEXT_PUBLIC_PRICE_ID_PRO_MONTHLY", false, "payment");
	await checkEnvVar("NEXT_PUBLIC_PRICE_ID_PRO_YEARLY", false, "payment");
	await checkEnvVar("NEXT_PUBLIC_PRICE_ID_LIFETIME", false, "payment");
	
	console.log("\n🤖 AI配置:");
	await checkEnvVar("ARK_API_KEY", false, "ai");
	await checkEnvVar("ARK_BASE_URL", false, "ai");
	await checkEnvVar("ARK_MODEL", false, "ai");
	await checkEnvVar("AI_API_KEY", false, "ai");
	await checkEnvVar("AI_BASE_URL", false, "ai");
	await checkEnvVar("AI_MODEL", false, "ai");
	await checkEnvVar("OPENAI_API_KEY", false, "ai");
	await checkEnvVar("OPENAI_BASE_URL", false, "ai");
	await checkEnvVar("OPENAI_MODEL", false, "ai");
	
	console.log("\n📊 分析配置:");
	await checkEnvVar("NEXT_PUBLIC_PIRSCH_CODE", false, "analytics");
	await checkEnvVar("NEXT_PUBLIC_PLAUSIBLE_URL", false, "analytics");
	await checkEnvVar("NEXT_PUBLIC_MIXPANEL_TOKEN", false, "analytics");
	await checkEnvVar("NEXT_PUBLIC_GOOGLE_ANALYTICS_ID", false, "analytics");

	console.log("\n🧪 连接测试:");

	// Test database connection
	await checkDatabase();

	// Test S3 connection
	await checkS3();

	// Test LLM API connection
	await checkLLMApi();

	// Check site configuration
	await checkSiteConfig();

	// Summary
	console.log("\n" + "=".repeat(80));
	console.log("📊 配置检查结果摘要");
	console.log("=".repeat(80));
	
	// Overall stats
	const total = results.passed + results.failed + results.skipped;
	console.log(`\n🔢 总体统计:`);
	console.log(`   总共检查项目: ${total}`);
	console.log(`   ✅ 通过: ${results.passed}`);
	console.log(`   ❌ 失败: ${results.failed}`);
	console.log(`   ⚪ 跳过: ${results.skipped}`);
	
	// Category breakdown
	console.log(`\n📋 分类详情:`);
	for (const [key, category] of Object.entries(results.categories)) {
		if (category.items.length > 0) {
			const categoryTotal = category.passed + category.failed + category.skipped;
			const passRate = categoryTotal > 0 ? ((category.passed / categoryTotal) * 100).toFixed(0) : 0;
			const statusIcon = category.failed > 0 ? "❌" : (category.passed > 0 ? "✅" : "⚪");
			
			console.log(`   ${statusIcon} ${category.name}: ${category.passed}/${categoryTotal} (${passRate}%)`);
			
			// Show failed items for this category
			const failedItems = category.items.filter(item => item.status === false);
			if (failedItems.length > 0) {
				failedItems.forEach(item => {
					console.log(`      └─ ❌ ${item.test}: ${item.details}`);
				});
			}
		}
	}

	// Critical issues
	const criticalIssues = results.details.filter(r => !r.status && r.test.includes("DATABASE_URL"));
	if (criticalIssues.length > 0) {
		console.log(`\n🚨 严重问题:`);
		criticalIssues.forEach(issue => {
			console.log(`   • ${issue.test}: ${issue.details}`);
		});
	}

	// Recommendations
	console.log(`\n💡 建议:`);
	if (results.failed > 0) {
		console.log("   1. 检查 .env.local 文件是否存在");
		console.log("   2. 确保所有必需的环境变量已设置");
		if (results.details.some(r => !r.status && r.test.includes("数据库"))) {
			console.log("   3. 验证数据库连接字符串");
		}
		if (results.details.some(r => !r.status && r.test.includes("S3"))) {
			console.log("   4. 确认 S3 凭据和权限");
			console.log("   5. 检查 S3 bucket 是否存在且可访问");
		}
		if (results.details.some(r => !r.status && r.test.includes("LLM API"))) {
			console.log("   6. 验证 LLM API Key 是否有效");
		}
	} else {
		console.log("   🎉 所有必需的配置都已正确设置！");
		if (results.skipped > 0) {
			console.log(`   ℹ️  有 ${results.skipped} 个可选配置未设置，如需要可以配置它们`);
		}
	}
	
	console.log("\n" + "=".repeat(80));
	
	if (results.failed > 0) {
		process.exit(1);
	} else {
		process.exit(0);
	}
}

main().catch((error) => {
	console.error("检查过程中发生错误:", error);
	process.exit(1);
});
