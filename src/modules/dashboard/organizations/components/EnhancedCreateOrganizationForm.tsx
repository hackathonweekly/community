"use client";

import { Badge } from "@/components/ui/badge";
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
import { ImageUpload } from "@/components/ui/image-upload";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useDebounce } from "@/hooks/use-debounce";
import { TAG_PRESETS } from "@/lib/utils";
import { useActiveOrganization } from "@dashboard/organizations/hooks/use-active-organization";
import {
	organizationListQueryKey,
	useCreateOrganizationMutation,
} from "@dashboard/organizations/lib/api";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "@/hooks/router";
import { useQueryClient } from "@tanstack/react-query";
import { X } from "lucide-react";
import { ExternalLink, Link } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const formSchema = z.object({
	name: z
		.string()
		.min(3, "组织名称至少需要3个字符")
		.max(32, "组织名称不能超过32个字符"),
	summary: z.string().max(100, "一句话介绍不能超过100个字符").optional(),
	description: z
		.string()
		.min(20, "组织介绍至少需要20个字符")
		.max(1000, "组织介绍不能超过1000个字符"),
	location: z.string().min(2, "请填写组织所在地址"),
	tags: z
		.array(z.string())
		.min(1, "至少需要选择一个标签")
		.max(10, "最多只能选择10个标签"),
	logo: z.string().optional(),
	audienceQrCode: z.string().optional(),
	membershipRequirements: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function EnhancedCreateOrganizationForm({
	defaultName,
}: {
	defaultName?: string;
}) {
	const t = useTranslations();
	const router = useRouter();
	const queryClient = useQueryClient();
	const { setActiveOrganization } = useActiveOrganization();
	const createOrganizationMutation = useCreateOrganizationMutation();
	const [newTag, setNewTag] = useState("");
	const [slugPreview, setSlugPreview] = useState<string>("");
	const [currentStep, setCurrentStep] = useState(1);

	const form = useForm<FormValues>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			name: defaultName ?? "",
			summary: "",
			description: "",
			location: "",
			tags: [],
			logo: "",
			audienceQrCode: "",
			membershipRequirements: "",
		},
	});

	const selectedTags = form.watch("tags");
	const organizationName = form.watch("name");
	const summary = form.watch("summary");
	const description = form.watch("description");
	const membershipRequirements = form.watch("membershipRequirements");
	const debouncedName = useDebounce(organizationName, 500);

	// Generate slug preview when name changes
	useEffect(() => {
		if (debouncedName && debouncedName.trim().length >= 3) {
			// 生成示例随机slug用于预览
			setSlugPreview(`${Math.random().toString(36).substr(2, 6)}`);
		} else {
			setSlugPreview("");
		}
	}, [debouncedName]);

	const addTag = (tag: string) => {
		if (tag && !selectedTags.includes(tag) && selectedTags.length < 10) {
			form.setValue("tags", [...selectedTags, tag]);
		}
	};

	const removeTag = (tagToRemove: string) => {
		form.setValue(
			"tags",
			selectedTags.filter((tag) => tag !== tagToRemove),
		);
	};

	const addCustomTag = () => {
		if (
			newTag.trim() &&
			!selectedTags.includes(newTag.trim()) &&
			selectedTags.length < 10
		) {
			addTag(newTag.trim());
			setNewTag("");
		}
	};

	const onSubmit = form.handleSubmit(async (data) => {
		try {
			const response = await fetch("/api/organizations/create", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(data),
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(
					error.message || "Failed to create organization",
				);
			}

			const newOrganization = await response.json();

			await setActiveOrganization(newOrganization.slug);

			await queryClient.invalidateQueries({
				queryKey: organizationListQueryKey,
			});

			toast.success("组织创建成功！");
			router.replace(`/app/${newOrganization.slug}`);
		} catch (e) {
			console.error("Create organization error:", e);
			toast.error(
				e instanceof Error ? e.message : "创建组织失败，请重试",
			);
		}
	});

	// 计算当前步骤
	const watchedValues = form.watch();
	useEffect(() => {
		if (
			watchedValues.name &&
			watchedValues.description &&
			watchedValues.location &&
			watchedValues.tags.length > 0
		) {
			setCurrentStep(4);
		} else if (watchedValues.tags.length > 0) {
			setCurrentStep(3);
		} else if (
			watchedValues.name &&
			watchedValues.description &&
			watchedValues.location
		) {
			setCurrentStep(2);
		} else {
			setCurrentStep(1);
		}
	}, [
		watchedValues.name,
		watchedValues.description,
		watchedValues.location,
		watchedValues.tags,
	]);

	return (
		<div className="mx-auto w-full max-w-2xl">
			{/* 进度指示器 */}
			<div className="mb-8">
				<div className="flex items-center justify-between mb-4">
					{[1, 2, 3, 4].map((step, index) => (
						<div key={step} className="flex items-center flex-1">
							<div
								className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
									step <= currentStep
										? "bg-blue-600 text-white"
										: "bg-gray-200 text-gray-500"
								}`}
							>
								{step}
							</div>
							{index < 3 && (
								<div
									className={`flex-1 h-0.5 mx-2 ${
										step < currentStep
											? "bg-blue-600"
											: "bg-gray-200"
									}`}
								/>
							)}
						</div>
					))}
				</div>
				<div className="flex justify-between text-xs text-gray-500">
					<span>基础信息</span>
					<span>标签选择</span>
					<span>视觉内容</span>
					<span>社区管理</span>
				</div>
			</div>

			<div className="text-center mb-8">
				<h1 className="font-bold text-2xl md:text-3xl">创建社区组织</h1>
				<p className="mt-2 text-foreground/60">
					填写详细信息来创建一个专业的社区组织，让更多人了解和加入你的社区
				</p>
			</div>

			<Form {...form}>
				<form onSubmit={onSubmit} className="space-y-8">
					{/* 基础信息 */}
					<div className="space-y-6">
						<div className="border-b pb-2">
							<h2 className="text-xl font-semibold text-gray-900 flex items-center">
								<div className="w-6 h-6 rounded-full bg-blue-600 text-white text-sm flex items-center justify-center mr-3 font-medium">
									1
								</div>
								基础信息
							</h2>
							<p className="text-sm text-gray-500 ml-9 mt-1">
								基本的组织信息，包括名称、介绍和地址
							</p>
						</div>

						<FormField
							control={form.control}
							name="name"
							render={({ field }) => (
								<FormItem>
									<FormLabel className="text-sm font-medium text-gray-700">
										组织名称{" "}
										<span className="text-red-500">*</span>
									</FormLabel>
									<FormControl>
										<Input
											{...field}
											placeholder="输入组织名称"
										/>
									</FormControl>
									<FormDescription>
										这是你的组织对外展示的名称
									</FormDescription>

									{/* Slug预览 */}
									{organizationName &&
										organizationName.trim().length >= 3 && (
											<div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
												<div className="flex items-center gap-2 text-sm">
													<Link className="h-4 w-4 text-blue-600" />
													<span className="font-medium text-blue-900">
														URL预览:
													</span>
												</div>
												<div className="mt-1">
													<code className="text-sm bg-white px-2 py-1 rounded border text-blue-800">
														/app/
														{slugPreview ||
															"abc123"}
													</code>
												</div>
												<div className="flex items-center gap-1 mt-2 text-xs text-blue-600">
													<ExternalLink className="h-3 w-3" />
													<span>
														将自动生成6位短链接，用户可通过此链接访问组织页面
													</span>
												</div>
											</div>
										)}

									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="summary"
							render={({ field }) => (
								<FormItem>
									<FormLabel className="text-sm font-medium text-gray-700">
										一句话介绍
									</FormLabel>
									<FormControl>
										<Input
											{...field}
											placeholder="用一句话简洁地介绍你的组织..."
											maxLength={100}
										/>
									</FormControl>
									<FormDescription>
										简洁的一句话介绍，将在组织列表和首页显示
										<span className="text-xs text-gray-400 ml-2">
											({(summary || "").length}/100)
										</span>
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
									<FormLabel className="text-sm font-medium text-gray-700">
										组织介绍{" "}
										<span className="text-red-500">*</span>
									</FormLabel>
									<FormControl>
										<Textarea
											{...field}
											placeholder="详细介绍你的组织，包括组织的目标、活动内容、文化特色等..."
											rows={4}
											maxLength={1000}
										/>
									</FormControl>
									<FormDescription>
										支持 Markdown 格式，至少20个字符
										<span className="text-xs text-gray-400 ml-2">
											({(description || "").length}/1000)
										</span>
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="location"
							render={({ field }) => (
								<FormItem>
									<FormLabel className="text-sm font-medium text-gray-700">
										组织地址{" "}
										<span className="text-red-500">*</span>
									</FormLabel>
									<FormControl>
										<Input
											{...field}
											placeholder="例如：北京市海淀区中关村 或 线上社区"
										/>
									</FormControl>
									<FormDescription>
										填写组织的主要活动地点或地区
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>
					</div>

					{/* 标签选择 */}
					<div className="space-y-4">
						<div className="border-b pb-2">
							<h2 className="text-xl font-semibold text-gray-900 flex items-center">
								<div className="w-6 h-6 rounded-full bg-blue-600 text-white text-sm flex items-center justify-center mr-3 font-medium">
									2
								</div>
								标签选择
							</h2>
							<p className="text-sm text-gray-500 ml-9 mt-1">
								选择合适的标签帮助他人更好地发现你的组织
							</p>
						</div>
						<FormField
							control={form.control}
							name="tags"
							render={() => (
								<FormItem>
									<FormLabel className="text-sm font-medium text-gray-700">
										组织标签{" "}
										<span className="text-red-500">*</span>
									</FormLabel>
									<FormDescription>
										选择标签帮助他人更好地发现你的组织（至少1个，最多10个）
									</FormDescription>

									{/* 已选标签 */}
									{selectedTags.length > 0 && (
										<div className="flex flex-wrap gap-2 p-3 bg-muted rounded-md">
											{selectedTags.map((tag) => (
												<Badge
													key={tag}
													variant="secondary"
													className="flex items-center gap-1"
												>
													{tag}
													<X
														className="h-3 w-3 cursor-pointer"
														onClick={(e) => {
															e.preventDefault();
															e.stopPropagation();
															removeTag(tag);
														}}
													/>
												</Badge>
											))}
										</div>
									)}

									{/* 预设标签 */}
									<div className="space-y-6">
										{Object.entries(TAG_PRESETS).map(
											([category, tags]) => (
												<div
													key={category}
													className="bg-gray-50 p-4 rounded-lg"
												>
													<h4 className="text-sm font-medium mb-3 text-gray-700">
														{category}
													</h4>
													<div className="flex flex-wrap gap-2">
														{tags.map((tag) => (
															<Badge
																key={tag}
																variant={
																	selectedTags.includes(
																		tag,
																	)
																		? "default"
																		: "outline"
																}
																className="cursor-pointer hover:shadow-sm transition-shadow"
																onClick={() =>
																	selectedTags.includes(
																		tag,
																	)
																		? removeTag(
																				tag,
																			)
																		: addTag(
																				tag,
																			)
																}
															>
																{tag}
															</Badge>
														))}
													</div>
												</div>
											),
										)}
									</div>

									{/* 自定义标签 */}
									{selectedTags.length < 10 && (
										<div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
											<h4 className="text-sm font-medium mb-3 text-blue-700">
												添加自定义标签
											</h4>
											<div className="flex gap-3">
												<Input
													placeholder="输入自定义标签..."
													value={newTag}
													onChange={(e) =>
														setNewTag(
															e.target.value,
														)
													}
													onKeyPress={(e) => {
														if (e.key === "Enter") {
															e.preventDefault();
															addCustomTag();
														}
													}}
													className="flex-1"
												/>
												<Button
													type="button"
													onClick={addCustomTag}
													variant="outline"
													className="whitespace-nowrap"
												>
													添加
												</Button>
											</div>
										</div>
									)}

									<FormMessage />
								</FormItem>
							)}
						/>
					</div>

					{/* 视觉内容 */}
					<div className="space-y-6">
						<div className="border-b pb-2">
							<h2 className="text-xl font-semibold text-gray-900 flex items-center">
								<div className="w-6 h-6 rounded-full bg-blue-600 text-white text-sm flex items-center justify-center mr-3 font-medium">
									3
								</div>
								视觉内容
							</h2>
							<p className="text-sm text-gray-500 ml-9 mt-1">
								上传组织标识，提升品牌形象
							</p>
						</div>

						<FormField
							control={form.control}
							name="logo"
							render={({ field }) => (
								<FormItem>
									<FormControl>
										<ImageUpload
											label="组织 Logo"
											description="建议使用正方形图片，将作为组织的标识在各处展示。可稍后在设置中上传。"
											value={field.value}
											onChange={field.onChange}
											onRemove={() => field.onChange("")}
											aspectRatio="square"
											moderationMode="avatar"
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					</div>

					{/* 社区管理 */}
					<div className="space-y-6">
						<div className="border-b pb-2">
							<h2 className="text-xl font-semibold text-gray-900 flex items-center">
								<div className="w-6 h-6 rounded-full bg-blue-600 text-white text-sm flex items-center justify-center mr-3 font-medium">
									4
								</div>
								社区管理
							</h2>
							<p className="text-sm text-gray-500 ml-9 mt-1">
								设置社区管理相关信息
							</p>
						</div>

						<FormField
							control={form.control}
							name="audienceQrCode"
							render={({ field }) => (
								<FormItem>
									<FormControl>
										<ImageUpload
											label="观众群二维码"
											description="用于新用户加入的微信群二维码或其他公开的联系方式（如微信二维码），将公开展示"
											value={field.value}
											onChange={field.onChange}
											onRemove={() => field.onChange("")}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="membershipRequirements"
							render={({ field }) => (
								<FormItem>
									<FormLabel className="text-sm font-medium text-gray-700">
										加入条件
									</FormLabel>
									<FormControl>
										<Textarea
											{...field}
											placeholder="描述加入组织的条件和要求，例如：技能要求、活跃度要求等..."
											rows={3}
											maxLength={500}
										/>
									</FormControl>
									<FormDescription>
										支持 Markdown 格式，留空表示无特殊要求
										<span className="text-xs text-gray-400 ml-2">
											(
											{
												(membershipRequirements || "")
													.length
											}
											/500)
										</span>
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>
					</div>

					<div className="flex gap-4 pt-6">
						<Button
							type="button"
							variant="outline"
							onClick={() => router.back()}
							className="flex-1"
						>
							取消
						</Button>
						<Button
							type="submit"
							disabled={form.formState.isSubmitting}
							className="flex-1"
						>
							{form.formState.isSubmitting
								? "创建中..."
								: "创建组织"}
						</Button>
					</div>
				</form>
			</Form>
		</div>
	);
}
