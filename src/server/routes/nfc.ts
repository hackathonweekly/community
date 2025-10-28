import { auth } from "@/lib/auth";
import { AdminPermission, hasPermission } from "@/lib/auth/permissions";
import { db } from "@/lib/database";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import QRCode from "qrcode";
import sharp from "sharp";
import { z } from "zod";
import { join } from "node:path";

// 生成NFC的请求schema
const generateNfcSchema = z.object({
	count: z
		.number()
		.int()
		.min(1, "生成数量至少为1")
		.max(500, "生成数量不能超过500"),
});

// 绑定NFC的请求schema
const bindNfcSchema = z.object({
	nfcId: z.string().min(1, "NFC ID不能为空"),
});

// 生成带logo的二维码
async function generateQRCodeWithLogo(
	text: string,
	logoPath: string,
): Promise<Buffer> {
	try {
		// 生成基础二维码（300x300）
		const qrBuffer = await QRCode.toBuffer(text, {
			width: 300,
			margin: 2,
			errorCorrectionLevel: "H", // 高纠错级别，允许遮挡部分
		});

		// 读取logo文件
		const logo = sharp(logoPath).resize(60, 60); // logo大小为二维码的20%

		// 合成二维码和logo
		const finalImage = await sharp(qrBuffer)
			.composite([
				{
					input: await logo.toBuffer(),
					gravity: "center", // 居中放置logo
				},
			])
			.png()
			.toBuffer();

		return finalImage;
	} catch (error) {
		console.error("Error generating QR code with logo:", error);
		throw error;
	}
}

