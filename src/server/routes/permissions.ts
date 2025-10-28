/**
 * 简单的新朋友限制管理API
 */

import { db } from "@/lib/database";
import { RestrictedAction } from "@/features/permissions";
import {
	getVisitorRestrictionsConfig,
	setVisitorRestrictionsConfig,
	VISITOR_RESTRICTIONS_CONFIG_KEY,
} from "@/config/visitor-restrictions";
import { Hono } from "hono";
import { z } from "zod";
import { authMiddleware } from "../middleware/auth";

const restrictionConfigSchema = z.object({
	[RestrictedAction.CREATE_COMMENT]: z.boolean(),
	[RestrictedAction.CREATE_PROJECT]: z.boolean(),
	[RestrictedAction.CREATE_ORGANIZATION]: z.boolean(),
	[RestrictedAction.CREATE_EVENT]: z.boolean(),
	[RestrictedAction.LIKE_PROJECT]: z.boolean(),
	[RestrictedAction.BOOKMARK_PROJECT]: z.boolean(),
});

export const permissionsRouter = new Hono()
	.use(authMiddleware)

	// 获取新朋友限制配置（需要管理员权限）
	.get("/permissions/visitor-restrictions", async (c) => {
		try {
			const user = c.get("user");

			// 检查是否为管理员
			if (user.role !== "admin" && user.role !== "super_admin") {
				return c.json({ error: "权限不足" }, 403);
			}

			const restrictions = await getVisitorRestrictionsConfig();

			return c.json({ success: true, restrictions });
		} catch (error) {
			console.error("获取新朋友限制配置失败:", error);
			return c.json({ error: "获取配置失败" }, 500);
		}
	})

	// 更新新朋友限制配置（需要管理员权限）
	.put("/permissions/visitor-restrictions", async (c) => {
		try {
			const user = c.get("user");

			// 检查是否为管理员
			if (user.role !== "admin" && user.role !== "super_admin") {
				return c.json({ error: "权限不足" }, 403);
			}

			const body = await c.req.json();
			const restrictions = restrictionConfigSchema.parse(body);

			await setVisitorRestrictionsConfig(restrictions, user.id);

			// 记录管理日志
			await db.adminLog.create({
				data: {
					adminId: user.id,
					action: "UPDATE_VISITOR_RESTRICTIONS",
					targetType: "SYSTEM",
					targetId: VISITOR_RESTRICTIONS_CONFIG_KEY,
					details: JSON.stringify({
						restrictions,
						restrictedActions: Object.entries(restrictions)
							.filter(([_, restricted]) => restricted)
							.map(([action, _]) => action),
					}),
				},
			});

			return c.json({
				success: true,
				message: "新朋友限制配置已更新",
			});
		} catch (error) {
			console.error("更新新朋友限制配置失败:", error);
			return c.json({ error: "更新配置失败" }, 500);
		}
	})

	// 获取当前用户的权限信息（任何登录用户都可访问）
	.get("/permissions/user", async (c) => {
		try {
			const currentUser = c.get("user");

			// 获取用户等级信息
			const user = await db.user.findUnique({
				where: { id: currentUser.id },
				select: {
					membershipLevel: true,
				},
			});

			if (!user) {
				return c.json({ error: "用户不存在" }, 404);
			}

			// 获取新朋友限制配置
			const restrictions = await getVisitorRestrictionsConfig();

			// 导入权限检查函数
			const { isVisitor, canUserDoAction } = await import(
				"@/features/permissions"
			);

			const userLevel = { membershipLevel: user.membershipLevel };
			const isUserVisitor = isVisitor(userLevel);

			// 检查所有操作的权限
			const permissions = Object.values(RestrictedAction).map(
				(action) => ({
					action,
					allowed: canUserDoAction(
						userLevel,
						action as RestrictedAction,
						restrictions,
					).allowed,
				}),
			);

			return c.json({
				success: true,
				user: {
					membershipLevel: user.membershipLevel,
					isVisitor: isUserVisitor,
					permissions,
					restrictions: isUserVisitor ? restrictions : {},
				},
			});
		} catch (error) {
			console.error("获取用户权限信息失败:", error);
			return c.json({ error: "获取权限信息失败" }, 500);
		}
	});
