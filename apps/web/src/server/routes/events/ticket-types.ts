import { db } from "@community/lib-server/database/prisma/client";
import {
	canManageEvent,
	canManageTicketType,
} from "@/features/permissions/events";
import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { validator } from "hono-openapi/zod";
import { z } from "zod";
import { authMiddleware } from "../../middleware/auth";

const priceTierSchema = z.object({
	quantity: z.number().int().min(1),
	price: z.number().min(0),
	currency: z.string().optional(),
});

const createTicketTypeSchema = z.object({
	name: z.string().min(1, "票种名称不能为空"),
	description: z.string().optional(),
	price: z.number().min(0).optional(),
	maxQuantity: z.number().min(1).optional(),
	isActive: z.boolean().default(true),
	sortOrder: z.number().default(0),
	priceTiers: z
		.array(priceTierSchema)
		.optional()
		.refine(
			(tiers) => {
				if (!tiers) return true;
				const quantities = tiers.map((tier) => tier.quantity);
				return new Set(quantities).size === quantities.length;
			},
			{ message: "票档数量不能重复" },
		),
});

const updateTicketTypeSchema = createTicketTypeSchema.partial();

export const eventTicketTypesRouter = new Hono()
	.get(
		"/:id/ticket-types",
		validator("param", z.object({ id: z.string() })),
		describeRoute({
			summary: "Get event ticket types",
			tags: ["Events"],
		}),
		async (c) => {
			try {
				const { id: eventId } = c.req.valid("param");

				// 验证活动是否存在
				const event = await db.event.findUnique({
					where: { id: eventId },
					select: { id: true, status: true },
				});

				if (!event) {
					return c.json({ error: "活动不存在" }, 404);
				}

				// 获取票种列表
				const ticketTypes = await db.eventTicketType.findMany({
					where: { eventId },
					orderBy: { sortOrder: "asc" },
					include: {
						_count: {
							select: { registrations: true },
						},
						priceTiers: {
							where: { isActive: true },
							orderBy: { quantity: "asc" },
						},
					},
				});

				return c.json({
					success: true,
					data: { ticketTypes },
				});
			} catch (error) {
				console.error("Error fetching ticket types:", error);
				return c.json({ error: "获取票种列表失败" }, 500);
			}
		},
	)
	.post(
		"/:id/ticket-types",
		validator("param", z.object({ id: z.string() })),
		validator("json", createTicketTypeSchema),
		authMiddleware,
		describeRoute({
			summary: "Create event ticket type",
			tags: ["Events"],
		}),
		async (c) => {
			try {
				const user = c.get("user");
				const { id: eventId } = c.req.valid("param");
				const validatedData = c.req.valid("json");
				const { priceTiers, ...ticketTypeData } = validatedData;

				// 验证活动是否存在
				const event = await db.event.findUnique({
					where: { id: eventId },
					select: { id: true, status: true },
				});

				if (!event) {
					return c.json({ error: "活动不存在" }, 404);
				}

				// 使用安全的权限检查
				const hasPermission = await canManageEvent(eventId, user.id);

				if (!hasPermission) {
					return c.json({ error: "没有权限管理此活动" }, 403);
				}

				// 创建票种
				const ticketType = await db.eventTicketType.create({
					data: {
						eventId,
						...ticketTypeData,
						...(priceTiers?.length
							? {
									priceTiers: {
										create: priceTiers.map((tier) => ({
											quantity: tier.quantity,
											price: tier.price,
											currency: tier.currency ?? "CNY",
										})),
									},
								}
							: {}),
					},
					include: {
						_count: {
							select: { registrations: true },
						},
						priceTiers: {
							where: { isActive: true },
							orderBy: { quantity: "asc" },
						},
					},
				});

				return c.json({
					success: true,
					data: { ticketType },
				});
			} catch (error) {
				console.error("Error creating ticket type:", error);
				return c.json({ error: "创建票种失败" }, 500);
			}
		},
	)
	.put(
		"/:id/ticket-types/:ticketTypeId",
		validator(
			"param",
			z.object({ id: z.string(), ticketTypeId: z.string() }),
		),
		validator("json", updateTicketTypeSchema),
		authMiddleware,
		describeRoute({
			summary: "Update event ticket type",
			tags: ["Events"],
		}),
		async (c) => {
			try {
				const user = c.get("user");
				const { id: eventId, ticketTypeId } = c.req.valid("param");
				const validatedData = c.req.valid("json");
				const { priceTiers, ...ticketTypeData } = validatedData;

				// 验证票种是否存在且属于该活动
				const ticketType = await db.eventTicketType.findFirst({
					where: {
						id: ticketTypeId,
						eventId,
					},
				});

				if (!ticketType) {
					return c.json({ error: "票种不存在" }, 404);
				}

				// 使用安全的权限检查
				const hasPermission = await canManageTicketType(
					ticketTypeId,
					user.id,
				);

				if (!hasPermission) {
					return c.json({ error: "没有权限管理此票种" }, 403);
				}

				// 更新票种
				const updatedTicketType = await db.$transaction(async (tx) => {
					await tx.eventTicketType.update({
						where: { id: ticketTypeId },
						data: ticketTypeData,
					});

					if (priceTiers) {
						await tx.eventTicketPriceTier.deleteMany({
							where: { ticketTypeId },
						});

						if (priceTiers.length > 0) {
							await tx.eventTicketPriceTier.createMany({
								data: priceTiers.map((tier) => ({
									quantity: tier.quantity,
									price: tier.price,
									currency: tier.currency ?? "CNY",
									ticketTypeId,
								})),
							});
						}
					}

					return await tx.eventTicketType.findUnique({
						where: { id: ticketTypeId },
						include: {
							_count: {
								select: { registrations: true },
							},
							priceTiers: {
								where: { isActive: true },
								orderBy: { quantity: "asc" },
							},
						},
					});
				});

				return c.json({
					success: true,
					data: { ticketType: updatedTicketType },
				});
			} catch (error) {
				console.error("Error updating ticket type:", error);
				return c.json({ error: "更新票种失败" }, 500);
			}
		},
	)
	.delete(
		"/:id/ticket-types/:ticketTypeId",
		validator(
			"param",
			z.object({ id: z.string(), ticketTypeId: z.string() }),
		),
		authMiddleware,
		describeRoute({
			summary: "Delete event ticket type",
			tags: ["Events"],
		}),
		async (c) => {
			try {
				const user = c.get("user");
				const { id: eventId, ticketTypeId } = c.req.valid("param");

				// 验证票种是否存在且属于该活动
				const ticketType = await db.eventTicketType.findFirst({
					where: {
						id: ticketTypeId,
						eventId,
					},
					include: {
						_count: {
							select: { registrations: true },
						},
					},
				});

				if (!ticketType) {
					return c.json({ error: "票种不存在" }, 404);
				}

				// 使用安全的权限检查
				const hasPermission = await canManageTicketType(
					ticketTypeId,
					user.id,
				);

				if (!hasPermission) {
					return c.json({ error: "没有权限管理此票种" }, 403);
				}

				// 检查是否有已注册的用户
				if (ticketType._count.registrations > 0) {
					return c.json(
						{ error: "该票种已有用户注册，无法删除" },
						400,
					);
				}

				// 删除票种
				await db.eventTicketType.delete({
					where: { id: ticketTypeId },
				});

				return c.json({
					success: true,
					message: "票种删除成功",
				});
			} catch (error) {
				console.error("Error deleting ticket type:", error);
				return c.json({ error: "删除票种失败" }, 500);
			}
		},
	);
