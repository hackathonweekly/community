"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { EventCreateForm } from "@/modules/dashboard/events/components/EventCreateForm";
import type { EventTemplate } from "@/modules/dashboard/events/components/EventTemplateSelector";
import type { EventFormData } from "@/modules/dashboard/events/components/types";
import {
	buildTemplatePayload,
	extractErrorMessage as extractTemplateErrorMessage,
} from "@/modules/dashboard/events/utils/template-helpers";
import { useSession } from "@dashboard/auth/hooks/use-session";
import { useUserOrganizations } from "@/modules/dashboard/organizations/hooks/use-user-organizations";
import {
	canUserDoAction,
	RestrictedAction,
	getMembershipLevelName,
} from "@/features/permissions";
import type { MembershipLevel } from "@prisma/client";
import {
	ArrowLeftIcon,
	PlusIcon,
	StarIcon,
	TrashIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface Organization {
	id: string;
	name: string;
	slug: string;
	logo?: string;
}

interface VolunteerRole {
	id: string;
	name: string;
	description: string;
	detailDescription?: string;
	iconUrl?: string;
	cpPoints: number;
}

export default function CreateEventPage() {
	const router = useRouter();
	const { user } = useSession();
	const {
		organizations,
		isLoading: organizationsLoading,
		refetchUserOrganizations,
	} = useUserOrganizations();
	const [selectedTemplate, setSelectedTemplate] =
		useState<EventTemplate | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [volunteerRoles, setVolunteerRoles] = useState<VolunteerRole[]>([]);
	const [volunteerRolesLoading, setVolunteerRolesLoading] = useState(true);
	const [templates, setTemplates] = useState<EventTemplate[]>([]);
	const [templatesLoading, setTemplatesLoading] = useState(true);
	const [showTemplates, setShowTemplates] = useState(true);

	// 检查用户是否有创建活动的权限
	const permissionCheck = canUserDoAction(
		{ membershipLevel: user?.membershipLevel as MembershipLevel },
		RestrictedAction.CREATE_EVENT,
	);

	// 如果没有权限，显示提示信息
	if (!permissionCheck.allowed) {
		return (
			<div className="container mx-auto px-2 md:px-4 py-4 md:py-8">
				<div className="max-w-md mx-auto">
					<div className="mb-6">
						<Button variant="ghost" size="sm" asChild>
							<Link href="/app/events">
								<ArrowLeftIcon className="w-4 h-4 mr-1" />
								返回活动列表
							</Link>
						</Button>
					</div>
					<Alert className="mb-6">
						<AlertDescription className="space-y-4">
							<p className="font-medium">无法创建活动</p>
							<p>{permissionCheck.reason}</p>
							<p className="text-sm text-muted-foreground">
								当前用户等级：
								{getMembershipLevelName(
									(user?.membershipLevel as MembershipLevel) ||
										null,
								)}
							</p>
						</AlertDescription>
					</Alert>
					<div className="flex gap-2">
						<Button asChild variant="outline">
							<Link href="/app/events">返回活动列表</Link>
						</Button>
					</div>
				</div>
			</div>
		);
	}

	const fetchUserOrganizations = async () => {
		// 使用 TanStack Query hook，不再需要手动 fetch
		refetchUserOrganizations();
	};

	const fetchVolunteerRoles = async () => {
		try {
			const response = await fetch("/api/volunteer-roles");
			if (response.ok) {
				const data = await response.json();
				setVolunteerRoles(data.data || []);
			}
		} catch (error) {
			console.error("Error fetching volunteer roles:", error);
		} finally {
			setVolunteerRolesLoading(false);
		}
	};

	const fetchTemplates = async () => {
		try {
			const response = await fetch("/api/event-templates");
			if (response.ok) {
				const data = await response.json();
				setTemplates(data.data || []);
			}
		} catch (error) {
			console.error("Error fetching templates:", error);
		} finally {
			setTemplatesLoading(false);
		}
	};

	useEffect(() => {
		// fetchUserOrganizations(); // 不再需要，TanStack Query 自动处理
		fetchVolunteerRoles();
		fetchTemplates();
	}, []);

	const handleTemplateSelect = (template: EventTemplate | null) => {
		setSelectedTemplate(template);
		setShowTemplates(false); // 选择模板后隐藏模板列表
	};

	const handleSubmit = async (
		data: any,
		status: "DRAFT" | "PUBLISHED" = "PUBLISHED",
	) => {
		setIsLoading(true);
		try {
			const submitData = selectedTemplate
				? { ...data, templateId: selectedTemplate.id, status }
				: { ...data, status };

			const response = await fetch("/api/events", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(submitData),
			});

			if (!response.ok) {
				const error = await response.json();
				console.error("Server error response:", error);

				// Handle content moderation errors with field-specific messaging
				if (
					error.details &&
					typeof error.details === "object" &&
					!Array.isArray(error.details)
				) {
					const fieldErrors = Object.entries(error.details)
						.map(([field, message]) => {
							const fieldName =
								field === "richContent"
									? "活动详情"
									: field === "title"
										? "活动标题"
										: field === "shortDescription"
											? "简短描述"
											: field;
							return `${fieldName}: ${message}`;
						})
						.join("\n");
					throw new Error(`${error.error}\n${fieldErrors}`);
				}

				// Show detailed validation errors if available
				if (error.details && Array.isArray(error.details)) {
					const validationErrors = error.details
						.map(
							(detail: any) =>
								`${detail.path?.join(".") || "字段"}: ${detail.message}`,
						)
						.join("\n");
					throw new Error(`验证失败:\n${validationErrors}`);
				}

				throw new Error(
					error.error || `Server returned ${response.status}`,
				);
			}

			const result = await response.json();
			const actionText = status === "DRAFT" ? "保存为草稿" : "发布";
			toast.success(`活动${actionText}成功！`);
			// 统一跳转到活动管理页面
			router.push(`/app/events/${result.data.id}/manage`);
		} catch (error) {
			console.error("Error creating event:", error);
			console.error("Error details:", JSON.stringify(error, null, 2));

			let errorMessage = "创建活动失败";

			if (error instanceof Error) {
				errorMessage = error.message;
			} else if (typeof error === "object" && error !== null) {
				errorMessage = JSON.stringify(error);
			}

			toast.error(errorMessage);
		} finally {
			setIsLoading(false);
		}
	};

	const handleSaveAsTemplate = async (rawData: EventFormData) => {
		const templateName = `${rawData.title} - 模板`;
		const templateDescription = `基于活动"${rawData.title}"创建的模板`;
		const templateType =
			rawData.type === "HACKATHON"
				? "HACKATHON_LEARNING"
				: rawData.type === "MEETUP"
					? "MEETUP"
					: rawData.type === "BUILDING_PUBLIC"
						? "BUILDING_PUBLIC"
						: "CUSTOM";

		const payload = buildTemplatePayload(rawData, {
			name: templateName,
			description: templateDescription,
			type: templateType,
			isPublic: false,
		});

		try {
			const response = await fetch("/api/event-templates", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(payload),
			});

			if (!response.ok) {
				const message = await extractTemplateErrorMessage(
					response,
					"保存模板失败",
				);
				throw new Error(message);
			}

			toast.success("模板保存成功！");
			await fetchTemplates();
		} catch (error) {
			console.error("Error saving template:", error);
			toast.error(
				error instanceof Error ? error.message : "保存模板失败",
			);
		}
	};

	const handleEditTemplate = async (template: EventTemplate) => {
		// 跳转到模板编辑页面 - 修复路由路径
		router.push(`/app/templates/${template.id}/edit`);
	};

	const handleDeleteTemplate = async (template: EventTemplate) => {
		if (
			!confirm(`确定要删除模板「${template.name}」吗？此操作不可撤销。`)
		) {
			return;
		}

		try {
			const response = await fetch(
				`/api/event-templates/${template.id}`,
				{
					method: "DELETE",
				},
			);

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.message || "删除模板失败");
			}

			toast.success("模板删除成功！");
			// 重新获取模板列表
			fetchTemplates();
		} catch (error) {
			console.error("Error deleting template:", error);
			toast.error(
				error instanceof Error ? error.message : "删除模板失败",
			);
		}
	};

	if (organizationsLoading || volunteerRolesLoading || templatesLoading) {
		return (
			<div className="container mx-auto px-2 md:px-4 py-4 md:py-8">
				<div className="max-w-4xl mx-auto">
					<div className="mb-8">
						<h1 className="text-3xl font-bold tracking-tight">
							创建活动
						</h1>
						<p className="text-muted-foreground mt-2">
							正在加载相关信息...
						</p>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="container mx-auto px-2 md:px-4 py-4 md:py-8">
			<div className="max-w-6xl mx-auto">
				<div className="mb-8">
					<div className="flex items-center gap-2 mb-2">
						<Button variant="ghost" size="sm" asChild>
							<Link href="/app/events">
								<ArrowLeftIcon className="w-4 h-4 mr-1" />
								返回活动列表
							</Link>
						</Button>
					</div>
					<h1 className="text-3xl font-bold tracking-tight">
						创建活动
					</h1>
					<p className="text-muted-foreground mt-2">
						使用模板快速创建或从空白开始
					</p>
				</div>

				{/* 模板选择区域 */}
				{showTemplates && (
					<div className="mb-8 space-y-8">
						{/* 1. 自定义活动创建 */}
						<div>
							<h2 className="text-xl font-semibold mb-4">
								创建自定义活动
							</h2>
							<Card className="cursor-pointer hover:shadow-md transition-shadow border-2 border-dashed border-primary/30 hover:border-primary/50">
								<CardContent className="p-4 md:p-6">
									<div
										className="flex flex-col md:flex-row md:items-center md:justify-between w-full text-left gap-4"
										onClick={() => setShowTemplates(false)}
										onKeyDown={(event) => {
											if (
												event.key === "Enter" ||
												event.key === " "
											) {
												event.preventDefault();
												setShowTemplates(false);
											}
										}}
										tabIndex={0}
										role="button"
									>
										<div className="flex items-center gap-3 md:gap-4">
											<div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
												<PlusIcon className="w-5 h-5 md:w-6 md:h-6 text-primary" />
											</div>
											<div className="flex-1">
												<h3 className="font-semibold text-base md:text-lg">
													从空白开始
												</h3>
												<p className="text-sm md:text-base text-muted-foreground">
													创建全新的自定义活动，完全按照您的需求设计
												</p>
											</div>
										</div>
										<Button
											size="lg"
											className="w-full md:w-auto"
										>
											创建活动
										</Button>
									</div>
								</CardContent>
							</Card>
						</div>

						{/* 2. 个人模板 */}
						{templates.filter((t) => t.createdBy === user?.id)
							.length > 0 && (
							<div>
								<h2 className="text-xl font-semibold mb-4">
									我的模板
								</h2>
								<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
									{templates
										.filter((t) => t.createdBy === user?.id)
										.map((template) => (
											<Card
												key={template.id}
												className="cursor-pointer hover:shadow-md transition-shadow"
												onClick={() =>
													handleTemplateSelect(
														template,
													)
												}
											>
												<CardContent className="p-4">
													<div className="flex items-start justify-between mb-2">
														<h3 className="font-semibold line-clamp-1">
															{template.name}
														</h3>
														<div className="flex gap-1">
															<Button
																variant="ghost"
																size="sm"
																onClick={(
																	e,
																) => {
																	e.stopPropagation();
																	handleEditTemplate(
																		template,
																	);
																}}
															>
																编辑
															</Button>
															<Button
																variant="ghost"
																size="sm"
																className="text-red-600 hover:text-red-700 hover:bg-red-50"
																onClick={(
																	e,
																) => {
																	e.stopPropagation();
																	handleDeleteTemplate(
																		template,
																	);
																}}
															>
																<TrashIcon className="w-4 h-4" />
															</Button>
														</div>
													</div>
													<p className="text-sm text-muted-foreground line-clamp-2 mb-3">
														{template.description}
													</p>
													<div className="flex items-center justify-between text-xs text-muted-foreground">
														<span>
															使用{" "}
															{template.usageCount ||
																0}{" "}
															次
														</span>
														<Badge
															variant="outline"
															className="text-xs"
														>
															个人模板
														</Badge>
													</div>
												</CardContent>
											</Card>
										))}
								</div>
							</div>
						)}

						{/* 3. 社区精选模板 */}
						{templates.filter(
							(t) => t.isFeatured && t.createdBy !== user?.id,
						).length > 0 && (
							<div>
								<h2 className="text-xl font-semibold mb-4">
									社区精选模板
								</h2>
								<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
									{templates
										.filter(
											(t) =>
												t.isFeatured &&
												t.createdBy !== user?.id,
										)
										.map((template) => (
											<Card
												key={template.id}
												className="cursor-pointer hover:shadow-md transition-shadow"
												onClick={() =>
													handleTemplateSelect(
														template,
													)
												}
											>
												<CardContent className="p-4">
													<div className="flex items-start justify-between mb-2">
														<h3 className="font-semibold line-clamp-1">
															{template.name}
														</h3>
														<div className="flex items-center gap-1">
															<StarIcon className="w-4 h-4 text-amber-500 fill-current" />
															<span className="text-xs text-amber-600">
																精选
															</span>
														</div>
													</div>
													<p className="text-sm text-muted-foreground line-clamp-2 mb-3">
														{template.description}
													</p>
													<div className="flex items-center justify-between text-xs text-muted-foreground">
														<span>
															使用{" "}
															{template.usageCount ||
																0}{" "}
															次
														</span>
														{template.createdBy && (
															<span>by User</span>
														)}
													</div>
												</CardContent>
											</Card>
										))}
								</div>
							</div>
						)}
					</div>
				)}

				{/* 活动创建表单 */}
				{!showTemplates && (
					<div>
						{selectedTemplate && (
							<div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
								<div className="flex items-center justify-between">
									<div>
										<h3 className="font-medium text-blue-900">
											使用模板：{selectedTemplate.name}
										</h3>
										<p className="text-sm text-blue-600 mt-1">
											{selectedTemplate.description}
										</p>
									</div>
									<Button
										variant="ghost"
										size="sm"
										onClick={() => {
											setSelectedTemplate(null);
											setShowTemplates(true);
										}}
									>
										重新选择模板
									</Button>
								</div>
							</div>
						)}

						<EventCreateForm
							organizations={organizations}
							volunteerRoles={volunteerRoles}
							onSubmit={handleSubmit}
							onSaveAsTemplate={handleSaveAsTemplate}
							isLoading={isLoading}
							template={selectedTemplate}
							user={user ? { email: user.email } : undefined}
							onRefreshOrganizations={refetchUserOrganizations}
						/>
					</div>
				)}
			</div>
		</div>
	);
}
