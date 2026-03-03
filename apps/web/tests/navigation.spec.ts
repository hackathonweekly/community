import { test, expect } from "@playwright/test";

test.describe("社区网站核心流程测试", () => {
	test("1. 首页加载 → 核心内容可见、无崩溃", async ({ page }) => {
		// 访问首页
		await page.goto("/", { waitUntil: "networkidle" });

		// 1. 验证主体内容区域 (main 标签)
		const main = page.locator("main");
		await expect(main.first()).toBeVisible();

		// 2. 验证核心标题 (Hero 中的 h1)
		const heading = page.locator("h1");
		await expect(heading.first()).toBeVisible();

		// 3. 验证导航链接是否存在
		// 修复：不再使用 .or() 导致的多元素冲突，直接断言链接列表的第一个
		const navLinks = page.locator('a[href="/auth/login"], a[href="/docs"]');
		await expect(navLinks.first()).toBeVisible();

		// 打印找到的链接数量，方便调试
		const count = await navLinks.count();
		console.log(`首页找到 ${count} 个关键导航链接`);
	});

	test("2. 导航跳转 → 主要页面路由可正常访问", async ({ page }) => {
		const mainRoutes = [
			{ path: "/events" },
			{ path: "/projects" },
			{ path: "/blog" },
			{ path: "/orgs" },
		];

		for (const route of mainRoutes) {
			console.log(`正在测试路由: ${route.path}`);
			const response = await page.goto(route.path, {
				waitUntil: "domcontentloaded",
				timeout: 15000,
			});

			expect(response?.status()).toBe(200);

			await expect(page.locator("text=404")).not.toBeVisible();
			await expect(
				page.locator("text=Internal Server Error"),
			).not.toBeVisible();

			// 验证页面至少加载了 main 内容
			await expect(page.locator("main").first()).toBeVisible();
		}
	});
});
