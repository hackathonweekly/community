import { auth } from "@/lib/auth";
import { AdminPermission, hasPermission } from "@/lib/auth/permissions";
import {
	getSystemConfig,
	updateSystemConfig,
} from "@/lib/database/prisma/queries/admin";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import {
	DEFAULT_BETA_BANNER_CONFIG,
	DEFAULT_CONTACT_FORM_CONFIG,
	DEFAULT_CUSTOMER_SERVICE_CONFIG,
} from "@/config/constants";
import { DEFAULT_VISITOR_RESTRICTIONS } from "@/features/permissions";

const updateConfigSchema = z.object({
	value: z.any(),
	description: z.string().optional(),
});

// 默认系统配置
const DEFAULT_CONFIGS = {
	cp_values: {
		EVENT_CHECKIN: 5,
		EVENT_FEEDBACK: 3,
		PROJECT_CREATION: 10,
		PROJECT_UPDATE: 2,
		PROJECT_LIKE: 1,
		COMMENT_CREATION: 1,
		PROFILE_COMPLETION: 5,
		VOLUNTEER_SERVICE: 10,
	},
	user_levels: {
		REGISTERED_USER: 0,
		COMMUNITY_MEMBER: 50,
		ACTIVE_CONTRIBUTOR: 100,
		CORE_CONTRIBUTOR: 500,
		COMMUNITY_LEADER: 2000,
	},
	site_settings: {
		site_name: "周周黑客松",
		site_description: "连接创新者，共建技术社区",
		announcement: "",
		maintenance_mode: false,
	},
	beta_banner: DEFAULT_BETA_BANNER_CONFIG,
	visitor_restrictions: DEFAULT_VISITOR_RESTRICTIONS,
	contact_form: DEFAULT_CONTACT_FORM_CONFIG,
	customer_service: DEFAULT_CUSTOMER_SERVICE_CONFIG,
};

export const systemConfigRouter = new Hono()
	// GET /config - 获取所有配置
	.get("/config", async (c) => {
		try {
			const session = await auth.api.getSession({
				headers: c.req.raw.headers,
			});

			if (
				!session?.user ||
				!hasPermission(session.user, AdminPermission.VIEW_SYSTEM_CONFIG)
			) {
				return c.json({ error: "Access denied" }, 403);
			}

			const configs: Record<string, any> = {};

			// 获取所有默认配置的当前值
			for (const [key, defaultValue] of Object.entries(DEFAULT_CONFIGS)) {
				const value = await getSystemConfig(key);
				configs[key] = value || defaultValue;
			}

			return c.json({ configs });
		} catch (error) {
			console.error("Error fetching system config:", error);
			return c.json({ error: "Internal server error" }, 500);
		}
	})

	// GET /config/:key - 获取单个配置
	.get("/config/:key", async (c) => {
		try {
			const session = await auth.api.getSession({
				headers: c.req.raw.headers,
			});

			if (
				!session?.user ||
				!hasPermission(session.user, AdminPermission.VIEW_SYSTEM_CONFIG)
			) {
				return c.json({ error: "Access denied" }, 403);
			}

			const key = c.req.param("key");
			const value = await getSystemConfig(key);
			const defaultValue =
				DEFAULT_CONFIGS[key as keyof typeof DEFAULT_CONFIGS];

			return c.json({
				key,
				value: value || defaultValue,
				hasCustomValue: !!value,
			});
		} catch (error) {
			console.error("Error fetching config:", error);
			return c.json({ error: "Internal server error" }, 500);
		}
	})

	// PUT /config/:key - 更新单个配置
	.put("/config/:key", zValidator("json", updateConfigSchema), async (c) => {
		try {
			const session = await auth.api.getSession({
				headers: c.req.raw.headers,
			});

			if (
				!session?.user ||
				!hasPermission(
					session.user,
					AdminPermission.MANAGE_SYSTEM_CONFIG,
				)
			) {
				return c.json({ error: "Access denied" }, 403);
			}

			const key = c.req.param("key");
			const { value, description } = c.req.valid("json");

			// 验证配置键是否存在于默认配置中
			if (!(key in DEFAULT_CONFIGS)) {
				return c.json({ error: "Invalid config key" }, 400);
			}

			const config = await updateSystemConfig(
				key,
				value,
				session.user.id,
				description,
			);

			return c.json({ config });
		} catch (error) {
			console.error("Error updating config:", error);
			return c.json({ error: "Internal server error" }, 500);
		}
	})

	// POST /config/reset/:key - 重置配置为默认值
	.post("/config/reset/:key", async (c) => {
		try {
			const session = await auth.api.getSession({
				headers: c.req.raw.headers,
			});

			if (
				!session?.user ||
				!hasPermission(
					session.user,
					AdminPermission.MANAGE_SYSTEM_CONFIG,
				)
			) {
				return c.json({ error: "Access denied" }, 403);
			}

			const key = c.req.param("key");

			if (!(key in DEFAULT_CONFIGS)) {
				return c.json({ error: "Invalid config key" }, 400);
			}

			const defaultValue =
				DEFAULT_CONFIGS[key as keyof typeof DEFAULT_CONFIGS];
			const config = await updateSystemConfig(
				key,
				defaultValue,
				session.user.id,
				"Reset to default value",
			);

			return c.json({ config });
		} catch (error) {
			console.error("Error resetting config:", error);
			return c.json({ error: "Internal server error" }, 500);
		}
	})

	// GET /config/templates/review - 获取审核模板
	.get("/config/templates/review", async (c) => {
		try {
			const session = await auth.api.getSession({
				headers: c.req.raw.headers,
			});

			if (
				!session?.user ||
				!hasPermission(
					session.user,
					AdminPermission.REVIEW_CONTRIBUTIONS,
				)
			) {
				return c.json({ error: "Access denied" }, 403);
			}

			const templates = [
				{
					id: "approved_standard",
					title: "标准通过",
					content: "贡献符合标准，予以通过。",
					status: "APPROVED",
				},
				{
					id: "approved_excellent",
					title: "优秀贡献",
					content: "贡献质量优秀，对社区发展有积极作用。",
					status: "APPROVED",
				},
				{
					id: "rejected_insufficient",
					title: "证据不足",
					content: "提供的证据不充分，请补充相关材料后重新申请。",
					status: "REJECTED",
				},
				{
					id: "rejected_duplicate",
					title: "重复申请",
					content: "该贡献已经申请过CP奖励，不可重复申请。",
					status: "REJECTED",
				},
				{
					id: "revision_required",
					title: "需要修改",
					content: "贡献描述需要更加详细，请补充相关信息。",
					status: "REVISED",
				},
			];

			return c.json({ templates });
		} catch (error) {
			console.error("Error fetching review templates:", error);
			return c.json({ error: "Internal server error" }, 500);
		}
	});

export default systemConfigRouter;
