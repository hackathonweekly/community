import { db } from "@community/lib-server/database/prisma/client";
import {
	buildRoleAssignmentWhere,
	computeRoleAssignmentStatus,
	getFunctionalRolesForOrganization,
} from "@community/lib-server/database/prisma/queries/functional-roles";
import { Hono } from "hono";
import { validator } from "hono-openapi/zod";
import { z } from "zod";

const roleTypeEnum = z.enum(["all", "system", "custom"]);
const statusEnum = z.enum([
	"all",
	"active",
	"upcoming",
	"historical",
	"inactive",
]);

const rolesQuerySchema = z.object({
	organizationId: z.string().optional(),
	organizationSlug: z.string().optional(),
	roleType: roleTypeEnum.optional(),
	includeInactive: z.enum(["true", "false"]).optional(),
	search: z.string().optional(),
});

const assignmentsQuerySchema = z.object({
	organizationId: z.string().optional(),
	organizationSlug: z.string().optional(),
	functionalRoleId: z.string().optional(),
	roleType: roleTypeEnum.optional(),
	status: statusEnum.optional(),
	includeInactive: z.enum(["true", "false"]).optional(),
	page: z.coerce.number().min(1).optional(),
	limit: z.coerce.number().min(1).max(100).optional(),
	search: z.string().optional(),
});

function resolveBooleanFlag(value: string | undefined, defaultValue: boolean) {
	if (value === undefined) {
		return defaultValue;
	}
	return value === "true";
}

async function resolveOrganizationId(
	organizationId?: string,
	organizationSlug?: string,
) {
	if (organizationId) {
		return { id: organizationId };
	}

	if (!organizationSlug) {
		return null;
	}

	const organization = await db.organization.findUnique({
		where: { slug: organizationSlug },
		select: { id: true, name: true, slug: true },
	});

	if (!organization) {
		return null;
	}

	return organization;
}

export const functionalRolesRouter = new Hono()
	.basePath("/functional-roles")
	.get("/", validator("query", rolesQuerySchema), async (c) => {
		const {
			organizationId,
			organizationSlug,
			roleType,
			includeInactive,
			search,
		} = c.req.valid("query");

		const organization = await resolveOrganizationId(
			organizationId,
			organizationSlug,
		);

		if (organizationSlug && !organization) {
			return c.json({ error: "Organization not found" }, 404);
		}

		const roles = await getFunctionalRolesForOrganization({
			organizationId: organization?.id ?? null,
			roleType: roleType ?? "all",
			includeInactive: resolveBooleanFlag(includeInactive, false),
			search,
		});

		return c.json({
			roles,
			organization,
		});
	})
	.get(
		"/assignments",
		validator("query", assignmentsQuerySchema),
		async (c) => {
			const query = c.req.valid("query");

			const organization = await resolveOrganizationId(
				query.organizationId,
				query.organizationSlug,
			);

			if (query.organizationSlug && !organization) {
				return c.json({ error: "Organization not found" }, 404);
			}

			const includeInactive = resolveBooleanFlag(
				query.includeInactive,
				false,
			);
			const roleType = query.roleType ?? "all";
			const status = query.status ?? "active";
			const page = query.page ?? 1;
			const limit = query.limit ?? 20;

			const resolvedOrganizationSlug =
				organization && "slug" in organization
					? organization.slug
					: undefined;

			const baseFilter = buildRoleAssignmentWhere({
				organizationId: organization?.id,
				organizationSlug:
					resolvedOrganizationSlug ?? query.organizationSlug,
				roleType,
				includeInactive,
				status,
				search: query.search,
			});

			const filters: Array<Record<string, unknown>> = [];

			if (Object.keys(baseFilter).length > 0) {
				filters.push(baseFilter);
			}

			if (query.functionalRoleId) {
				filters.push({ functionalRoleId: query.functionalRoleId });
			}

			const where = filters.length > 0 ? { AND: filters } : undefined;

			const [assignments, total] = await Promise.all([
				db.roleAssignment.findMany({
					where,
					include: {
						user: {
							select: {
								id: true,
								name: true,
								username: true,
								image: true,
							},
						},
						organization: {
							select: {
								id: true,
								name: true,
								slug: true,
								logo: true,
							},
						},
						functionalRole: true,
					},
					orderBy: [{ startDate: "desc" }],
					skip: (page - 1) * limit,
					take: limit,
				}),
				db.roleAssignment.count({ where }),
			]);

			const results = assignments.map((assignment) => {
				const roleAssignment = assignment as typeof assignment & {
					functionalRole?: { organizationId?: string | null };
				};
				return {
					...assignment,
					status: computeRoleAssignmentStatus(roleAssignment),
					roleType: roleAssignment.functionalRole?.organizationId
						? "custom"
						: "system",
				};
			});

			return c.json({
				assignments: results,
				organization,
				pagination: {
					page,
					limit,
					total,
					totalPages: Math.ceil(total / limit),
				},
			});
		},
	);
