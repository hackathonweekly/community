import { Hono } from "hono";
import {
	getEventRecommendations,
	refreshEventRecommendations,
	submitRecommendationFeedback,
	checkUserRegistration,
} from "@/lib/database/prisma/queries/event-recommendations";
import { auth } from "@/lib/auth/auth";
import { headers } from "next/headers";
import { z } from "zod";

export const eventRecommendationsApp = new Hono()
	// 获取活动推荐
	.get("/events/:eventId/recommendations", async (c) => {
		try {
			const eventId = c.req.param("eventId");

			// 尝试获取当前用户（可选）
			let userId: string | undefined;
			try {
				const h = await headers();
				const authHeader = h.get("authorization");

				if (authHeader) {
					const session = await auth.api.getSession({ headers: h });
					userId = session?.user?.id;
				}
			} catch (error) {
				// 用户未登录，继续返回统一推荐
				console.log(
					"User not authenticated, returning unified recommendations",
				);
			}

			// 如果用户已登录且已报名，返回个性化推荐
			if (userId) {
				try {
					const isRegistered = await checkUserRegistration(
						eventId,
						userId,
					);
					if (!isRegistered) {
						// 未报名用户看统一推荐
						userId = undefined;
					}
				} catch (error) {
					console.log(
						"Failed to check registration status, using unified recommendations",
					);
					userId = undefined;
				}
			}

			const recommendations = await getEventRecommendations(
				eventId,
				userId,
			);

			if (!recommendations) {
				return c.json({ error: "Failed to get recommendations" }, 500);
			}

			return c.json({
				success: true,
				type: userId ? "PERSONAL" : "UNIFIED",
				recommendations,
			});
		} catch (error) {
			console.error("Error in recommendations API:", error);
			return c.json({ error: "Internal server error" }, 500);
		}
	})

	// 刷新推荐
	.post("/events/:eventId/recommendations/refresh", async (c) => {
		try {
			const eventId = c.req.param("eventId");

			// 获取当前用户（可选）
			let userId: string | undefined;
			try {
				const h = await headers();
				const session = await auth.api.getSession({ headers: h });
				userId = session?.user?.id;

				if (userId) {
					const isRegistered = await checkUserRegistration(
						eventId,
						userId,
					);
					if (!isRegistered) {
						userId = undefined;
					}
				}
			} catch (error) {
				// 用户未登录或检查失败
				userId = undefined;
			}

			const recommendations = await refreshEventRecommendations(
				eventId,
				userId,
			);

			if (!recommendations) {
				return c.json(
					{ error: "Failed to refresh recommendations" },
					500,
				);
			}

			return c.json({
				success: true,
				type: userId ? "PERSONAL" : "UNIFIED",
				recommendations,
			});
		} catch (error) {
			console.error("Error refreshing recommendations:", error);
			return c.json({ error: "Internal server error" }, 500);
		}
	})

	// 提交推荐反馈
	.post("/recommendations/:recommendationId/feedback", async (c) => {
		try {
			const recommendationId = c.req.param("recommendationId");

			// 需要用户登录
			const h = await headers();
			const session = await auth.api.getSession({ headers: h });

			if (!session?.user?.id) {
				return c.json({ error: "Unauthorized" }, 401);
			}

			// 验证请求体
			const feedbackSchema = z.object({
				helpful: z.boolean(),
				comment: z.string().optional(),
			});

			const body = await c.req.json();
			const { helpful, comment } = feedbackSchema.parse(body);

			const success = await submitRecommendationFeedback(
				recommendationId,
				session.user.id,
				helpful,
				comment,
			);

			if (!success) {
				return c.json({ error: "Failed to submit feedback" }, 500);
			}

			return c.json({ success: true });
		} catch (error) {
			console.error("Error submitting feedback:", error);
			if (error instanceof z.ZodError) {
				return c.json(
					{ error: "Invalid request data", details: error.errors },
					400,
				);
			}
			return c.json({ error: "Internal server error" }, 500);
		}
	});
