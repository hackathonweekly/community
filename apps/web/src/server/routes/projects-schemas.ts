import { PricingType, ProjectStage } from "@prisma/client";
import { z } from "zod";

const teamMemberSchema = z.object({
	userId: z.string(),
	role: z.enum(["LEADER", "MEMBER"]).default("MEMBER"),
});

const optionalUrlSchema = z
	.string()
	.optional()
	.nullable()
	.refine((val) => !val || z.string().url().safeParse(val).success, {
		message: "Invalid URL",
	});

const optionalVideoUrlSchema = z
	.string()
	.optional()
	.nullable()
	.refine((val) => !val || z.string().url().safeParse(val).success, {
		message: "Invalid video URL",
	});

const legacyImageUrlSchema = z
	.string()
	.url("Invalid image URL")
	.optional()
	.nullable()
	.or(z.literal(""));

export const createProjectSchema = z.object({
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
	url: optionalUrlSchema,
	demoVideoUrl: optionalVideoUrlSchema,

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
	imageUrl: legacyImageUrlSchema,
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
	teamMembers: z.array(teamMemberSchema).default([]),
});

export const updateProjectSchema = z.object({
	id: z.string(),

	// Basic information
	title: z
		.string()
		.min(1, "Project title is required")
		.max(100, "Title too long")
		.optional(),
	subtitle: z
		.string()
		.min(1, "Subtitle is required")
		.max(200, "Subtitle too long")
		.optional(),
	description: z.string().max(2000, "作品描述过长").optional().nullable(),
	detailedDescription: z.string().optional().nullable(),
	url: optionalUrlSchema,
	demoVideoUrl: optionalVideoUrlSchema,

	// Media
	screenshots: z.array(z.string()).max(8, "Too many screenshots").optional(),

	// Classification
	projectTags: z
		.array(z.string())
		.max(10, "Too many project tags")
		.optional(),
	stage: z.nativeEnum(ProjectStage).optional(),
	pricingType: z.nativeEnum(PricingType).optional().nullable(),

	// Milestones
	milestones: z.array(z.string()).max(20, "Too many milestones").optional(),
	currentMilestone: z.string().optional().nullable(),

	// Settings
	featured: z.boolean().optional(),

	// Legacy fields (for backwards compatibility)
	imageUrl: legacyImageUrlSchema.optional(),
	tags: z.array(z.string()).max(10, "Too many tags").optional(),

	// Team recruitment fields
	isRecruiting: z.boolean().optional(),
	recruitmentStatus: z.string().optional().nullable(),
	recruitmentTags: z
		.array(z.string())
		.max(10, "Too many recruitment tags")
		.optional(),
	teamDescription: z.string().optional().nullable(),
	teamSkills: z
		.array(z.string())
		.max(20, "Too many required skills")
		.optional(),
	teamSize: z.number().min(1).max(20).optional().nullable(),
	contactInfo: z.string().optional().nullable(),

	// Creation experience sharing
	creationExperience: z.string().optional().nullable(),

	// Team members
	teamMembers: z.array(teamMemberSchema).optional(),
});
