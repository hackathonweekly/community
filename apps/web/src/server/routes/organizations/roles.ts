import { auth } from "@community/lib-server/auth";
import { isAdmin } from "@community/lib-shared/auth/permissions";
import { db } from "@community/lib-server/database/prisma/client";
import {
	buildRoleAssignmentWhere,
	computeRoleAssignmentStatus,
	findOverlappingRoleAssignment,
	getFunctionalRolesForOrganization,
} from "@community/lib-server/database/prisma/queries/functional-roles";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";

interface OrganizationMemberSummary {
	userId: string;
	role: string;
}

interface OrganizationContext {
	id: string;
	slug: string;
	name: string;
	members: OrganizationMemberSummary[];
}

type MiddlewareVariables = {
	session: any;
	user: any;
	organization: OrganizationContext;
};

const roleTypeEnum = z.enum(["all", "system", "custom"]);
const statusEnum = z.enum([
	"all",
	"active",
	"upcoming",
	"historical",
	"inactive",
]);

const listRolesQuerySchema = z.object({
	roleType: roleTypeEnum.optional(),
	includeInactive: z.enum(["true", "false"]).optional(),
	search: z.string().optional(),
});

const assignmentsQuerySchema = z.object({
	roleType: roleTypeEnum.optional(),
	includeInactive: z.enum(["true", "false"]).optional(),
	status: statusEnum.optional(),
	page: z.coerce.number().min(1).optional(),
	limit: z.coerce.number().min(1).max(100).optional(),
	search: z.string().optional(),
});

const createRoleSchema = z.object({
	name: z.string().min(1).max(64),
	description: z.string().min(1).max(500),
	applicableScope: z.string().max(255).optional(),
});

const updateRoleSchema = createRoleSchema.partial().extend({
	isActive: z.boolean().optional(),
});

const dateStringSchema = z
	.string()
	.min(1)
	.refine((value) => !Number.isNaN(new Date(value).getTime()), {
		message: "Invalid date",
	});

const createAssignmentSchema = z.object({
	userId: z.string().min(1),
	functionalRoleId: z.string().min(1),
	startDate: dateStringSchema,
	endDate: dateStringSchema.nullish(),
	isActive: z.boolean().optional(),
});

const updateAssignmentSchema = z
	.object({
		startDate: dateStringSchema.optional(),
		endDate: dateStringSchema.nullish(),
		isActive: z.boolean().optional(),
	})
	.refine((data) => Object.keys(data).length > 0, {
		message: "至少需要提供一个更新字段",
	});

function parseDate(value: string | null | undefined) {
	if (!value) {
		return null;
	}
	const parsed = new Date(value);
	if (Number.isNaN(parsed.getTime())) {
		throw new Error("Invalid date provided");
	}
	return parsed;
}

function resolveBooleanFlag(value: string | undefined, defaultValue: boolean) {
	if (value === undefined) {
		return defaultValue;
	}
	return value === "true";
}

function isOrganizationManager(
	organization: OrganizationContext,
	user: { id: string; role?: string | null },
) {
	if (isAdmin(user)) {
		return true;
	}

	return organization.members.some((member) => {
		if (member.userId !== user.id) {
			return false;
		}

		const normalizedRole = member.role ? member.role.toLowerCase() : "";
		return normalizedRole === "owner" || normalizedRole === "admin";
	});
}

export const organizationRolesRouter = new Hono<{
	Variables: MiddlewareVariables;
}>();

