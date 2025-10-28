#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");
const https = require("node:https");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
require("dotenv").config();

// S3 客户端配置
const s3Client = new S3Client({
	region: process.env.S3_REGION || "auto",
	endpoint: process.env.S3_ENDPOINT,
	forcePathStyle: false,
	credentials: {
		accessKeyId: process.env.S3_ACCESS_KEY_ID,
		secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
	},
});

const bucketName = process.env.NEXT_PUBLIC_BUCKET_NAME;
const s3Endpoint = process.env.NEXT_PUBLIC_S3_ENDPOINT;

// 解析 TypeScript 配置文件
function parseImageTemplatesFromFile() {
	const configPath = path.join(__dirname, "../src/config/image-templates.ts");
	const content = fs.readFileSync(configPath, "utf8");

	// 提取 IMAGE_TEMPLATES 数组
	const match = content.match(
		/export const IMAGE_TEMPLATES: ImageTemplate\[\] = \[([\s\S]*?)\];/,
	);
	if (!match) {
		throw new Error("无法在文件中找到 IMAGE_TEMPLATES 数组");
	}

	// 简单的模板对象解析
	const templatesString = match[1];
	const templates = [];

	// 使用正则表达式匹配每个模板对象
	const templateRegex =
		/\{[\s\S]*?id:\s*"([^"]+)"[\s\S]*?name:\s*"([^"]+)"[\s\S]*?url:\s*"([^"]+)"[\s\S]*?category:\s*"([^"]+)"[\s\S]*?description:\s*"([^"]*)"[\s\S]*?\}/g;

	let templateMatch;
	while ((templateMatch = templateRegex.exec(templatesString)) !== null) {
		templates.push({
			id: templateMatch[1],
			name: templateMatch[2],
			url: templateMatch[3],
			category: templateMatch[4],
			description: templateMatch[5] || "",
		});
	}

	return templates;
}

// 验证环境变量
function validateEnvironment() {
	const requiredVars = [
		"S3_ENDPOINT",
		"S3_ACCESS_KEY_ID",
		"S3_SECRET_ACCESS_KEY",
		"NEXT_PUBLIC_BUCKET_NAME",
		"NEXT_PUBLIC_S3_ENDPOINT",
	];

	const missing = requiredVars.filter((varName) => !process.env[varName]);

	if (missing.length > 0) {
		console.error("❌ 缺少必要的环境变量:");
		missing.forEach((varName) => console.error(`   - ${varName}`));
		console.error("\n请检查 .env 文件配置");
		process.exit(1);
	}

	console.log("✅ 环境变量验证通过");
}

// 下载图片
function downloadImage(url) {
	return new Promise((resolve, reject) => {
		https
			.get(url, (response) => {
				if (response.statusCode === 200) {
					const chunks = [];
					response.on("data", (chunk) => chunks.push(chunk));
					response.on("end", () => resolve(Buffer.concat(chunks)));
				} else {
					reject(new Error(`HTTP ${response.statusCode}: ${url}`));
				}
			})
			.on("error", reject);
	});
}

// 上传到 S3
async function uploadToS3(buffer, fileName, contentType = "image/jpeg") {
	const key = `public/event-templates/${fileName}`;

	const command = new PutObjectCommand({
		Bucket: bucketName,
		Key: key,
		Body: buffer,
		ContentType: contentType,
		// 设置公开读取权限（如果你的 bucket 支持）
		ACL: "public-read",
	});

	try {
		await s3Client.send(command);
		return `${s3Endpoint}/${key}`;
	} catch (error) {
		throw new Error(`上传失败 ${fileName}: ${error.message}`);
	}
}

// 获取文件扩展名
function getExtensionFromUrl(url) {
	// Unsplash URLs usually end with format parameters, extract the actual format
	const match = url.match(/[&?]fm=(\w+)/);
	if (match) {
		return match[1] === "jpg" ? "jpeg" : match[1];
	}
	return "jpeg"; // 默认为 jpeg
}

