import { db } from "@/lib/database/prisma/client";
import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { validator } from "hono-openapi/zod";
import { z } from "zod";
import { authMiddleware } from "../../middleware/auth";

export const eventLikesRouter = new Hono()
	// Like event
	.post(
		"/:eventId/like",
		authMiddleware,
		validator("param", z.object({ eventId: z.string() })),
		describeRoute({
			summary: "Like event",
			tags: ["Events", "Likes"],
		}),
		async (c) => {
			try {
				const user = c.get("user");
				const { eventId } = c.req.valid("param");

				// 检查活动是否存在且已发布
				const event = await db.event.findFirst({
					where: {
						id: eventId,
						status: "PUBLISHED",
					},
				});

				if (!event) {
					return c.json({ error: "Event not found" }, 404);
				}

				// 检查是否已经点赞
				const existingLike = await db.eventLike.findUnique({
					where: {
						userId_eventId: {
							userId: user.id,
							eventId,
						},
					},
				});

				if (existingLike) {
					return c.json({ error: "Already liked" }, 409);
				}

				// 创建点赞
				await db.eventLike.create({
					data: {
						userId: user.id,
						eventId,
					},
				});

				return c.json({ success: true });
			} catch (error) {
				console.error("Error liking event:", error);
				return c.json({ error: "Internal server error" }, 500);
			}
		},
	)
	// Remove event like
	.delete(
		"/:eventId/like",
		authMiddleware,
		validator("param", z.object({ eventId: z.string() })),
		describeRoute({
			summary: "Remove event like",
			tags: ["Events", "Likes"],
		}),
		async (c) => {
			try {
				const user = c.get("user");
				const { eventId } = c.req.valid("param");

				// 删除点赞
				await db.eventLike.deleteMany({
					where: {
						userId: user.id,
						eventId,
					},
				});

				return c.json({ success: true });
			} catch (error) {
				console.error("Error removing event like:", error);
				return c.json({ error: "Internal server error" }, 500);
			}
		},
	)
	// Get event likes count
	.get(
		"/:eventId/likes",
		validator("param", z.object({ eventId: z.string() })),
		describeRoute({
			summary: "Get event likes",
			tags: ["Events", "Likes"],
		}),
		async (c) => {
			try {
				const { eventId } = c.req.valid("param");

				const likeCount = await db.eventLike.count({
					where: { eventId },
				});

				return c.json({
					success: true,
					data: { likeCount },
				});
			} catch (error) {
				console.error("Error fetching event likes:", error);
				return c.json({ error: "Internal server error" }, 500);
			}
		},
	);
