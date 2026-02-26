import { config } from "@community/config";
import { auth } from "@community/lib-server/auth";
import { getBaseUrl } from "@community/lib-shared/utils";
import { Scalar } from "@scalar/hono-api-reference";
import { Hono } from "hono";
import { openAPISpecs } from "hono-openapi";
import { mergeOpenApiSchemas } from "./lib/openapi-schema";
import { corsMiddleware } from "./middleware/cors";
import { errorHandler } from "./middleware/error-handler";
import { apiRateLimit } from "./middleware/rate-limit";
import adminCommentsRouter from "./routes/admin/comments";
import { adminRouter } from "./routes/admin/router";
import { aiRouter } from "./routes/ai";
import { authRouter } from "./routes/auth"; // 🔧 添加缺失的authRouter导入
import badgesRouter from "./routes/badges";
import certificatesRouter from "./routes/certificates";
import commentsRouter from "./routes/comments";
import { communityStatsRouter } from "./routes/community-stats";
import { contactRouter } from "./routes/contact/router";
import contributionAdminRouter from "./routes/contribution-admin";
import contributionsRouter from "./routes/contributions";
import eventCommunicationsRouter from "./routes/event-communications";
import eventProjectsRouter from "./routes/event-projects";
import { eventRecommendationsApp } from "./routes/event-recommendations";
import { eventHostSubscriptionsRouter } from "./routes/event-host-subscriptions";
import eventTemplatesRouter from "./routes/event-templates";
import eventsRouter from "./routes/events";
import eventsRegistrationsRouter from "./routes/events/registrations";
import { eventsTokenRouter } from "./routes/events-token";
import hackathonRouter from "./routes/hackathon";
import { healthRouter } from "./routes/health";
import { newsletterRouter } from "./routes/newsletter";
import notificationsRouter from "./routes/notifications";
import { organizationAdminRouter } from "./routes/organizations/admin";
import { organizationsRouterExtended as organizationsRouter } from "./routes/organizations/router";
import { paymentsRouter } from "./routes/payments/router";
import { profileRouter } from "./routes/profile";
import { projectsRouter } from "./routes/projects";
import { postsRouter } from "./routes/posts";
import { permissionsRouter } from "./routes/permissions";
import superAdminRouter from "./routes/super-admin";
import systemConfigRouter from "./routes/system-config";
import tasksRouter from "./routes/tasks";
import { uploadsRouter } from "./routes/uploads";
import { userRouter } from "./routes/user/router";
import { usersRouter } from "./routes/users";
import volunteerRolesRouter from "./routes/volunteer-roles";
import { webhooksRouter } from "./routes/webhooks";
import { websitesRouter } from "./routes/websites";
import { functionalRolesRouter } from "./routes/functional-roles";
import { versionRouter } from "./routes/version";
import { clientLogsRouter } from "./routes/client-logs";
import { cronRouter } from "./routes/cron";
import leaderboardRouter from "./routes/leaderboard";

export const app = new Hono().basePath("/api");

// Global middleware
app.use(errorHandler);
app.use(corsMiddleware);
app.use(apiRateLimit);

// 挂载所有路由器 - 先挂载无认证的路由器
app.route("/", authRouter) // 🔧 Better Auth处理 /auth/* 路径
	.route("/", webhooksRouter)
	.route("/", cronRouter)
	.route("/", healthRouter)
	.route("/", versionRouter)
	.route("/", clientLogsRouter)
	.route("/", communityStatsRouter)
	.route("/leaderboard", leaderboardRouter)
	.route("/tasks", tasksRouter)
	.route("/", contactRouter)
	.route("/", projectsRouter)
	.route("/", newsletterRouter)
	.route("/events-token", eventsTokenRouter)
	.route("/contributions", contributionsRouter)
	.route("/badges", badgesRouter)
	.route("/volunteer-roles", volunteerRolesRouter)
	.route("/", functionalRolesRouter)
	.route("/events", eventsRouter)
	.route("/events", eventsRegistrationsRouter)
	.route("/", eventCommunicationsRouter)
	.route("/", eventRecommendationsApp)
	.route("/event-host-subscriptions", eventHostSubscriptionsRouter)
	.route("/websites", websitesRouter)
	.route("/event-templates", eventTemplatesRouter)
	.route("/", eventProjectsRouter)
	.route("/", hackathonRouter)
	.route("/", certificatesRouter)
	.route("/comments", commentsRouter)
	.route("/posts", postsRouter)
	// 有认证中间件的路由器放在最后
	.route("/", aiRouter)
	.route("/", uploadsRouter)
	.route("/", paymentsRouter)
	.route("/", organizationsRouter)
	.route("/", organizationAdminRouter)
	.route("/user", userRouter)
	.route("/users", usersRouter)
	.route("/notifications", notificationsRouter)
	.route("/", adminRouter)
	.route("/", profileRouter)
	.route("/", permissionsRouter)
	.route("/super-admin", superAdminRouter)
	.route("/admin", contributionAdminRouter)
	.route("/admin", systemConfigRouter)
	.route("/admin/comments", adminCommentsRouter);

app.get(
	"/app-openapi",
	openAPISpecs(app, {
		documentation: {
			info: {
				title: `${config.appName} API`,
				version: "1.0.0",
			},
			servers: [
				{
					url: getBaseUrl(),
					description: "API server",
				},
			],
		},
	}),
);

app.get("/openapi", async (c) => {
	const authSchema = await (auth.api as any).generateOpenAPISchema();
	const appSchema = await (
		app.request("/api/app-openapi") as Promise<Response>
	).then((res) => res.json());

	const mergedSchema = mergeOpenApiSchemas({
		appSchema,
		authSchema: authSchema as any,
	});

	return c.json(mergedSchema);
});

app.get(
	"/docs",
	Scalar({
		theme: "saturn",
		url: "/api/openapi",
	}),
);

export type AppRouter = typeof app;