export const nfcRouter = new Hono()
	// POST /admin/generate - 批量生成NFC（仅超级管理员）
	.post(
		"/admin/generate",
		zValidator("json", generateNfcSchema),
		async (c) => {
			try {
				const session = await auth.api.getSession({
					headers: c.req.raw.headers,
				});

				// 权限验证：只有超级管理员可以生成NFC
				if (
					!session?.user ||
					!hasPermission(session.user, AdminPermission.MANAGE_SYSTEM)
				) {
					return c.json({ error: "Access denied" }, 403);
				}

				const { count } = c.req.valid("json");

				// 批量创建NFC记录
				const nfcCards = await Promise.all(
					Array.from({ length: count }, async () => {
						return db.nfcCard.create({
							data: {
								createdBy: session.user.id,
							},
						});
					}),
				);

				return c.json({
					success: true,
					count: nfcCards.length,
					nfcCards: nfcCards.map((card) => ({
						id: card.id,
						status: card.status,
						createdAt: card.createdAt,
					})),
				});
			} catch (error) {
				console.error("Error generating NFC cards:", error);
				return c.json({ error: "Internal server error" }, 500);
			}
		},
	)

	// GET /admin/list - 查看NFC列表（仅超级管理员）
	.get("/admin/list", async (c) => {
		try {
			const session = await auth.api.getSession({
				headers: c.req.raw.headers,
			});

			// 权限验证：只有超级管理员可以查看NFC列表
			if (
				!session?.user ||
				!hasPermission(session.user, AdminPermission.MANAGE_SYSTEM)
			) {
				return c.json({ error: "Access denied" }, 403);
			}

			const { status, limit = "100", offset = "0" } = c.req.query();

			const where = status
				? { status: status as "PENDING" | "BOUND" }
				: {};

			const [nfcCards, totalCount] = await Promise.all([
				db.nfcCard.findMany({
					where,
					include: {
						boundUser: {
							select: {
								id: true,
								name: true,
								username: true,
								image: true,
							},
						},
						creator: {
							select: {
								id: true,
								name: true,
							},
						},
					},
					orderBy: {
						createdAt: "desc",
					},
					take: Number.parseInt(limit),
					skip: Number.parseInt(offset),
				}),
				db.nfcCard.count({ where }),
			]);

			return c.json({
				success: true,
				nfcCards,
				totalCount,
			});
		} catch (error) {
			console.error("Error fetching NFC list:", error);
			return c.json({ error: "Internal server error" }, 500);
		}
	})

	// GET /admin/qrcode/:id - 生成单个NFC的二维码（仅超级管理员）
	.get("/admin/qrcode/:id", async (c) => {
		try {
			const session = await auth.api.getSession({
				headers: c.req.raw.headers,
			});

			// 权限验证：只有超级管理员可以生成二维码
			if (
				!session?.user ||
				!hasPermission(session.user, AdminPermission.MANAGE_SYSTEM)
			) {
				return c.json({ error: "Access denied" }, 403);
			}

			const nfcId = c.req.param("id");

			// 验证NFC存在
			const nfcCard = await db.nfcCard.findUnique({
				where: { id: nfcId },
			});

			if (!nfcCard) {
				return c.json({ error: "NFC card not found" }, 404);
			}

			// 生成二维码URL
			const baseUrl = c.req.header("origin") || "http://localhost:3000";
			const qrCodeUrl = `${baseUrl}/zh/nfc-bind/${nfcId}`;

			// 生成带logo的二维码
			const logoPath = join(
				process.cwd(),
				"public/images/logo-stack.png",
			);
			const qrCodeBuffer = await generateQRCodeWithLogo(
				qrCodeUrl,
				logoPath,
			);

			// 设置响应头
			c.header("Content-Type", "image/png");
			c.header(
				"Content-Disposition",
				`attachment; filename="nfc_${nfcId}.png"`,
			);

			return c.body(qrCodeBuffer);
		} catch (error) {
			console.error("Error generating QR code:", error);
			return c.json({ error: "Internal server error" }, 500);
		}
	})

	// GET /admin/download-zip - 批量下载二维码ZIP包（仅超级管理员）
	.get("/admin/download-zip", async (c) => {
		try {
			const session = await auth.api.getSession({
				headers: c.req.raw.headers,
			});

			// 权限验证：只有超级管理员可以下载ZIP包
			if (
				!session?.user ||
				!hasPermission(session.user, AdminPermission.MANAGE_SYSTEM)
			) {
				return c.json({ error: "Access denied" }, 403);
			}

			const { ids } = c.req.query();
			if (!ids) {
				return c.json({ error: "Missing ids parameter" }, 400);
			}

			const nfcIds = ids.split(",");

			// 验证所有NFC存在
			const nfcCards = await db.nfcCard.findMany({
				where: {
					id: { in: nfcIds },
					createdBy: session.user.id, // 只能下载自己创建的NFC
				},
			});

			if (nfcCards.length !== nfcIds.length) {
				return c.json(
					{ error: "Some NFC cards not found or not accessible" },
					404,
				);
			}

			// 动态导入 JSZip
			const JSZip = (await import("jszip")).default;
			const zip = new JSZip();

			const baseUrl = c.req.header("origin") || "http://localhost:3000";
			const logoPath = join(
				process.cwd(),
				"public/images/logo-stack.png",
			);

			// 为每个NFC生成二维码并添加到ZIP
			for (const nfcCard of nfcCards) {
				const qrCodeUrl = `${baseUrl}/zh/nfc-bind/${nfcCard.id}`;
				const qrCodeBuffer = await generateQRCodeWithLogo(
					qrCodeUrl,
					logoPath,
				);
				zip.file(`nfc_${nfcCard.id}.png`, qrCodeBuffer);
			}

			// 生成ZIP
			const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });

			// 设置响应头
			c.header("Content-Type", "application/zip");
			c.header(
				"Content-Disposition",
				`attachment; filename="nfc_qrcodes_${new Date().toISOString().split("T")[0]}.zip"`,
			);

			return c.body(zipBuffer);
		} catch (error) {
			console.error("Error generating ZIP:", error);
			return c.json({ error: "Internal server error" }, 500);
		}
	})

	// GET /:id - 获取NFC详情（公开接口）
	.get("/:id", async (c) => {
		try {
			const nfcId = c.req.param("id");

			const nfcCard = await db.nfcCard.findUnique({
				where: { id: nfcId },
				include: {
					boundUser: {
						select: {
							id: true,
							username: true,
						},
					},
				},
			});

			if (!nfcCard) {
				return c.json(
					{
						error: "NFC card not found",
						status: "NOT_FOUND",
					},
					404,
				);
			}

			return c.json({
				success: true,
				nfcCard: {
					id: nfcCard.id,
					status: nfcCard.status,
					boundUsername: nfcCard.boundUser?.username,
				},
			});
		} catch (error) {
			console.error("Error fetching NFC card:", error);
			return c.json({ error: "Internal server error" }, 500);
		}
	})

	// POST /bind - 绑定NFC到当前用户（需要登录）
	.post("/bind", zValidator("json", bindNfcSchema), async (c) => {
		try {
			const session = await auth.api.getSession({
				headers: c.req.raw.headers,
			});

			// 必须登录才能绑定
			if (!session?.user) {
				return c.json({ error: "Authentication required" }, 401);
			}

			const { nfcId } = c.req.valid("json");

			// 查找NFC卡片
			const nfcCard = await db.nfcCard.findUnique({
				where: { id: nfcId },
			});

			if (!nfcCard) {
				return c.json({ error: "NFC card not found" }, 404);
			}

			// 检查是否已经绑定
			if (nfcCard.status === "BOUND" && nfcCard.boundUserId) {
				return c.json({ error: "NFC card already bound" }, 409);
			}

			// 获取用户的username
			const user = await db.user.findUnique({
				where: { id: session.user.id },
				select: { username: true },
			});

			if (!user?.username) {
				return c.json(
					{ error: "User must have a username to bind NFC" },
					400,
				);
			}

			// 绑定NFC到当前用户
			const updatedNfcCard = await db.nfcCard.update({
				where: { id: nfcId },
				data: {
					status: "BOUND",
					boundUserId: session.user.id,
					boundAt: new Date(),
				},
			});

			return c.json({
				success: true,
				nfcCard: {
					id: updatedNfcCard.id,
					status: updatedNfcCard.status,
					boundAt: updatedNfcCard.boundAt,
				},
				username: user.username,
			});
		} catch (error) {
			console.error("Error binding NFC card:", error);
			return c.json({ error: "Internal server error" }, 500);
		}
	});

export default nfcRouter;
