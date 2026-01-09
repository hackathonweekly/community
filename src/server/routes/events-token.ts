import { getEventCreationEligibility } from "@/features/events/creation-eligibility";
import {
	buildEventsTokenSummary,
	getEventsTokenOverview,
	issueEventsToken,
	revokeEventsToken,
} from "@/features/events-token/service";
import { getRequestClientMetadata } from "@/features/events-token/request-metadata";
import { createModuleLogger } from "@/lib/logs";
import { Hono } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import { authMiddleware } from "../middleware/auth";

const logger = createModuleLogger("events-token-router");

export const eventsTokenRouter = new Hono()
	.use(authMiddleware)
	.get("/", async (c) => {
		const user = c.get("user");
		const overview = await getEventsTokenOverview(user.id);
		const eligibility = await getEventCreationEligibility(user.id);

		return c.json({
			success: true,
			data: {
				summary: overview.summary,
				eligibility: {
					allowed: eligibility.allowed,
					reason: eligibility.reason,
				},
			},
		});
	})
	.post("/", async (c) => {
		const user = c.get("user");
		const eligibility = await getEventCreationEligibility(user.id);

		if (!eligibility.allowed) {
			return c.json(
				{
					success: false,
					error:
						eligibility.reason ??
						"创建活动需要成为共创伙伴，请联系社区负责人！",
				},
				eligibility.status as ContentfulStatusCode,
			);
		}

		const metadata = getRequestClientMetadata(c.req.raw);
		const { token, record } = await issueEventsToken({
			userId: user.id,
			ipAddress: metadata.ipAddress,
			userAgent: metadata.userAgent,
		});

		return c.json(
			{
				success: true,
				data: {
					token,
					summary: buildEventsTokenSummary(record),
				},
			},
			201,
		);
	})
	.delete("/", async (c) => {
		const user = c.get("user");
		await revokeEventsToken({ userId: user.id, reason: "user_request" });
		logger.info("Events token revoked by user", { userId: user.id });

		return c.json({
			success: true,
			data: {
				summary: {
					status: "empty",
				},
			},
		});
	});
