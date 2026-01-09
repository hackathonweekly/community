import { Hono } from "hono";
import { db } from "@/lib/database/prisma";
import { isOrganizationAdmin } from "@/lib/auth/lib/helper";
import { getActiveOrganization, getSession } from "@dashboard/auth/lib/server";
import { sendEmail } from "@/lib/mail";
import { filterSendableEmails, isSendableEmail } from "@/lib/mail/address";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";

type Variables = {
	session: any;
	organization: any;
};

const organizationEmailsRouter = new Hono<{ Variables: Variables }>();

// 创建邮件活动的验证schema
const createCampaignSchema = z.object({
	title: z.string().min(1, "Title is required"),
	description: z.string().optional(),
	type: z.enum(["NEWSLETTER", "NOTIFICATION", "MARKETING", "ANNOUNCEMENT"]),
	templateId: z.string().min(1, "Template ID is required"),
	subject: z.string().min(1, "Subject is required"),
	content: z.record(z.any()),
	audienceConfig: z.record(z.any()),
	scheduledAt: z.string().datetime().optional(),
});

const updateCampaignSchema = createCampaignSchema.partial();
const sendOrganizationEmailSchema = z.object({
	type: z.string(),
	subject: z.string().min(1, "Subject is required"),
	content: z.string().min(1, "Content is required"),
	recipients: z.array(z.string().email()).optional(),
});

// 权限中间件
organizationEmailsRouter.use("/*", async (c, next) => {
	const session = await getSession();
	const organizationSlug = c.req.param("organizationSlug");

	if (!organizationSlug) {
		return c.json({ error: "Organization slug is required" }, 400);
	}

	if (!session) {
		return c.json({ error: "Unauthorized" }, 401);
	}

	const organization = await getActiveOrganization(organizationSlug);
	if (!organization) {
		return c.json({ error: "Organization not found" }, 404);
	}

	const userIsOrganizationAdmin = isOrganizationAdmin(
		organization,
		session.user,
	);
	if (!userIsOrganizationAdmin) {
		return c.json({ error: "Insufficient permissions" }, 403);
	}

	c.set("session", session);
	c.set("organization", organization);
	await next();
});

// 获取组织邮件活动列表
organizationEmailsRouter.get("/campaigns", async (c) => {
	const { page = "1", limit = "20", status, type } = c.req.query();
	const organization = c.get("organization");

	const pageNum = Number.parseInt(page);
	const limitNum = Number.parseInt(limit);
	const offset = (pageNum - 1) * limitNum;

	const where: any = {
		organizationId: organization.id,
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
		console.error("Failed to fetch organization campaigns:", error);
		return c.json({ error: "Failed to fetch campaigns" }, 500);
	}
});