organizationRolesRouter.use("/*", async (c, next) => {
	const session = await auth.api.getSession({
		headers: c.req.raw.headers,
		query: {
			disableCookieCache: true,
		},
	});

	if (!session) {
		return c.json({ error: "Unauthorized" }, 401);
	}

	const organizationSlug = c.req.param("organizationSlug");

	if (!organizationSlug) {
		return c.json({ error: "Organization slug is required" }, 400);
	}

	const organization = await db.organization.findUnique({
		where: { slug: organizationSlug },
		select: {
			id: true,
			slug: true,
			name: true,
			members: {
				select: {
					userId: true,
					role: true,
				},
			},
		},
	});

	if (!organization) {
		return c.json({ error: "Organization not found" }, 404);
	}

	if (!isOrganizationManager(organization, session.user)) {
		return c.json({ error: "Insufficient permissions" }, 403);
	}

	c.set("session", session.session);
	c.set("user", session.user);
	c.set("organization", organization);

	await next();
});

organizationRolesRouter.get(
	"/",
	zValidator("query", listRolesQuerySchema),
	async (c) => {
		const organization = c.get("organization");
		const { roleType, includeInactive, search } = c.req.valid("query");

		const includeInactiveFlag = resolveBooleanFlag(includeInactive, false);
		const resolvedRoleType = roleType ?? "all";

		const roles = await getFunctionalRolesForOrganization({
			organizationId: organization.id,
			includeInactive: includeInactiveFlag,
			roleType: resolvedRoleType,
			search,
		});

		return c.json({ roles });
	},
);

organizationRolesRouter.post(
	"/",
	zValidator("json", createRoleSchema),
	async (c) => {
		const organization = c.get("organization");
		const data = c.req.valid("json");

		const existing = await db.functionalRole.findFirst({
			where: {
				organizationId: organization.id,
				name: data.name,
			},
		});

		if (existing) {
			return c.json({ error: "该组织已存在相同名称的职能角色" }, 409);
		}

		const role = await db.functionalRole.create({
			data: {
				name: data.name,
				description: data.description,
				applicableScope: data.applicableScope ?? "organization",
				organizationId: organization.id,
			},
		});

		return c.json({ role }, 201);
	},
);

organizationRolesRouter.patch(
	"/:roleId",
	zValidator("json", updateRoleSchema),
	async (c) => {
		const organization = c.get("organization");
		const { roleId } = c.req.param();
		const data = c.req.valid("json");

		const role = await db.functionalRole.findUnique({
			where: { id: roleId },
		});

		if (!role || role.organizationId !== organization.id) {
			return c.json({ error: "只能编辑本组织的自定义职能角色" }, 404);
		}

		const updated = await db.functionalRole.update({
			where: { id: roleId },
			data: {
				description: data.description ?? role.description,
				applicableScope: data.applicableScope ?? role.applicableScope,
				isActive: data.isActive ?? role.isActive,
			},
		});

		return c.json({ role: updated });
	},
);

