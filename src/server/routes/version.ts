import { Hono } from "hono";
import { createRoute, z } from "@hono/zod-openapi";

export const versionRouter = new Hono().openapi(
	createRoute({
		path: "/version",
		method: "get",
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

		return c.json({
			version: process.env.npm_package_version || "development",
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
