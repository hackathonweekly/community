import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
	testDir: "./tests",
	/* 自动重试 2 次 */
	retries: 2,
	/* 失败时保存 trace */
	use: {
		/* 核心设置：定义测试的基础 URL */
		baseURL: "http://localhost:3000",
		trace: "on-first-retry",
	},
	/* 运行测试前自动启动开发服务器 */
	webServer: {
		command: "pnpm run dev",
		url: "http://localhost:3000",
		reuseExistingServer: !process.env.CI,
		stdout: "ignore",
		stderr: "pipe",
	},
	projects: [
		{
			name: "chromium",
			use: { ...devices["Desktop Chrome"] },
		},
	],
});
