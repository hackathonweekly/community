"use client";

import { Button } from "@/components/ui/button";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PricingTypeSelector } from "@dashboard/profile/components/PricingTypeSelector";
import { ProjectScreenshotsUpload } from "@dashboard/profile/components/ProjectScreenshotsUpload";
import { ProjectTagSelector } from "@dashboard/profile/components/ProjectTagSelector";
import { zodResolver } from "@hookform/resolvers/zod";
import { PricingType, ProjectStage } from "@prisma/client";
import { type SubmitHandler, useForm } from "react-hook-form";
import { z } from "zod";
import { ProjectMilestoneSelectorModal } from "../../create/ProjectMilestoneSelectorModal";
import { ProjectStageSelector } from "../../create/ProjectStageSelector";
import { TeamRecruitmentSection } from "../../create/TeamRecruitmentSection";

const projectEditSchema = z.object({
	// Basic information
	title: z
		.string()
		.min(1, "Project title is required")
		.max(100, "Title too long"),
	subtitle: z
		.string()
		.min(1, "One-sentence intro is required")
		.max(200, "Subtitle too long"),
	description: z
		.string()
		.min(1, "Project description is required")
		.max(1000, "Description too long"),
	url: z
		.string()
		.optional()
		.refine((val) => !val || z.string().url().safeParse(val).success, {
			message: "Invalid URL",
		}),
	demoVideoUrl: z
		.string()
		.optional()
		.refine((val) => !val || z.string().url().safeParse(val).success, {
			message: "Invalid video URL",
		}),

	// Media
	screenshots: z.array(z.string()).default([]),

	// Classification
	projectTags: z.array(z.string()).default([]),
	stage: z.nativeEnum(ProjectStage),
	pricingType: z.nativeEnum(PricingType).optional().nullable(),

	// Milestones - only completed milestones
	milestones: z.array(z.string()).default([]),

	// Team recruitment fields (independent of stage)
	isRecruiting: z.boolean().default(false),
	recruitmentStatus: z.string().optional(),
	recruitmentTags: z.array(z.string()).default([]),
	teamDescription: z.string().optional(),
	teamSkills: z.string().optional(),
	teamSize: z.number().min(1).max(20).optional().nullable(),
	contactInfo: z.string().optional(),

	// Creation experience sharing
	creationExperience: z.string().optional(),

	// Settings
	featured: z.boolean().default(false),
});

type ProjectEditValues = z.infer<typeof projectEditSchema>;

interface ProjectEditFormProps {
	project: any;
	onSubmit: (data: any) => Promise<void>;
	isLoading: boolean;
}

