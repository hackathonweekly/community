import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { db } from "@/lib/database/prisma";
import { auth } from "@/lib/auth/auth";
import { HTTPException } from "hono/http-exception";

const app = new Hono()
	// 获取所有模板（超级管理员专用）
	.get("/", async (c) => {
		const session = await auth.api.getSession({
			headers: c.req.raw.headers,
		});

		if (!session || (session.user as any).role !== "super_admin") {
			throw new HTTPException(403, { message: "Access denied" });
		}

		try {
			const templates = await db.eventTemplate.findMany({
				include: {
					ticketTypes: {
						orderBy: { sortOrder: "asc" },
					},
					volunteerRoles: {
						include: {
							volunteerRole: true,
						},
						orderBy: { cpReward: "desc" },
					},
					questions: {
						orderBy: { order: "asc" },
					},
					schedules: {
						orderBy: { order: "asc" },
					},
					creator: {
						select: {
							id: true,
							name: true,
							image: true,
						},
					},
					organization: {
						select: {
							id: true,
							name: true,
							logo: true,
						},
					},
					_count: {
						select: {
							events: true,
						},
					},
				},
				orderBy: [
					{ isFeatured: "desc" },
					{ isSystemTemplate: "desc" },
					{ usageCount: "desc" },
					{ createdAt: "desc" },
				],
			});

			return c.json({
				success: true,
				data: templates,
			});
		} catch (error) {
			console.error("Error fetching all templates:", error);
			throw new HTTPException(500, {
				message: "Failed to fetch templates",
			});
		}
	})

	// 更新模板状态（超级管理员专用）
	.patch(
		"/:id",
		zValidator(
			"json",
			z.object({
				isFeatured: z.boolean().optional(),
				isActive: z.boolean().optional(),
				isPublic: z.boolean().optional(),
				name: z.string().min(1).optional(),
				description: z.string().optional(),
			}),
		),
		async (c) => {
			const session = await auth.api.getSession({
				headers: c.req.raw.headers,
			});

			if (!session || (session.user as any).role !== "super_admin") {
				throw new HTTPException(403, { message: "Access denied" });
			}

			const id = c.req.param("id");
			const data = c.req.valid("json");

			try {
				const existingTemplate = await db.eventTemplate.findUnique({
					where: { id },
				});

				if (!existingTemplate) {
					throw new HTTPException(404, {
						message: "Template not found",
					});
				}

				const updatedTemplate = await db.eventTemplate.update({
					where: { id },
					data: {
						isFeatured: data.isFeatured,
						isActive: data.isActive,
						isPublic: data.isPublic,
						name: data.name,
						description: data.description,
					},
					include: {
						creator: {
							select: {
								id: true,
								name: true,
								image: true,
							},
						},
						organization: {
							select: {
								id: true,
								name: true,
								logo: true,
							},
						},
					},
				});

				return c.json({
					success: true,
					data: updatedTemplate,
				});
			} catch (error) {
				console.error("Error updating template:", error);
				if (error instanceof HTTPException) {
					throw error;
				}
				throw new HTTPException(500, {
					message: "Failed to update template",
				});
			}
		},
	);

export default app;
