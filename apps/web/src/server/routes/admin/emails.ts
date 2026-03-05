import { Hono } from "hono";
import { db } from "@community/lib-server/database/prisma";
import { isAdmin } from "@community/lib-shared/auth/permissions";
import { getSession } from "@shared/auth/lib/server";
import { sendEmail } from "@community/lib-server/mail";
import { isSendableEmail } from "@community/lib-server/mail/address";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";

type Variables = {
	session: any;
};

const emailsRouter = new Hono<{ Variables: Variables }>();

function sanitizeRecipients<T extends { email: string | null | undefined }>(
	users: T[],
) {
	let skipped = 0;
	const unique = new Map<string, T>();

	for (const user of users) {
		if (!isSendableEmail(user.email)) {
			skipped++;
			continue;
		}

		const key = user.email!.trim().toLowerCase();
		if (unique.has(key)) {
			skipped++;
			continue;
		}

		unique.set(key, user);
	}

	return {
		users: Array.from(unique.values()),
		skipped,
	};
}

// 创建邮件活动的验证schema
const createCampaignSchema = z.object({
	title: z.string().min(1, "Title is required"),
	description: z.string().optional(),
	type: z.enum([
		"NEWSLETTER",
		"NOTIFICATION",
		"MARKETING",
		"SYSTEM",
		"ANNOUNCEMENT",
	]),
	templateId: z.string().min(1, "Template ID is required"),
	subject: z.string().min(1, "Subject is required"),
	content: z.record(z.string(), z.any()),
	audienceConfig: z.record(z.string(), z.any()),
	scheduledAt: z.string().datetime().optional(),
});

const updateCampaignSchema = createCampaignSchema.partial();

// 权限中间件
emailsRouter.use("/*", async (c, next) => {
	const session = await getSession();
	if (!session || !isAdmin(session.user)) {
		return c.json({ error: "Unauthorized" }, 401);
	}
	c.set("session", session);
	await next();
});

// 获取邮件活动列表
emailsRouter.get("/campaigns", async (c) => {
	const { page = "1", limit = "20", status, type } = c.req.query();

	const pageNum = Number.parseInt(page);
	const limitNum = Number.parseInt(limit);
	const offset = (pageNum - 1) * limitNum;

	const where: any = {
		organizationId: null, // 全站邮件
	};

	if (status) {
		where.status = status;
	}

	if (type) {
		where.type = type;
	}

	try {
		const [campaigns, total] = await Promise.all([
			db.emailCampaign.findMany({
				where,
				include: {
					creator: {
						select: { name: true, email: true },
					},
					_count: {
						select: { jobs: true },
					},
				},
				orderBy: { createdAt: "desc" },
				take: limitNum,
				skip: offset,
			}),
			db.emailCampaign.count({ where }),
		]);

		return c.json({
			campaigns,
			pagination: {
				page: pageNum,
				limit: limitNum,
				total,
				totalPages: Math.ceil(total / limitNum),
			},
		});
	} catch (error) {
		console.error("Failed to fetch campaigns:", error);
		return c.json({ error: "Failed to fetch campaigns" }, 500);
	}
});

// 创建邮件活动
emailsRouter.post(
	"/campaigns",
	zValidator("json", createCampaignSchema),
	async (c) => {
		const session = c.get("session");
		const data = c.req.valid("json");

		try {
			const campaign = await db.emailCampaign.create({
				data: {
					...data,
					scope: "GLOBAL",
					organizationId: null,
					createdBy: session.user.id,
					status: data.scheduledAt ? "SCHEDULED" : "DRAFT",
					scheduledAt: data.scheduledAt
						? new Date(data.scheduledAt)
						: null,
				},
				include: {
					creator: {
						select: { name: true, email: true },
					},
				},
			});

			return c.json({ campaign }, 201);
		} catch (error) {
			console.error("Failed to create campaign:", error);
			return c.json({ error: "Failed to create campaign" }, 500);
		}
	},
);

