import { OrganizationPublicHomepage } from "@/modules/public/organizations/components/OrganizationPublicHomepage";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";

// Enable ISR: Revalidate every 60 minutes for organizations (they change less frequently)
export const revalidate = 3600;

interface OrganizationPageProps {
	params: Promise<{ slug: string }>;
}

export async function generateMetadata({
	params,
}: OrganizationPageProps): Promise<Metadata> {
	const { slug } = await params;
	const locale = await getLocale();
	const t = await getTranslations({ locale, namespace: "organizations" });
	const isZh = locale?.startsWith("zh");
	const fallbackTitle = isZh ? "探索社区组织" : t("public.title");
	const fallbackDescription = isZh
		? "了解社区组织的成员与动态。"
		: t("public.description");

	// Validate slug format - should not be a file name
	if (slug.includes(".") || slug.length > 100) {
		return {
			title: fallbackTitle,
			description: fallbackDescription,
		};
	}

	// Fetch organization data for meta
	try {
		const baseUrl =
			process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL;
		if (!baseUrl) {
			console.error(
				"Missing NEXT_PUBLIC_SITE_URL or NEXT_PUBLIC_APP_URL environment variable",
			);
			return {
				title: fallbackTitle,
				description: fallbackDescription,
			};
		}

		// First try to fetch by slug
		let response = await fetch(
			`${baseUrl}/api/organizations/by-slug/${slug}`,
		);

		// If that fails, try to fetch by ID (for backward compatibility)
		if (!response.ok && response.status === 404) {
			response = await fetch(`${baseUrl}/api/organizations/${slug}`);
		}

		if (response.ok) {
			const organization = await response.json();
			const shareDescription =
				organization.description ||
				t("public.joinCommunity", { name: organization.name });
			const shareTitle = isZh
				? `加入组织：${organization.name}`
				: organization.name;
			return {
				title: isZh
					? shareTitle
					: `${organization.name} - ${t("public.title")}`,
				description: shareDescription,
				openGraph: {
					title: shareTitle,
					description: shareDescription,
					images: organization.coverImage
						? [organization.coverImage]
						: [],
				},
				twitter: {
					card: "summary_large_image",
					title: shareTitle,
					description: shareDescription,
					images: organization.coverImage
						? [organization.coverImage]
						: [],
				},
			};
		}
	} catch (error) {
		console.error("Failed to fetch organization for metadata:", error);
	}

	return {
		title: fallbackTitle,
		description: fallbackDescription,
	};
}

export default async function OrganizationPublicPage({
	params,
}: OrganizationPageProps) {
	const { slug } = await params;

	// Validate slug format - should not be a file name
	if (slug.includes(".") || slug.length > 100) {
		return notFound();
	}

	return <OrganizationPublicHomepage slug={slug} />;
}
