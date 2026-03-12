import { OrganizationTabbedPage } from "@/modules/public/organizations/components/OrganizationTabbedPage";
import {
	type OrganizationTabKey,
	isOrganizationTabKey,
} from "@/modules/public/organizations/components/organization-tabs-shared";
import {
	getOrganizationById,
	getOrganizationBySlug,
	getOrganizationMembership,
} from "@community/lib-server/database/prisma/queries/organizations";
import { getSession } from "@shared/auth/lib/server";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";

export const revalidate = 3600;

interface OrganizationPageProps {
	params: Promise<{ slug: string }>;
	searchParams: Promise<{ tab?: string | string[] }>;
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

	if (slug.includes(".") || slug.length > 100) {
		return {
			title: fallbackTitle,
			description: fallbackDescription,
		};
	}

	try {
		const baseUrl =
			process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL;
		if (!baseUrl) {
			return {
				title: fallbackTitle,
				description: fallbackDescription,
			};
		}

		let response = await fetch(
			`${baseUrl}/api/organizations/by-slug/${slug}`,
		);

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
	searchParams,
}: OrganizationPageProps) {
	const { slug } = await params;
	const { tab } = await searchParams;
	const tabValue = Array.isArray(tab) ? tab[0] : tab;

	if (slug.includes(".") || slug.length > 100) {
		return notFound();
	}

	let organization = await getOrganizationBySlug(slug);
	if (!organization) {
		organization = await getOrganizationById(slug);
	}
	if (!organization) {
		return notFound();
	}

	const session = await getSession();
	const membership = session?.user?.id
		? await getOrganizationMembership(organization.id, session.user.id)
		: null;

	const isMember = !!membership;
	const isMemberAdmin =
		membership?.role === "owner" || membership?.role === "admin";

	const fallbackTab: OrganizationTabKey = isMember ? "members" : "overview";
	const activeTab = isOrganizationTabKey(tabValue) ? tabValue : fallbackTab;
	const canonicalSlug = organization.slug ?? slug;

	if (canonicalSlug !== slug || !isOrganizationTabKey(tabValue)) {
		redirect(`/orgs/${canonicalSlug}?tab=${activeTab}`);
	}

	return (
		<OrganizationTabbedPage
			slug={canonicalSlug}
			defaultTab={activeTab}
			isMember={isMember}
			isMemberAdmin={isMemberAdmin}
		/>
	);
}
