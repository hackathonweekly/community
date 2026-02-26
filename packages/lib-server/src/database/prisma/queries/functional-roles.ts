import type { Prisma } from "@prisma/client";
import { db } from "../client";

interface FunctionalRoleSeedItem {
	name: string;
	description: string;
	applicableScope?: string | null;
}

// System preset functional roles defined in PRD
export const SYSTEM_PRESET_FUNCTIONAL_ROLES: FunctionalRoleSeedItem[] = [
	{
		name: "founder",
		description: "组织创始人，负责组织的整体愿景和战略方向",
	},
	{
		name: "co_founder",
		description: "联合创始人，协助创始人进行组织管理和发展",
	},
	{
		name: "director",
		description: "总负责人，负责组织日常运营和团队管理",
	},
	{
		name: "tech_lead",
		description: "技术负责人，负责技术方向和项目管理",
	},
	{
		name: "operations_lead",
		description: "运营负责人，负责活动组织和日常运营",
	},
	{
		name: "community_lead",
		description: "社区负责人，负责社区建设和成员关系维护",
	},
	{
		name: "marketing_lead",
		description: "市场负责人，负责品牌推广和对外宣传",
	},
	{
		name: "partnership_lead",
		description: "合作负责人，负责对外合作和商务拓展",
	},
	{
		name: "volunteer_lead",
		description: "志愿者负责人，负责志愿者招募和管理",
	},
	{
		name: "finance_lead",
		description: "财务负责人，负责财务管理和预算规划",
	},
	{
		name: "content_lead",
		description: "内容负责人，负责内容创作和知识分享",
	},
	{
		name: "event_lead",
		description: "活动负责人，负责活动策划和执行",
	},
	{
		name: "product_lead",
		description: "产品负责人，负责产品规划和用户体验设计",
	},
	{
		name: "design_lead",
		description: "设计负责人，负责UI/UX设计和视觉规范制定",
	},
	{
		name: "education_lead",
		description: "教育负责人，负责培训课程和知识传播体系",
	},
	{
		name: "mentor_lead",
		description: "导师负责人，负责导师项目和新人指导计划",
	},
	{
		name: "learning_lead",
		description: "学习负责人，负责学习资源管理和知识传播体系",
	},
	{
		name: "membership_lead",
		description: "会员负责人，负责会员招募、留存和发展",
	},
];

export async function initializeSystemFunctionalRoles() {
	const createdRoles = [];

	for (const role of SYSTEM_PRESET_FUNCTIONAL_ROLES) {
		const applicableScope = role.applicableScope ?? "community";

		const existingRole = await db.functionalRole.findFirst({
			where: {
				name: role.name,
				organizationId: null,
			},
		});

		if (existingRole) {
			const updatedRole = await db.functionalRole.update({
				where: { id: existingRole.id },
				data: {
					description: role.description,
					applicableScope,
					isActive: true,
				},
			});

			createdRoles.push(updatedRole);
			continue;
		}

		const createdRole = await db.functionalRole.create({
			data: {
				name: role.name,
				description: role.description,
				applicableScope,
				isActive: true,
			},
		});

		createdRoles.push(createdRole);
	}

	return createdRoles;
}

interface FunctionalRoleQueryOptions {
	organizationId?: string | null;
	includeInactive?: boolean;
	includeSystemRoles?: boolean;
	search?: string;
	roleType?: "system" | "custom" | "all";
}

export async function getFunctionalRolesForOrganization(
	options: FunctionalRoleQueryOptions = {},
) {
	const {
		organizationId = null,
		includeInactive = false,
		includeSystemRoles = true,
		search,
		roleType = "all",
	} = options;

	const roleFilters: Prisma.FunctionalRoleWhereInput[] = [];

	if (!includeInactive) {
		roleFilters.push({ isActive: true });
	}

	if (search) {
		roleFilters.push({
			OR: [
				{ name: { contains: search, mode: "insensitive" } },
				{ description: { contains: search, mode: "insensitive" } },
			],
		});
	}

	const roleTypeFilter: Prisma.FunctionalRoleWhereInput[] = [];

	if (roleType === "system") {
		roleTypeFilter.push({ organizationId: null });
	} else if (roleType === "custom") {
		if (!organizationId) {
			// No organization specified means no custom roles to fetch
			return [];
		}
		roleTypeFilter.push({ organizationId });
	} else {
		const typeConditions: Prisma.FunctionalRoleWhereInput[] = [];
		if (includeSystemRoles) {
			typeConditions.push({ organizationId: null });
		}
		if (organizationId) {
			typeConditions.push({ organizationId });
		}

		if (typeConditions.length > 0) {
			roleTypeFilter.push({ OR: typeConditions });
		}
	}

	const roles = await db.functionalRole.findMany({
		where: {
			AND: [...roleFilters, ...roleTypeFilter],
		},
		orderBy: [{ organizationId: "asc" }, { name: "asc" }],
	});

	return roles;
}

