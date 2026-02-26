import { auth } from "@community/lib-server/auth";
import { db } from "@community/lib-server/database";
import { checkAndAwardAutoBadges } from "@community/lib-server/database/prisma/queries/badges";
import {
	CP_VALUES,
	recordContribution,
} from "@community/lib-server/database/prisma/queries/contributions";
import {
	generateProjectShortId,
	resolveProjectIdentifier,
} from "@community/lib-server/database/prisma/queries/projects";
import {
	ContentType,
	createContentValidator,
	ensureImageSafe,
} from "@community/lib-server/content-moderation";
import { NotificationService } from "@/features/notifications/service";
import { getCachedOrganizations } from "@community/lib-server/cache/organizations";
import { ContributionType } from "@prisma/client";
import { PricingType, ProjectStage } from "@prisma/client";
import { Hono } from "hono";
import { z } from "zod";

const createProjectSchema = z.object({
	// Basic information
	title: z
		.string()
		.min(1, "Project title is required")
		.max(100, "Title too long"),
	subtitle: z
		.string()
		.min(1, "一句话介绍是必需的")
		.max(200, "一句话介绍过长"),
	description: z.string().max(2000, "作品描述过长").optional().nullable(),
	detailedDescription: z.string().optional().nullable(),
	url: z
		.string()
		.optional()
		.nullable()
		.refine((val) => !val || z.string().url().safeParse(val).success, {
			message: "Invalid URL",
		}),
	demoVideoUrl: z
		.string()
		.optional()
		.nullable()
		.refine((val) => !val || z.string().url().safeParse(val).success, {
			message: "Invalid video URL",
		}),

	// Media
	screenshots: z.array(z.string()).max(8, "Too many screenshots").default([]),

	// Classification
	projectTags: z
		.array(z.string())
		.max(10, "Too many project tags")
		.default([]),
	stage: z.nativeEnum(ProjectStage),
	pricingType: z.nativeEnum(PricingType).optional().nullable(),

	// Milestones
	milestones: z.array(z.string()).max(20, "Too many milestones").default([]),
	currentMilestone: z.string().optional().nullable(),

	// Settings
	featured: z.boolean().default(false),

	// Legacy fields (for backwards compatibility)
	imageUrl: z
		.string()
		.url("Invalid image URL")
		.optional()
		.nullable()
		.or(z.literal("")),
	tags: z.array(z.string()).max(10, "Too many tags").default([]),

	// Team recruitment fields
	isRecruiting: z.boolean().default(false),
	recruitmentStatus: z.string().optional().nullable(),
	recruitmentTags: z
		.array(z.string())
		.max(10, "Too many recruitment tags")
		.default([]),
	teamDescription: z.string().optional().nullable(),
	teamSkills: z
		.array(z.string())
		.max(20, "Too many required skills")
		.default([]),
	teamSize: z.number().min(1).max(20).optional().nullable(),
	contactInfo: z.string().optional().nullable(),

	// Creation experience sharing
	creationExperience: z.string().optional().nullable(),

	// Team members
	teamMembers: z
		.array(
			z.object({
				userId: z.string(),
				role: z.enum(["LEADER", "MEMBER"]).default("MEMBER"),
			}),
		)
		.default([]),
});

// 作品完成度计算函数
function calculateProjectCompletion(data: {
	title: string;
	subtitle: string | null;
	description?: string | null;
	url?: string | null;
	screenshots: string[];
	projectTags: string[];
	stage: any;
	milestones: string[];
	creationExperience?: string | null;
}): { completionScore: number; isComplete: boolean } {
	// 检查是否包含社区展示必需的关键字段
	const hasRequiredForCommunity =
		data.title?.trim() &&
		data.subtitle?.trim() &&
		data.stage &&
		data.screenshots?.length > 0 &&
		data.description?.trim() &&
		data.url?.trim();

	// 简化完成度计算：有关键字段就算完成
	const isComplete = Boolean(hasRequiredForCommunity);
	const completionScore = isComplete ? 100 : 0;

	return { completionScore, isComplete };
}

const createCommentSchema = z.object({
	content: z
		.string()
		.min(1, "Comment cannot be empty")
		.max(1000, "Comment too long"),
});

const updateProjectSchema = createProjectSchema.partial().extend({
	id: z.string(),
	subtitle: z
		.string()
		.min(1, "Subtitle is required")
		.max(200, "Subtitle too long")
		.optional(),
	teamMembers: z
		.array(
			z.object({
				userId: z.string(),
				role: z.enum(["LEADER", "MEMBER"]).default("MEMBER"),
			}),
		)
		.optional(),
});

