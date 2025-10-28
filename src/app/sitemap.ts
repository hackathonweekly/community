import { config } from "@/config";
import { getBaseUrl } from "@/lib/utils";
import { getAllPosts } from "@/modules/public/blog/utils/lib/posts";
import { allLegalPages } from "content-collections";
import type { MetadataRoute } from "next";
import { docsSource } from "./docs-source";

const baseUrl = getBaseUrl();
const locales = config.i18n.enabled
	? Object.keys(config.i18n.locales)
	: [config.i18n.defaultLocale];

const staticMarketingPages = ["", "/changelog"];

// Cache sitemap for 1 hour to avoid repeated compilation during build
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds
let cachedSitemap: MetadataRoute.Sitemap | null = null;
let lastCacheTime = 0;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
	const now = Date.now();

	// Return cached sitemap if it's still valid
	if (cachedSitemap && now - lastCacheTime < CACHE_DURATION) {
		return cachedSitemap;
	}

	// Generate fresh sitemap
	console.log("[sitemap] Generating fresh sitemap...");

	const posts = await getAllPosts();

	const sitemapData = [
		...staticMarketingPages.flatMap((page) =>
			locales.map((locale) => ({
				url: new URL(`/${locale}${page}`, baseUrl).href,
				lastModified: new Date(),
			})),
		),
		...posts.map((post) => ({
			url: new URL(`/${post.locale}/blog/${post.path}`, baseUrl).href,
			lastModified: new Date(),
		})),
		...allLegalPages.map((page) => {
			const pathParts = page._meta.path.split("/");
			const locale = pathParts[0] || config.i18n.defaultLocale;
			const path =
				pathParts.slice(1).join("/") ||
				page._meta.fileName.replace(".md", "");
			return {
				url: new URL(`/${locale}/legal/${path}`, baseUrl).href,
				lastModified: new Date(),
			};
		}),
		...docsSource.getPages().map((page) => ({
			url: new URL(
				`/${page.locale}/docs/${page.slugs.join("/")}`,
				baseUrl,
			).href,
			lastModified: new Date(),
		})),
	];

	// Cache the result
	cachedSitemap = sitemapData;
	lastCacheTime = now;

	console.log(
		`[sitemap] Generated sitemap with ${sitemapData.length} entries`,
	);

	return sitemapData;
}
