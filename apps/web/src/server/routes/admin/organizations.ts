import {
	countAllOrganizations,
	getOrganizationById,
	getOrganizations,
} from "@community/lib-server/database";
import {
	AdminPermission,
	hasPermission,
} from "@community/lib-shared/auth/permissions";
import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { validator } from "hono-openapi/zod";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";
import { adminMiddleware } from "../../middleware/admin";

export const organizationRouter = new Hono()
	.basePath("/organizations")
	.use(adminMiddleware)
	.get(
		"/",
		validator(
			"query",
			z.object({
				query: z.string().optional(),
				limit: z.string().optional().default("10").transform(Number),
				offset: z.string().optional().default("0").transform(Number),
			}),
		),
		describeRoute({
			summary: "Get all organizations",
			tags: ["Administration"],
		}),
		async (c) => {
			const user = c.get("user");

			if (!hasPermission(user, AdminPermission.VIEW_ORGANIZATIONS)) {
				throw new HTTPException(403, {
					message: "Insufficient permissions",
				});
			}

			const { query, limit, offset } = c.req.valid("query");

			const organizations = await getOrganizations({
				limit,
				offset,
				query,
			});

			const total = await countAllOrganizations({ query });

			return c.json({ organizations, total });
		},
	)
	.get("/:id", async (c) => {
		const user = c.get("user");

		if (!hasPermission(user, AdminPermission.VIEW_ORGANIZATIONS)) {
			throw new HTTPException(403, {
				message: "Insufficient permissions",
			});
		}

		const id = c.req.param("id");

		const organization = await getOrganizationById(id);

		if (!organization) {
			throw new HTTPException(404);
		}

		return c.json(organization);
	});
