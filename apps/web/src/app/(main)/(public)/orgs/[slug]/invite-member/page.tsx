import { OrganizationMemberInvitationForm } from "@/modules/public/organizations/components/OrganizationMemberInvitationForm";
import { db } from "@community/lib-server/database/prisma/client";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";

interface InviteMemberPageProps {
	params: Promise<{ slug: string }>;
}

export async function generateMetadata({
	params,
}: InviteMemberPageProps): Promise<Metadata> {
	const { slug } = await params;
	const locale = await getLocale();
	const t = await getTranslations({ locale, namespace: "organizations" });
	const isZh = locale?.startsWith("zh");
	const fallbackTitle = isZh
		? "邀请成员加入组织"
		: "Invite Member to Organization";

	// Validate slug format
	if (slug.includes(".") || slug.length > 100) {
		return {
			title: fallbackTitle,
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
			};
		}

		const response = await fetch(
			`${baseUrl}/api/organizations/by-slug/${slug}`,
		);

		if (response.ok) {
			const organization = await response.json();
			return {
				title: isZh
					? `邀请成员 - ${organization.name}`
					: `Invite Member - ${organization.name}`,
				description: isZh
					? `邀请新成员加入 ${organization.name}`
					: `Invite new members to join ${organization.name}`,
			};
		}
	} catch (error) {
		console.error("Failed to fetch organization for metadata:", error);
	}

	return {
		title: fallbackTitle,
	};
}

export default async function InviteMemberPage({
	params,
}: InviteMemberPageProps) {
	const { slug } = await params;

	// Validate slug format
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

	return <OrganizationMemberInvitationForm slug={slug} />;
}
