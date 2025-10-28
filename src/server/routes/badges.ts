import { auth } from "@/lib/auth";
import {
	createBadge,
	getActiveBadges,
	awardBadge,
	getUserBadges,
	revokeBadge,
	getBadgeHolders,
	initializeDefaultBadges,
} from "@/lib/database/prisma/queries/badges";
import { BadgeRarity } from "@prisma/client";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";

const createBadgeSchema = z.object({
	name: z.string().min(1, "勋章名称不能为空"),
	description: z.string().min(1, "勋章描述不能为空"),
	iconUrl: z.string().url("无效的图标URL").optional(),
	rarity: z.nativeEnum(BadgeRarity).default(BadgeRarity.COMMON),
});

const awardBadgeSchema = z.object({
	userId: z.string().min(1, "用户ID不能为空"),
	badgeId: z.string().min(1, "勋章ID不能为空"),
	reason: z.string().optional(),
	expiresAt: z
		.string()
		.optional()
		.transform((val) => (val ? new Date(val) : undefined)),
});

export const badgesRouter = new Hono()
	// GET /badges - 获取所有活跃勋章
	.get("/", async (c) => {
		try {
			const badges = await getActiveBadges();
			return c.json({ badges });
		} catch (error) {
			console.error("Error fetching badges:", error);
			return c.json({ error: "Internal server error" }, 500);
		}
	})

	// POST /badges - 创建新勋章（管理员功能）
	.post("/", zValidator("json", createBadgeSchema), async (c) => {
		try {
			const session = await auth.api.getSession({
				headers: c.req.raw.headers,
			});

			if (!session?.user) {
				return c.json({ error: "Unauthorized" }, 401);
			}

			// TODO: 添加管理员权限检查
			// 暂时允许所有登录用户创建勋章，后续需要添加权限控制

			const data = c.req.valid("json");

			const badge = await createBadge({
				name: data.name,
				description: data.description,
				iconUrl: data.iconUrl,
				rarity: data.rarity,
			});

			return c.json({ badge });
		} catch (error) {
			console.error("Error creating badge:", error);
			return c.json({ error: "Internal server error" }, 500);
		}
	})

	// POST /badges/award - 颁发勋章给用户
	.post("/award", zValidator("json", awardBadgeSchema), async (c) => {
		try {
			const session = await auth.api.getSession({
				headers: c.req.raw.headers,
			});

			if (!session?.user) {
				return c.json({ error: "Unauthorized" }, 401);
			}

			// TODO: 添加管理员权限检查
			// 暂时允许所有登录用户颁发勋章，后续需要添加权限控制

			const data = c.req.valid("json");

			const userBadge = await awardBadge({
				userId: data.userId,
				badgeId: data.badgeId,
				awardedBy: session.user.id,
				reason: data.reason,
				expiresAt: data.expiresAt,
			});

			return c.json({ userBadge });
		} catch (error) {
			console.error("Error awarding badge:", error);

			if (
				error instanceof Error &&
				error.message.includes("已拥有该勋章")
			) {
				return c.json({ error: "用户已拥有该勋章" }, 409);
			}

			return c.json({ error: "Internal server error" }, 500);
		}
	})

	// GET /badges/user/:userId - 获取用户勋章
	.get("/user/:userId", async (c) => {
		try {
			const userId = c.req.param("userId");
			const userBadges = await getUserBadges(userId);
			return c.json({ userBadges });
		} catch (error) {
			console.error("Error fetching user badges:", error);
			return c.json({ error: "Internal server error" }, 500);
		}
	})

	// GET /badges/my - 获取当前用户勋章
	.get("/my", async (c) => {
		try {
			const session = await auth.api.getSession({
				headers: c.req.raw.headers,
			});

			if (!session?.user) {
				return c.json({ error: "Unauthorized" }, 401);
			}

			const userBadges = await getUserBadges(session.user.id);
			return c.json({ userBadges });
		} catch (error) {
			console.error("Error fetching my badges:", error);
			return c.json({ error: "Internal server error" }, 500);
		}
	})

	// GET /badges/:badgeId/holders - 获取勋章获得者列表
	.get("/:badgeId/holders", async (c) => {
		try {
			const badgeId = c.req.param("badgeId");
			const holders = await getBadgeHolders(badgeId);
			return c.json({ holders });
		} catch (error) {
			console.error("Error fetching badge holders:", error);
			return c.json({ error: "Internal server error" }, 500);
		}
	})

	// DELETE /badges/user/:userId/:badgeId - 撤销用户勋章
	.delete("/user/:userId/:badgeId", async (c) => {
		try {
			const session = await auth.api.getSession({
				headers: c.req.raw.headers,
			});

			if (!session?.user) {
				return c.json({ error: "Unauthorized" }, 401);
			}

			// TODO: 添加管理员权限检查
			// 暂时允许所有登录用户撤销勋章，后续需要添加权限控制

			const userId = c.req.param("userId");
			const badgeId = c.req.param("badgeId");

			await revokeBadge(userId, badgeId);

			return c.json({ success: true });
		} catch (error) {
			console.error("Error revoking badge:", error);
			return c.json({ error: "Internal server error" }, 500);
		}
	})

	// POST /badges/initialize - 初始化默认勋章（系统管理功能）
	.post("/initialize", async (c) => {
		try {
			const session = await auth.api.getSession({
				headers: c.req.raw.headers,
			});

			if (!session?.user) {
				return c.json({ error: "Unauthorized" }, 401);
			}

			// TODO: 添加超级管理员权限检查
			// 这是系统级操作，应该限制权限

			const badges = await initializeDefaultBadges();

			return c.json({
				message: `成功创建 ${badges.length} 个默认勋章`,
				badges,
			});
		} catch (error) {
			console.error("Error initializing default badges:", error);
			return c.json({ error: "Internal server error" }, 500);
		}
	});

export default badgesRouter;
