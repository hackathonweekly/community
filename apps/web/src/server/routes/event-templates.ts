import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { db } from "@community/lib-server/database/prisma";
import { auth } from "@community/lib-server/auth/auth";
import { HTTPException } from "hono/http-exception";

const app = new Hono()
	.get("/", async (c) => {
		try {
			const session = await auth.api.getSession({
				headers: c.req.raw.headers,
			});

			// 构建查询条件
			const where: any = {
				isActive: true,
			};

			// 如果用户已登录，显示个人模板和公开模板
			if (session) {
				where.OR = [
					{
						AND: [
							{ isSystemTemplate: false },
							{ isFeatured: true },
						],
					}, // 精选模板
					{
						AND: [
							{ isSystemTemplate: false },
							{ createdBy: session.user.id },
						],
					}, // 用户自己的个人模板
				];
			} else {
				// 未登录用户只能看到精选模板
				where.AND = [{ isSystemTemplate: false }, { isFeatured: true }];
			}

			const templates = await db.eventTemplate.findMany({
				where,
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
					{ isFeatured: "desc" }, // 精选模板优先
					{ usageCount: "desc" }, // 使用次数多的优先
					{ createdAt: "desc" },
				],
			});

			return c.json({
				success: true,
				data: templates,
			});
		} catch (error) {
			console.error("Error fetching event templates:", error);
			throw new HTTPException(500, {
				message: "Failed to fetch event templates",
			});
		}
	})

	.get("/:id", async (c) => {
		const id = c.req.param("id");

		try {
			const template = await db.eventTemplate.findUnique({
				where: { id },
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
					events: {
						select: {
							id: true,
							title: true,
							startTime: true,
							organization: {
								select: {
									name: true,
									slug: true,
								},
							},
						},
						orderBy: { startTime: "desc" },
						take: 10,
					},
				},
			});

			if (!template) {
				throw new HTTPException(404, {
					message: "Event template not found",
				});
			}

			return c.json({
				success: true,
				data: template,
			});
		} catch (error) {
			console.error("Error fetching event template:", error);
			if (error instanceof HTTPException) {
				throw error;
			}
			throw new HTTPException(500, {
				message: "Failed to fetch event template",
			});
		}
	})

	.post(
		"/",
		zValidator(
			"json",
			z.object({
				name: z.string().min(1).max(255),
				type: z.enum(["HACKATHON_LEARNING", "MEETUP", "CUSTOM"]),
				description: z.string().min(1),
				title: z.string().min(1).max(255),
				defaultDescription: z.string().min(1),
				shortDescription: z.string().max(200).optional(),
				duration: z.number().int().positive().optional(),
				maxAttendees: z.number().int().positive().optional(),
				requireApproval: z.boolean().default(false),
				organizationId: z.string().optional(),
				templateType: z
					.enum(["SYSTEM", "PERSONAL"])
					.default("PERSONAL"),
				isPublic: z.boolean().default(false),
				originalEventId: z.string().optional(), // 基于哪个活动创建的模板
				ticketTypes: z
					.array(
						z.object({
							name: z.string().min(1).max(100),
							description: z.string().optional(),
							price: z.number().optional(),
							maxQuantity: z.number().int().positive().optional(),
							requirements: z.string().optional(),
							sortOrder: z.number().int().default(0),
						}),
					)
					.optional(),
				volunteerRoles: z
					.array(
						z.object({
							volunteerRoleId: z.string(),
							recruitCount: z
								.number()
								.int()
								.positive()
								.default(1),
							description: z.string().optional(),
							requireApproval: z.boolean().default(true),
							cpReward: z.number().int().default(0),
						}),
					)
					.optional(),
				questions: z
					.array(
						z.object({
							question: z.string().min(1),
							type: z.enum([
								"TEXT",
								"TEXTAREA",
								"SELECT",
								"CHECKBOX",
								"RADIO",
							]),
							options: z.array(z.string()).default([]),
							required: z.boolean().default(false),
							targetRole: z.string().optional(),
							order: z.number().int().default(0),
						}),
					)
					.optional(),
				schedules: z
					.array(
						z.object({
							title: z.string().min(1),
							description: z.string().optional(),
							startMinute: z.number().int(),
							duration: z.number().int().positive(),
							type: z.enum([
								"CHECK_IN",
								"INTRODUCTION",
								"LEARNING",
								"DEVELOPMENT",
								"DEMO",
								"AWARD",
								"BREAK",
							]),
							order: z.number().int().default(0),
						}),
					)
					.optional(),
			}),
		),
		async (c) => {
			const session = await auth.api.getSession({
				headers: c.req.raw.headers,
			});
			if (!session) {
				throw new HTTPException(401, { message: "Unauthorized" });
			}

			const data = c.req.valid("json");

			try {
				const template = await db.eventTemplate.create({
					data: {
						name: data.name,
						type: data.type,
						description: data.description,
						title: data.title,
						defaultDescription: data.defaultDescription,
						shortDescription: data.shortDescription,
						duration: data.duration,
						maxAttendees: data.maxAttendees,
						requireApproval: data.requireApproval,
						createdBy: session.user.id,
						organizationId: data.organizationId,
						isSystemTemplate: data.templateType === "SYSTEM", // 向后兼容
						isPublic:
							data.templateType === "SYSTEM"
								? true
								: data.isPublic,
						isFeatured: false, // 新创建的模板默认不是精选
						originalEventId: data.originalEventId,
						isActive: true,
						ticketTypes: data.ticketTypes
							? {
									create: data.ticketTypes,
								}
							: undefined,
						volunteerRoles: data.volunteerRoles
							? {
									create: data.volunteerRoles,
								}
							: undefined,
						questions: data.questions
							? {
									create: data.questions,
								}
							: undefined,
						schedules: data.schedules
							? {
									create: data.schedules,
								}
							: undefined,
					},
					include: {
						ticketTypes: true,
						volunteerRoles: {
							include: {
								volunteerRole: true,
							},
						},
						questions: true,
						schedules: true,
					},
				});

				return c.json(
					{
						success: true,
						data: template,
					},
					201,
				);
			} catch (error) {
				console.error("Error creating event template:", error);
				throw new HTTPException(500, {
					message: "Failed to create event template",
				});
			}
		},
	)

	.put(
		"/:id",
		zValidator(
			"json",
			z.object({
				name: z.string().min(1).max(255).optional(),
				description: z.string().min(1).optional(),
				title: z.string().min(1).max(255).optional(),
				defaultDescription: z.string().min(1).optional(),
				shortDescription: z.string().max(200).optional().nullable(),
				duration: z.number().int().positive().optional(),
				maxAttendees: z.number().int().positive().optional(),
				requireApproval: z.boolean().optional(),
				isActive: z.boolean().optional(),
				isPublic: z.boolean().optional(),
			}),
		),
		async (c) => {
			const session = await auth.api.getSession({
				headers: c.req.raw.headers,
			});
			if (!session) {
				throw new HTTPException(401, { message: "Unauthorized" });
			}

			const id = c.req.param("id");
			const data = c.req.valid("json");

			try {
				// 检查模板权限
				const existingTemplate = await db.eventTemplate.findUnique({
					where: { id },
				});

				if (!existingTemplate) {
					throw new HTTPException(404, {
						message: "Event template not found",
					});
				}

				// 个人模板：只有创建者可以编辑
				// 系统模板：需要超级管理员权限（这里简化处理，只允许创建者编辑）
				if (existingTemplate.createdBy !== session.user.id) {
					throw new HTTPException(403, {
						message: "Permission denied",
					});
				}

				const template = await db.eventTemplate.update({
					where: { id },
					data,
					include: {
						ticketTypes: true,
						volunteerRoles: {
							include: {
								volunteerRole: true,
							},
						},
						questions: true,
						schedules: true,
					},
				});

				return c.json({
					success: true,
					data: template,
				});
			} catch (error) {
				console.error("Error updating event template:", error);
				if (error instanceof HTTPException) {
					throw error;
				}
				throw new HTTPException(500, {
					message: "Failed to update event template",
				});
			}
		},
	)

	.delete("/:id", async (c) => {
		const session = await auth.api.getSession({
			headers: c.req.raw.headers,
		});
		if (!session) {
			throw new HTTPException(401, { message: "Unauthorized" });
		}

		const id = c.req.param("id");

		try {
			// 检查模板权限
			const existingTemplate = await db.eventTemplate.findUnique({
				where: { id },
				include: {
					_count: {
						select: {
							events: true,
						},
					},
				},
			});

			if (!existingTemplate) {
				throw new HTTPException(404, {
					message: "Event template not found",
				});
			}

			// 系统模板不能删除，个人模板只有创建者可以删除
			if (existingTemplate.isSystemTemplate) {
				throw new HTTPException(403, {
					message: "Cannot delete system template",
				});
			}

			// 只有创建者可以删除个人模板
			if (existingTemplate.createdBy !== session.user.id) {
				throw new HTTPException(403, {
					message: "Permission denied",
				});
			}

			// 如果有活动使用了这个模板，只能设为不可用，不能删除
			if (existingTemplate._count.events > 0) {
				await db.eventTemplate.update({
					where: { id },
					data: { isActive: false },
				});

				return c.json({
					success: true,
					message: "Template deactivated due to existing events",
				});
			}
			await db.eventTemplate.delete({
				where: { id },
			});

			return c.json({
				success: true,
				message: "Template deleted successfully",
			});
		} catch (error) {
			console.error("Error deleting event template:", error);
			if (error instanceof HTTPException) {
				throw error;
			}
			throw new HTTPException(500, {
				message: "Failed to delete event template",
			});
		}
	})

	.post(
		"/:id/duplicate",
		zValidator(
			"json",
			z.object({
				name: z.string().min(1).max(255),
				organizationId: z.string().optional(),
			}),
		),
		async (c) => {
			const session = await auth.api.getSession({
				headers: c.req.raw.headers,
			});
			if (!session) {
				throw new HTTPException(401, { message: "Unauthorized" });
			}

			const id = c.req.param("id");
			const { name, organizationId } = c.req.valid("json");

			try {
				const originalTemplate = await db.eventTemplate.findUnique({
					where: { id },
					include: {
						ticketTypes: true,
						volunteerRoles: true,
						questions: true,
						schedules: true,
					},
				});

				if (!originalTemplate) {
					throw new HTTPException(404, {
						message: "Event template not found",
					});
				}

				const duplicatedTemplate = await db.eventTemplate.create({
					data: {
						name,
						type: "CUSTOM",
						description: `${originalTemplate.description} (复制)`,
						title: originalTemplate.title,
						defaultDescription: originalTemplate.defaultDescription,
						shortDescription: originalTemplate.shortDescription,
						duration: originalTemplate.duration,
						maxAttendees: originalTemplate.maxAttendees,
						requireApproval: originalTemplate.requireApproval,
						createdBy: session.user.id,
						organizationId,
						isSystemTemplate: false, // 复制的模板都是个人模板
						isPublic: false, // 默认不公开
						isFeatured: false,
						isActive: true,
						ticketTypes: {
							create: originalTemplate.ticketTypes.map(
								(ticketType) => ({
									name: ticketType.name,
									description: ticketType.description,
									price: ticketType.price,
									maxQuantity: ticketType.maxQuantity,
									requirements: ticketType.requirements,
									sortOrder: ticketType.sortOrder,
								}),
							),
						},
						volunteerRoles: {
							create: originalTemplate.volunteerRoles.map(
								(role) => ({
									volunteerRoleId: role.volunteerRoleId,
									recruitCount: role.recruitCount,
									description: role.description,
									requireApproval: role.requireApproval,
								}),
							),
						},
						questions: {
							create: originalTemplate.questions.map(
								(question) => ({
									question: question.question,
									type: question.type,
									options: question.options,
									required: question.required,
									targetRole: question.targetRole,
									order: question.order,
								}),
							),
						},
						schedules: {
							create: originalTemplate.schedules.map(
								(schedule) => ({
									title: schedule.title,
									description: schedule.description,
									startMinute: schedule.startMinute,
									duration: schedule.duration,
									type: schedule.type,
									order: schedule.order,
								}),
							),
						},
					},
					include: {
						ticketTypes: true,
						volunteerRoles: {
							include: {
								volunteerRole: true,
							},
						},
						questions: true,
						schedules: true,
					},
				});

				return c.json(
					{
						success: true,
						data: duplicatedTemplate,
					},
					201,
				);
			} catch (error) {
				console.error("Error duplicating event template:", error);
				throw new HTTPException(500, {
					message: "Failed to duplicate event template",
				});
			}
		},
	)

	.post(
		"/from-event/:eventId",
		zValidator(
			"json",
			z.object({
				name: z.string().min(1).max(255),
				description: z.string().min(1).optional(),
				isPublic: z.boolean().default(false),
			}),
		),
		async (c) => {
			const session = await auth.api.getSession({
				headers: c.req.raw.headers,
			});
			if (!session) {
				throw new HTTPException(401, { message: "Unauthorized" });
			}

			const eventId = c.req.param("eventId");
			const { name, description, isPublic } = c.req.valid("json");

			try {
				// 获取原始活动数据
				const originalEvent = await db.event.findUnique({
					where: { id: eventId },
					include: {
						ticketTypes: true,
						volunteerRoles: {
							include: {
								volunteerRole: true,
							},
						},
						questions: true,
						// schedules: true, // 如果有的话
					},
				});

				if (!originalEvent) {
					throw new HTTPException(404, {
						message: "Event not found",
					});
				}

				// 检查权限：只有活动创建者可以将活动保存为模板
				if (originalEvent.organizerId !== session.user.id) {
					throw new HTTPException(403, {
						message:
							"Permission denied: Only event organizer can create template from this event",
					});
				}

				// 根据活动类型确定模板类型
				let templateType: "HACKATHON_LEARNING" | "MEETUP" | "CUSTOM" =
					"CUSTOM";
				if (originalEvent.type === "HACKATHON") {
					templateType = "HACKATHON_LEARNING";
				} else if (originalEvent.type === "MEETUP") {
					templateType = "MEETUP";
				}

				const template = await db.eventTemplate.create({
					data: {
						name,
						type: templateType,
						description:
							description ||
							`基于活动"${originalEvent.title}"创建的模板`,
						title: originalEvent.title,
						defaultDescription: originalEvent.richContent || "",
						shortDescription: originalEvent.shortDescription || "",
						duration:
							originalEvent.endTime && originalEvent.startTime
								? Math.round(
										(originalEvent.endTime.getTime() -
											originalEvent.startTime.getTime()) /
											(1000 * 60),
									)
								: undefined,
						maxAttendees: originalEvent.maxAttendees,
						requireApproval: originalEvent.requireApproval,
						createdBy: session.user.id,
						organizationId: originalEvent.organizationId,
						isSystemTemplate: false, // 从活动创建的都是个人模板
						isPublic,
						isFeatured: false,
						originalEventId: eventId,
						isActive: true,
						ticketTypes: {
							create: originalEvent.ticketTypes.map(
								(ticketType, index) => ({
									name: ticketType.name,
									description: ticketType.description,
									price: ticketType.price,
									maxQuantity: ticketType.maxQuantity,
									sortOrder: index,
								}),
							),
						},
						volunteerRoles: {
							create: originalEvent.volunteerRoles.map(
								(role) => ({
									volunteerRoleId: role.volunteerRoleId,
									recruitCount: role.recruitCount,
									description: role.description,
									requireApproval: role.requireApproval,
								}),
							),
						},
						questions: {
							create: originalEvent.questions.map(
								(question, index) => ({
									question: question.question,
									type: question.type,
									options: question.options,
									required: question.required,
									order: index,
								}),
							),
						},
					},
					include: {
						ticketTypes: true,
						volunteerRoles: {
							include: {
								volunteerRole: true,
							},
						},
						questions: true,
					},
				});

				return c.json(
					{
						success: true,
						data: template,
					},
					201,
				);
			} catch (error) {
				console.error("Error creating template from event:", error);
				if (error instanceof HTTPException) {
					throw error;
				}
				throw new HTTPException(500, {
					message: "Failed to create template from event",
				});
			}
		},
	);

export default app;
