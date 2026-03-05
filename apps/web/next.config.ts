import { withContentCollections } from "@content-collections/next";
import path from "node:path";
import type { NextConfig } from "next";
import nextIntlPlugin from "next-intl/plugin";

process.env.BASELINE_BROWSER_MAPPING_IGNORE_OLD_DATA ??= "1";
process.env.BROWSERSLIST_IGNORE_OLD_DATA ??= "1";

const withNextIntl = nextIntlPlugin("./src/modules/i18n/request.ts");

const nextConfig: NextConfig = {
	output: "standalone", // 启用 standalone 模式
	transpilePackages: [
		"@community/ui",
		"@community/lib-client",
		"@community/lib-server",
		"@community/lib-shared",
		"@community/config",
	],
	outputFileTracingRoot: path.join(__dirname, "../.."),
	experimental: {
		// Turbopack File System Caching (beta)
		turbopackFileSystemCacheForDev: true,
		optimizePackageImports: [
			"lucide-react",
			"@radix-ui/react-icons",
			"@heroicons/react",
			"date-fns",
			"recharts",
			"@react-email/components",
			"fumadocs-ui",
			"fumadocs-core",
			"@tanstack/react-query",
			"@tanstack/react-table",
			"@tiptap/react",
			"@tiptap/starter-kit",
			"react-hook-form",
			"zod",
			"ai",
			"better-auth",
			"hono",
		],
	},
	webpack: (config) => {
		// 忽略 Hono color.js 中的动态导入警告
		config.ignoreWarnings = [
			...(config.ignoreWarnings || []),
			{
				module: /node_modules\/hono\/dist\/utils\/color\.js/,
				message:
					/Critical dependency: the request of a dependency is an expression/,
			},
		];

		// 解决 formidable 等 Node.js 专用包在客户端的问题
		config.resolve = config.resolve || {};
		config.resolve.fallback = {
			...config.resolve.fallback,
			formidable: false,
			superagent: false,
		};
		config.resolve.alias = {
			...(config.resolve.alias || {}),
			"@img/sharp-libvips-dev/include": false,
			"@img/sharp-libvips-dev/cplusplus": false,
			"@img/sharp-wasm32/versions": false,
		};

		return config;
	},
	images: {
		remotePatterns: [
			{
				// google profile images
				protocol: "https",
				hostname: "lh3.googleusercontent.com",
			},
			{
				// github profile images
				protocol: "https",
				hostname: "avatars.githubusercontent.com",
			},
			{
				// project screenshots and assets
				protocol: "https",
				hostname:
					"hackweek-public-1303088253.cos.ap-guangzhou.myqcloud.com",
			},
			{
				// wechat profile images
				protocol: "https",
				hostname: "thirdwx.qlogo.cn",
			},
		],
	},
	async redirects() {
		return [
			// 应用内必要的重定向
			{
				source: "/settings",
				destination: "/settings/general",
				permanent: true,
			},
			{
				source: "/admin",
				destination: "/admin/users",
				permanent: true,
			},
			{
				source: "/orgs/:organizationSlug/settings",
				destination: "/orgs/:organizationSlug/manage/settings/general",
				permanent: true,
			},
			// 路径标准化重定向
			{
				source: "/organizations/:path*",
				destination: "/orgs/:path*",
				permanent: true,
			},
		];
	},
	typescript: {
		ignoreBuildErrors: !!process.env.SKIP_TYPE_CHECK,
	},
};

export default withContentCollections(withNextIntl(nextConfig));
