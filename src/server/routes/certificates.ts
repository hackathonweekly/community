import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { db } from "@/lib/database";
import { auth } from "@/lib/auth";

const app = new Hono();

// 证书生成 schema
const generateCertificateSchema = z.object({
	projectId: z.string(),
	awardId: z.string(),
	eventId: z.string().optional(),
	submissionId: z.string().optional(),
	reason: z.string().optional(),
	score: z.number().min(0).max(10).optional(),
});

// 批量生成证书 schema
const batchGenerateCertificatesSchema = z.object({
	eventId: z.string(),
	awards: z.array(
		z.object({
			projectId: z.string(),
			awardId: z.string(),
			submissionId: z.string().optional(),
			reason: z.string().optional(),
			score: z.number().min(0).max(10).optional(),
		}),
	),
});

// 为作品颁发奖项
app.post(
	"/projects/:projectId/awards",
	zValidator("json", generateCertificateSchema),
	async (c) => {
		try {
			const session = await auth.api.getSession({
				headers: c.req.header() as any,
			});
			if (!session?.user) {
				return c.json({ error: "Unauthorized" }, 401);
			}

			const projectId = c.req.param("projectId");
			const data = c.req.valid("json");

			// 检查作品是否存在
			const project = await db.project.findUnique({
				where: { id: projectId },
				include: {
					user: {
						select: {
							id: true,
							name: true,
							email: true,
						},
					},
				},
			});

			if (!project) {
				return c.json({ error: "Project not found" }, 404);
			}

			// 检查奖项是否存在
			const award = await db.award.findUnique({
				where: { id: data.awardId },
				include: {
					organization: true,
				},
			});

			if (!award) {
				return c.json({ error: "Award not found" }, 404);
			}

			// 检查是否已经获得过此奖项
			const existingAward = await db.projectAward.findFirst({
				where: {
					projectId,
					awardId: data.awardId,
					eventId: data.eventId,
				},
			});

			if (existingAward) {
				return c.json({ error: "Project already has this award" }, 400);
			}

			// 创建获奖记录
			const projectAward = await db.projectAward.create({
				data: {
					projectId,
					awardId: data.awardId,
					eventId: data.eventId,
					submissionId: data.submissionId,
					awardedBy: session.user.id,
					reason: data.reason,
					score: data.score,
				},
				include: {
					project: {
						include: {
							user: {
								select: {
									id: true,
									name: true,
									email: true,
								},
							},
						},
					},
					award: true,
					event: {
						select: {
							id: true,
							title: true,
						},
					},
					awarder: {
						select: {
							id: true,
							name: true,
						},
					},
				},
			});

			// 更新作品获奖数量
			await db.project.update({
				where: { id: projectId },
				data: {
					awardCount: {
						increment: 1,
					},
				},
			});

			return c.json({
				success: true,
				data: projectAward,
			});
		} catch (error) {
			console.error("Error creating project award:", error);
			return c.json({ error: "Internal server error" }, 500);
		}
	},
);

// 批量为活动作品颁发奖项
app.post(
	"/events/:eventId/awards/batch",
	zValidator("json", batchGenerateCertificatesSchema),
	async (c) => {
		try {
			const session = await auth.api.getSession({
				headers: c.req.header() as any,
			});
			if (!session?.user) {
				return c.json({ error: "Unauthorized" }, 401);
			}

			const eventId = c.req.param("eventId");
			const { awards } = c.req.valid("json");

			// 检查活动是否存在
			const event = await db.event.findUnique({
				where: { id: eventId },
			});

			if (!event) {
				return c.json({ error: "Event not found" }, 404);
			}

			// 批量创建获奖记录
			const projectAwards = await Promise.all(
				awards.map(async (award) => {
					// 检查是否已存在
					const existing = await db.projectAward.findFirst({
						where: {
							projectId: award.projectId,
							awardId: award.awardId,
							eventId,
						},
					});

					if (existing) {
						return existing;
					}

					return db.projectAward.create({
						data: {
							projectId: award.projectId,
							awardId: award.awardId,
							eventId,
							submissionId: award.submissionId,
							awardedBy: session.user.id,
							reason: award.reason,
							score: award.score,
						},
						include: {
							project: {
								include: {
									user: {
										select: {
											id: true,
											name: true,
											email: true,
										},
									},
								},
							},
							award: true,
						},
					});
				}),
			);

			// 更新作品获奖数量 - 避免竞态条件
			const projectCounts = new Map<string, number>();
			for (const award of awards) {
				projectCounts.set(
					award.projectId,
					(projectCounts.get(award.projectId) || 0) + 1,
				);
			}

			await Promise.all(
				Array.from(projectCounts.entries()).map(
					async ([projectId, count]) => {
						await db.project.update({
							where: { id: projectId },
							data: {
								awardCount: {
									increment: count,
								},
							},
						});
					},
				),
			);

			return c.json({
				success: true,
				data: projectAwards,
			});
		} catch (error) {
			console.error("Error batch creating awards:", error);
			return c.json({ error: "Internal server error" }, 500);
		}
	},
);