// 获取单个邮件活动
emailsRouter.get("/campaigns/:id", async (c) => {
	const id = c.req.param("id");

	try {
		const campaign = await db.emailCampaign.findFirst({
			where: {
				id,
				organizationId: null, // 确保是全站邮件
			},
			include: {
				creator: {
					select: { name: true, email: true },
				},
				jobs: {
					select: {
						id: true,
						status: true,
						recipient: true,
						sentAt: true,
						deliveredAt: true,
						openedAt: true,
						clickedAt: true,
						errorMessage: true,
					},
					take: 10, // 只返回最近10条任务
					orderBy: { createdAt: "desc" },
				},
				_count: {
					select: { jobs: true },
				},
			},
		});

		if (!campaign) {
			return c.json({ error: "Campaign not found" }, 404);
		}

		return c.json({ campaign });
	} catch (error) {
		console.error("Failed to fetch campaign:", error);
		return c.json({ error: "Failed to fetch campaign" }, 500);
	}
});

// 更新邮件活动
emailsRouter.put(
	"/campaigns/:id",
	zValidator("json", updateCampaignSchema),
	async (c) => {
		const id = c.req.param("id");
		const data = c.req.valid("json");

		try {
			const existingCampaign = await db.emailCampaign.findFirst({
				where: {
					id,
					organizationId: null, // 确保是全站邮件
				},
			});

			if (!existingCampaign) {
				return c.json({ error: "Campaign not found" }, 404);
			}

			// 只有草稿状态的活动可以编辑
			if (existingCampaign.status !== "DRAFT") {
				return c.json(
					{ error: "Only draft campaigns can be edited" },
					400,
				);
			}

			const campaign = await db.emailCampaign.update({
				where: { id },
				data: {
					...data,
					scheduledAt: data.scheduledAt
						? new Date(data.scheduledAt)
						: undefined,
					status: data.scheduledAt ? "SCHEDULED" : "DRAFT",
				},
				include: {
					creator: {
						select: { name: true, email: true },
					},
				},
			});

			return c.json({ campaign });
		} catch (error) {
			console.error("Failed to update campaign:", error);
			return c.json({ error: "Failed to update campaign" }, 500);
		}
	},
);

// 删除邮件活动
emailsRouter.delete("/campaigns/:id", async (c) => {
	const id = c.req.param("id");

	try {
		const existingCampaign = await db.emailCampaign.findFirst({
			where: {
				id,
				organizationId: null, // 确保是全站邮件
			},
		});

		if (!existingCampaign) {
			return c.json({ error: "Campaign not found" }, 404);
		}

		// 只有草稿状态的活动可以删除
		if (existingCampaign.status !== "DRAFT") {
			return c.json(
				{ error: "Only draft campaigns can be deleted" },
				400,
			);
		}

		await db.emailCampaign.delete({
			where: { id },
		});

		return c.json({ message: "Campaign deleted successfully" });
	} catch (error) {
		console.error("Failed to delete campaign:", error);
		return c.json({ error: "Failed to delete campaign" }, 500);
	}
});

