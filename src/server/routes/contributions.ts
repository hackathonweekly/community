import { auth } from "@/lib/auth";
import {
	getUserContributions,
	getOrganizationContributions,
	createContributionRequest,
	reviewContribution,
	calculateUserLevel,
} from "@/lib/database/prisma/queries/contributions";
import { getOrganizationMembership } from "@/lib/database";
import { ContributionType, ContributionStatus } from "@prisma/client";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";

const createContributionSchema = z.object({
	type: z.nativeEnum(ContributionType),
	category: z.string().min(1, "分类不能为空"),
	description: z.string().min(10, "描述至少10个字符"),
	requestedCp: z
		.number()
		.min(1, "申请CP值必须大于0")
		.max(500, "单次申请CP值不能超过500"),
	evidence: z.string().optional(),
	organizationId: z.string().optional(),
});

const reviewContributionSchema = z.object({
	status: z.nativeEnum(ContributionStatus),
	reviewNote: z.string().optional(),
	awardedCp: z.number().min(0).optional(),
});

export const contributionsRouter = new Hono()
	// GET /contributions/types - 获取贡献类型配置 (无需认证)
	.get("/types", async (c) => {
		const contributionTypes = [
			{
				type: ContributionType.EVENT_ORGANIZATION,
				name: "活动组织",
				description: "组织社区活动、讲座、研讨会等",
				cpRange: "20-100",
				defaultCp: 50,
				category: "社区贡献",
			},
			{
				type: ContributionType.CONTENT_CREATION,
				name: "内容创作",
				description: "撰写技术文章、教程、分享经验等",
				cpRange: "10-50",
				defaultCp: 20,
				category: "知识分享",
			},
			{
				type: ContributionType.COMMUNITY_SERVICE,
				name: "社区服务",
				description: "答疑解惑、指导新人、维护社区秩序等",
				cpRange: "5-30",
				defaultCp: 15,
				category: "社区贡献",
			},
			{
				type: ContributionType.RESOURCE_INTRODUCTION,
				name: "资源引入",
				description: "引入合作伙伴、赞助商、重要嘉宾等",
				cpRange: "30-200",
				defaultCp: 80,
				category: "资源拓展",
			},
			{
				type: ContributionType.COMMUNITY_BUILDING,
				name: "社区建设",
				description: "重大产品贡献、创建SIG、战略规划等",
				cpRange: "50-500",
				defaultCp: 150,
				category: "基础建设",
			},
			{
				type: ContributionType.VOLUNTEER_SERVICE,
				name: "志愿者服务",
				description: "担任分部志愿者、协助日常运营等",
				cpRange: "10-50",
				defaultCp: 25,
				category: "志愿服务",
			},
			{
				type: ContributionType.OTHER,
				name: "其他贡献",
				description: "其他对社区有价值的贡献",
				cpRange: "1-100",
				defaultCp: 10,
				category: "其他",
			},
		];

		return c.json({ contributionTypes });
	})

	// GET /contributions - 获取用户贡献记录
	.get("/", async (c) => {
		try {
			const session = await auth.api.getSession({
				headers: c.req.raw.headers,
			});

			if (!session?.user) {
				return c.json({ error: "Unauthorized" }, 401);
			}

			const {
				type,
				status,
				organizationId,
				limit = "20",
				offset = "0",
			} = c.req.query();

			const contributions = await getUserContributions(session.user.id, {
				type: type as ContributionType,
				status: status as ContributionStatus,
				organizationId,
				limit: Number.parseInt(limit),
				offset: Number.parseInt(offset),
			});

			// 获取用户等级信息 - 需要从数据库获取完整用户数据
			const { getUserById } = await import("@/lib/database");
			const fullUser = await getUserById(session.user.id);
			const levelInfo = fullUser
				? calculateUserLevel(fullUser.cpValue || 0)
				: null;

			return c.json({
				contributions,
				levelInfo,
				totalCp: fullUser?.cpValue || 0,
			});
		} catch (error) {
			console.error("Error fetching contributions:", error);
			return c.json({ error: "Internal server error" }, 500);
		}
	})

	// POST /contributions - 创建贡献申报
	.post("/", zValidator("json", createContributionSchema), async (c) => {
		try {
			const session = await auth.api.getSession({
				headers: c.req.raw.headers,
			});

			if (!session?.user) {
				return c.json({ error: "Unauthorized" }, 401);
			}

			const data = c.req.valid("json");

			const contribution = await createContributionRequest({
				userId: session.user.id,
				type: data.type,
				category: data.category,
				description: data.description,
				requestedCp: data.requestedCp,
				evidence: data.evidence,
				organizationId: data.organizationId,
			});

			return c.json({ contribution });
		} catch (error) {
			console.error("Error creating contribution request:", error);
			return c.json({ error: "Internal server error" }, 500);
		}
	})

	// GET /contributions/organization/:organizationId - 获取组织贡献记录（管理员用）
	.get("/organization/:organizationId", async (c) => {
		try {
			const session = await auth.api.getSession({
				headers: c.req.raw.headers,
			});

			if (!session?.user) {
				return c.json({ error: "Unauthorized" }, 401);
			}

			const organizationId = c.req.param("organizationId");

			// 检查用户是否是组织成员/管理员
			const membership = await getOrganizationMembership(
				organizationId,
				session.user.id,
			);
			if (!membership) {
				return c.json({ error: "Access denied" }, 403);
			}

			const { status, limit = "20", offset = "0" } = c.req.query();

			const contributions = await getOrganizationContributions(
				organizationId,
				{
					status: status as ContributionStatus,
					limit: Number.parseInt(limit),
					offset: Number.parseInt(offset),
				},
			);

			return c.json({ contributions });
		} catch (error) {
			console.error("Error fetching organization contributions:", error);
			return c.json({ error: "Internal server error" }, 500);
		}
	})

	// PUT /contributions/:id/review - 审核贡献申报
	.put(
		"/:id/review",
		zValidator("json", reviewContributionSchema),
		async (c) => {
			try {
				const session = await auth.api.getSession({
					headers: c.req.raw.headers,
				});

				if (!session?.user) {
					return c.json({ error: "Unauthorized" }, 401);
				}

				const contributionId = c.req.param("id");
				const data = c.req.valid("json");

				// TODO: 添加权限检查 - 只有管理员可以审核
				// 这里需要根据具体的权限系统来实现

				const contribution = await reviewContribution(
					contributionId,
					data.status,
					session.user.id,
					data.reviewNote,
				);

				return c.json({ contribution });
			} catch (error) {
				console.error("Error reviewing contribution:", error);
				return c.json({ error: "Internal server error" }, 500);
			}
		},
	);

export default contributionsRouter;
