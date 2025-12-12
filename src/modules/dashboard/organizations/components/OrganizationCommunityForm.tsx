"use client";
import { TAG_PRESETS } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { useActiveOrganization } from "@dashboard/organizations/hooks/use-active-organization";
import { organizationListQueryKey } from "@dashboard/organizations/lib/api";
import { SettingsItem } from "@dashboard/shared/components/SettingsItem";
import { useRouter } from "@/hooks/router";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ImageUpload } from "@/components/ui/image-upload";
import { ContactInfoEditor } from "./ContactInfoEditor";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { useState, useEffect } from "react";

const formSchema = z.object({
	summary: z.string().optional(),
	description: z.string().optional(),
	location: z.string().optional(),
	tags: z.array(z.string()),
	audienceQrCode: z.string().optional(),
	memberQrCode: z.string().optional(),
	contactInfo: z.string().optional(),
});

type FormSchema = z.infer<typeof formSchema>;

export function OrganizationCommunityForm() {
	const t = useTranslations();
	const router = useRouter();
	const queryClient = useQueryClient();
	const { activeOrganization } = useActiveOrganization();
	const [newTag, setNewTag] = useState("");
	const [organizationData, setOrganizationData] = useState<any>(null);
	const [dataLoading, setDataLoading] = useState(true);

	const form = useForm<FormSchema>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			summary: "",
			description: "",
			location: "",
			tags: [],
			audienceQrCode: "",
			memberQrCode: "",
			contactInfo: "",
		},
	});

	const selectedTags = form.watch("tags");

	// 获取完整的组织数据
	useEffect(() => {
		if (activeOrganization?.id) {
			fetchOrganizationData(activeOrganization.id);
		}
	}, [activeOrganization?.id]);

	const fetchOrganizationData = async (organizationId: string) => {
		try {
			setDataLoading(true);
			const response = await fetch(
				`/api/organizations/${organizationId}`,
			);
			if (response.ok) {
				const data = await response.json();
				setOrganizationData(data);

				// 更新表单数据
				form.reset({
					summary: data.summary ?? "",
					description: data.description ?? "",
					location: data.location ?? "",
					tags: data.tags ?? [],
					audienceQrCode: data.audienceQrCode ?? "",
					memberQrCode: data.memberQrCode ?? "",
					contactInfo: data.contactInfo ?? "",
				});
			}
		} catch (error) {
			console.error("Failed to fetch organization data:", error);
		} finally {
			setDataLoading(false);
		}
	};

	const addTag = (tag: string) => {
		if (tag && !selectedTags.includes(tag)) {
			form.setValue("tags", [...selectedTags, tag]);
		}
	};

	const removeTag = (tagToRemove: string) => {
		const newTags = selectedTags.filter((tag) => tag !== tagToRemove);
		form.setValue("tags", newTags, { shouldDirty: true });
	};

	const addCustomTag = () => {
		if (newTag.trim() && !selectedTags.includes(newTag.trim())) {
			addTag(newTag.trim());
			setNewTag("");
		}
	};

	const onSubmit = form.handleSubmit(async (data) => {
		if (!activeOrganization) {
			return;
		}

		try {
			const response = await fetch(
				`/api/organizations/${activeOrganization.id}`,
				{
					method: "PUT",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify(data),
				},
			);

			if (!response.ok) {
				throw new Error("Failed to update organization");
			}

			toast.success("组织信息更新成功");

			queryClient.invalidateQueries({
				queryKey: organizationListQueryKey,
			});
			router.refresh();
		} catch {
			toast.error("组织信息更新失败");
		}
	});

	return (
		<SettingsItem title="社区信息设置">
			{dataLoading ? (
				<div className="flex items-center justify-center p-8">
					<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
					<span className="ml-2">加载中...</span>
				</div>
			) : (
				<form onSubmit={onSubmit} className="space-y-6 w-full">
					{/* Summary */}
					<div>
						<Label htmlFor="summary">组织一句话介绍</Label>
						<Input
							id="summary"
							{...form.register("summary")}
							placeholder="用一句话简洁地介绍你的组织..."
							className="mt-1 w-full"
						/>
						<p className="text-sm text-muted-foreground mt-1">
							这将在组织列表和首页标题下显示
						</p>
					</div>

					{/* Description */}
					<div>
						<Label htmlFor="description">
							组织介绍 (支持 Markdown)
						</Label>
						<Textarea
							id="description"
							{...form.register("description")}
							placeholder="描述您的组织，使用 Markdown 格式..."
							rows={6}
							className="mt-1 w-full"
						/>
					</div>

					{/* Location */}
					<div>
						<Label htmlFor="location">组织地址</Label>
						<Input
							id="location"
							{...form.register("location")}
							placeholder="例如：北京市海淀区中关村 或 线上社区"
							className="mt-1 w-full"
						/>
						<p className="text-sm text-muted-foreground mt-1">
							填写组织的主要活动地点或地区
						</p>
					</div>

					{/* Tags */}
					<div>
						<Label>组织标签</Label>
						<div className="mt-2 space-y-4">
							{/* Selected tags */}
							{selectedTags.length > 0 && (
								<div className="flex flex-wrap gap-2">
									{selectedTags.map((tag) => (
										<Badge
											key={tag}
											variant="secondary"
											className="flex items-center gap-1 text-xs"
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

							{/* Preset tags */}
							{Object.entries(TAG_PRESETS).map(
								([category, tags]) => (
									<div key={category}>
										<h4 className="text-sm font-medium mb-2">
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
													className="cursor-pointer text-xs"
													onClick={() =>
														selectedTags.includes(
															tag,
														)
															? removeTag(tag)
															: addTag(tag)
													}
												>
													{tag}
												</Badge>
											))}
										</div>
									</div>
								),
							)}

							{/* Custom tag input */}
							<div className="flex flex-col sm:flex-row gap-2">
								<Input
									placeholder="添加自定义标签..."
									value={newTag}
									onChange={(e) => setNewTag(e.target.value)}
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
									size="sm"
									className="w-full sm:w-auto"
								>
									添加
								</Button>
							</div>
						</div>
					</div>

					{/* QR Codes */}
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
						<div>
							<ImageUpload
								label="观众群二维码"
								value={form.watch("audienceQrCode")}
								onChange={(url) =>
									form.setValue("audienceQrCode", url, {
										shouldDirty: true,
									})
								}
								onRemove={() =>
									form.setValue("audienceQrCode", "", {
										shouldDirty: true,
									})
								}
								description="公开展示的微信群二维码，建议尺寸 400x400 像素"
								acceptedFileTypes={[
									"image/jpeg",
									"image/jpg",
									"image/png",
									"image/webp",
								]}
								maxSizeInMB={2}
								bucketType="public"
							/>
						</div>

						<div>
							<ImageUpload
								label="成员群二维码"
								value={form.watch("memberQrCode")}
								onChange={(url) =>
									form.setValue("memberQrCode", url, {
										shouldDirty: true,
									})
								}
								onRemove={() =>
									form.setValue("memberQrCode", "", {
										shouldDirty: true,
									})
								}
								description="仅社区成员可见的微信群二维码，建议尺寸 400x400 像素"
								acceptedFileTypes={[
									"image/jpeg",
									"image/jpg",
									"image/png",
									"image/webp",
								]}
								maxSizeInMB={2}
								bucketType="public"
							/>
						</div>
					</div>

					{/* Contact Info */}
					<ContactInfoEditor
						value={form.watch("contactInfo")}
						onChange={(contactInfo) =>
							form.setValue("contactInfo", contactInfo, {
								shouldDirty: true,
							})
						}
					/>

					<div className="flex justify-end">
						<Button
							type="submit"
							size="sm"
							className="w-full sm:w-auto"
							disabled={
								form.formState.isSubmitting ||
								!form.formState.isDirty
							}
						>
							{form.formState.isSubmitting
								? "保存中..."
								: "保存设置"}
						</Button>
					</div>
				</form>
			)}
		</SettingsItem>
	);
}
