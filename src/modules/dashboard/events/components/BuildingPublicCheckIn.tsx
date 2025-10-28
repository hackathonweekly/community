"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import {
	CalendarIcon,
	ExclamationTriangleIcon,
	PencilIcon,
	TrashIcon,
} from "@heroicons/react/24/outline";
import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

const checkInSchema = z.object({
	content: z.string().min(30, "请详细描述项目进度，至少30个字符"),
});

type CheckInFormData = z.infer<typeof checkInSchema>;

interface BuildingRegistration {
	id: string;
	eventId: string;
	projectId: string;
	userId: string;
	plan21Days: string;
	visibilityLevel: "PUBLIC" | "PARTICIPANTS_ONLY";
	checkInCount: number;
	isCompleted: boolean;
	depositPaid: boolean;
	depositAmount: number;
	project: {
		id: string;
		title: string;
		description: string;
		projectTags: string[];
	};
	user: {
		id: string;
		name: string;
		avatar?: string;
	};
}

interface Event {
	id: string;
	title: string;
	startTime: string;
	endTime: string;
	buildingConfig?: {
		duration: number;
		requiredCheckIns: number;
		isPublic: boolean;
		allowAnonymous: boolean;
	};
}

interface CheckInRecord {
	id: string;
	day: number;
	title: string;
	content: string;
	checkedInAt: string;
	likeCount: number;
	commentCount: number;
	userId: string;
	userName: string;
	userAvatar?: string;
}

interface BuildingPublicCheckInProps {
	event: Event;
	registration: BuildingRegistration;
	onSubmit: (data: CheckInFormData) => Promise<void>;
	isLoading?: boolean;
	existingCheckIns?: CheckInRecord[];
}

