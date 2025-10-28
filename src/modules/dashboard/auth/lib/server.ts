import "server-only";
import { auth, type ActiveOrganization, type User } from "@/lib/auth";
import { getInvitationById } from "@/lib/database";
import { getPublicStorageUrl } from "@/lib/storage";
import { headers } from "next/headers";
import { cache } from "react";

export const getSession = cache(async () => {
	const session = await auth.api.getSession({
		headers: await headers(),
		query: {
			disableCookieCache: true,
		},
	});

	// Type cast user to our extended User type if session exists
	if (session) {
		return {
			...session,
			user: session.user as User,
		};
	}

	return session;
});

export const getActiveOrganization = cache(async (slug: string) => {
	try {
		const activeOrganization = await (auth.api as any).getFullOrganization({
			query: {
				organizationSlug: slug,
			},
			headers: await headers(),
		});

		// Convert storage paths to full URLs
		if (activeOrganization) {
			return {
				...activeOrganization,
				logo: activeOrganization.logo
					? getPublicStorageUrl(activeOrganization.logo)
					: undefined,
				coverImage: activeOrganization.coverImage
					? getPublicStorageUrl(activeOrganization.coverImage)
					: undefined,
				audienceQrCode: activeOrganization.audienceQrCode
					? getPublicStorageUrl(activeOrganization.audienceQrCode)
					: undefined,
				memberQrCode: activeOrganization.memberQrCode
					? getPublicStorageUrl(activeOrganization.memberQrCode)
					: undefined,
			} as ActiveOrganization;
		}

		return activeOrganization;
	} catch (error) {
		return null;
	}
});

export const getOrganizationList = cache(async () => {
	try {
		const organizationList = await (auth.api as any).listOrganizations({
			headers: await headers(),
		});

		// Convert storage paths to full URLs for each organization
		return organizationList.map((org: any) => ({
			...org,
			logo: org.logo ? getPublicStorageUrl(org.logo) : undefined,
			coverImage: org.coverImage
				? getPublicStorageUrl(org.coverImage)
				: undefined,
			audienceQrCode: org.audienceQrCode
				? getPublicStorageUrl(org.audienceQrCode)
				: undefined,
			memberQrCode: org.memberQrCode
				? getPublicStorageUrl(org.memberQrCode)
				: undefined,
		}));
	} catch (error) {
		return [];
	}
});

export const getUserAccounts = cache(async () => {
	try {
		const userAccounts = await auth.api.listUserAccounts({
			headers: await headers(),
		});

		return userAccounts;
	} catch (error) {
		return [];
	}
});

export const getUserPasskeys = cache(async () => {
	try {
		const userPasskeys = await (auth.api as any).listPasskeys({
			headers: await headers(),
		});

		return userPasskeys;
	} catch (error) {
		return [];
	}
});

export const getInvitation = cache(async (id: string) => {
	try {
		return await getInvitationById(id);
	} catch (error) {
		return null;
	}
});
