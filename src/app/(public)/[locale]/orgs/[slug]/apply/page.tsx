import { OrganizationApplicationForm } from "@/modules/public/organizations/components/OrganizationApplicationForm";
import { db } from "@/lib/database/prisma/client";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

interface OrganizationApplicationPageProps {
	params: Promise<{ slug: string; locale: string }>;
	searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({
	params,
}: OrganizationApplicationPageProps): Promise<Metadata> {
	const { slug } = await params;

	// Validate slug format - should not be a file name
	if (slug.includes(".") || slug.length > 100) {
		return {
			title: "申请加入组织",
			description: "申请加入社区组织",
		};
	}

	// Fetch organization data for meta
	try {
		// Use internal API call instead of external URL
		const baseUrl =
			process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL;
		if (!baseUrl) {
			console.error(
				"Missing NEXT_PUBLIC_SITE_URL or NEXT_PUBLIC_APP_URL environment variable",
			);
			return {
				title: "申请加入组织",
				description: "申请加入社区组织",
			};
		}

		const response = await fetch(
			`${baseUrl}/api/organizations/by-slug/${slug}`,
			{
				// Add headers to avoid caching issues in SSR
				cache: "no-store",
			},
		);
		if (response.ok) {
			const organization = await response.json();
			return {
				title: `申请加入 ${organization.name}`,
				description: `申请加入 ${organization.name} 组织，一起成长！`,
			};
		}
	} catch (error) {
		console.error("Failed to fetch organization for metadata:", error);
	}

	return {
		title: "申请加入组织",
		description: "申请加入社区组织",
	};
}

export default async function OrganizationApplicationPage({
	params,
	searchParams,
}: OrganizationApplicationPageProps) {
	const { slug } = await params;
	const resolvedSearch = await searchParams;
	const invitationCodeRaw = resolvedSearch?.["invited-code"];
	const invitationCode = Array.isArray(invitationCodeRaw)
		? invitationCodeRaw[0]
		: invitationCodeRaw || null;

	// Validate slug format - should not be a file name
	if (slug.includes(".") || slug.length > 100) {
		return notFound();
	}

	const organization = await db.organization.findUnique({
		where: { slug },
		select: { id: true, isPublic: true },
	});

	if (!organization || !organization.isPublic) {
		return notFound();
	}

	return (
		<OrganizationApplicationForm
			slug={slug}
			invitationCode={invitationCode}
		/>
	);
}
