"use client";

import { useQuery } from "@tanstack/react-query";

interface OrganizationMember {
	id: string;
	role: string;
	createdAt: string;
	user: {
		id: string;
		name: string;
		username: string | null;
		image: string | null;
		cpValue: number;
		createdAt: string;
		userRoleString: string | null;
		currentWorkOn: string | null;
		email?: string | null;
	};
}

interface OrganizationEvent {
	id: string;
	title: string;
	startTime: string;
	type: string;
}

interface OrganizationData {
	id: string;
	name: string;
	slug: string;
	summary: string | null;
	description: string | null;
	location: string | null;
	tags: string[];
	logo: string | null;
	coverImage: string | null;
	audienceQrCode: string | null;
	memberQrCode: string | null;
	membershipRequirements: string | null;
	contactInfo: string | null;
	members: OrganizationMember[];
	events: OrganizationEvent[];
	membersCount: number;
	eventsCount: number;
	createdAt: string;
}

export function useOrganizationBySlug(slug: string) {
	return useQuery({
		queryKey: ["organization", "by-slug", slug],
		queryFn: async (): Promise<OrganizationData> => {
			// First try to fetch by slug
			let response = await fetch(`/api/organizations/by-slug/${slug}`);

			// If that fails, try to fetch by ID (for backward compatibility)
			if (!response.ok && response.status === 404) {
				response = await fetch(`/api/organizations/${slug}`);
			}

			if (!response.ok) {
				if (response.status === 404) {
					throw new Error("Organization not found");
				}
				throw new Error("Failed to fetch organization");
			}

			return response.json();
		},
		staleTime: 1000 * 60 * 5, // 5 minutes
		gcTime: 1000 * 60 * 10, // 10 minutes
		retry: (failureCount, error: any) => {
			// Don't retry on 404 errors
			if (error?.message === "Organization not found") {
				return false;
			}
			return failureCount < 3;
		},
	});
}

export function useUserOrganizations(userId: string) {
	return useQuery({
		queryKey: ["user-organizations", userId],
		queryFn: async () => {
			const response = await fetch(`/api/users/${userId}/organizations`);
			if (!response.ok) {
				throw new Error("Failed to fetch user organizations");
			}
			return response.json();
		},
		enabled: !!userId,
		staleTime: 1000 * 60 * 5,
		gcTime: 1000 * 60 * 10,
	});
}
