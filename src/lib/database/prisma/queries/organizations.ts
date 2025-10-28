import { withOrganizationPublicUrls } from "@/lib/storage";
import { Prisma } from "@prisma/client";
import type { z } from "zod";
import { db } from "../client";
import type { OrganizationUpdateInputSchema } from "../zod";

// Type for organization with _count
type OrganizationWithCount = Prisma.OrganizationGetPayload<{
	include: {
		_count: {
			select: {
				members: true;
			};
		};
	};
}>;

export interface MarketingOrganizationsQueryParams {
	search?: string;
	tags?: string[];
	location?: string;
	page?: number;
	limit?: number;
}

export interface MarketingOrganizationSummary {
	id: string;
	name: string;
	summary: string | null;
	description: string | null;
	location: string | null;
	tags: string[];
	logo: string | null;
	slug: string | null;
	createdAt: string;
}

export interface MarketingOrganizationsResult {
	organizations: MarketingOrganizationSummary[];
	pagination: {
		page: number;
		limit: number;
		total: number;
		totalPages: number;
	};
}

export async function getOrganizations({
	limit,
	offset,
	query,
}: {
	limit: number;
	offset: number;
	query?: string;
}) {
	const normalizedQuery = query?.trim();
	const where: Prisma.OrganizationWhereInput | undefined = normalizedQuery
		? {
				name: {
					contains: normalizedQuery,
					mode: Prisma.QueryMode.insensitive,
				},
			}
		: undefined;

	const organizations = await db.organization.findMany({
		where,
		include: {
			_count: {
				select: {
					members: true,
				},
			},
		},
		take: limit,
		skip: offset,
	});

	return organizations.map((org: OrganizationWithCount) => {
		const organizationWithUrls = withOrganizationPublicUrls(org);
		return {
			...organizationWithUrls,
			membersCount: organizationWithUrls._count.members,
		};
	});
}

export async function countAllOrganizations({
	query,
}: {
	query?: string;
} = {}) {
	const normalizedQuery = query?.trim();
	const where: Prisma.OrganizationWhereInput | undefined = normalizedQuery
		? {
				name: {
					contains: normalizedQuery,
					mode: Prisma.QueryMode.insensitive,
				},
			}
		: undefined;

	return db.organization.count({ where });
}

export async function getOrganizationById(id: string) {
	const organization = await db.organization.findUnique({
		where: { id },
		include: {
			members: true,
			invitations: true,
		},
	});

	return organization ? withOrganizationPublicUrls(organization) : null;
}

export async function getInvitationById(id: string) {
	const invitation = await db.invitation.findUnique({
		where: { id },
		include: {
			organization: true,
			targetUser: {
				select: {
					id: true,
					name: true,
					email: true,
					username: true,
				},
			},
		},
	});

	if (!invitation) {
		return null;
	}

	return {
		...invitation,
		organization: withOrganizationPublicUrls(invitation.organization),
	};
}

export async function getOrganizationBySlug(slug: string) {
	const organization = await db.organization.findUnique({
		where: { slug },
	});

	return organization ? withOrganizationPublicUrls(organization) : null;
}

export async function getOrganizationMembership(
	organizationId: string,
	userId: string,
) {
	return db.member.findUnique({
		where: {
			organizationId_userId: {
				organizationId,
				userId,
			},
		},
		include: {
			organization: true,
		},
	});
}

export async function getOrganizationWithPurchasesAndMembersCount(
	organizationId: string,
) {
	const organization = await db.organization.findUnique({
		where: {
			id: organizationId,
		},
		include: {
			purchases: true,
			_count: {
				select: {
					members: true,
				},
			},
		},
	});

	if (!organization) {
		return null;
	}

	const organizationWithUrls = withOrganizationPublicUrls(organization);

	return {
		...organizationWithUrls,
		membersCount: organizationWithUrls._count.members,
	};
}

export async function getPendingInvitationByEmail(email: string) {
	return db.invitation.findFirst({
		where: {
			email,
			status: "pending",
		},
	});
}

