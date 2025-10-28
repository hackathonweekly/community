import { ensureImageSafe } from "@/lib/content-moderation";
import { db } from "@/lib/database/prisma/client";
import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { validator } from "hono-openapi/zod";
import { z } from "zod";
import { authMiddleware } from "../../middleware/auth";

const uploadPhotoSchema = z.object({
	imageUrl: z.string().url("请提供有效的图片URL"),
	caption: z.string().optional(),
});

export const eventPhotosRouter = new Hono()
	.get(
		"/:id/photos",
		validator("param", z.object({ id: z.string() })),
		describeRoute({
			summary: "Get event photos",
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

				// 获取已审核通过的照片
				const photos = await db.eventPhoto.findMany({
					where: {
						eventId,
						isApproved: true,
					},
					include: {
						user: {
							select: {
								id: true,
								name: true,
								image: true,
								username: true,
							},
						},
					},
					orderBy: { createdAt: "desc" },
				});

				return c.json({
					success: true,
					data: { photos },
				});
			} catch (error) {
				console.error("Error fetching event photos:", error);
				return c.json({ error: "获取活动照片失败" }, 500);
			}
		},
	)
	.post(
		"/:id/photos",
		validator("param", z.object({ id: z.string() })),
		validator("json", uploadPhotoSchema),
		authMiddleware,
		describeRoute({
			summary: "Upload event photo",
			tags: ["Events"],
		}),
		async (c) => {
			try {
				const user = c.get("user");
				const { id: eventId } = c.req.valid("param");
				const validatedData = c.req.valid("json");

				// 首先获取活动信息
				const event = await db.event.findUnique({
					where: { id: eventId },
					select: {
						id: true,
						title: true,
						status: true,
						organizerId: true,
					},
				});

				if (!event) {
					return c.json({ error: "活动不存在" }, 404);
				}

				// 检查活动是否已取消
				if (event.status === "CANCELLED") {
					return c.json({ error: "已取消的活动无法上传照片" }, 400);
				}

				// 检查用户权限：组织者或已确认参加的成员
				const isOrganizer = event.organizerId === user.id;
				let hasPermission = isOrganizer;

				if (!isOrganizer) {
					// 如果不是组织者，检查是否是已确认参加的成员
					const registration = await db.eventRegistration.findFirst({
						where: {
							eventId,
							userId: user.id,
							status: "APPROVED",
						},
					});
					hasPermission = !!registration;
				}

				if (!hasPermission) {
					return c.json(
						{
							error: "只有活动组织者或已确认参加的成员才能上传照片",
						},
						403,
					);
				}

				const imageModeration = await ensureImageSafe(
					validatedData.imageUrl,
					"content",
					{ skipIfEmpty: false },
				);

				if (!imageModeration.isApproved) {
					console.warn("Event photo moderation rejected", {
						userId: user.id,
						eventId,
						imageUrl: validatedData.imageUrl,
						result: imageModeration.result,
					});
					const violationMessage = "发布内容含违规信息，请修改后重试";
					return c.json(
						{
							error: imageModeration.reason ?? violationMessage,
						},
						400,
					);
				}

				// 创建照片记录
				const photo = await db.eventPhoto.create({
					data: {
						eventId,
						userId: user.id,
						imageUrl: validatedData.imageUrl,
						caption: validatedData.caption,
						// 默认自动审核通过，如果需要人工审核可以设置为false
						isApproved: true,
					},
					include: {
						user: {
							select: {
								id: true,
								name: true,
								image: true,
								username: true,
							},
						},
					},
				});

				return c.json({
					success: true,
					data: { photo },
					message: "照片上传成功",
				});
			} catch (error) {
				console.error("Error uploading event photo:", error);
				return c.json({ error: "上传照片失败" }, 500);
			}
		},
	);