// 发送邮件活动
emailsRouter.post("/campaigns/:id/send", async (c) => {
	const id = c.req.param("id");
	const session = c.get("session");

	try {
		const campaign = await db.emailCampaign.findFirst({
			where: {
				id,
				organizationId: null, // 确保是全站邮件
			},
		});

		if (!campaign) {
			return c.json({ error: "Campaign not found" }, 404);
		}

		if (campaign.status !== "DRAFT" && campaign.status !== "SCHEDULED") {
			return c.json({ error: "Campaign is not ready to send" }, 400);
		}

		// 获取目标受众
		const audienceConfig = campaign.audienceConfig as any;
		let users: any[] = [];
		let skippedRecipients = 0;

		// 根据受众配置查询用户
		const where: any = {};

		// 如果指定了具体的用户ID
		if (audienceConfig.userIds?.length > 0) {
			where.id = { in: audienceConfig.userIds };
		}

		// 如果指定了组织ID，获取组织成员
		if (audienceConfig.organizationIds?.length > 0) {
			const orgWhere = {
				...where,
				members: {
					some: {
						organizationId: { in: audienceConfig.organizationIds },
					},
				},
			};

			const orgUsers = await db.user.findMany({
				where: orgWhere,
				select: {
					id: true,
					name: true,
					email: true,
					locale: true,
				},
			});

			// 如果有指定用户ID，需要合并结果
			if (audienceConfig.userIds?.length > 0) {
				const directUsers = await db.user.findMany({
					where: {
						...where,
						id: { in: audienceConfig.userIds },
					},
					select: {
						id: true,
						name: true,
						email: true,
						locale: true,
					},
				});

				const sanitized = sanitizeRecipients([
					...directUsers,
					...orgUsers,
				]);
				skippedRecipients += sanitized.skipped;
				users = sanitized.users;
			} else {
				const sanitized = sanitizeRecipients(orgUsers);
				skippedRecipients += sanitized.skipped;
				users = sanitized.users;
			}
		} else {
			// 只有指定用户ID的情况
			const directUsers = await db.user.findMany({
				where,
				select: {
					id: true,
					name: true,
					email: true,
					locale: true,
				},
			});
			const sanitized = sanitizeRecipients(directUsers);
			skippedRecipients += sanitized.skipped;
			users = sanitized.users;
		}

		// 传统的角色和组织筛选（兼容性）
		if (!audienceConfig.userIds && !audienceConfig.organizationIds) {
			if (audienceConfig.roles?.length > 0) {
				where.role = { in: audienceConfig.roles };
			}

			if (audienceConfig.organizations?.length > 0) {
				where.members = {
					some: {
						organizationId: { in: audienceConfig.organizations },
					},
				};
			}

			const legacyUsers = await db.user.findMany({
				where,
				select: {
					id: true,
					name: true,
					email: true,
					locale: true,
				},
			});
			const sanitized = sanitizeRecipients(legacyUsers);
			skippedRecipients += sanitized.skipped;
			users = sanitized.users;
		}

		if (users.length === 0) {
			return c.json(
				{ error: "No recipients with real email addresses were found" },
				400,
			);
		}

		// 创建邮件任务
		const emailJobs = users.map((user: any) => ({
			campaignId: campaign.id,
			recipient: user.email,
			userId: user.id,
			status: "PENDING" as const,
			scheduledAt: new Date(),
			context: {
				userName: user.name,
				userLocale: user.locale || "en",
				...((campaign.content as any) || {}),
			},
		}));

		// 批量创建邮件任务
		await db.emailJob.createMany({
			data: emailJobs,
		});

		// 更新活动状态
		await db.emailCampaign.update({
			where: { id },
			data: {
				status: "SENDING",
				sentAt: new Date(),
				recipientCount: users.length,
			},
		});

		// 异步发送邮件
		processEmailQueue(campaign.id);

		return c.json({
			message: "Campaign sending started",
			recipientCount: users.length,
			skipped: skippedRecipients,
		});
	} catch (error) {
		console.error("Failed to send campaign:", error);
		return c.json({ error: "Failed to send campaign" }, 500);
	}
});

// 获取邮件统计
emailsRouter.get("/analytics", async (c) => {
	const { period = "30" } = c.req.query();
	const days = Number.parseInt(period);
	const startDate = new Date();
	startDate.setDate(startDate.getDate() - days);

	try {
		const [
			totalCampaigns,
			activeCampaigns,
			totalRecipients,
			deliveredEmails,
			openedEmails,
			clickedEmails,
		] = await Promise.all([
			db.emailCampaign.count({
				where: { organizationId: null },
			}),
			db.emailCampaign.count({
				where: {
					organizationId: null,
					status: "SENDING",
				},
			}),
			db.emailJob.count({
				where: {
					campaign: { organizationId: null },
					createdAt: { gte: startDate },
				},
			}),
			db.emailJob.count({
				where: {
					campaign: { organizationId: null },
					status: { in: ["DELIVERED", "OPENED", "CLICKED"] },
					createdAt: { gte: startDate },
				},
			}),
			db.emailJob.count({
				where: {
					campaign: { organizationId: null },
					status: { in: ["OPENED", "CLICKED"] },
					createdAt: { gte: startDate },
				},
			}),
			db.emailJob.count({
				where: {
					campaign: { organizationId: null },
					status: "CLICKED",
					createdAt: { gte: startDate },
				},
			}),
		]);

		const deliveryRate =
			totalRecipients > 0 ? (deliveredEmails / totalRecipients) * 100 : 0;
		const openRate =
			deliveredEmails > 0 ? (openedEmails / deliveredEmails) * 100 : 0;
		const clickRate =
			openedEmails > 0 ? (clickedEmails / openedEmails) * 100 : 0;

		return c.json({
			overview: {
				totalCampaigns,
				activeCampaigns,
				totalRecipients,
				deliveredEmails,
				deliveryRate: Math.round(deliveryRate * 100) / 100,
				openRate: Math.round(openRate * 100) / 100,
				clickRate: Math.round(clickRate * 100) / 100,
			},
		});
	} catch (error) {
		console.error("Failed to fetch analytics:", error);
		return c.json({ error: "Failed to fetch analytics" }, 500);
	}
});

