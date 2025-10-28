import type { ActiveOrganization, OrganizationMetadata } from "@/lib/auth";
import { authClient } from "@/lib/auth/client";
import { apiClient } from "@/lib/api/api-client";
import { useMutation, useQuery } from "@tanstack/react-query";

// Helper function to transform null to undefined for optional fields
function transformOrganization<T extends Record<string, any>>(org: T): T {
	const transformed: any = { ...org };
	// Transform specific nullable fields to undefined
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
export const useOrganizationListQuery = () => {
	return useQuery({
		queryKey: organizationListQueryKey,
		queryFn: async () => {
			const { data, error } = await authClient.organization.list();

			if (error) {
				throw new Error(
					error.message || "Failed to fetch organizations",
				);
			}

			return data;
		},
	});
};

// 新增：使用新的API获取按角色分类的组织数据
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

export interface OrganizationInvitationMetadata {
	originalEmail?: string | null;
	targetUserId?: string | null;
	placeholderEmailUsed?: boolean;
	notificationSent?: boolean;
	linkType?: string;
	createdByUserId?: string;
	claimedByUserId?: string | null;
	pendingProfileUserId?: string | null;
	pendingProfileMissing?: string[];
}

export interface OrganizationInvitationTarget {
	id: string;
	name: string | null;
	email: string | null;
	username: string | null;
	image: string | null;
}

export interface OrganizationInvitationSummary {
	id: string;
	organizationId: string;
	role: string | null;
	status: string;
	email: string | null;
	expiresAt: string;
	targetUserId: string | null;
	targetUser: OrganizationInvitationTarget | null;
	inviter: {
		id: string;
		name: string | null;
		email: string | null;
	} | null;
	metadata: OrganizationInvitationMetadata;
	linkType?: string;
	notificationSent: boolean;
	sharePath: string;
	shareUrl: string;
	createdAt: string;
	updatedAt: string;
}

export interface CreateOrganizationInvitationPayload {
	role: "member" | "admin";
	email?: string;
	targetUserId?: string;
}

export const organizationInvitationsQueryKey = (slug: string) =>
	["organization", slug, "invitations"] as const;

export const useOrganizationInvitationsQuery = (
	slug: string | undefined,
	options?: {
		enabled?: boolean;
	},
) => {
	return useQuery({
		queryKey: organizationInvitationsQueryKey(slug ?? ""),
		enabled: Boolean(slug) && (options?.enabled ?? true),
		queryFn: async () => {
			if (!slug) {
				return [] as OrganizationInvitationSummary[];
			}

			const response = await fetch(
				`/api/organizations/${slug}/invitations`,
			);

			if (!response.ok) {
				const errorBody = await response.json().catch(() => ({}));
				throw new Error(
					errorBody.error ||
						"Failed to fetch organization invitations",
				);
			}

			const data = await response.json();
			return Array.isArray(data.invitations)
				? (data.invitations as OrganizationInvitationSummary[])
				: [];
		},
	});
};

export const createOrganizationInvitation = async ({
	slug,
	payload,
}: {
	slug: string;
	payload: CreateOrganizationInvitationPayload;
}) => {
	const response = await fetch(`/api/organizations/${slug}/invitations`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(payload),
	});

	if (!response.ok) {
		const errorBody = await response.json().catch(() => ({}));
		throw new Error(
			errorBody.error || "Failed to create organization invitation",
		);
	}

	const data = await response.json();
	return data.invitation as OrganizationInvitationSummary;
};

export const generateOrganizationSlug = async (name: string) => {
	const response = await apiClient.organizations["generate-slug"].$get({
		query: {
			name,
		},
	});

	if (!response.ok) {
		throw new Error("Failed to generate organization slug");
	}

	const { slug } = await response.json();

	return slug;
};

/*
 * Create organization
 */
export const createOrganizationMutationKey = ["create-organization"] as const;
export const useCreateOrganizationMutation = () => {
	return useMutation({
		mutationKey: createOrganizationMutationKey,
		mutationFn: async ({
			name,
			metadata: _metadata, // Renamed to indicate it's intentionally unused
		}: {
			name: string;
			metadata?: OrganizationMetadata;
		}) => {
			// Use the same API endpoint as EnhancedCreateOrganizationForm
			const response = await fetch("/api/organizations/create", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					name,
					summary: "", // Default empty values for required fields
					description: "A new community organization", // Minimum 20 chars required
					location: "TBD", // Minimum 2 chars required
					tags: ["community"], // Minimum 1 tag required
					logo: "",
					coverImage: "",
					audienceQrCode: "",
					membershipRequirements: "",
					// Note: metadata is not used in this API endpoint
				}),
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.error || "Failed to create organization");
			}

			const data = await response.json();
			return data;
		},
	});
};

/*
 * Update organization
 */
export const updateOrganizationMutationKey = ["update-organization"] as const;
export const useUpdateOrganizationMutation = () => {
	return useMutation({
		mutationKey: updateOrganizationMutationKey,
		mutationFn: async ({
			id,
			name,
			metadata,
			updateSlug,
		}: {
			id: string;
			name: string;
			metadata?: OrganizationMetadata;
			updateSlug?: boolean;
		}) => {
			const { error, data } = await authClient.organization.update({
				organizationId: id,
				data: {
					name,
					slug: updateSlug
						? await generateOrganizationSlug(name)
						: undefined,
					metadata,
				},
			});

			if (error) {
				throw error;
			}

			return data;
		},
	});
};