// 创建组织邮件活动
organizationEmailsRouter.post(
	"/campaigns",
	zValidator("json", createCampaignSchema),
	async (c) => {
		const session = c.get("session");
		const organization = c.get("organization");
		const data = c.req.valid("json");

		try {
			const campaign = await db.emailCampaign.create({
				data: {
					...data,
					scope: "ORGANIZATION",
					organizationId: organization.id,
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
			console.error("Failed to create organization campaign:", error);
			return c.json({ error: "Failed to create campaign" }, 500);
		}
	},
);

// 获取单个组织邮件活动
organizationEmailsRouter.get("/campaigns/:id", async (c) => {
	const id = c.req.param("id");
	const organization = c.get("organization");

	try {
		const campaign = await db.emailCampaign.findFirst({
			where: {
				id,
				organizationId: organization.id,
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
					take: 10,
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
		console.error("Failed to fetch organization campaign:", error);
		return c.json({ error: "Failed to fetch campaign" }, 500);
	}
});

// 发送组织邮件活动
organizationEmailsRouter.post("/campaigns/:id/send", async (c) => {
	const id = c.req.param("id");
	const organization = c.get("organization");

	try {
		const campaign = await db.emailCampaign.findFirst({
			where: {
				id,
				organizationId: organization.id,
			},
		});

		if (!campaign) {
			return c.json({ error: "Campaign not found" }, 404);
		}

		if (campaign.status !== "DRAFT" && campaign.status !== "SCHEDULED") {
			return c.json({ error: "Campaign is not ready to send" }, 400);
		}

		// 获取组织成员作为目标受众
		const audienceConfig = campaign.audienceConfig as any;
		const whereClause: any = {
			members: {
				some: {
					organizationId: organization.id,
				},
			},
		};

		// 根据受众配置进一步筛选
		if (audienceConfig.roles?.length > 0) {
			whereClause.members = {
				some: {
					organizationId: organization.id,
					role: { in: audienceConfig.roles },
				},
			};
		}

		const rawUsers = await db.user.findMany({
			where: whereClause,
			select: {
				id: true,
				name: true,
				email: true,
				locale: true,
			},
		});

		let skippedRecipients = 0;
		const uniqueUsers = new Map<string, (typeof rawUsers)[number]>();

		for (const user of rawUsers) {
			if (!isSendableEmail(user.email)) {
				skippedRecipients++;
				continue;
			}

			const key = user.email!.trim().toLowerCase();
			if (uniqueUsers.has(key)) {
				skippedRecipients++;
				continue;
			}

			uniqueUsers.set(key, user);
		}

		const users = Array.from(uniqueUsers.values());

		if (users.length === 0) {
			return c.json(
				{
					error: "No organization members with deliverable email addresses",
				},
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
				organizationName: organization.name,
				organizationLogo: organization.logo,
				...((campaign.content as any) || {}),
			},
		}));

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
		processOrganizationEmailQueue(campaign.id);

		return c.json({
			message: "Campaign sending started",
			recipientCount: users.length,
			skipped: skippedRecipients,
		});
	} catch (error) {
		console.error("Failed to send organization campaign:", error);
		return c.json({ error: "Failed to send campaign" }, 500);
	}
});

organizationEmailsRouter.post(
	"/send",
	zValidator("json", sendOrganizationEmailSchema),
	async (c) => {
		const { subject, content, recipients, type } = c.req.valid("json");
		const organization = c.get("organization");

		try {
			let targetEmails = filterSendableEmails(recipients ?? []);
			let skippedDueToFilter =
				(recipients?.length ?? 0) - targetEmails.length;

			if (targetEmails.length === 0) {
				const members = await db.user.findMany({
					where: {
						members: {
							some: {
								organizationId: organization.id,
							},
						},
					},
					select: {
						email: true,
					},
				});

				targetEmails = filterSendableEmails(
					members.map((member) => member.email),
				);
				skippedDueToFilter = members.length - targetEmails.length;
			}

			if (targetEmails.length === 0) {
				return c.json(
					{
						error: "No valid email recipients found",
						details:
							skippedDueToFilter > 0
								? "所有候选邮箱均为 @wechat.app 虚拟邮箱或为空"
								: undefined,
					},
					400,
				);
			}

			let successCount = 0;
			let errorCount = 0;
			const errors: string[] = [];

			for (const email of targetEmails) {
				if (!isSendableEmail(email)) {
					continue;
				}

				try {
					await sendEmail({
						to: email,
						subject,
						templateId: "organizationNotification",
						context: {
							organizationName: organization.name,
							organizationLogo: undefined,
							subject,
							content: content.replace(/\n/g, "<br>"),
							type,
						},
						locale: "zh",
					});
					successCount++;
				} catch (error) {
					errorCount++;
					errors.push(
						`Failed to send to ${email}: ${
							error instanceof Error
								? error.message
								: "Unknown error"
						}`,
					);
					console.error(`Failed to send email to ${email}:`, error);
				}
			}

			return c.json({
				message: `Email sending completed. Sent: ${successCount}, Failed: ${errorCount}`,
				success: successCount,
				failed: errorCount,
				skipped: skippedDueToFilter,
				errors: errors.length > 0 ? errors : undefined,
			});
		} catch (error) {
			console.error("Error sending organization emails:", error);
			return c.json({ error: "Failed to send emails" }, 500);
		}
	},
);

// 获取组织邮件统计
organizationEmailsRouter.get("/analytics", async (c) => {
	const { period = "30" } = c.req.query();
	const organization = c.get("organization");
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
				where: { organizationId: organization.id },
			}),
			db.emailCampaign.count({
				where: {
					organizationId: organization.id,
					status: "SENDING",
				},
			}),
			db.emailJob.count({
				where: {
					campaign: { organizationId: organization.id },
					createdAt: { gte: startDate },
				},
			}),
			db.emailJob.count({
				where: {
					campaign: { organizationId: organization.id },
					status: { in: ["DELIVERED", "OPENED", "CLICKED"] },
					createdAt: { gte: startDate },
				},
			}),
			db.emailJob.count({
				where: {
					campaign: { organizationId: organization.id },
					status: { in: ["OPENED", "CLICKED"] },
					createdAt: { gte: startDate },
				},
			}),
			db.emailJob.count({
				where: {
					campaign: { organizationId: organization.id },
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
		console.error("Failed to fetch organization analytics:", error);
		return c.json({ error: "Failed to fetch analytics" }, 500);
	}
});

// 生成组织周报数据
organizationEmailsRouter.get("/weekly-report/data", async (c) => {
	const { week } = c.req.query();
	const organization = c.get("organization");

	let startDate = new Date();
	let endDate = new Date();

	if (week) {
		startDate = new Date(week);
		endDate = new Date(startDate);
		endDate.setDate(endDate.getDate() + 7);
	} else {
		const today = new Date();
		const dayOfWeek = today.getDay();
		const diff =
			today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1) - 7;
		startDate = new Date(today.setDate(diff));
		endDate = new Date(startDate);
		endDate.setDate(endDate.getDate() + 7);
	}

	try {
		const [
			newMembers,
			organizationEvents,
			memberContributions,
			organizationProjects,
			memberHighlights,
		] = await Promise.all([
			db.member.count({
				where: {
					organizationId: organization.id,
					createdAt: {
						gte: startDate,
						lt: endDate,
					},
				},
			}),
			db.event.findMany({
				where: {
					organizationId: organization.id,
					startTime: {
						gte: startDate,
						lt: endDate,
					},
				},
				include: {
					_count: {
						select: { registrations: true },
					},
				},
			}),
			db.contribution.findMany({
				where: {
					organizationId: organization.id,
					createdAt: {
						gte: startDate,
						lt: endDate,
					},
					status: "APPROVED",
				},
				include: {
					user: {
						select: { name: true, email: true },
					},
				},
				orderBy: {
					cpValue: "desc",
				},
				take: 10,
			}),
			db.project.findMany({
				where: {
					user: {
						members: {
							some: {
								organizationId: organization.id,
							},
						},
					},
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
				take: 5,
			}),
			db.user.findMany({
				where: {
					members: {
						some: {
							organizationId: organization.id,
						},
					},
					contributions: {
						some: {
							organizationId: organization.id,
							createdAt: {
								gte: startDate,
								lt: endDate,
							},
							status: "APPROVED",
						},
					},
				},
				select: {
					id: true,
					name: true,
					contributions: {
						where: {
							organizationId: organization.id,
							createdAt: {
								gte: startDate,
								lt: endDate,
							},
							status: "APPROVED",
						},
						select: {
							cpValue: true,
							type: true,
						},
					},
				},
				take: 5,
			}),
		]);

		const weekRange = `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`;

		const reportData = {
			organizationId: organization.id,
			organizationName: organization.name,
			organizationLogo: organization.logo,
			weekRange,
			newMembers,
			organizationEvents: organizationEvents.map((e: any) => ({
				id: e.id,
				title: e.title,
				startTime: e.startTime.toISOString(),
				attendeeCount: e._count.registrations,
				status: e.status,
			})),
			memberContributions: memberContributions.map((c: any) => ({
				id: c.id,
				userName: c.user.name,
				type: c.type,
				cpValue: c.cpValue,
				description: c.description,
			})),
			organizationProjects: organizationProjects.map((p: any) => ({
				id: p.id,
				title: p.title,
				description: p.description,
				author: p.user.name,
				stage: p.stage,
			})),
			memberHighlights: memberHighlights.map((u: any) => ({
				id: u.id,
				name: u.name,
				cpValue: u.contributions.reduce(
					(sum: any, c: any) => sum + c.cpValue,
					0,
				),
				achievement: `获得 ${u.contributions.length} 个贡献`,
			})),
		};

		return c.json({ data: reportData });
	} catch (error) {
		console.error(
			"Failed to generate organization weekly report data:",
			error,
		);
		return c.json({ error: "Failed to generate weekly report data" }, 500);
	}
});

// 发送组织周报
organizationEmailsRouter.post("/weekly-report/send", async (c) => {
	const session = c.get("session");
	const organization = c.get("organization");

	try {
		// 获取周报数据
		const reportResponse = await fetch(
			`${c.req.url.replace("/send", "/data")}`,
		);
		const { data } = await reportResponse.json();

		// 获取组织成员
		const subscribers = await db.user.findMany({
			where: {
				members: {
					some: {
						organizationId: organization.id,
					},
				},
				// 检查用户是否订阅组织邮件
				emailPreference: {
					organizationEmails: {
						path: [organization.id, "newsletter"],
						equals: true,
					},
				},
			},
			select: {
				id: true,
				name: true,
				email: true,
				locale: true,
			},
		});

		let skippedSubscribers = 0;
		const uniqueSubscribers = new Map<
			string,
			(typeof subscribers)[number]
		>();

		for (const user of subscribers) {
			if (!isSendableEmail(user.email)) {
				skippedSubscribers++;
				continue;
			}

			const key = user.email!.trim().toLowerCase();
			if (uniqueSubscribers.has(key)) {
				skippedSubscribers++;
				continue;
			}

			uniqueSubscribers.set(key, user);
		}

		const users = Array.from(uniqueSubscribers.values());

		if (users.length === 0) {
			return c.json(
				{
					error: "No organization newsletter subscribers with deliverable email addresses",
				},
				400,
			);
		}

		// 创建周报活动
		const campaign = await db.emailCampaign.create({
			data: {
				title: `${organization.name} Weekly Report - ${data.weekRange}`,
				description: "Organization weekly report",
				type: "NEWSLETTER",
				scope: "ORGANIZATION",
				organizationId: organization.id,
				templateId: "weeklyReportOrganization",
				subject: `📊 ${organization.name} Weekly Report - ${data.weekRange}`,
				content: data,
				audienceConfig: { organizationNewsletter: true },
				status: "SENDING",
				sentAt: new Date(),
				recipientCount: users.length,
				createdBy: session.user.id,
			},
		});

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
				...data,
			},
		}));

		await db.emailJob.createMany({
			data: emailJobs,
		});

		// 异步发送邮件
		processOrganizationEmailQueue(campaign.id);

		return c.json({
			message: "Organization weekly report sending started",
			recipientCount: users.length,
			campaignId: campaign.id,
			skipped: skippedSubscribers,
		});
	} catch (error) {
		console.error("Failed to send organization weekly report:", error);
		return c.json({ error: "Failed to send weekly report" }, 500);
	}
});