// 生成周报数据
emailsRouter.get("/weekly-report/data", async (c) => {
	const { week } = c.req.query();

	let startDate = new Date();
	let endDate = new Date();

	if (week) {
		// 解析特定周的数据
		startDate = new Date(week);
		endDate = new Date(startDate);
		endDate.setDate(endDate.getDate() + 7);
	} else {
		// 默认获取上周数据
		const today = new Date();
		const dayOfWeek = today.getDay();
		const diff =
			today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1) - 7; // 上周一
		startDate = new Date(today.setDate(diff));
		endDate = new Date(startDate);
		endDate.setDate(endDate.getDate() + 7);
	}

	try {
		const [
			newUsers,
			newOrganizations,
			weekEvents,
			topContributions,
			featuredProjects,
			upcomingEvents,
		] = await Promise.all([
			db.user.count({
				where: {
					createdAt: {
						gte: startDate,
						lt: endDate,
					},
				},
			}),
			db.organization.count({
				where: {
					createdAt: {
						gte: startDate,
						lt: endDate,
					},
				},
			}),
			db.event.count({
				where: {
					startTime: {
						gte: startDate,
						lt: endDate,
					},
				},
			}),
			db.contribution.findMany({
				where: {
					createdAt: {
						gte: startDate,
						lt: endDate,
					},
					status: "APPROVED",
				},
				include: {
					user: {
						select: { name: true },
					},
				},
				orderBy: {
					cpValue: "desc",
				},
				take: 5,
			}),
			db.project.findMany({
				where: {
					featured: true,
					createdAt: {
						gte: startDate,
						lt: endDate,
					},
				},
				include: {
					user: {
						select: { name: true },
					},
				},
				take: 3,
			}),
			db.event.findMany({
				where: {
					startTime: {
						gte: endDate, // 即将到来的活动
					},
					status: "PUBLISHED",
				},
				include: {
					organizer: {
						select: { name: true },
					},
					organization: {
						select: { name: true },
					},
				},
				orderBy: {
					startTime: "asc",
				},
				take: 5,
			}),
		]);

		const weekRange = `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`;

		const reportData = {
			weekRange,
			newUsers,
			newOrganizations,
			totalEvents: weekEvents,
			topContributions: topContributions.map((c: any) => ({
				id: c.id,
				userName: c.user.name,
				type: c.type,
				cpValue: c.cpValue,
				description: c.description,
			})),
			featuredProjects: featuredProjects.map((p: any) => ({
				id: p.id,
				title: p.title,
				description: p.description,
				author: p.user.name,
				url: p.url,
			})),
			upcomingEvents: upcomingEvents.map((e: any) => ({
				id: e.id,
				title: e.title,
				startTime: e.startTime.toISOString(),
				organizerName: e.organization?.name || e.organizer.name,
				location: e.isOnline ? "Online" : "TBD",
			})),
		};

		return c.json({ data: reportData });
	} catch (error) {
		console.error("Failed to generate weekly report data:", error);
		return c.json({ error: "Failed to generate weekly report data" }, 500);
	}
});