export function BuildingPublicCheckIn({
	event,
	registration,
	onSubmit,
	isLoading = false,
	existingCheckIns = [],
}: BuildingPublicCheckInProps) {
	const [shareText, setShareText] = useState("");
	const [isEditing, setIsEditing] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);
	const [editingCheckInId, setEditingCheckInId] = useState<string | null>(
		null,
	);
	const [userCheckIns, setUserCheckIns] = useState<CheckInRecord[]>([]);
	const [showShareContent, setShowShareContent] = useState(false);
	const toastsT = useTranslations(
		"dashboard.events.buildingPublicCheckIn.toasts",
	);

	// 计算当前是第几天
	const startDate = new Date(event.startTime);
	const today = new Date();
	const daysDiff = Math.floor(
		(today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
	);
	const currentDay = Math.max(1, daysDiff + 1);

	// 检查是否已经打卡 (保留用于历史记录，但不阻止新打卡)
	const todayCheckIn = existingCheckIns.find(
		(checkIn) => checkIn.day === currentDay,
	);
	const hasCheckedToday = !!todayCheckIn;

	// 获取用户的所有打卡记录
	useEffect(() => {
		fetchUserCheckIns();
	}, [event.id]);

	const fetchUserCheckIns = async () => {
		try {
			const response = await fetch(
				`/api/events/${event.id}/building-public/my-check-ins`,
			);
			if (response.ok) {
				const data = await response.json();
				setUserCheckIns(data.data || []);
			}
		} catch (error) {
			console.error("Error fetching user check-ins:", error);
		}
	};

	// 获取正在编辑的打卡内容
	const editingCheckIn = editingCheckInId
		? userCheckIns.find((c) => c.id === editingCheckInId)
		: todayCheckIn;

	const form = useForm<CheckInFormData>({
		resolver: zodResolver(checkInSchema),
		defaultValues: {
			content: editingCheckIn?.content || "",
		},
	});

	// 生成分享文本
	const generateShareText = (content: string) => {
		const today = new Date();
		const dateStr = today.toLocaleDateString("zh-CN", {
			month: "long",
			day: "numeric",
		});

		return `#打卡# 【${registration.user?.name || "匿名用户"}】【${dateStr}】
📍 项目：${registration.project.title}
💭 项目进展：${content}
🔗 项目链接：${typeof window !== "undefined" ? window.location.origin : ""}/events/${event.id}?user=${registration.userId}`;
	};

	const handleContentChange = (value: string) => {
		form.setValue("content", value);
		if (value.trim()) {
			setShareText(generateShareText(value));
		} else {
			setShareText("");
			setShowShareContent(false);
		}
	};

	const handleFormSubmit = async (data: CheckInFormData) => {
		// Transform form data to match server expectations
		const checkInData = {
			title: editingCheckIn
				? editingCheckIn.title
				: `第${currentDay}天打卡`, // 保持原标题或自动生成
			content: data.content,
			nextPlan: undefined,
			imageUrls: [], // Empty array as default
			demoUrl: undefined,
			isPublic: registration.visibilityLevel === "PUBLIC",
		};

		if (editingCheckInId) {
			// 编辑现有打卡
			await updateCheckIn(editingCheckInId, checkInData);
		} else {
			// 创建新打卡
			await onSubmit(checkInData);
			// 刷新用户打卡列表
			await fetchUserCheckIns();
			// 重置表单
			form.reset({ content: "" });
			setShareText("");
			setShowShareContent(true);
		}
	};

	const updateCheckIn = async (checkInId: string, data: any) => {
		try {
			const response = await fetch(
				`/api/building-public/check-ins/${checkInId}`,
				{
					method: "PUT",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify(data),
				},
			);

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.error || toastsT("updateFailed"));
			}

			toast.success(toastsT("updateSuccess"));
			setIsEditing(false);
			setEditingCheckInId(null);
			form.reset({ content: "" });
			// 刷新用户打卡列表
			await fetchUserCheckIns();
		} catch (error) {
			console.error("Error updating check-in:", error);
			toast.error(
				error instanceof Error
					? error.message
					: toastsT("updateFailed"),
			);
		}
	};

	const startEditingCheckIn = (checkInId: string) => {
		const checkIn = userCheckIns.find((c) => c.id === checkInId);
		if (checkIn) {
			setEditingCheckInId(checkInId);
			setIsEditing(true);
			form.reset({ content: checkIn.content });
			setShareText(generateShareText(checkIn.content));
		}
	};

	const cancelEditing = () => {
		setIsEditing(false);
		setEditingCheckInId(null);
		form.reset({ content: "" });
		setShareText("");
	};

	const deleteCheckIn = async (checkInId?: string) => {
		const targetCheckInId = checkInId || todayCheckIn?.id;
		if (!targetCheckInId) {
			return;
		}

		setIsDeleting(true);
		try {
			const response = await fetch(
				`/api/building-public/check-ins/${targetCheckInId}`,
				{
					method: "DELETE",
				},
			);

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.error || toastsT("deleteFailed"));
			}

			toast.success(toastsT("deleteSuccess"));
			// 刷新用户打卡列表
			await fetchUserCheckIns();
			// 如果删除的是正在编辑的打卡，重置编辑状态
			if (checkInId === editingCheckInId) {
				cancelEditing();
			}
		} catch (error) {
			console.error("Error deleting check-in:", error);
			toast.error(
				error instanceof Error
					? error.message
					: toastsT("deleteFailed"),
			);
		} finally {
			setIsDeleting(false);
		}
	};

	const copyShareText = () => {
		if (shareText) {
			navigator.clipboard.writeText(shareText);
			toast.success(toastsT("shareCopied"));
		}
	};

	// 检查打卡时间是否有效
	const isWithinEventPeriod =
		today >= startDate && today <= new Date(event.endTime);

	if (!isWithinEventPeriod) {
		return (
			<div className="space-y-6">
				<Card>
					<CardContent className="text-center py-12">
						<ExclamationTriangleIcon className="w-12 h-12 mx-auto text-amber-500 mb-4" />
						<h3 className="text-lg font-medium mb-2">无法打卡</h3>
						<p className="text-muted-foreground">
							{today < startDate
								? "活动尚未开始，请在活动开始后打卡"
								: "活动已结束，无法继续打卡"}
						</p>
					</CardContent>
				</Card>

				{/* 历史打卡记录 - 简化结构 */}
				{userCheckIns.length > 0 && (
					<div className="bg-white border rounded-lg p-4 md:p-6">
						<div className="mb-4">
							<h3 className="text-lg md:text-xl font-semibold mb-1">
								我的打卡历史
							</h3>
							<p className="text-sm text-muted-foreground">
								查看和编辑您的所有打卡记录
							</p>
						</div>
						<div className="space-y-3 md:space-y-4">
							{userCheckIns.map((checkIn) => (
								<div
									key={checkIn.id}
									className="border rounded-lg p-3"
								>
									<div className="flex items-center justify-between mb-2">
										<div className="flex items-center gap-2">
											<span className="font-medium">
												第 {checkIn.day} 天
											</span>
											<span className="text-xs md:text-sm text-muted-foreground">
												{new Date(
													checkIn.checkedInAt,
												).toLocaleDateString("zh-CN")}
											</span>
										</div>
										<div className="flex gap-2">
											<Button
												variant="outline"
												size="sm"
												onClick={() =>
													startEditingCheckIn(
														checkIn.id,
													)
												}
											>
												<PencilIcon className="w-4 h-4 mr-1" />
												编辑
											</Button>
											<Button
												variant="outline"
												size="sm"
												onClick={() =>
													deleteCheckIn(checkIn.id)
												}
												disabled={isDeleting}
												className="text-red-600 hover:text-red-700"
											>
												<TrashIcon className="w-4 h-4 mr-1" />
												删除
											</Button>
										</div>
									</div>
									<p className="text-sm text-gray-600 whitespace-pre-line">
										{checkIn.content}
									</p>
								</div>
							))}
						</div>
					</div>
				)}
			</div>
		);
	}

	return (
		<div className="space-y-3 sm:space-y-4 md:space-y-6">
			{/* 打卡进度 - 移动端优化 */}
			<Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
				<CardContent className="pt-4 sm:pt-6">
					<div className="flex items-center justify-between mb-3 md:mb-4">
						<div>
							<h3 className="font-medium text-sm sm:text-base">
								打卡进度
							</h3>
							<p className="text-xs sm:text-sm text-muted-foreground">
								第 {currentDay} 天 /{" "}
								{event.buildingConfig?.duration || 21} 天
							</p>
						</div>
						<div className="text-right">
							<div className="text-xl sm:text-2xl font-bold text-purple-600">
								{registration.checkInCount}
							</div>
							<div className="text-xs sm:text-sm text-muted-foreground">
								/ {event.buildingConfig?.requiredCheckIns || 7}{" "}
								次
							</div>
						</div>
					</div>
					<div className="w-full bg-gray-200 rounded-full h-2.5 sm:h-3">
						<div
							className="bg-purple-600 h-2.5 sm:h-3 rounded-full transition-all"
							style={{
								width: `${Math.min(
									(registration.checkInCount /
										(event.buildingConfig
											?.requiredCheckIns || 7)) *
										100,
									100,
								)}%`,
							}}
						/>
					</div>
				</CardContent>
			</Card>

			{/* 打卡表单 - 移动端优化布局 */}
			<div className="bg-white border rounded-lg p-3 sm:p-4 md:p-6">
				<div className="mb-3 sm:mb-4">
					<h3 className="text-base sm:text-lg md:text-xl font-semibold flex items-center gap-2 mb-1">
						<CalendarIcon className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
						{isEditing
							? `编辑第 ${currentDay} 天打卡`
							: `第 ${currentDay} 天打卡`}
					</h3>
					<p className="text-xs sm:text-sm text-muted-foreground">
						{isEditing
							? "修改您的项目进展和未来计划"
							: "分享您今天的项目进展和未来计划"}
					</p>
				</div>
				<Form {...form}>
					<form
						onSubmit={form.handleSubmit(handleFormSubmit)}
						className="space-y-3 sm:space-y-4 md:space-y-6"
					>
						<FormField
							control={form.control}
							name="content"
							render={({ field }) => (
								<FormItem>
									<FormLabel className="text-sm sm:text-base">
										项目进展与未来计划
									</FormLabel>
									<FormControl>
										<Textarea
											placeholder="请详细描述您的项目进展和未来计划...&#10;&#10;例如：&#10;✅ 今日完成：完成了用户登录模块的开发&#10;🚀 明日计划：开始开发用户个人中心页面&#10;💡 遇到的问题：在处理JWT token时遇到了一些跨域问题&#10;🎯 下一步目标：完成整个用户系统模块"
											className="min-h-[100px] sm:min-h-[120px] md:min-h-[150px] text-sm sm:text-base resize-none"
											{...field}
											onChange={(e) => {
												field.onChange(e);
												handleContentChange(
													e.target.value,
												);
											}}
										/>
									</FormControl>
									<FormDescription className="text-xs sm:text-sm">
										详细描述您的进展，至少30个字符。这将帮助获得社区的支持和反馈
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>

						{/* 分享内容 - 移动端优化显示 */}
						{showShareContent && shareText && (
							<div className="bg-gray-50 border rounded-lg p-3 sm:p-4">
								<div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-2">
									<span className="text-sm font-medium">
										分享内容
									</span>
									<Button
										type="button"
										variant="outline"
										size="sm"
										onClick={copyShareText}
										className="text-xs sm:text-sm w-full sm:w-auto"
									>
										📋 复制分享内容
									</Button>
								</div>
								<div className="bg-white border rounded p-2 sm:p-3 text-xs sm:text-sm whitespace-pre-line max-h-32 overflow-y-auto">
									{shareText}
								</div>
							</div>
						)}

						<div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 md:gap-4 pt-2">
							{isEditing && (
								<Button
									type="button"
									variant="outline"
									onClick={cancelEditing}
									className="text-sm sm:text-base order-2 sm:order-1"
								>
									取消
								</Button>
							)}
							<Button
								type="submit"
								disabled={
									isLoading || !form.watch("content")?.trim()
								}
								size="lg"
								className="w-full sm:w-auto text-sm sm:text-base order-1 sm:order-2"
							>
								{isLoading
									? "提交中..."
									: isEditing
										? "更新打卡"
										: "完成打卡"}
							</Button>
						</div>
					</form>
				</Form>
			</div>

			{/* 历史打卡记录 - 移动端优化布局 */}
			{userCheckIns.length > 0 && (
				<div className="bg-white border rounded-lg p-3 sm:p-4 md:p-6">
					<div className="mb-3 sm:mb-4">
						<h3 className="text-base sm:text-lg md:text-xl font-semibold mb-1">
							我的打卡历史
						</h3>
						<p className="text-xs sm:text-sm text-muted-foreground">
							查看和编辑您的所有打卡记录
						</p>
					</div>
					<div className="space-y-3 sm:space-y-4">
						{userCheckIns
							.sort((a, b) => b.day - a.day)
							.map((checkIn) => (
								<div
									key={checkIn.id}
									className="border rounded-lg p-3 sm:p-4 bg-gray-50/50"
								>
									{/* 移动端优化：标题和操作按钮布局 */}
									<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 mb-3">
										<div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
											<span className="font-medium text-base sm:text-lg">
												第 {checkIn.day} 天
											</span>
											<div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
												<span>
													{new Date(
														checkIn.checkedInAt,
													).toLocaleDateString(
														"zh-CN",
														{
															year: "numeric",
															month: "long",
															day: "numeric",
														},
													)}
												</span>
												<span className="hidden sm:inline">
													•
												</span>
												<span>
													{new Date(
														checkIn.checkedInAt,
													).toLocaleTimeString(
														"zh-CN",
														{
															hour: "2-digit",
															minute: "2-digit",
														},
													)}
												</span>
											</div>
										</div>
										<div className="flex gap-2">
											<Button
												variant="outline"
												size="sm"
												onClick={() =>
													startEditingCheckIn(
														checkIn.id,
													)
												}
												disabled={isEditing}
												className="flex-1 sm:flex-none"
											>
												<PencilIcon className="w-4 h-4 mr-1" />
												编辑
											</Button>
											<Button
												variant="outline"
												size="sm"
												onClick={() =>
													deleteCheckIn(checkIn.id)
												}
												disabled={isDeleting}
												className="text-red-600 hover:text-red-700 flex-1 sm:flex-none"
											>
												<TrashIcon className="w-4 h-4 mr-1" />
												{isDeleting
													? "删除中..."
													: "删除"}
											</Button>
										</div>
									</div>
									<div className="bg-white border rounded-lg p-3 sm:p-4">
										<p className="text-sm sm:text-base text-gray-700 whitespace-pre-line leading-relaxed">
											{checkIn.content}
										</p>
									</div>
									<div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
										<span className="flex items-center gap-1">
											👍 {checkIn.likeCount || 0}
										</span>
										<span className="flex items-center gap-1">
											💬 {checkIn.commentCount || 0}
										</span>
									</div>
								</div>
							))}
					</div>
				</div>
			)}
		</div>
	);
}
