import { ensureImageSafe } from "@/lib/content-moderation";
import { db } from "@/lib/database/prisma/client";
import { uploadFileToS3 } from "@/lib/storage";
import { addWatermark } from "@/lib/storage/watermark";
import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { validator } from "hono-openapi/zod";
import { z } from "zod";
import { authMiddleware } from "../../middleware/auth";
import { getPublicStorageUrl } from "@/lib/storage/url";
import { config } from "@/config";

const uploadPhotoSchema = z.object({
	imageUrl: z.string().url("请提供有效的图片URL"),
	caption: z.string().optional(),
});

const deletePhotoSchema = z.object({
	photoId: z.string(),
});

export const eventPhotosRouter = new Hono()
	// 获取所有照片（带水印）
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

				// 格式化响应，使用水印图片URL
				const formattedPhotos = photos.map((photo) => ({
					...photo,
					imageUrl:
						getPublicStorageUrl(
							photo.watermarkedUrl || photo.imageUrl,
						) || photo.imageUrl,
					originalUrl:
						getPublicStorageUrl(photo.imageUrl) || photo.imageUrl,
				}));

				return c.json({
					success: true,
					data: { photos: formattedPhotos },
				});
			} catch (error) {
				console.error("Error fetching event photos:", error);
				return c.json({ error: "获取活动照片失败" }, 500);
			}
		},
	)
	// 获取我的照片
	.get(
		"/:id/photos/my",
		validator("param", z.object({ id: z.string() })),
		authMiddleware,
		describeRoute({
			summary: "Get current user's photos for event",
			tags: ["Events"],
		}),
		async (c) => {
			try {
				const { id: eventId } = c.req.valid("param");
				const user = c.get("user");

				// 验证活动是否存在
				const event = await db.event.findUnique({
					where: { id: eventId },
					select: { id: true, status: true },
				});

				if (!event) {
					return c.json({ error: "活动不存在" }, 404);
				}

				// 获取当前用户上传的照片
				const photos = await db.eventPhoto.findMany({
					where: {
						eventId,
						userId: user.id,
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

				// 格式化响应
				const formattedPhotos = photos.map((photo) => ({
					...photo,
					imageUrl:
						getPublicStorageUrl(
							photo.watermarkedUrl || photo.imageUrl,
						) || photo.imageUrl,
					originalUrl:
						getPublicStorageUrl(photo.imageUrl) || photo.imageUrl,
				}));

				return c.json({
					success: true,
					data: { photos: formattedPhotos },
				});
			} catch (error) {
				console.error("Error fetching my photos:", error);
				return c.json({ error: "获取我的照片失败" }, 500);
			}
		},
	)
	// 上传照片（带水印）
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

				// 下载原始图片并添加水印
				let watermarkedUrl: string | undefined;
				try {
					const response = await fetch(validatedData.imageUrl);
					if (!response.ok) {
						throw new Error("Failed to fetch image");
					}

					const imageBuffer = Buffer.from(
						await response.arrayBuffer(),
					);
					const watermarkedBuffer = await addWatermark(imageBuffer);

					// Upload watermarked image to S3
					const watermarkPath = `events/${eventId}/photos/watermarked_${Date.now()}_${user.id}.jpg`;
					const watermarkBucket = config.storage.bucketNames.public;

					await uploadFileToS3(watermarkPath, {
						bucket: watermarkBucket,
						body: watermarkedBuffer,
						contentType: "image/jpeg",
					});

					watermarkedUrl = watermarkPath;
				} catch (watermarkError) {
					console.error("Failed to add watermark:", watermarkError);
					// 如果水印处理失败，仍然上传原图，但不设置 watermarkedUrl
				}

				// 创建照片记录
				const photo = await db.eventPhoto.create({
					data: {
						eventId,
						userId: user.id,
						imageUrl: validatedData.imageUrl,
						watermarkedUrl: watermarkedUrl || null,
						caption: validatedData.caption,
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

				// 格式化响应
				const formattedPhoto = {
					...photo,
					imageUrl:
						getPublicStorageUrl(
							photo.watermarkedUrl || photo.imageUrl,
						) || photo.imageUrl,
					originalUrl:
						getPublicStorageUrl(photo.imageUrl) || photo.imageUrl,
				};

				return c.json({
					success: true,
					data: { photo: formattedPhoto },
					message: "照片上传成功",
				});
			} catch (error) {
				console.error("Error uploading event photo:", error);
				return c.json({ error: "上传照片失败" }, 500);
			}
		},
	)
	// 删除照片
	.delete(
		"/:id/photos",
		validator("param", z.object({ id: z.string() })),
		validator("json", deletePhotoSchema),
		authMiddleware,
		describeRoute({
			summary: "Delete event photo",
			tags: ["Events"],
		}),
		async (c) => {
			try {
				const user = c.get("user");
				const { id: eventId } = c.req.valid("param");
				const { photoId } = c.req.valid("json");

				// 检查用户是否已登录
				if (!user || !user.id) {
					console.error("User not authenticated for photo deletion");
					return c.json({ error: "请先登录" }, 401);
				}

				// 检查照片是否存在
				const photo = await db.eventPhoto.findUnique({
					where: { id: photoId },
				});

				if (!photo) {
					console.error("Photo not found:", { photoId });
					return c.json({ error: "照片不存在" }, 404);
				}

				// 检查照片是否属于这个活动
				if (photo.eventId !== eventId) {
					return c.json({ error: "照片不属于此活动" }, 400);
				}

				// 检查权限：只有上传者本人可以删除
				if (photo.userId !== user.id) {
					return c.json({ error: "只能删除自己上传的照片" }, 403);
				}

				// 删除照片记录（软删除）
				await db.eventPhoto.delete({
					where: { id: photoId },
				});

				return c.json({
					success: true,
					message: "照片删除成功",
				});
			} catch (error) {
				console.error("Error deleting event photo:", error);
				return c.json({ error: "删除照片失败" }, 500);
			}
		},
	);
