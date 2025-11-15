import { auth } from "@/lib/auth";
import { db } from "@/lib/database/prisma";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";

const searchSchema = z.object({
	q: z.string().min(2, "Query must be at least 2 characters"),
	scope: z.enum(["event", "global"]).default("event"),
	excludeIds: z.string().optional(),
});

const app = new Hono();

// GET /api/events/:eventId/participants/search - Search participants
app.get("/search", zValidator("query", searchSchema), async (c) => {
	try {
		const session = await auth.api.getSession({
			headers: c.req.raw.headers,
		});

		if (!session) {
			return c.json(
				{
					success: false,
					error: "Authentication required",
				},
				401,
			);
		}

		const eventId = c.req.param("eventId");
		const { q: query, scope, excludeIds } = c.req.valid("query");

		// Parse exclude IDs
		const excludeIdsList = excludeIds ? excludeIds.split(",") : [];
		const excludeIdsSet = new Set([...excludeIdsList, session.user.id]); // Always exclude current user

		let users = [];

		if (scope === "event") {
			// Search within event participants
			const registrations = await db.eventRegistration.findMany({
				where: {
					eventId,
					status: "APPROVED", // Only approved participants
					userId: {
						notIn: Array.from(excludeIdsSet),
					},
					user: {
						OR: [
							{
								name: {
									contains: query,
									mode: "insensitive",
								},
							},
							{
								username: {
									contains: query,
									mode: "insensitive",
								},
							},
							{
								email: {
									contains: query,
									mode: "insensitive",
								},
							},
						],
					},
				},
				include: {
					user: {
						select: {
							id: true,
							name: true,
							username: true,
							email: true,
							image: true,
							userRoleString: true,
							currentWorkOn: true,
							bio: true,
						},
					},
				},
				take: 20, // Limit results
				orderBy: [
					{
						user: {
							name: "asc",
						},
					},
				],
			});

			users = registrations.map((reg) => reg.user);
		} else {
			// Search globally
			const globalUsers = await db.user.findMany({
				where: {
					id: {
						notIn: Array.from(excludeIdsSet),
					},
					OR: [
						{
							name: {
								contains: query,
								mode: "insensitive",
							},
						},
						{
							username: {
								contains: query,
								mode: "insensitive",
							},
						},
						{
							email: {
								contains: query,
								mode: "insensitive",
							},
						},
					],
				},
				select: {
					id: true,
					name: true,
					username: true,
					email: true,
					image: true,
					userRoleString: true,
					currentWorkOn: true,
					bio: true,
				},
				take: 20, // Limit results
				orderBy: [
					{
						name: "asc",
					},
				],
			});

			users = globalUsers;
		}

		return c.json({
			success: true,
			data: {
				users: users.map((user) => ({
					id: user.id,
					name: user.name,
					username: user.username,
					email: user.email,
					image: user.image,
					role: user.userRoleString,
					currentWork: user.currentWorkOn,
					bio: user.bio,
				})),
			},
		});
	} catch (error) {
		console.error("Error searching participants:", error);
		return c.json(
			{
				success: false,
				error: "Failed to search participants",
			},
			500,
		);
	}
});

export default app;
