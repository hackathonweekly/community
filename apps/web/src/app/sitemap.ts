import { config } from "@community/config";
import { getBaseUrl } from "@community/lib-shared/utils";
import { getAllPosts } from "@/modules/public/blog/utils/lib/posts";
import { allLegalPages } from "content-collections";
import type { MetadataRoute } from "next";
import { docsSource } from "./docs-source";

const baseUrl = getBaseUrl();
const localeKeys = Object.keys(config.i18n.locales);

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
	const uniqueUrls = new Map<string, MetadataRoute.Sitemap[number]>();

	const normalizePath = (path: string) => {
		const clean = path.startsWith("/") ? path : `/${path}`;
		const segments = clean.split("/").filter(Boolean);
		if (segments.length > 0 && localeKeys.includes(segments[0])) {
			const stripped = segments.slice(1);
			return stripped.length > 0 ? `/${stripped.join("/")}` : "/";
		}
		return clean === "" ? "/" : clean;
	};

	const addUrl = (path: string) => {
		const url = new URL(normalizePath(path), baseUrl).href;
		if (!uniqueUrls.has(url)) {
			uniqueUrls.set(url, {
				url,
				lastModified: new Date(),
			});
		}
	};

	staticMarketingPages.forEach((page) => {
		addUrl(page);
	});

	posts.forEach((post) => {
		addUrl(`/blog/${post.path}`);
	});

	allLegalPages.forEach((page) => {
		const fileName = page._meta.fileName.replace(/\.mdx?$/, "");
		const fileParts = fileName.split(".");
		const basePath =
			fileParts.length > 1 ? fileParts.slice(0, -1).join(".") : fileName;
		addUrl(`/legal/${basePath}`);
	});

	docsSource.getPages().forEach((page) => {
		const slugs =
			page.slugs[0] && localeKeys.includes(page.slugs[0])
				? page.slugs.slice(1)
				: page.slugs;
		addUrl(`/docs/${slugs.join("/")}`);
	});

	const sitemapData = Array.from(uniqueUrls.values());

	// Cache the result
	cachedSitemap = sitemapData;
	lastCacheTime = now;

	console.log(
		`[sitemap] Generated sitemap with ${sitemapData.length} entries`,
	);

	return sitemapData;
}