const updateProjectOrderSchema = z.object({
	projects: z.array(
		z.object({
			id: z.string(),
			order: z.number(),
		}),
	),
});

const validateProjectContent = createContentValidator({
	title: { type: ContentType.PROJECT_TITLE },
	description: { type: ContentType.PROJECT_DESCRIPTION },
});

export const projectsRouter = new Hono()
	.get("/projects/public", async (c) => {
		try {
			const session = await auth.api.getSession({
				headers: c.req.raw.headers,
			});

			const stage = c.req.query("stage");
			const search = c.req.query("search");
			const organization = c.req.query("organization");
			const sort = c.req.query("sort");
			const sortOrder = c.req.query("sortOrder") || "desc";

			const where: any = {
				user: {
					profilePublic: true,
				},
				isComplete: true,
			};

			// Handle special stage filters
			if (stage === "recruiting") {
				where.isRecruiting = true;
			} else if (stage === "featured") {
				where.featured = true;
			} else if (stage === "early") {
				where.stage = {
					in: ["IDEA_VALIDATION", "DEVELOPMENT", "LAUNCH"],
				};
			} else if (stage === "mature") {
				where.stage = {
					in: ["GROWTH", "MONETIZATION", "FUNDING", "COMPLETED"],
				};
			} else if (
				stage &&
				stage !== "recruiting" &&
				stage !== "featured"
			) {
				where.stage = stage;
			}

			if (search) {
				where.OR = [
					{
						title: {
							contains: search,
							mode: "insensitive",
						},
					},
					{
						description: {
							contains: search,
							mode: "insensitive",
						},
					},
					{
						projectTags: {
							hasSome: [search],
						},
					},
				];
			}

			if (organization) {
				where.user = {
					...where.user,
					members: {
						some: {
							organization: {
								slug: organization,
							},
						},
					},
				};
			}

			const orderBy: any = [{ featured: "desc" }];
			const direction = sortOrder === "asc" ? "asc" : "desc";
			if (sort === "latest") {
				orderBy.push({ createdAt: direction });
			} else if (sort === "popular") {
				orderBy.push({ likeCount: direction });
			} else if (sort === "views") {
				orderBy.push({ viewCount: direction });
			} else {
				orderBy.push({ createdAt: direction });
			}

			// 优化后的查询：使用并发查询和缓存组织数据
			const [projects, stats, totalProjects, organizations] =
				await Promise.all([
					db.project.findMany({
						where,
						select: {
							id: true,
							shortId: true,
							title: true,
							description: true,
							subtitle: true,
							stage: true,
							featured: true,
							projectTags: true,
							url: true,
							screenshots: true,
							viewCount: true,
							likeCount: true,
							commentCount: true,
							createdAt: true,
							isRecruiting: true,
							recruitmentTags: true,
							recruitmentStatus: true,
							likes: session?.user
								? {
										where: {
											userId: session.user.id,
										},
										select: {
											id: true,
										},
									}
								: false,
							bookmarks: session?.user
								? {
										where: {
											userId: session.user.id,
										},
										select: {
											id: true,
										},
									}
								: false,
							// 简化用户查询：移除深层的组织关联查询
							user: {
								select: {
									id: true,
									name: true,
									username: true,
									userRoleString: true,
									image: true,
									// 添加主要组织信息字段以减少复杂查询
									// 如果用户有多个组织，只显示第一个主要组织
									members: {
										take: 1, // 只取第一个组织
										orderBy: {
											createdAt: "asc", // 按加入时间排序，取最早的
										},
										select: {
											organization: {
												select: {
													id: true,
													name: true,
													slug: true,
													logo: true,
												},
											},
										},
									},
								},
							},
						},
						orderBy,
					}),
					db.project.groupBy({
						by: ["stage"],
						_count: {
							stage: true,
						},
						where: {
							user: {
								profilePublic: true,
							},
							isComplete: true,
						},
					}),
					db.project.count({
						where: {
							user: {
								profilePublic: true,
							},
							isComplete: true,
						},
					}),
					// 使用缓存的组织数据替代直接查询
					getCachedOrganizations(),
				]);

			return c.json({
				projects,
				stats: { stats, totalProjects },
				organizations,
			});
		} catch (error) {
			console.error("Error fetching public projects:", error);
			return c.json({ error: "Internal server error" }, 500);
		}
	})
	.get("/projects", async (c) => {
		try {
			const session = await auth.api.getSession({
				headers: c.req.raw.headers,
			});

			if (!session?.user) {
				return c.json({ error: "Unauthorized" }, 401);
			}

			const projects = await db.project.findMany({
				where: {
					userId: session.user.id,
				},
				orderBy: [
					{ featured: "desc" },
					{ order: "asc" },
					{ createdAt: "desc" },
				],
			});

			return c.json({ projects });
		} catch (error) {
			console.error("Error fetching projects:", error);
			return c.json({ error: "Internal server error" }, 500);
		}
	})
	.get("/projects/participated", async (c) => {
		try {
			const session = await auth.api.getSession({
				headers: c.req.raw.headers,
			});

			if (!session?.user) {
				return c.json({ error: "Unauthorized" }, 401);
			}

			// Get projects where user is a team member
			const participatedProjects = await db.project.findMany({
				where: {
					members: {
						some: {
							userId: session.user.id,
						},
					},
					// Exclude projects owned by the user (they appear in "我的作品")
					userId: {
						not: session.user.id,
					},
				},
				include: {
					user: {
						select: {
							id: true,
							name: true,
							username: true,
							image: true,
						},
					},
					members: {
						where: {
							userId: session.user.id,
						},
						select: {
							role: true,
							joinedAt: true,
						},
					},
				},
				orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
			});

			return c.json({ projects: participatedProjects });
		} catch (error) {
			console.error("Error fetching participated projects:", error);
			return c.json({ error: "Internal server error" }, 500);
		}
	})
	.get("/projects/:id", async (c) => {
		try {
			const session = await auth.api.getSession({
				headers: c.req.raw.headers,
			});

			if (!session?.user) {
				return c.json({ error: "Unauthorized" }, 401);
			}

			const projectId = c.req.param("id");

			// Get project belonging to the user
			const project = await db.project.findFirst({
				where: {
					...resolveProjectIdentifier(projectId),
					userId: session.user.id,
				},
			});

			if (!project) {
				return c.json({ error: "Project not found" }, 404);
			}

			return c.json({ project });
		} catch (error) {
			console.error("Error fetching project:", error);
			return c.json({ error: "Internal server error" }, 500);
		}
	})
	.post("/projects", async (c) => {
		try {
			const session = await auth.api.getSession({
				headers: c.req.raw.headers,
			});

			if (!session?.user) {
				return c.json({ error: "Unauthorized" }, 401);
			}

			const body = await c.req.json();
			const validatedData = createProjectSchema.parse(body);

			// 内容安全审核
			const moderationResult = await validateProjectContent({
				title: validatedData.title,
				description:
					validatedData.description || validatedData.subtitle,
			});

			if (!moderationResult.isValid) {
				console.warn("Project creation content moderation failed:", {
					projectData: { title: validatedData.title },
					errors: moderationResult.errors,
					userId: session.user.id,
				});
				return c.json(
					{
						error: "内容审核未通过",
						details: moderationResult.errors,
					},
					400,
				);
			}

			for (const screenshot of validatedData.screenshots ?? []) {
				const moderation = await ensureImageSafe(
					screenshot,
					"content",
					{
						skipIfEmpty: true,
					},
				);
				if (!moderation.isApproved) {
					console.warn(
						"Project screenshot moderation rejected on create",
						{
							userId: session.user.id,
							screenshot,
							result: moderation.result,
						},
					);
					return c.json(
						{
							error: moderation.reason ?? "图片未通过审核",
						},
						400,
					);
				}
			}

			if (validatedData.imageUrl) {
				const coverModeration = await ensureImageSafe(
					validatedData.imageUrl,
					"content",
					{ skipIfEmpty: true },
				);
				if (!coverModeration.isApproved) {
					console.warn(
						"Project imageUrl moderation rejected on create",
						{
							userId: session.user.id,
							imageUrl: validatedData.imageUrl,
							result: coverModeration.result,
						},
					);
					return c.json(
						{
							error: coverModeration.reason ?? "图片未通过审核",
						},
						400,
					);
				}
			}

			// Get the next order number
			const lastProject = await db.project.findFirst({
				where: { userId: session.user.id },
				orderBy: { order: "desc" },
			});

			const nextOrder = (lastProject?.order || 0) + 1;

			// 计算作品完成度
			const { completionScore, isComplete } = calculateProjectCompletion({
				title: validatedData.title,
				subtitle: validatedData.subtitle,
				description: validatedData.description || null,
				url: validatedData.url || null,
				screenshots: validatedData.screenshots || [],
				projectTags: validatedData.projectTags || [],
				stage: validatedData.stage,
				milestones: validatedData.milestones || [],
				creationExperience: validatedData.creationExperience || null,
			});

			const project = await db.project.create({
				data: {
					// Short ID
					shortId: generateProjectShortId(),

					// Basic information
					title: validatedData.title,
					subtitle: validatedData.subtitle,
					description: validatedData.description,
					url: validatedData.url || null,
					demoVideoUrl: validatedData.demoVideoUrl || null,

					// Media
					screenshots: validatedData.screenshots || [],

					// Classification
					projectTags: validatedData.projectTags || [],
					stage: validatedData.stage,
					pricingType: validatedData.pricingType,

					// Milestones
					milestones: validatedData.milestones || [],

					// Settings
					featured: validatedData.featured,

					// Team recruitment
					isRecruiting: validatedData.isRecruiting || false,
					recruitmentStatus: validatedData.recruitmentStatus || null,
					recruitmentTags: validatedData.recruitmentTags || [],
					teamDescription: validatedData.teamDescription || null,
					teamSkills: validatedData.teamSkills || [],
					teamSize: validatedData.teamSize,
					contactInfo: validatedData.contactInfo || null,

					// Creation experience
					creationExperience:
						validatedData.creationExperience || null,

					// Project completion
					completionScore,
					isComplete,

					// System fields
					userId: session.user.id,
					order: nextOrder,

					// Team members - create related records
					members: {
						create:
							validatedData.teamMembers?.map((member) => ({
								userId: member.userId,
								role: member.role,
							})) || [],
					},
				},
			});

			// 记录贡献点：作品创建
			try {
				await recordContribution({
					userId: session.user.id,
					type: ContributionType.PROJECT_CREATION,
					category: "作品创作",
					description: `创建作品：${validatedData.title}`,
					cpValue: CP_VALUES.PROJECT_CREATION,
					sourceId: project.id,
					sourceType: "project",
				});

				// 检查并颁发自动勋章
				await checkAndAwardAutoBadges(session.user.id);
			} catch (error) {
				console.error(
					"Error recording project creation contribution:",
					error,
				);
				// 不阻断作品创建流程，只记录错误
			}

			return c.json({ project });
		} catch (error) {
			console.error("Error creating project:", error);

			if (error instanceof z.ZodError) {
				return c.json(
					{
						error: "Invalid data",
						details: error.issues,
					},
					400,
				);
			}

			return c.json({ error: "Internal server error" }, 500);
		}
	})
	.put("/projects/:id", async (c) => {
		try {
			const session = await auth.api.getSession({
				headers: c.req.raw.headers,
			});

			if (!session?.user) {
				return c.json({ error: "Unauthorized" }, 401);
			}

			const projectId = c.req.param("id");
			const body = await c.req.json();
			const validatedData = updateProjectSchema.parse({
				...body,
				id: projectId,
			});

			// 内容安全审核
			const moderationResult = await validateProjectContent({
				title: validatedData.title,
				description: validatedData.description || undefined,
			});

			if (!moderationResult.isValid) {
				console.warn("Project update content moderation failed:", {
					projectId: projectId,
					projectData: { title: validatedData.title },
					errors: moderationResult.errors,
					userId: session.user.id,
				});
				return c.json(
					{
						error: "内容审核未通过",
						details: moderationResult.errors,
					},
					400,
				);
			}

			// Check if project belongs to user
			const existingProject = await db.project.findFirst({
				where: {
					...resolveProjectIdentifier(projectId),
					userId: session.user.id,
				},
			});

			if (!existingProject) {
				return c.json({ error: "Project not found" }, 404);
			}

			const { id, ...updateData } = validatedData;

			// 获取更新后的完整数据用于重新计算完成度
			const updatedProjectData = {
				title: updateData.title ?? existingProject.title,
				subtitle: updateData.subtitle ?? existingProject.subtitle,
				description:
					updateData.description !== undefined
						? updateData.description
						: existingProject.description,
				url:
					updateData.url !== undefined
						? updateData.url
						: existingProject.url,
				screenshots:
					updateData.screenshots ?? existingProject.screenshots,
				projectTags:
					updateData.projectTags ?? existingProject.projectTags,
				stage: updateData.stage ?? existingProject.stage,
				milestones: updateData.milestones ?? existingProject.milestones,
				creationExperience:
					updateData.creationExperience !== undefined
						? updateData.creationExperience
						: existingProject.creationExperience,
			};

			// 重新计算作品完成度
			const { completionScore, isComplete } =
				calculateProjectCompletion(updatedProjectData);

			// Handle team members update if provided
			let memberUpdates = {};
			if (updateData.teamMembers !== undefined) {
				// Delete existing members and create new ones
				memberUpdates = {
					members: {
						deleteMany: {}, // Delete all existing members
						create: updateData.teamMembers.map((member) => ({
							userId: member.userId,
							role: member.role,
						})),
					},
				};
			}

			if (updateData.screenshots) {
				for (const screenshot of updateData.screenshots) {
					const moderation = await ensureImageSafe(
						screenshot,
						"content",
						{
							skipIfEmpty: true,
						},
					);
					if (!moderation.isApproved) {
						console.warn(
							"Project screenshot moderation rejected on update",
							{
								userId: session.user.id,
								projectId,
								screenshot,
								result: moderation.result,
							},
						);
						return c.json(
							{
								error: moderation.reason ?? "图片未通过审核",
							},
							400,
						);
					}
				}
			}

			if (updateData.imageUrl !== undefined) {
				const coverModeration = await ensureImageSafe(
					updateData.imageUrl,
					"content",
					{ skipIfEmpty: true },
				);
				if (!coverModeration.isApproved) {
					console.warn(
						"Project imageUrl moderation rejected on update",
						{
							userId: session.user.id,
							projectId,
							imageUrl: updateData.imageUrl,
							result: coverModeration.result,
						},
					);
					return c.json(
						{
							error: coverModeration.reason ?? "图片未通过审核",
						},
						400,
					);
				}
			}

			const project = await db.project.update({
				where: { id: existingProject.id },
				data: {
					// Basic information
					...(updateData.title !== undefined && {
						title: updateData.title,
					}),
					...(updateData.subtitle !== undefined && {
						subtitle: updateData.subtitle,
					}),
					...(updateData.description !== undefined && {
						description: updateData.description,
					}),
					...(updateData.url !== undefined && {
						url: updateData.url || null,
					}),
					...(updateData.demoVideoUrl !== undefined && {
						demoVideoUrl: updateData.demoVideoUrl || null,
					}),

					// Media
					...(updateData.screenshots !== undefined && {
						screenshots: updateData.screenshots,
					}),

					// Classification
					...(updateData.projectTags !== undefined && {
						projectTags: updateData.projectTags,
					}),
					...(updateData.stage !== undefined && {
						stage: updateData.stage,
					}),
					...(updateData.pricingType !== undefined && {
						pricingType: updateData.pricingType,
					}),

					// Milestones
					...(updateData.milestones !== undefined && {
						milestones: updateData.milestones,
					}),
					...(updateData.currentMilestone !== undefined && {
						currentMilestone: updateData.currentMilestone || null,
					}),

					// Settings
					...(updateData.featured !== undefined && {
						featured: updateData.featured,
					}),

					// Legacy fields
					...(updateData.imageUrl !== undefined && {
						imageUrl: updateData.imageUrl || null,
					}),
					...(updateData.tags !== undefined && {
						tags: updateData.tags,
					}),

					// Team recruitment
					...(updateData.isRecruiting !== undefined && {
						isRecruiting: updateData.isRecruiting,
					}),
					...(updateData.recruitmentStatus !== undefined && {
						recruitmentStatus: updateData.recruitmentStatus || null,
					}),
					...(updateData.recruitmentTags !== undefined && {
						recruitmentTags: updateData.recruitmentTags,
					}),
					...(updateData.teamDescription !== undefined && {
						teamDescription: updateData.teamDescription || null,
					}),
					...(updateData.teamSkills !== undefined && {
						teamSkills: updateData.teamSkills,
					}),
					...(updateData.teamSize !== undefined && {
						teamSize: updateData.teamSize,
					}),
					...(updateData.contactInfo !== undefined && {
						contactInfo: updateData.contactInfo || null,
					}),

					// Creation experience
					...(updateData.creationExperience !== undefined && {
						creationExperience:
							updateData.creationExperience || null,
					}),

					// Update completion data
					completionScore,
					isComplete,

					// Team members updates
					...memberUpdates,
				},
			});

			return c.json({ project });
		} catch (error) {
			console.error("Error updating project:", error);

			if (error instanceof z.ZodError) {
				return c.json(
					{
						error: "Invalid data",
						details: error.issues,
					},
					400,
				);
			}

			return c.json({ error: "Internal server error" }, 500);
		}
	})
	.delete("/projects/:id", async (c) => {
		try {
			const session = await auth.api.getSession({
				headers: c.req.raw.headers,
			});

			if (!session?.user) {
				return c.json({ error: "Unauthorized" }, 401);
			}

			const projectId = c.req.param("id");

			// Check if project belongs to user
			const existingProject = await db.project.findFirst({
				where: {
					...resolveProjectIdentifier(projectId),
					userId: session.user.id,
				},
			});

			if (!existingProject) {
				return c.json({ error: "Project not found" }, 404);
			}

			// Delete related data in transaction to avoid foreign key constraint violations
			await db.$transaction(async (tx) => {
				// Delete related EventProjectSubmission records
				await tx.eventProjectSubmission.deleteMany({
					where: { projectId: existingProject.id },
				});

				// Delete related ProjectAward records
				await tx.projectAward.deleteMany({
					where: { projectId: existingProject.id },
				});

				// Other related records are handled by cascade delete in schema
				// (ProjectLike, ProjectComment, ProjectBookmark all have onDelete: Cascade)

				// Finally delete the project
				await tx.project.delete({
					where: { id: existingProject.id },
				});
			});

			return c.json({ success: true });
		} catch (error) {
			console.error("Error deleting project:", error);
			return c.json({ error: "Internal server error" }, 500);
		}
	})
	.put("/projects/order", async (c) => {
		try {
			const session = await auth.api.getSession({
				headers: c.req.raw.headers,
			});

			if (!session?.user) {
				return c.json({ error: "Unauthorized" }, 401);
			}

			const body = await c.req.json();
			const validatedData = updateProjectOrderSchema.parse(body);

			// Update project orders in a transaction
			await db.$transaction(
				validatedData.projects.map(({ id, order }) =>
					db.project.update({
						where: {
							id,
							userId: session.user.id, // Ensure user owns the project
						},
						data: { order },
					}),
				),
			);

			return c.json({ success: true });
		} catch (error) {
			console.error("Error updating project order:", error);

			if (error instanceof z.ZodError) {
				return c.json(
					{
						error: "Invalid data",
						details: error.issues,
					},
					400,
				);
			}

			return c.json({ error: "Internal server error" }, 500);
		}
	})
	.get("/projects/public/:userId", async (c) => {
		try {
			const userId = c.req.param("userId");

			// Get user's public projects
			const projects = await db.project.findMany({
				where: {
					userId,
					user: {
						profilePublic: true, // Only show projects if user's profile is public
					},
					isComplete: true, // 只显示高完成度作品
				},
				orderBy: [
					{ featured: "desc" },
					{ order: "asc" },
					{ createdAt: "desc" },
				],
				select: {
					id: true,
					shortId: true,
					title: true,
					subtitle: true,
					description: true,
					url: true,
					screenshots: true,
					projectTags: true,
					stage: true,
					featured: true,
					createdAt: true,
					updatedAt: true,
				},
			});

			return c.json({ projects });
		} catch (error) {
			console.error("Error fetching public projects:", error);
			return c.json({ error: "Internal server error" }, 500);
		}
	})
	.post("/projects/:id/like", async (c) => {
		try {
			const session = await auth.api.getSession({
				headers: c.req.raw.headers,
			});

			if (!session?.user) {
				return c.json({ error: "Unauthorized" }, 401);
			}

			const projectId = c.req.param("id");

			// Check if project exists and is public
			const project = await db.project.findFirst({
				where: {
					...resolveProjectIdentifier(projectId),
					user: { profilePublic: true },
					isComplete: true, // 确保是高完成度作品
				},
			});

			if (!project) {
				return c.json({ error: "Project not found" }, 404);
			}

			// Check if already liked
			const existingLike = await db.projectLike.findUnique({
				where: {
					projectId_userId: {
						projectId: project.id,
						userId: session.user.id,
					},
				},
			});

			if (existingLike) {
				return c.json({ error: "Already liked" }, 409);
			}

			// Create like
			await db.$transaction(async (tx) => {
				await tx.projectLike.create({
					data: {
						projectId: project.id,
						userId: session.user.id,
					},
				});

				await tx.project.update({
					where: { id: project.id },
					data: { likeCount: { increment: 1 } },
				});
			});

			// 创建通知
			try {
				// 不给自己发通知
				if (project.userId !== session.user.id) {
					await NotificationService.notifyProjectLike(
						project.id,
						project.title,
						project.userId,
						session.user.id,
						session.user.name,
					);
				}
			} catch (notificationError) {
				console.error(
					"Error creating project like notification:",
					notificationError,
				);
				// 不阻断点赞流程
			}

			// 记录贡献点：获得作品点赞（给作品作者）
			try {
				await recordContribution({
					userId: project.userId,
					type: ContributionType.PROJECT_LIKE,
					category: "作品认可",
					description: `作品"${project.title}"获得点赞`,
					cpValue: CP_VALUES.PROJECT_LIKE,
					sourceId: project.id,
					sourceType: "project_like",
				});

				// 检查并颁发自动勋章
				await checkAndAwardAutoBadges(project.userId);
			} catch (error) {
				console.error(
					"Error recording project like contribution:",
					error,
				);
				// 不阻断点赞流程，只记录错误
			}

			return c.json({ success: true });
		} catch (error) {
			console.error("Error liking project:", error);
			return c.json({ error: "Internal server error" }, 500);
		}
	})
	.delete("/projects/:id/like", async (c) => {
		try {
			const session = await auth.api.getSession({
				headers: c.req.raw.headers,
			});

			if (!session?.user) {
				return c.json({ error: "Unauthorized" }, 401);
			}

			const projectId = c.req.param("id");

			// Resolve project identifier
			const project = await db.project.findFirst({
				where: resolveProjectIdentifier(projectId),
				select: { id: true },
			});

			if (!project) {
				return c.json({ error: "Project not found" }, 404);
			}

			// Check if like exists
			const existingLike = await db.projectLike.findUnique({
				where: {
					projectId_userId: {
						projectId: project.id,
						userId: session.user.id,
					},
				},
			});

			if (!existingLike) {
				return c.json({ error: "Like not found" }, 404);
			}

			// Remove like
			await db.$transaction(async (tx) => {
				await tx.projectLike.delete({
					where: {
						projectId_userId: {
							projectId: project.id,
							userId: session.user.id,
						},
					},
				});

				await tx.project.update({
					where: { id: project.id },
					data: { likeCount: { decrement: 1 } },
				});
			});

			return c.json({ success: true });
		} catch (error) {
			console.error("Error unliking project:", error);
			return c.json({ error: "Internal server error" }, 500);
		}
	})
	.post("/projects/:id/bookmark", async (c) => {
		try {
			const session = await auth.api.getSession({
				headers: c.req.raw.headers,
			});

			if (!session?.user) {
				return c.json({ error: "Unauthorized" }, 401);
			}

			const projectId = c.req.param("id");

			// Check if project exists and is public
			const project = await db.project.findFirst({
				where: {
					...resolveProjectIdentifier(projectId),
					user: { profilePublic: true },
					isComplete: true, // 确保是高完成度作品
				},
			});

			if (!project) {
				return c.json({ error: "Project not found" }, 404);
			}

			// Check if user is trying to bookmark their own project
			if (project.userId === session.user.id) {
				return c.json(
					{ error: "Cannot bookmark your own project" },
					400,
				);
			}

			// Check if already bookmarked
			const existingBookmark = await db.projectBookmark.findUnique({
				where: {
					projectId_userId: {
						projectId: project.id,
						userId: session.user.id,
					},
				},
			});

			if (existingBookmark) {
				return c.json({ error: "Already bookmarked" }, 409);
			}

			// Create bookmark
			await db.projectBookmark.create({
				data: {
					projectId: project.id,
					userId: session.user.id,
				},
			});

			return c.json({ success: true });
		} catch (error) {
			console.error("Error bookmarking project:", error);
			return c.json({ error: "Internal server error" }, 500);
		}
	})
	.delete("/projects/:id/bookmark", async (c) => {
		try {
			const session = await auth.api.getSession({
				headers: c.req.raw.headers,
			});

			if (!session?.user) {
				return c.json({ error: "Unauthorized" }, 401);
			}

			const projectId = c.req.param("id");

			// Resolve project identifier
			const project = await db.project.findFirst({
				where: resolveProjectIdentifier(projectId),
				select: { id: true },
			});

			if (!project) {
				return c.json({ error: "Project not found" }, 404);
			}

			// Check if bookmark exists
			const existingBookmark = await db.projectBookmark.findUnique({
				where: {
					projectId_userId: {
						projectId: project.id,
						userId: session.user.id,
					},
				},
			});

			if (!existingBookmark) {
				return c.json({ error: "Bookmark not found" }, 404);
			}

			// Remove bookmark
			await db.projectBookmark.delete({
				where: {
					projectId_userId: {
						projectId: project.id,
						userId: session.user.id,
					},
				},
			});

			return c.json({ success: true });
		} catch (error) {
			console.error("Error removing bookmark:", error);
			return c.json({ error: "Internal server error" }, 500);
		}
	})
	.post("/projects/:id/comments", async (c) => {
		try {
			const session = await auth.api.getSession({
				headers: c.req.raw.headers,
			});

			if (!session?.user) {
				return c.json({ error: "Unauthorized" }, 401);
			}

			const projectId = c.req.param("id");
			const body = await c.req.json();
			const validatedData = createCommentSchema.parse(body);

			// Check if project exists and is public
			const project = await db.project.findFirst({
				where: {
					...resolveProjectIdentifier(projectId),
					user: { profilePublic: true },
					isComplete: true, // 确保是高完成度作品
				},
			});

			if (!project) {
				return c.json({ error: "Project not found" }, 404);
			}

			// Create comment
			const comment = await db.$transaction(async (tx) => {
				const newComment = await tx.projectComment.create({
					data: {
						projectId: project.id,
						userId: session.user.id,
						content: validatedData.content,
					},
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
				});

				await tx.project.update({
					where: { id: project.id },
					data: { commentCount: { increment: 1 } },
				});

				return newComment;
			});

			// 创建通知
			try {
				// 不给自己发通知
				if (project.userId !== session.user.id) {
					await NotificationService.notifyProjectComment(
						project.id,
						project.title,
						project.userId,
						session.user.id,
						session.user.name,
					);
				}
			} catch (notificationError) {
				console.error(
					"Error creating project comment notification:",
					notificationError,
				);
				// 不阻断评论创建流程
			}

			return c.json({ comment });
		} catch (error) {
			console.error("Error creating comment:", error);

			if (error instanceof z.ZodError) {
				return c.json(
					{
						error: "Invalid data",
						details: error.issues,
					},
					400,
				);
			}

			return c.json({ error: "Internal server error" }, 500);
		}
	})
	.get("/projects/public/detail/:id", async (c) => {
		try {
			const session = await auth.api.getSession({
				headers: c.req.raw.headers,
			});

			const projectId = c.req.param("id");
			const userId = session?.user?.id;

			// Get project with user information and counts
			const project = await db.project.findFirst({
				where: resolveProjectIdentifier(projectId),
				include: {
					user: {
						select: {
							id: true,
							name: true,
							username: true,
							userRoleString: true,
							image: true,
							profilePublic: true,
						},
					},
					_count: {
						select: {
							likes: true,
							comments: true,
						},
					},
				},
			});

			if (
				!project ||
				!project.user ||
				!project.user.profilePublic ||
				!project.isComplete
			) {
				return c.json({ error: "Project not found" }, 404);
			}

			// Increment view count
			await db.project.update({
				where: { id: project.id },
				data: { viewCount: { increment: 1 } },
			});

			// Get user interactions if logged in
			const [userLike, userBookmark] = userId
				? await Promise.all([
						db.projectLike.findUnique({
							where: {
								projectId_userId: {
									projectId: project.id,
									userId,
								},
							},
						}),
						db.projectBookmark.findUnique({
							where: {
								projectId_userId: {
									projectId: project.id,
									userId,
								},
							},
						}),
					])
				: [null, null];

			return c.json({
				...project,
				userLike: !!userLike,
				userBookmark: !!userBookmark,
			});
		} catch (error) {
			console.error("Failed to fetch project detail:", error);
			return c.json({ error: "Failed to fetch project detail" }, 500);
		}
	})
	.get("/projects/public/detail/:id/related", async (c) => {
		try {
			const projectId = c.req.param("id");

			// Get the project to find the user ID
			const project = await db.project.findFirst({
				where: resolveProjectIdentifier(projectId),
				select: {
					id: true,
					userId: true,
					user: {
						select: {
							profilePublic: true,
						},
					},
				},
			});

			if (!project || !project.user?.profilePublic) {
				return c.json({ error: "Project not found" }, 404);
			}

			// Get related projects from the same user
			const relatedProjects = await db.project.findMany({
				where: {
					userId: project.userId,
					id: { not: project.id },
					user: {
						profilePublic: true,
					},
					isComplete: true,
				},
				include: {
					user: {
						select: {
							id: true,
							name: true,
							username: true,
							userRoleString: true,
							image: true,
						},
					},
					_count: {
						select: {
							likes: true,
							comments: true,
						},
					},
				},
				orderBy: {
					createdAt: "desc",
				},
				take: 3,
			});

			return c.json(relatedProjects);
		} catch (error) {
			console.error("Failed to fetch related projects:", error);
			return c.json({ error: "Failed to fetch related projects" }, 500);
		}
	});