export async function updateOrganization(
	organization: z.infer<typeof OrganizationUpdateInputSchema> & {
		id: string;
	},
) {
	return db.organization.update({
		where: {
			id: organization.id,
		},
		data: organization,
	});
}

export async function getMarketingOrganizations(
	params: MarketingOrganizationsQueryParams = {},
): Promise<MarketingOrganizationsResult> {
	const { search, tags, location } = params;
	const page = Math.max(params.page ?? 1, 1);
	const limit = Math.min(Math.max(params.limit ?? 12, 1), 50);
	const offset = (page - 1) * limit;
	const tagArray = tags?.map((tag) => tag.trim()).filter(Boolean);

	const where: Prisma.OrganizationWhereInput = {
		isPublic: true, // Only return public organizations
	};

	if (search?.trim()) {
		where.OR = [
			{
				name: {
					contains: search.trim(),
					mode: "insensitive",
				},
			},
			{
				description: {
					contains: search.trim(),
					mode: "insensitive",
				},
			},
		];
	}

	if (location?.trim()) {
		where.location = {
			contains: location.trim(),
			mode: "insensitive",
		};
	}

	if (tagArray && tagArray.length > 0) {
		where.tags = {
			hasSome: tagArray,
		};
	}

	const [organizations, total] = await Promise.all([
		db.organization.findMany({
			where,
			select: {
				id: true,
				name: true,
				summary: true,
				description: true,
				location: true,
				tags: true,
				logo: true,
				slug: true,
				createdAt: true,
			},
			orderBy: [{ createdAt: "desc" }, { id: "desc" }],
			take: limit,
			skip: offset,
		}),
		db.organization.count({ where }),
	]);

	return {
		organizations: organizations.map((organization) => {
			const organizationWithUrls =
				withOrganizationPublicUrls(organization);
			return {
				...organizationWithUrls,
				createdAt: organization.createdAt.toISOString(),
			};
		}),
		pagination: {
			page,
			limit,
			total,
			totalPages: Math.ceil(total / limit),
		},
	};
}

export async function getUserOrganizations(userId: string) {
	const organizations = await db.organization.findMany({
		where: {
			members: {
				some: {
					userId,
				},
			},
		},
		select: {
			id: true,
			name: true,
			slug: true,
			logo: true,
			createdAt: true,
			_count: {
				select: {
					members: true,
					events: true,
				},
			},
		},
		orderBy: {
			name: "asc",
		},
	});

	return organizations.map((organization) => {
		const organizationWithUrls = withOrganizationPublicUrls(organization);
		return {
			...organizationWithUrls,
			_count: organizationWithUrls._count,
		};
	});
}

export async function getUserOrganizationsWithRoles(userId: string) {
	const memberships = await db.member.findMany({
		where: {
			userId,
		},
		include: {
			organization: {
				select: {
					id: true,
					name: true,
					slug: true,
					logo: true,
					createdAt: true,
					_count: {
						select: {
							members: true,
							events: true,
						},
					},
				},
			},
		},
		orderBy: {
			organization: {
				name: "asc",
			},
		},
	});

	// 按角色分类组织
	const allOrganizations = memberships.map((membership) => ({
		...withOrganizationPublicUrls(membership.organization),
		memberRole: membership.role,
	}));

	const createdOrganizations = allOrganizations.filter(
		(org) => org.memberRole === "owner",
	);
	const managedOrganizations = allOrganizations.filter((org) =>
		["owner", "admin"].includes(org.memberRole),
	);

	return {
		all: allOrganizations,
		created: createdOrganizations,
		managed: managedOrganizations,
	};
}

export async function getUserOrganizationMembership(userId: string) {
	return db.member
		.findMany({
			where: {
				userId,
			},
			include: {
				organization: {
					select: {
						id: true,
						name: true,
						slug: true,
						logo: true,
					},
				},
			},
			orderBy: {
				organization: {
					name: "asc",
				},
			},
		})
		.then((memberships) =>
			memberships.map((membership) => ({
				...membership,
				organization: withOrganizationPublicUrls(
					membership.organization,
				),
			})),
		);
}