interface RoleAssignmentConflictCheckInput {
	functionalRoleId: string;
	organizationId: string;
	startDate: Date;
	endDate?: Date | null;
	excludeAssignmentId?: string;
}

export async function findOverlappingRoleAssignment({
	functionalRoleId,
	organizationId,
	startDate,
	endDate,
	excludeAssignmentId,
}: RoleAssignmentConflictCheckInput) {
	const effectiveEndDate = endDate ?? new Date("9999-12-31T23:59:59.999Z");

	return db.roleAssignment.findFirst({
		where: {
			functionalRoleId,
			organizationId,
			isActive: true,
			id: excludeAssignmentId ? { not: excludeAssignmentId } : undefined,
			startDate: { lte: effectiveEndDate },
			OR: [{ endDate: null }, { endDate: { gte: startDate } }],
		},
		include: {
			user: {
				select: {
					id: true,
					name: true,
					username: true,
				},
			},
			functionalRole: {
				select: {
					id: true,
					name: true,
				},
			},
		},
	});
}

export type RoleAssignmentStatus =
	| "UPCOMING"
	| "ACTIVE"
	| "HISTORICAL"
	| "INACTIVE";

export type RoleAssignmentStatusFilter =
	| "all"
	| "active"
	| "upcoming"
	| "historical"
	| "inactive";

export type FunctionalRoleTypeFilter = "all" | "system" | "custom";

export function computeRoleAssignmentStatus(assignment: {
	startDate: Date;
	endDate: Date | null;
	isActive: boolean;
}): RoleAssignmentStatus {
	if (!assignment.isActive) {
		return "INACTIVE";
	}

	const now = new Date();
	if (assignment.startDate > now) {
		return "UPCOMING";
	}

	if (assignment.endDate && assignment.endDate < now) {
		return "HISTORICAL";
	}

	return "ACTIVE";
}

export async function getUserRoleAssignments(userId: string) {
	return db.roleAssignment.findMany({
		where: { userId },
		include: {
			functionalRole: true,
			organization: {
				select: {
					id: true,
					name: true,
					slug: true,
					logo: true,
				},
			},
		},
		orderBy: [{ startDate: "desc" }],
	});
}

export interface RoleAssignmentFilterOptions {
	userId?: string;
	organizationId?: string;
	organizationSlug?: string;
	roleType?: FunctionalRoleTypeFilter;
	includeInactive?: boolean;
	status?: RoleAssignmentStatusFilter;
	search?: string;
}

export function buildRoleAssignmentWhere({
	userId,
	organizationId,
	organizationSlug,
	roleType = "all",
	includeInactive = false,
	status = "all",
	search,
}: RoleAssignmentFilterOptions = {}): Prisma.RoleAssignmentWhereInput {
	const filters: Prisma.RoleAssignmentWhereInput[] = [];

	if (userId) {
		filters.push({ userId });
	}

	if (organizationId) {
		filters.push({ organizationId });
	}

	if (organizationSlug) {
		filters.push({ organization: { slug: organizationSlug } });
	}

	if (roleType === "system") {
		filters.push({ functionalRole: { organizationId: null } });
	} else if (roleType === "custom") {
		filters.push({ functionalRole: { organizationId: { not: null } } });
	}

	if (!includeInactive && status === "all") {
		filters.push({ isActive: true });
	}

	const now = new Date();

	switch (status) {
		case "active":
			filters.push({
				isActive: true,
				startDate: { lte: now },
				OR: [{ endDate: null }, { endDate: { gte: now } }],
			});
			break;
		case "upcoming":
			filters.push({ isActive: true, startDate: { gt: now } });
			break;
		case "historical":
			filters.push({ isActive: true, endDate: { lt: now } });
			break;
		case "inactive":
			filters.push({ isActive: false });
			break;
		default:
			break;
	}

	if (search) {
		filters.push({
			OR: [
				{
					user: {
						is: {
							OR: [
								{
									name: {
										contains: search,
										mode: "insensitive",
									},
								},
								{
									username: {
										contains: search,
										mode: "insensitive",
									},
								},
							],
						},
					},
				},
				{
					functionalRole: {
						is: {
							name: { contains: search, mode: "insensitive" },
						},
					},
				},
				{
					organization: {
						is: {
							name: { contains: search, mode: "insensitive" },
							slug: { contains: search, mode: "insensitive" },
						},
					},
				},
			],
		});
	}

	if (filters.length === 0) {
		return {};
	}

	return { AND: filters };
}
