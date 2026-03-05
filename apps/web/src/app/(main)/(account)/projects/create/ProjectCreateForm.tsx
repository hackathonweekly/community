"use client";

import { Button } from "@community/ui/ui/button";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@community/ui/ui/form";
import { Input } from "@community/ui/ui/input";
import { Textarea } from "@community/ui/ui/textarea";
import { PricingTypeSelector } from "@account/profile/components/PricingTypeSelector";
import { ProjectScreenshotsUpload } from "@account/profile/components/ProjectScreenshotsUpload";
import { ProjectTagSelector } from "@account/profile/components/ProjectTagSelector";
import { zodResolver } from "@hookform/resolvers/zod";
import { PricingType, ProjectStage } from "@community/lib-shared/prisma-enums";
import { Edit3 } from "lucide-react";
import { type SubmitHandler, useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { ProjectMilestoneSelectorModal } from "./ProjectMilestoneSelectorModal";
import { ProjectStageSelector } from "./ProjectStageSelector";
import { TeamMemberSelector } from "./TeamMemberSelector";

const projectCreateSchema = z.object({
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
		.min(1, "作品描述是必需的")
		.max(1000, "作品描述不能超过 1000 字符"),
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
	screenshots: z
		.array(z.string())
		.min(1, "至少需要上传一张作品截图")
		.default([]),

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

	// Team members
	teamMembers: z
		.array(
			z.object({
				userId: z.string(),
				role: z.enum(["LEADER", "MEMBER"]).default("MEMBER"),
				// Store user info for display purposes
				userName: z.string().optional(),
				userUsername: z.string().optional(),
				userImage: z.string().optional(),
			}),
		)
		.default([]),
});

type ProjectCreateValues = z.infer<typeof projectCreateSchema>;

interface ProjectCreateFormProps {
	onSubmit: (data: any) => Promise<void>;
	isLoading: boolean;
	currentUserId?: string; // 添加当前用户ID
}

export function ProjectCreateForm({
	onSubmit,
	isLoading,
	currentUserId,
}: ProjectCreateFormProps) {
	const form = useForm({
		resolver: zodResolver(projectCreateSchema),
		defaultValues: {
			// Basic information
			title: "",
			subtitle: "",
			description: "",
			url: "",
			demoVideoUrl: "",

			// Media
			screenshots: [],

			// Classification
			projectTags: [],
			stage: ProjectStage.IDEA_VALIDATION,
			pricingType: null,

			// Milestones
			milestones: [],

			// Team recruitment
			isRecruiting: false,
			recruitmentStatus: "",
			recruitmentTags: [],
			teamDescription: "",
			teamSkills: "",
			teamSize: null,
			contactInfo: "",

			// Creation experience
			creationExperience: "",

			// Team members
			teamMembers: [],
		},
	});

	const handleCancel = () => {
		// Check if there's history to go back to
		if (window.history.length > 1) {
			window.history.back();
		} else {
			// Fallback to projects page if no history
			window.location.href = "/projects";
		}
	};

	// Watch form values for completion calculation
	const watchedValues = useWatch({ control: form.control });

	// Calculate project completion percentage
	const calculateCompletionPercentage = () => {
		// 检查是否包含所有必需字段
		const hasAllRequired =
			watchedValues?.title?.trim() &&
			watchedValues?.subtitle?.trim() &&
			watchedValues?.stage &&
			(watchedValues?.screenshots?.length ?? 0) > 0 &&
			watchedValues?.description?.trim() &&
			watchedValues?.url?.trim();

		return hasAllRequired ? 100 : 0;
	};

	const getMissingRequiredFields = () => {
		const missing = [];
		if (!watchedValues?.title?.trim()) missing.push("作品名称");
		if (!watchedValues?.subtitle?.trim()) missing.push("一句话介绍");
		if (!watchedValues?.stage) missing.push("作品阶段");
		if (
			!watchedValues?.screenshots ||
			watchedValues.screenshots.length === 0
		)
			missing.push("作品截图");
		if (!watchedValues?.description?.trim()) missing.push("作品描述");
		if (!watchedValues?.url?.trim()) missing.push("作品链接");
		return missing;
	};

	const completionPercentage = calculateCompletionPercentage();

	// 检查是否符合社区展示条件
	const hasRequiredForCommunity =
		watchedValues?.title?.trim() &&
		watchedValues?.subtitle?.trim() &&
		watchedValues?.stage &&
		(watchedValues?.screenshots?.length ?? 0) > 0 &&
		watchedValues?.description?.trim() &&
		watchedValues?.url?.trim();

	const isComplete = hasRequiredForCommunity;

	const handleSubmit: SubmitHandler<ProjectCreateValues> = async (data) => {
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

			// Team members
			teamMembers: data.teamMembers || [],

			// Default values
			featured: false,
		};

		await onSubmit(projectData);
	};

	return (
		<Form {...form}>
			<form
				onSubmit={form.handleSubmit(handleSubmit)}
				className="space-y-6"
			>
				{/* 作品完善程度提示 */}
				<div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
					<div className="flex items-center justify-between mb-3">
						<div className="flex items-center gap-3 flex-1">
							<Edit3 className="h-4 w-4 text-amber-600 flex-shrink-0" />
							<div className="flex items-center gap-2">
								<span className="text-sm font-medium text-amber-800">
									社区展示状态
								</span>
								<div className="w-20 h-2 bg-amber-200 rounded-full overflow-hidden">
									<div
										className={`h-full rounded-full transition-all duration-300 ${
											isComplete
												? "bg-green-500"
												: "bg-amber-500"
										}`}
										style={{
											width: `${completionPercentage}%`,
										}}
									/>
								</div>
							</div>
						</div>
						<span className="text-xs text-amber-600">
							{isComplete ? "可以展示" : "待完善"}
						</span>
					</div>
					<div className="text-sm text-amber-800">
						{isComplete ? (
							<p>
								<strong>太棒了！</strong>{" "}
								您的作品包含所有必需信息，将在社区作品中展示。
							</p>
						) : (
							<div>
								<p className="mb-2">
									<strong>
										要在社区作品中获得曝光，还需填写以下字段，更完善的作品信息可以帮助你更好的链接资源哦：
									</strong>
								</p>
								<div className="text-xs space-y-1">
									{getMissingRequiredFields().map(
										(field, index) => (
											<div
												key={index}
												className="flex items-center gap-1"
											>
												<span className="w-1 h-1 bg-red-500 rounded-full" />
												<span className="text-red-700">
													{field}
												</span>
											</div>
										),
									)}
								</div>
							</div>
						)}
					</div>
				</div>
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
								<FormLabel>
									作品描述{" "}
									<span className="text-red-500">*</span>
								</FormLabel>
								<FormControl>
									<Textarea
										{...field}
										placeholder="详细描述你的作品功能和特色，支持Markdown语法..."
										className="min-h-[200px]"
									/>
								</FormControl>
								<FormDescription>
									{field.value?.length || 0}/1000 字符
								</FormDescription>
								<FormMessage />
							</FormItem>
						)}
					/>
				</div>

				{/* 媒体资源 */}
				<div className="space-y-4 bg-white p-6 border rounded-lg">
					<h3 className="text-lg font-medium">媒体资源</h3>

					<FormField
						control={form.control}
						name="screenshots"
						render={({ field }) => (
							<FormItem>
								<FormLabel>
									作品截图{" "}
									<span className="text-red-500">*</span>
								</FormLabel>
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

					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<FormField
							control={form.control}
							name="url"
							render={({ field }) => (
								<FormItem>
									<FormLabel>
										作品链接{" "}
										<span className="text-red-500">*</span>
									</FormLabel>
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
				{/* <TeamRecruitmentSection form={form} /> */}

				{/* 团队成员 */}
				<div className="space-y-4 bg-white p-6 border rounded-lg">
					<div>
						<h3 className="text-lg font-medium">团队成员</h3>
						<p className="text-sm text-gray-500 mt-1">
							添加团队成员，共同协作开发作品
						</p>
					</div>

					<FormField
						control={form.control}
						name="teamMembers"
						render={({ field }) => {
							// 将 teamMembers 转换为 TeamMemberSelector 所需的格式
							const selectedMembers = (field.value || []).map(
								(member: any) => ({
									user: {
										id: member.userId,
										name: member.userName || "用户",
										username: member.userUsername || "",
										image: member.userImage || "",
									},
									role: member.role,
								}),
							);

							return (
								<FormItem>
									<FormControl>
										<TeamMemberSelector
											selectedMembers={selectedMembers}
											onChange={(members) => {
												// 转换回表单所需的格式，保存完整的用户信息
												const teamMembers = members.map(
													(member) => ({
														userId: member.user.id,
														role: member.role,
														userName:
															member.user.name,
														userUsername:
															member.user
																.username,
														userImage:
															member.user.image,
													}),
												);
												field.onChange(teamMembers);
											}}
											currentUserId={currentUserId}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							);
						}}
					/>
				</div>

				{/* 创作经验分享 */}
				<div className="space-y-4 bg-white p-6 border rounded-lg">
					<div>
						<h3 className="text-lg font-medium">经验分享</h3>
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
						onClick={handleCancel}
					>
						取消
					</Button>
					<Button type="submit" disabled={isLoading}>
						{isLoading ? "创建中..." : "创建作品"}
					</Button>
				</div>
			</form>
		</Form>
	);
}
