import { Hono } from "hono";
import { organizationRouter } from "./organizations";
import { userRouter } from "./users";
import { emailsRouter } from "./emails";
import eventTemplatesRouter from "./event-templates";
import { adminFunctionalRolesRouter } from "./functional-roles";

export const adminRouter = new Hono()
	.basePath("/admin")
	.route("/", organizationRouter)
	.route("/", userRouter)
	.route("/", adminFunctionalRolesRouter)
	.route("/emails", emailsRouter)
	.route("/event-templates", eventTemplatesRouter);
