"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
	EventCreateForm,
	type EventCopySource,
} from "@/modules/dashboard/events/components/EventCreateForm";
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
	DocumentDuplicateIcon,
	PlusIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface VolunteerRole {
	id: string;
	name: string;
	description: string;
	detailDescription?: string;
	iconUrl?: string;
	cpPoints: number;
}

interface CopySourceSummary {
	id: string;
	title: string;
	shortDescription?: string | null;
	type: "MEETUP" | "HACKATHON" | "BUILDING_PUBLIC";
	startTime: string;
	endTime: string;
	coverImage?: string | null;
	organizer?: {
		id: string;
		name: string;
		image?: string | null;
		username?: string | null;
	};
	organization?: {
		id: string;
		name: string;
		slug?: string;
		logo?: string | null;
	};
}

const eventTypeLabels: Record<CopySourceSummary["type"], string> = {
	MEETUP: "常规活动",
	HACKATHON: "黑客松",
	BUILDING_PUBLIC: "Building Public",
};

const formatEventDate = (value: string) => {
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return "";
	return date.toLocaleDateString("zh-CN", {
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
	});
};

const getCopySourceHost = (source: CopySourceSummary) =>
	source.organization?.name ?? source.organizer?.name ?? "社区活动";

export default function CreateEventPage() {
	const router = useRouter();
	const { user } = useSession();
	const {
		organizations,
		isLoading: organizationsLoading,
		refetchUserOrganizations,
	} = useUserOrganizations();
	const [selectedSourceEvent, setSelectedSourceEvent] =
		useState<EventCopySource | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [volunteerRoles, setVolunteerRoles] = useState<VolunteerRole[]>([]);
	const [volunteerRolesLoading, setVolunteerRolesLoading] = useState(true);
	const [copySources, setCopySources] = useState<CopySourceSummary[]>([]);
	const [copySourcesLoading, setCopySourcesLoading] = useState(true);
	const [copySourceLoadingId, setCopySourceLoadingId] = useState<
		string | null
	>(null);
	const [showSourcePicker, setShowSourcePicker] = useState(true);

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

	const fetchCopySources = async () => {
		try {
			const response = await fetch("/api/events/copy-sources?limit=12");
			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.error || "获取历史活动失败");
			}
			const data = await response.json();
			setCopySources(data.data || []);
		} catch (error) {
			console.error("Error fetching copy sources:", error);
			toast.error(
				error instanceof Error ? error.message : "获取历史活动失败",
			);
		} finally {
			setCopySourcesLoading(false);
		}
	};

	useEffect(() => {
		// fetchUserOrganizations(); // 不再需要，TanStack Query 自动处理
		fetchVolunteerRoles();
		fetchCopySources();
	}, []);

	const handleCopySourceSelect = async (source: CopySourceSummary) => {
		setCopySourceLoadingId(source.id);
		try {
			const response = await fetch(
				`/api/events/copy-sources/${source.id}`,
			);
			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.error || "获取历史活动失败");
			}
			const data = await response.json();
			if (!data.data) {
				throw new Error("未能获取活动数据");
			}
			setSelectedSourceEvent(data.data);
			setShowSourcePicker(false);
		} catch (error) {
			console.error("Error fetching copy source:", error);
			toast.error(
				error instanceof Error ? error.message : "获取历史活动失败",
			);
		} finally {
			setCopySourceLoadingId(null);
		}
	};

	const handleSubmit = async (
		data: any,
		status: "DRAFT" | "PUBLISHED" = "PUBLISHED",
	) => {
		setIsLoading(true);
		try {
			const submitData = { ...data, status };

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
		} catch (error) {
			console.error("Error saving template:", error);
			toast.error(
				error instanceof Error ? error.message : "保存模板失败",
			);
		}
	};

	if (organizationsLoading || volunteerRolesLoading || copySourcesLoading) {
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
						从历史活动快速复刻或从空白开始
					</p>
				</div>

				{/* 活动来源选择区域 */}
				{showSourcePicker && (
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
										onClick={() => {
											setSelectedSourceEvent(null);
											setShowSourcePicker(false);
										}}
										onKeyDown={(event) => {
											if (
												event.key === "Enter" ||
												event.key === " "
											) {
												event.preventDefault();
												setSelectedSourceEvent(null);
												setShowSourcePicker(false);
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

						{/* 2. 历史活动 */}
						<div>
							<h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
								<DocumentDuplicateIcon className="w-5 h-5 text-muted-foreground" />
								历史活动
							</h2>
							<p className="text-sm text-muted-foreground mb-4">
								选择一个历史活动快速复刻，公开信息会自动带入（主办方联系方式不会复制）。
							</p>
							{copySources.length > 0 ? (
								<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
									{copySources.map((source) => {
										const isCopying =
											copySourceLoadingId === source.id;
										return (
											<Card
												key={source.id}
												className={`cursor-pointer hover:shadow-md transition-shadow ${isCopying ? "opacity-60 pointer-events-none" : ""}`}
												onClick={() =>
													handleCopySourceSelect(
														source,
													)
												}
											>
												<CardContent className="p-4">
													<div className="flex items-start gap-3">
														{source.coverImage ? (
															<div className="w-14 h-14 rounded-md overflow-hidden bg-muted flex-shrink-0">
																<img
																	src={
																		source.coverImage
																	}
																	alt={
																		source.title
																	}
																	className="w-full h-full object-cover"
																	loading="lazy"
																/>
															</div>
														) : (
															<div className="w-14 h-14 rounded-md bg-muted flex items-center justify-center text-xs text-muted-foreground flex-shrink-0">
																无封面
															</div>
														)}
														<div className="flex-1 min-w-0">
															<div className="flex items-start justify-between gap-2">
																<h3 className="font-semibold line-clamp-1">
																	{
																		source.title
																	}
																</h3>
																<Badge
																	variant="outline"
																	className="text-xs"
																>
																	{
																		eventTypeLabels[
																			source
																				.type
																		]
																	}
																</Badge>
															</div>
															<p className="text-sm text-muted-foreground line-clamp-2 mt-1">
																{source.shortDescription ||
																	"暂无简介"}
															</p>
															<div className="flex items-center justify-between text-xs text-muted-foreground mt-2">
																<span>
																	结束于{" "}
																	{formatEventDate(
																		source.endTime,
																	)}
																</span>
																<span>
																	{getCopySourceHost(
																		source,
																	)}
																</span>
															</div>
															{isCopying && (
																<div className="text-xs text-muted-foreground mt-2">
																	正在加载活动信息...
																</div>
															)}
														</div>
													</div>
												</CardContent>
											</Card>
										);
									})}
								</div>
							) : (
								<Card>
									<CardContent className="p-6 text-center text-sm text-muted-foreground">
										暂无可复制的历史活动
									</CardContent>
								</Card>
							)}
						</div>
					</div>
				)}

				{/* 活动创建表单 */}
				{!showSourcePicker && (
					<div>
						{selectedSourceEvent && (
							<div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
								<div className="flex items-center justify-between">
									<div>
										<h3 className="font-medium text-blue-900">
											基于历史活动复刻：
											{selectedSourceEvent.title}
										</h3>
										<p className="text-sm text-blue-600 mt-1">
											已自动带入公开信息，主办方联系方式需重新填写
										</p>
									</div>
									<Button
										variant="ghost"
										size="sm"
										onClick={() => {
											setSelectedSourceEvent(null);
											setShowSourcePicker(true);
										}}
									>
										重新选择历史活动
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
							sourceEvent={selectedSourceEvent}
							user={user ? { email: user.email } : undefined}
							onRefreshOrganizations={refetchUserOrganizations}
						/>
					</div>
				)}
			</div>
		</div>
	);
}