// 获取组织成员统计（用于仪表板）
organizationEmailsRouter.get("/dashboard", async (c) => {
	const organization = c.get("organization");

	try {
		// 计算本月的开始和结束时间
		const now = new Date();
		const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
		const nextMonthStart = new Date(
			now.getFullYear(),
			now.getMonth() + 1,
			1,
		);

		const [
			memberCount,
			thisMonthNewMembers,
			monthlyEvents,
			plannedEvents,
			pendingApplications,
			organizationContributionValue,
			thisMonthContribution,
		] = await Promise.all([
			db.member.count({
				where: { organizationId: organization.id },
			}),
			db.member.count({
				where: {
					organizationId: organization.id,
					createdAt: {
						gte: thisMonthStart,
						lt: nextMonthStart,
					},
				},
			}),
			db.event.count({
				where: {
					organizationId: organization.id,
					startTime: {
						gte: thisMonthStart,
						lt: nextMonthStart,
					},
				},
			}),
			db.event.count({
				where: {
					organizationId: organization.id,
					startTime: {
						gte: nextMonthStart,
					},
					status: "PUBLISHED",
				},
			}),
			db.invitation.count({
				where: {
					organizationId: organization.id,
					status: "pending",
				},
			}),
			db.contribution.aggregate({
				where: {
					organizationId: organization.id,
					status: "APPROVED",
				},
				_sum: {
					cpValue: true,
				},
			}),
			db.contribution.aggregate({
				where: {
					organizationId: organization.id,
					status: "APPROVED",
					createdAt: {
						gte: thisMonthStart,
						lt: nextMonthStart,
					},
				},
				_sum: {
					cpValue: true,
				},
			}),
		]);

		return c.json({
			stats: {
				organizationId: organization.id,
				organizationName: organization.name,
				organizationLevel: "Active", // TODO: 根据活跃度计算等级
				memberCount,
				thisMonthNewMembers,
				monthlyEvents,
				plannedEvents,
				pendingApplications,
				newApplications: 0, // TODO: 计算新的申请数量
				organizationContributionValue:
					organizationContributionValue._sum.cpValue || 0,
				thisMonthContribution: thisMonthContribution._sum.cpValue || 0,
			},
		});
	} catch (error) {
		console.error("Failed to fetch organization dashboard stats:", error);
		return c.json({ error: "Failed to fetch dashboard stats" }, 500);
	}
});