// 迁移单个图片
async function migrateImage(template, index) {
	console.log(`📥 [${index + 1}] 下载: ${template.id} - ${template.name}`);

	try {
		// 下载图片
		const buffer = await downloadImage(template.url);

		// 生成文件名
		const extension = getExtensionFromUrl(template.url);
		const fileName = `${template.id}-${template.category}.${extension}`;
		const contentType = `image/${extension}`;

		console.log(
			`📤 [${index + 1}] 上传: ${fileName} (${(buffer.length / 1024).toFixed(1)}KB)`,
		);

		// 上传到 S3
		const newUrl = await uploadToS3(buffer, fileName, contentType);

		console.log(`✅ [${index + 1}] 完成: ${template.id}`);
		console.log(`   原始URL: ${template.url}`);
		console.log(`   新URL: ${newUrl}\n`);

		return {
			...template,
			url: newUrl,
		};
	} catch (error) {
		console.error(
			`❌ [${index + 1}] 失败: ${template.id} - ${error.message}\n`,
		);
		return null;
	}
}

// 更新配置文件
function updateImageTemplatesFile(updatedTemplates) {
	const configPath = path.join(__dirname, "../src/config/image-templates.ts");

	try {
		const content = fs.readFileSync(configPath, "utf8");

		// 构建新的模板数组代码
		const templatesCode = updatedTemplates
			.map((template) => {
				return `\t{
\t\tid: "${template.id}",
\t\tname: "${template.name}",
\t\turl: "${template.url}",
\t\tcategory: "${template.category}",
\t\tdescription: "${template.description || ""}",
\t}`;
			})
			.join(",\n");

		// 替换 IMAGE_TEMPLATES 数组
		const newContent = content.replace(
			/export const IMAGE_TEMPLATES: ImageTemplate\[\] = \[[\s\S]*?\];/,
			`export const IMAGE_TEMPLATES: ImageTemplate[] = [
${templatesCode},
];`,
		);

		fs.writeFileSync(configPath, newContent, "utf8");
		console.log("✅ 已更新 image-templates.ts 文件");
	} catch (error) {
		console.error("❌ 更新配置文件失败:", error.message);

		// 备份失败，写入新文件
		const backupPath = `${configPath}.backup`;
		const newPath = `${configPath}.new`;

		console.log(`💾 创建备份文件: ${backupPath}`);
		fs.copyFileSync(configPath, backupPath);

		console.log(`📝 创建新配置文件: ${newPath}`);
		console.log("请手动替换原文件");
	}
}

// 主函数
async function main() {
	console.log("🚀 开始迁移图片模板到 S3...\n");

	// 验证环境
	validateEnvironment();

	// 读取当前配置
	const configPath = path.join(__dirname, "../src/config/image-templates.ts");
	const IMAGE_TEMPLATES = parseImageTemplatesFromFile();

	console.log(`📋 找到 ${IMAGE_TEMPLATES.length} 个图片模板\n`);

	// 迁移图片
	const results = [];
	const failed = [];

	for (let i = 0; i < IMAGE_TEMPLATES.length; i++) {
		const result = await migrateImage(IMAGE_TEMPLATES[i], i);
		if (result) {
			results.push(result);
		} else {
			failed.push(IMAGE_TEMPLATES[i]);
		}

		// 添加小延迟避免过于频繁的请求
		if (i < IMAGE_TEMPLATES.length - 1) {
			await new Promise((resolve) => setTimeout(resolve, 500));
		}
	}

	// 显示结果
	console.log("📊 迁移结果:");
	console.log(`✅ 成功: ${results.length}`);
	console.log(`❌ 失败: ${failed.length}`);

	if (failed.length > 0) {
		console.log("\n❌ 失败的模板:");
		failed.forEach((template) => {
			console.log(`   - ${template.id}: ${template.name}`);
		});
	}

	// 更新配置文件（只有成功的模板）
	if (results.length > 0) {
		console.log("\n📝 更新配置文件...");
		updateImageTemplatesFile(results);
	}

	console.log("\n🎉 迁移完成!");

	if (failed.length > 0) {
		console.log("\n⚠️  有失败的项目，建议重新运行脚本或手动处理失败的图片");
		process.exit(1);
	}
}

// 错误处理
process.on("unhandledRejection", (error) => {
	console.error("❌ 未处理的错误:", error);
	process.exit(1);
});

process.on("SIGINT", () => {
	console.log("\n⏹️  用户中断操作");
	process.exit(0);
});

// 运行主函数
if (require.main === module) {
	main().catch(console.error);
}

module.exports = { main };
