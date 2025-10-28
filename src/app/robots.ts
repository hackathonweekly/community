import type { MetadataRoute } from "next";

/**
 * Robots.txt configuration for HackathonWeekly
 * Allows all search engines to crawl the entire site
 */
export default function robots(): MetadataRoute.Robots {
	return {
		rules: [
			{
				userAgent: "*",
				allow: "/",
			},
		],
	};
}
