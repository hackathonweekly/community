import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { z } from "zod";

// 尝试获取 git tag 版本号
function getVersionFromGit(): string | null {
	try {
		// 使用 Bun 的 Shell API 执行 git 命令
		const result = Bun.spawnSync({
			cmd: ["git", "describe", "--tags", "--abbrev=0"],
			stdout: "pipe",
			stderr: "pipe",
		});

		if (result.success) {
			return new TextDecoder().decode(result.stdout).trim();
		}
	} catch (error) {
		// 忽略错误，返回 null
	}
	return null;
}

// 获取应用版本（优先级：BUILD_VERSION > git tag > npm_package_version > development）
function getAppVersion(): string {
	// 1. 优先使用构建时传入的版本（Docker 构建时使用）
	if (process.env.BUILD_VERSION) {
		return process.env.BUILD_VERSION;
	}

	// 2. 其次使用 git tag
	const gitTag = getVersionFromGit();
	if (gitTag) return gitTag;

	// 3. 使用环境变量
	if (process.env.npm_package_version) {
		return process.env.npm_package_version;
	}

	// 4. 最后使用 development 标记
	return "development";
}

// 使用 stderr 确保日志输出到 Docker
process.stderr.write(
	`🚀 应用启动中... 版本: ${getAppVersion()} 环境: ${
		process.env.NODE_ENV || "development"
	} 时间: ${new Date().toISOString()}\n`,
);

export const versionRouter = new Hono().get(
	"/version",
	describeRoute({
		tags: ["System"],
		summary: "Get system version and build information",
		description: "获取系统版本、构建时间和部署信息",
		responses: {
			200: {
				description: "Version information",
				content: {
					"application/json": {
						schema: z.object({
							version: z.string().describe("应用版本"),
							buildTime: z.string().describe("构建时间"),
							nodeVersion: z.string().describe("Node.js版本"),
							gitCommit: z
								.string()
								.optional()
								.describe("Git提交哈希"),
							environment: z.string().describe("环境"),
							imageModeration: z
								.object({
									lastModified: z
										.string()
										.describe("图片审核功能最后修改时间"),
									version: z
										.string()
										.describe("图片审核修复版本"),
								})
								.describe("图片审核功能版本信息"),
						}),
					},
				},
			},
		},
	}),
	async (c) => {
		const now = new Date().toISOString();

		// 获取版本信息
		const version = getAppVersion();

		return c.json({
			version,
			buildTime: process.env.BUILD_TIME || now,
			nodeVersion: process.version,
			gitCommit:
				process.env.VERCEL_GIT_COMMIT_SHA ||
				process.env.GIT_COMMIT ||
				"unknown",
			environment: process.env.NODE_ENV || "development",
			imageModeration: {
				lastModified: "2024-11-19T12:00:00Z",
				version: "v1.1-fix-error-handling",
			},
		});
	},
);
