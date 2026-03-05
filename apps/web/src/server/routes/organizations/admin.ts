import { Hono } from "hono";
import { organizationEmailsRouter } from "./emails";
import { organizationRolesRouter } from "./roles";

export const organizationAdminRouter = new Hono()
	.basePath("/organizations/:organizationSlug/admin")
	.route("/emails", organizationEmailsRouter)
	.route("/roles", organizationRolesRouter);
