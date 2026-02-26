import type { ActiveOrganization } from "@community/lib-server/auth";
import { authClient } from "@community/lib-client/auth/client";
import { useQuery } from "@tanstack/react-query";

// Helper function to transform null to undefined for optional fields
export function transformOrganization<T extends Record<string, any>>(
	org: T,
): T {
	const transformed: any = { ...org };
	const nullableFields = [
		"logo",
		"coverImage",
		"audienceQrCode",
		"memberQrCode",
		"summary",
		"description",
		"location",
		"contactInfo",
		"membershipRequirements",
	] as const;
	for (const field of nullableFields) {
		if (field in transformed && transformed[field] === null) {
			transformed[field] = undefined;
		}
	}
	return transformed;
}

export const organizationListQueryKey = ["user", "organizations"] as const;

export const organizationsByRoleQueryKey = [
	"user",
	"organizations",
	"by-role",
] as const;
export const useOrganizationsByRoleQuery = () => {
	return useQuery({
		queryKey: organizationsByRoleQueryKey,
		queryFn: async () => {
			const response = await fetch("/api/user/organizations");

			if (!response.ok) {
				throw new Error("Failed to fetch organizations with roles");
			}

			const result = await response.json();

			if (!result.success) {
				throw new Error(
					result.error || "Failed to fetch organizations",
				);
			}

			return result.data;
		},
	});
};

export const activeOrganizationQueryKey = (slug: string) =>
	["user", "activeOrganization", slug] as const;
export const useActiveOrganizationQuery = (
	slug: string,
	options?: {
		enabled?: boolean;
	},
) => {
	return useQuery({
		queryKey: activeOrganizationQueryKey(slug),
		queryFn: async () => {
			const { data, error } =
				await authClient.organization.getFullOrganization({
					query: {
						organizationSlug: slug,
					},
				});

			if (error) {
				throw new Error(
					error.message || "Failed to fetch active organization",
				);
			}

			return data
				? (transformOrganization(data) as ActiveOrganization)
				: data;
		},
		enabled: options?.enabled,
	});
};

export const fullOrganizationQueryKey = (id: string) =>
	["fullOrganization", id] as const;
export const useFullOrganizationQuery = (id: string) => {
	return useQuery({
		queryKey: fullOrganizationQueryKey(id),
		queryFn: async () => {
			const { data, error } =
				await authClient.organization.getFullOrganization({
					query: {
						organizationId: id,
					},
				});

			if (error) {
				throw new Error(
					error.message || "Failed to fetch full organization",
				);
			}

			return data
				? (transformOrganization(data) as ActiveOrganization)
				: data;
		},
	});
};
