import { Hono } from "hono";
import { emailsRouter } from "./emails";
import { adminFunctionalRolesRouter } from "./functional-roles";
import { organizationRouter } from "./organizations";
import { userRouter } from "./users";

export const adminRouter = new Hono()
	.basePath("/admin")
	.route("/", organizationRouter)
	.route("/", userRouter)
	.route("/", adminFunctionalRolesRouter)
	.route("/emails", emailsRouter);