organizationRolesRouter.get(
	"/assignments",
	zValidator("query", assignmentsQuerySchema),
	async (c) => {
		const organization = c.get("organization");
		const query = c.req.valid("query");

		const includeInactive = resolveBooleanFlag(
			query.includeInactive,
			false,
		);
		const roleType = query.roleType ?? "all";
		const status = query.status ?? "all";
		const page = query.page ?? 1;
		const limit = query.limit ?? 50;

		const where = buildRoleAssignmentWhere({
			organizationId: organization.id,
			roleType,
			includeInactive,
			status,
			search: query.search,
		});

		const [assignments, total] = await Promise.all([
			db.roleAssignment.findMany({
				where,
				include: {
					user: {
						select: {
							id: true,
							name: true,
							username: true,
							email: true,
							image: true,
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

		const results = assignments.map((assignment) => ({
			...assignment,
			status: computeRoleAssignmentStatus(assignment),
			roleType: assignment.functionalRole.organizationId
				? "custom"
				: "system",
		}));

		return c.json({
			assignments: results,
			pagination: {
				page,
				limit,
				total,
				totalPages: Math.ceil(total / limit),
			},
		});
	},
);

organizationRolesRouter.post(
	"/assignments",
	zValidator("json", createAssignmentSchema),
	async (c) => {
		const organization = c.get("organization");
		const data = c.req.valid("json");

		const startDate = parseDate(data.startDate);
		const endDate = parseDate(data.endDate ?? undefined);

		if (endDate && startDate && endDate < startDate) {
			return c.json({ error: "结束时间必须晚于开始时间" }, 400);
		}

		const [role, member] = await Promise.all([
			db.functionalRole.findUnique({
				where: { id: data.functionalRoleId },
			}),
			db.member.findFirst({
				where: {
					organizationId: organization.id,
					userId: data.userId,
				},
			}),
		]);

		if (!role) {
			return c.json({ error: "职能角色不存在" }, 404);
		}

		if (role.organizationId && role.organizationId !== organization.id) {
			return c.json({ error: "只能为所属组织分配该角色" }, 400);
		}

		if (!member) {
			return c.json({ error: "该用户尚未加入组织" }, 400);
		}

		const conflict = await findOverlappingRoleAssignment({
			functionalRoleId: data.functionalRoleId,
			organizationId: organization.id,
			startDate: startDate!,
			endDate: endDate ?? undefined,
		});

		if (conflict) {
			return c.json(
				{
					error: "该时间段已有成员担任此职能角色",
					conflict,
				},
				409,
			);
		}

		const assignment = await db.roleAssignment.create({
			data: {
				userId: data.userId,
				organizationId: organization.id,
				functionalRoleId: data.functionalRoleId,
				startDate: startDate!,
				endDate: endDate,
				isActive: data.isActive ?? true,
			},
			include: {
				user: {
					select: {
						id: true,
						name: true,
						username: true,
						image: true,
					},
				},
				functionalRole: true,
			},
		});

		return c.json(
			{
				assignment: {
					...assignment,
					status: computeRoleAssignmentStatus(assignment),
					roleType: assignment.functionalRole.organizationId
						? "custom"
						: "system",
				},
			},
			201,
		);
	},
);

organizationRolesRouter.patch(
	"/assignments/:assignmentId",
	zValidator("json", updateAssignmentSchema),
	async (c) => {
		const organization = c.get("organization");
		const { assignmentId } = c.req.param();
		const payload = c.req.valid("json");

		const assignment = await db.roleAssignment.findUnique({
			where: { id: assignmentId },
			include: {
				functionalRole: true,
			},
		});

		if (!assignment || assignment.organizationId !== organization.id) {
			return c.json({ error: "职能角色任期不存在" }, 404);
		}

		const nextStartDate =
			payload.startDate !== undefined
				? (parseDate(payload.startDate) ?? assignment.startDate)
				: assignment.startDate;
		const nextEndDate =
			payload.endDate !== undefined
				? parseDate(payload.endDate)
				: assignment.endDate;
		const nextIsActive =
			payload.isActive !== undefined
				? payload.isActive
				: assignment.isActive;

		if (nextEndDate && nextEndDate < nextStartDate) {
			return c.json({ error: "结束时间必须晚于开始时间" }, 400);
		}

		if (nextIsActive) {
			const conflict = await findOverlappingRoleAssignment({
				functionalRoleId: assignment.functionalRoleId,
				organizationId: organization.id,
				startDate: nextStartDate!,
				endDate: nextEndDate ?? undefined,
				excludeAssignmentId: assignment.id,
			});

			if (conflict) {
				return c.json(
					{
						error: "该时间段已有成员担任此职能角色",
						conflict,
					},
					409,
				);
			}
		}

		const updated = await db.roleAssignment.update({
			where: { id: assignment.id },
			data: {
				startDate: nextStartDate!,
				endDate: nextEndDate,
				isActive: nextIsActive,
			},
			include: {
				user: {
					select: {
						id: true,
						name: true,
						username: true,
						image: true,
					},
				},
				functionalRole: true,
			},
		});

		return c.json({
			assignment: {
				...updated,
				status: computeRoleAssignmentStatus(updated),
				roleType: updated.functionalRole.organizationId
					? "custom"
					: "system",
			},
		});
	},
);
