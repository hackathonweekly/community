import "ignore-punycode-warning";
import { withContentCollections } from "@content-collections/next";
import type { NextConfig } from "next";
import nextIntlPlugin from "next-intl/plugin";

const withNextIntl = nextIntlPlugin("./src/modules/i18n/request.ts");

const nextConfig: NextConfig = {
	output: "standalone", // 启用 standalone 模式
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
				source: "/app/settings",
				destination: "/app/settings/general",
				permanent: true,
			},
			{
				source: "/app/:organizationSlug/settings",
				destination: "/app/:organizationSlug/settings/general",
				permanent: true,
			},
			{
				source: "/app/admin",
				destination: "/app/admin/users",
				permanent: true,
			},
			// 国际化重定向 - 无语言前缀的路径重定向到中文
			{
				source: "/u/:path*",
				destination: "/zh/u/:path*",
				permanent: false,
			},
			{
				source: "/docs/:path*",
				destination: "/zh/docs/:path*",
				permanent: false,
			},
			{
				source: "/projects/:path*",
				destination: "/zh/projects/:path*",
				permanent: false,
			},
			{
				source: "/events/:path*",
				destination: "/zh/events/:path*",
				permanent: false,
			},
			{
				source: "/tasks/:path*",
				destination: "/zh/tasks/:path*",
				permanent: false,
			},
			{
				source: "/orgs/:path*",
				destination: "/zh/orgs/:path*",
				permanent: false,
			},
			{
				source: "/contact",
				destination: "/zh/contact",
				permanent: false,
			},
			{
				source: "/changelog",
				destination: "/zh/changelog",
				permanent: false,
			},
			{
				source: "/blog",
				destination: "/zh/blog",
				permanent: false,
			},
			{
				source: "/legal",
				destination: "/zh/legal",
				permanent: false,
			},
			// 路径标准化重定向
			{
				source: "/organizations/:path*",
				destination: "/zh/orgs/:path*",
				permanent: true,
			},
		];
	},
	eslint: {
		ignoreDuringBuilds: true,
	},
	typescript: {
		ignoreBuildErrors: !!process.env.SKIP_TYPE_CHECK,
	},
};

export default withContentCollections(withNextIntl(nextConfig));