// 异步处理组织邮件队列
async function processOrganizationEmailQueue(campaignId: string) {
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
			take: 10,
		});

		for (const job of jobs) {
			try {
				await db.emailJob.update({
					where: { id: job.id },
					data: { status: "PROCESSING" },
				});

				await sendEmail({
					to: job.recipient,
					templateId: job.campaign.templateId as any,
					context: job.context as Omit<
						unknown,
						"locale" | "translations"
					>,
					locale: (job.user?.locale as "en" | "zh") || "en",
				});

				await db.emailJob.update({
					where: { id: job.id },
					data: {
						status: "SENT",
						sentAt: new Date(),
					},
				});

				await db.emailCampaign.update({
					where: { id: campaignId },
					data: {
						sentCount: { increment: 1 },
					},
				});
			} catch (error) {
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

		const remainingJobs = await db.emailJob.count({
			where: {
				campaignId,
				status: "PENDING",
			},
		});

		if (remainingJobs > 0) {
			setTimeout(() => processOrganizationEmailQueue(campaignId), 1000);
		} else {
			await db.emailCampaign.update({
				where: { id: campaignId },
				data: { status: "COMPLETED" },
			});
		}
	} catch (error) {
		console.error("Error processing organization email queue:", error);
	}
}

export { organizationEmailsRouter };