export function ProjectEditForm({
	project,
	onSubmit,
	isLoading,
}: ProjectEditFormProps) {
	const form = useForm({
		resolver: zodResolver(projectEditSchema),
		defaultValues: {
			// Basic information
			title: project.title || "",
			subtitle: project.subtitle || "",
			description: project.description || "",
			url: project.url || "",
			demoVideoUrl: project.demoVideoUrl || "",

			// Media
			screenshots: project.screenshots || [],

			// Classification
			projectTags: project.projectTags || [],
			stage: project.stage || ProjectStage.IDEA_VALIDATION,
			pricingType: project.pricingType || null,

			// Milestones
			milestones: project.milestones || [],

			// Team recruitment
			isRecruiting: project.isRecruiting || false,
			recruitmentStatus: project.recruitmentStatus || "",
			recruitmentTags: project.recruitmentTags || [],
			teamDescription: project.teamDescription || "",
			teamSkills: Array.isArray(project.teamSkills)
				? project.teamSkills.join(", ")
				: project.teamSkills || "",
			teamSize: project.teamSize || null,
			contactInfo: project.contactInfo || "",

			// Creation experience
			creationExperience: project.creationExperience || "",

			// Settings
			featured: project.featured || false,
		},
	});

	const handleSubmit: SubmitHandler<ProjectEditValues> = async (data) => {
		const projectData = {
			// Basic information
			title: data.title,
			subtitle: data.subtitle,
			description: data.description,
			url: data.url || null,
			demoVideoUrl: data.demoVideoUrl || null,

			// Media
			screenshots: data.screenshots || [],

			// Classification
			projectTags: data.projectTags || [],
			stage: data.stage,
			pricingType: data.pricingType,

			// Milestones
			milestones: data.milestones || [],

			// Team recruitment
			isRecruiting: data.isRecruiting || false,
			recruitmentStatus: data.recruitmentStatus || null,
			recruitmentTags: data.recruitmentTags || [],
			teamDescription: data.teamDescription || null,
			teamSkills: data.teamSkills
				? data.teamSkills
						.split(",")
						.map((skill) => skill.trim())
						.filter(Boolean)
				: [],
			teamSize: data.teamSize,
			contactInfo: data.contactInfo || null,

			// Creation experience
			creationExperience: data.creationExperience || null,

			// Settings
			featured: data.featured,
		};

		await onSubmit(projectData);
	};

	return (
		<Form {...form}>
			<form
				onSubmit={form.handleSubmit(handleSubmit)}
				className="space-y-6"
			>
				{/* 基础信息 */}
				<div className="space-y-4 bg-white p-6 border rounded-lg">
					<h3 className="text-lg font-medium">基础信息</h3>

					<FormField
						control={form.control}
						name="title"
						render={({ field }) => (
							<FormItem>
								<FormLabel>作品名称 *</FormLabel>
								<FormControl>
									<Input
										{...field}
										placeholder="我的作品名称"
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name="subtitle"
						render={({ field }) => (
							<FormItem>
								<FormLabel>一句话介绍 *</FormLabel>
								<FormControl>
									<Input
										{...field}
										placeholder="用一句话概括你的作品..."
									/>
								</FormControl>
								<FormDescription>
									简洁的作品介绍，会在作品卡片中显示
								</FormDescription>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name="description"
						render={({ field }) => (
							<FormItem>
								<FormLabel>作品描述 *</FormLabel>
								<FormControl>
									<Textarea
										{...field}
										placeholder="详细描述你的作品功能和特色，支持Markdown语法..."
										className="min-h-[200px]"
									/>
								</FormControl>
								<FormDescription>
									详细介绍作品的功能和价值，支持Markdown格式
								</FormDescription>
								<FormMessage />
							</FormItem>
						)}
					/>
				</div>

				{/* 媒体资源 */}
				<div className="space-y-4 bg-white p-6 border rounded-lg">
					<h3 className="text-lg font-medium">媒体资源</h3>

					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<FormField
							control={form.control}
							name="url"
							render={({ field }) => (
								<FormItem>
									<FormLabel>作品链接（可选）</FormLabel>
									<FormControl>
										<Input
											{...field}
											value={field.value || ""}
											placeholder="https://myproject.com"
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="demoVideoUrl"
							render={({ field }) => (
								<FormItem>
									<FormLabel>演示视频（可选）</FormLabel>
									<FormControl>
										<Input
											{...field}
											value={field.value || ""}
											placeholder="B站或YouTube视频链接"
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					</div>
				</div>

				<FormField
					control={form.control}
					name="screenshots"
					render={({ field }) => (
						<FormItem>
							<FormLabel>作品截图 *</FormLabel>
							<FormDescription className="text-red-600">
								至少需要上传一张作品截图作为展示图片
							</FormDescription>
							<FormControl>
								<ProjectScreenshotsUpload
									value={field.value || []}
									onChange={field.onChange}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				{/* 分类和标签 */}
				<div className="space-y-4 bg-white p-6 border rounded-lg">
					<h3 className="text-lg font-medium">分类和标签</h3>

					<FormField
						control={form.control}
						name="projectTags"
						render={({ field }) => (
							<FormItem>
								<FormControl>
									<ProjectTagSelector
										selectedTags={field.value || []}
										onTagsChange={field.onChange}
										showTitle={false}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name="stage"
						render={({ field }) => (
							<FormItem>
								<FormControl>
									<ProjectStageSelector
										value={field.value}
										onChange={field.onChange}
										showTitle={true}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name="pricingType"
						render={({ field }) => (
							<FormItem>
								<FormControl>
									<PricingTypeSelector
										value={field.value || null}
										onChange={field.onChange}
										showTitle={true}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
				</div>

				{/* 里程碑 */}
				<div className="space-y-4 bg-white p-6 border rounded-lg">
					<FormField
						control={form.control}
						name="milestones"
						render={({ field }) => (
							<FormItem>
								<FormControl>
									<ProjectMilestoneSelectorModal
										completedMilestones={field.value || []}
										onMilestonesChange={field.onChange}
										showTitle={true}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
				</div>

				{/* 团队招募模块 */}
				<TeamRecruitmentSection form={form} />

				{/* 创作经验分享 */}
				<div className="space-y-4 bg-white p-6 border rounded-lg">
					<div>
						<h3 className="text-lg font-medium">创作经验分享</h3>
						<p className="text-sm text-muted-foreground mt-1">
							分享你在创作这个作品过程中的心得感悟（可选）
						</p>
					</div>

					<FormField
						control={form.control}
						name="creationExperience"
						render={({ field }) => (
							<FormItem>
								<FormLabel>创作经验（可选）</FormLabel>
								<FormControl>
									<Textarea
										{...field}
										placeholder="分享你的创作心得、遇到的挑战、解决方案，或者粘贴相关博客链接..."
										className="min-h-[120px]"
									/>
								</FormControl>
								<FormDescription>
									支持 Markdown
									格式。鼓励分享创作过程中的思考、挑战和收获，也可以粘贴相关博客或文档链接
								</FormDescription>
								<FormMessage />
							</FormItem>
						)}
					/>
				</div>

				<div className="flex gap-4">
					<Button
						type="button"
						variant="outline"
						onClick={() => window.history.back()}
					>
						取消
					</Button>
					<Button type="submit" disabled={isLoading}>
						{isLoading ? "更新中..." : "更新作品"}
					</Button>
				</div>
			</form>
		</Form>
	);
}