// 发送周报
emailsRouter.post("/weekly-report/send", async (c) => {
	const session = c.get("session");

	try {
		// 获取周报数据
		const reportResponse = await fetch(
			`${c.req.url.replace("/send", "/data")}`,
		);
		const { data } = await reportResponse.json();

		// 获取所有订阅用户
		const subscribers = await db.user.findMany({
			where: {
				emailPreference: {
					subscribeNewsletter: true,
					unsubscribedAt: null,
				},
			},
			select: {
				id: true,
				name: true,
				email: true,
				locale: true,
			},
		});

		const sanitizedSubscribers = sanitizeRecipients(subscribers);
		if (sanitizedSubscribers.users.length === 0) {
			return c.json(
				{
					error: "No newsletter subscribers with deliverable email addresses",
				},
				400,
			);
		}

		// 创建周报活动
		const campaign = await db.emailCampaign.create({
			data: {
				title: `Weekly Report - ${data.weekRange}`,
				description: "Global community weekly report",
				type: "NEWSLETTER",
				scope: "GLOBAL",
				templateId: "weeklyReportGlobal",
				subject: `📊 Weekly Report - ${data.weekRange}`,
				content: data,
				audienceConfig: { subscribeNewsletter: true },
				status: "SENDING",
				sentAt: new Date(),
				recipientCount: sanitizedSubscribers.users.length,
				createdBy: session.user.id,
			},
		});

		// 创建邮件任务
		const emailJobs = sanitizedSubscribers.users.map((user: any) => ({
			campaignId: campaign.id,
			recipient: user.email,
			userId: user.id,
			status: "PENDING" as const,
			scheduledAt: new Date(),
			context: {
				userName: user.name,
				userLocale: user.locale || "en",
				...data,
			},
		}));

		await db.emailJob.createMany({
			data: emailJobs,
		});

		// 异步发送邮件
		processEmailQueue(campaign.id);

		return c.json({
			message: "Weekly report sending started",
			recipientCount: sanitizedSubscribers.users.length,
			campaignId: campaign.id,
			skipped: sanitizedSubscribers.skipped,
		});
	} catch (error) {
		console.error("Failed to send weekly report:", error);
		return c.json({ error: "Failed to send weekly report" }, 500);
	}
});

// 异步处理邮件队列
async function processEmailQueue(campaignId: string) {
	try {
		const jobs = await db.emailJob.findMany({
			where: {
				campaignId,
				status: "PENDING",
			},
			include: {
				campaign: true,
				user: true,
			},
			take: 10, // 每批处理10封邮件
		});

		for (const job of jobs) {
			try {
				// 更新任务状态为处理中
				await db.emailJob.update({
					where: { id: job.id },
					data: { status: "PROCESSING" },
				});

				// 发送邮件
				const emailContext = {
					...(job.context as Record<string, unknown>),
					subject: job.campaign.subject,
					title:
						(job.context as Record<string, unknown>).title ??
						job.campaign.title,
				};

				await sendEmail({
					to: job.recipient,
					templateId: job.campaign.templateId as any,
					context: emailContext as Omit<
						unknown,
						"locale" | "translations"
					>,
					locale: (job.user?.locale as "en" | "zh") || "en",
				});

				// 更新任务状态为已发送
				await db.emailJob.update({
					where: { id: job.id },
					data: {
						status: "SENT",
						sentAt: new Date(),
					},
				});

				// 更新活动统计
				await db.emailCampaign.update({
					where: { id: campaignId },
					data: {
						sentCount: { increment: 1 },
					},
				});
			} catch (error) {
				// 发送失败，记录错误
				await db.emailJob.update({
					where: { id: job.id },
					data: {
						status: "FAILED",
						errorMessage:
							error instanceof Error
								? error.message
								: "Unknown error",
						retryCount: { increment: 1 },
					},
				});
			}
		}

		// 如果还有待处理的邮件，继续处理
		const remainingJobs = await db.emailJob.count({
			where: {
				campaignId,
				status: "PENDING",
			},
		});

		if (remainingJobs > 0) {
			// 延迟1秒后继续处理下一批
			setTimeout(() => processEmailQueue(campaignId), 1000);
		} else {
			// 所有邮件处理完成，更新活动状态
			await db.emailCampaign.update({
				where: { id: campaignId },
				data: { status: "COMPLETED" },
			});
		}
	} catch (error) {
		console.error("Error processing email queue:", error);
	}
}

export { emailsRouter };