// 获取作品的所有获奖记录
app.get("/projects/:projectId/awards", async (c) => {
	try {
		const projectId = c.req.param("projectId");

		const awards = await db.projectAward.findMany({
			where: { projectId },
			include: {
				award: true,
				event: {
					select: {
						id: true,
						title: true,
					},
				},
				awarder: {
					select: {
						id: true,
						name: true,
					},
				},
			},
			orderBy: { awardedAt: "desc" },
		});

		return c.json({
			success: true,
			data: awards,
		});
	} catch (error) {
		console.error("Error fetching project awards:", error);
		return c.json({ error: "Internal server error" }, 500);
	}
});

// 获取用户的所有证书
app.get("/user/certificates", async (c) => {
	try {
		const session = await auth.api.getSession({
			headers: c.req.header() as any,
		});
		if (!session?.user) {
			return c.json({ error: "Unauthorized" }, 401);
		}

		const certificates = await db.projectAward.findMany({
			where: {
				project: {
					userId: session.user.id,
				},
			},
			include: {
				project: {
					select: {
						id: true,
						title: true,
						description: true,
					},
				},
				award: true,
				event: {
					select: {
						id: true,
						title: true,
					},
				},
			},
			orderBy: { awardedAt: "desc" },
		});

		return c.json({
			success: true,
			data: certificates,
		});
	} catch (error) {
		console.error("Error fetching user certificates:", error);
		return c.json({ error: "Internal server error" }, 500);
	}
});

// 获取单个证书详情
app.get("/certificates/:certificateId", async (c) => {
	try {
		const certificateId = c.req.param("certificateId");

		const certificate = await db.projectAward.findUnique({
			where: { id: certificateId },
			include: {
				project: {
					include: {
						user: {
							select: {
								id: true,
								name: true,
								username: true,
								image: true,
							},
						},
					},
				},
				award: {
					include: {
						organization: {
							select: {
								id: true,
								name: true,
								logo: true,
							},
						},
					},
				},
				event: {
					select: {
						id: true,
						title: true,
						richContent: true,
					},
				},
				awarder: {
					select: {
						id: true,
						name: true,
					},
				},
			},
		});

		if (!certificate) {
			return c.json({ error: "Certificate not found" }, 404);
		}

		return c.json({
			success: true,
			data: certificate,
		});
	} catch (error) {
		console.error("Error fetching certificate:", error);
		return c.json({ error: "Internal server error" }, 500);
	}
});

// 更新证书URL（证书生成后）
app.patch(
	"/certificates/:certificateId/url",
	zValidator(
		"json",
		z.object({
			certificateUrl: z.string().url(),
		}),
	),
	async (c) => {
		try {
			const session = await auth.api.getSession({
				headers: c.req.header() as any,
			});
			if (!session?.user) {
				return c.json({ error: "Unauthorized" }, 401);
			}

			const certificateId = c.req.param("certificateId");
			const { certificateUrl } = c.req.valid("json");

			const certificate = await db.projectAward.update({
				where: { id: certificateId },
				data: {
					certificateUrl,
					certificateGenerated: true,
				},
			});

			return c.json({
				success: true,
				data: certificate,
			});
		} catch (error) {
			console.error("Error updating certificate URL:", error);
			return c.json({ error: "Internal server error" }, 500);
		}
	},
);

// 获取活动的所有获奖作品
app.get("/events/:eventId/awards", async (c) => {
	try {
		const eventId = c.req.param("eventId");

		const awards = await db.projectAward.findMany({
			where: { eventId },
			include: {
				project: {
					include: {
						user: {
							select: {
								id: true,
								name: true,
								username: true,
								image: true,
							},
						},
					},
				},
				award: true,
			},
			orderBy: [
				{ award: { level: "asc" } },
				{ score: "desc" },
				{ awardedAt: "desc" },
			],
		});

		return c.json({
			success: true,
			data: awards,
		});
	} catch (error) {
		console.error("Error fetching event awards:", error);
		return c.json({ error: "Internal server error" }, 500);
	}
});

// 删除获奖记录
app.delete("/certificates/:certificateId", async (c) => {
	try {
		const session = await auth.api.getSession({
			headers: c.req.header() as any,
		});
		if (!session?.user) {
			return c.json({ error: "Unauthorized" }, 401);
		}

		const certificateId = c.req.param("certificateId");

		// 检查权限 - 只有颁发者或管理员可以删除
		const certificate = await db.projectAward.findUnique({
			where: { id: certificateId },
		});

		if (!certificate) {
			return c.json({ error: "Certificate not found" }, 404);
		}

		if (certificate.awardedBy !== session.user.id) {
			return c.json(
				{ error: "Unauthorized to delete this certificate" },
				403,
			);
		}

		await db.projectAward.delete({
			where: { id: certificateId },
		});

		// 更新作品获奖数量
		await db.project.update({
			where: { id: certificate.projectId },
			data: {
				awardCount: {
					decrement: 1,
				},
			},
		});

		return c.json({
			success: true,
			message: "Certificate deleted successfully",
		});
	} catch (error) {
		console.error("Error deleting certificate:", error);
		return c.json({ error: "Internal server error" }, 500);
	}
});

export default app;
