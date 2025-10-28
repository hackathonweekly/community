"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import {
	Calendar,
	Clock,
	Coins,
	Star,
	Building,
	CheckCircle,
	XCircle,
	AlertCircle,
	FileText,
	Link as LinkIcon,
	ArrowLeft,
} from "lucide-react";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useSession } from "@/lib/auth/client";
import { UserAvatar } from "@/components/shared/UserAvatar";

// 类型定义
interface Task {
	id: string;
	title: string;
	description: string;
	category: string;
	cpReward: number;
	status: string;
	deadline?: string;
	priority: string;
	featured: boolean;
	tags: string[];
	createdAt: string;
	submittedAt?: string;
	submissionNote?: string;
	evidenceUrls?: string[];
	reviewedAt?: string;
	reviewNote?: string;
	isUserTask: boolean;
	publisher: {
		id: string;
		name: string;
		image?: string;
		username?: string;
		role?: string;
	};
	assignee?: {
		id: string;
		name: string;
		image?: string;
		username?: string;
	};
	organization?: {
		id: string;
		name: string;
		slug: string;
	};
}

const TASK_CATEGORIES = {
	COMMUNITY_SERVICE: { label: "社区服务", color: "bg-blue-500" },
	CONTENT_CREATION: { label: "内容创作", color: "bg-purple-500" },
	PRODUCT_TECH: { label: "产品技术", color: "bg-green-500" },
	OPERATION_PROMOTION: { label: "运营推广", color: "bg-orange-500" },
	OTHER: { label: "其他", color: "bg-gray-500" },
};

const TASK_PRIORITY = {
	LOW: { label: "低", color: "text-gray-500" },
	NORMAL: { label: "普通", color: "text-blue-500" },
	HIGH: { label: "高", color: "text-orange-500" },
	URGENT: { label: "紧急", color: "text-red-500" },
};

const TASK_STATUS = {
	PUBLISHED: { label: "待认领", color: "bg-green-100 text-green-800" },
	CLAIMED: { label: "进行中", color: "bg-blue-100 text-blue-800" },
	SUBMITTED: { label: "待审核", color: "bg-yellow-100 text-yellow-800" },
	COMPLETED: { label: "已完成", color: "bg-green-100 text-green-800" },
	REJECTED: { label: "已拒绝", color: "bg-red-100 text-red-800" },
	CANCELLED: { label: "已取消", color: "bg-gray-100 text-gray-800" },
};

interface TaskDetailProps {
	taskId: string;
}

export function TaskDetail({ taskId }: TaskDetailProps) {
	const { data: session } = useSession();
	const router = useRouter();
	const t = useTranslations();
	const [task, setTask] = useState<Task | null>(null);
	const [loading, setLoading] = useState(true);
	const [actionLoading, setActionLoading] = useState(false);

	// 提交相关状态
	const [showSubmitDialog, setShowSubmitDialog] = useState(false);
	const [submissionNote, setSubmissionNote] = useState("");
	const [evidenceUrls, setEvidenceUrls] = useState<string[]>([""]);

	// 审核相关状态
	const [showReviewDialog, setShowReviewDialog] = useState(false);
	const [reviewAction, setReviewAction] = useState<"approve" | "reject">(
		"approve",
	);
	const [reviewNote, setReviewNote] = useState("");

	// 获取任务详情
	const fetchTask = async () => {
		try {
			setLoading(true);
			const response = await fetch(`/api/tasks/${taskId}`);
			if (response.ok) {
				const data = await response.json();
				setTask(data.task);
			} else if (response.status === 404) {
				toast.error("任务不存在");
				router.push("/tasks");
			}
		} catch (error) {
			console.error("获取任务详情失败:", error);
			toast.error("获取任务详情失败");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		if (taskId) {
			fetchTask();
		}
	}, [taskId]);

	// 认领任务
	const handleClaimTask = async () => {
		if (!session?.user) {
			toast.error("请先登录");
			return;
		}

		try {
			setActionLoading(true);
			const response = await fetch(`/api/tasks/${taskId}/claim`, {
				method: "POST",
			});

			if (response.ok) {
				toast.success("任务认领成功！");
				await fetchTask();
			} else {
				const error = await response.json();
				toast.error(error.error || "认领失败");
			}
		} catch (error) {
			console.error("认领任务失败:", error);
			toast.error("认领任务失败");
		} finally {
			setActionLoading(false);
		}
	};

	// 提交任务
	const handleSubmitTask = async () => {
		if (!submissionNote.trim()) {
			toast.error("请填写提交说明");
			return;
		}

		if (submissionNote.trim().length < 10) {
			toast.error("提交说明至少需要10个字符");
			return;
		}

		try {
			setActionLoading(true);
			const validUrls = evidenceUrls
				.filter((url) => url.trim())
				.filter((url) => {
					try {
						new URL(url);
						return true;
					} catch {
						return false;
					}
				});

			const response = await fetch(`/api/tasks/${taskId}/submit`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					submissionNote: submissionNote.trim(),
					evidenceUrls: validUrls,
				}),
			});

			if (response.ok) {
				toast.success("任务提交成功！");
				setShowSubmitDialog(false);
				setSubmissionNote("");
				setEvidenceUrls([""]);
				await fetchTask();
			} else {
				const error = await response.json();
				toast.error(error.error || "提交失败");
			}
		} catch (error) {
			console.error("提交任务失败:", error);
			toast.error("提交任务失败");
		} finally {
			setActionLoading(false);
		}
	};

	// 审核任务
	const handleReviewTask = async () => {
		try {
			setActionLoading(true);
			const response = await fetch(`/api/tasks/${taskId}/review`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					status:
						reviewAction === "approve" ? "COMPLETED" : "REJECTED",
					reviewNote: reviewNote.trim() || undefined,
				}),
			});

			if (response.ok) {
				toast.success(
					reviewAction === "approve"
						? "任务审核通过！"
						: "任务已拒绝",
				);
				setShowReviewDialog(false);
				setReviewNote("");
				await fetchTask();
			} else {
				const error = await response.json();
				toast.error(error.error || "审核失败");
			}
		} catch (error) {
			console.error("审核任务失败:", error);
			toast.error("审核任务失败");
		} finally {
			setActionLoading(false);
		}
	};

	// 添加证据链接输入框
	const addEvidenceUrl = () => {
		if (evidenceUrls.length < 5) {
			setEvidenceUrls([...evidenceUrls, ""]);
		}
	};

	// 更新证据链接
	const updateEvidenceUrl = (index: number, value: string) => {
		const newUrls = [...evidenceUrls];
		newUrls[index] = value;
		setEvidenceUrls(newUrls);
	};

	// 移除证据链接
	const removeEvidenceUrl = (index: number) => {
		if (evidenceUrls.length > 1) {
			setEvidenceUrls(evidenceUrls.filter((_, i) => i !== index));
		}
	};

	if (loading) {
		return (
			<div className="container mx-auto py-8">
				<div className="animate-pulse">
					<div className="h-8 bg-gray-200 rounded w-3/4 mb-6" />
					<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
						<div className="lg:col-span-2 space-y-6">
							<Card>
								<CardHeader>
									<div className="h-6 bg-gray-200 rounded w-1/2 mb-2" />
									<div className="h-4 bg-gray-200 rounded w-3/4" />
								</CardHeader>
								<CardContent>
									<div className="space-y-3">
										<div className="h-4 bg-gray-200 rounded w-full" />
										<div className="h-4 bg-gray-200 rounded w-2/3" />
									</div>
								</CardContent>
							</Card>
						</div>
						<div className="space-y-6">
							<Card>
								<CardHeader>
									<div className="h-5 bg-gray-200 rounded w-1/2" />
								</CardHeader>
								<CardContent>
									<div className="space-y-3">
										<div className="h-4 bg-gray-200 rounded w-full" />
										<div className="h-4 bg-gray-200 rounded w-3/4" />
									</div>
								</CardContent>
							</Card>
						</div>
					</div>
				</div>
			</div>
		);
	}

	if (!task) {
		return (
			<div className="container mx-auto py-8">
				<div className="text-center">
					<h1 className="text-2xl font-bold text-gray-900 mb-2">
						{t("tasks.detail.taskNotFound")}
					</h1>
					<p className="text-gray-600 mb-4">
						{t("tasks.detail.taskNotFoundDesc")}
					</p>
					<Button asChild>
						<Link href="/tasks">
							{t("tasks.detail.backToTasks")}
						</Link>
					</Button>
				</div>
			</div>
		);
	}

	const categoryInfo =
		TASK_CATEGORIES[task.category as keyof typeof TASK_CATEGORIES];
	const priorityInfo =
		TASK_PRIORITY[task.priority as keyof typeof TASK_PRIORITY];
	const statusInfo = TASK_STATUS[task.status as keyof typeof TASK_STATUS];
	const isExpiringSoon =
		task.deadline &&
		new Date(task.deadline) <
			new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
	const isExpired = task.deadline && new Date(task.deadline) < new Date();

	// 判断用户权限
	const isPublisher = session?.user?.id === task.publisher.id;
	const isAssignee = session?.user?.id === task.assignee?.id;
	const canClaim =
		session?.user && task.status === "PUBLISHED" && !isPublisher;
	const canSubmit = isAssignee && task.status === "CLAIMED";
	const canReview = isPublisher && task.status === "SUBMITTED";

	return (
		<div className="container mx-auto py-8">
			{/* 返回按钮 */}
			<Button variant="ghost" className="mb-6" asChild>
				<Link href="/tasks">
					<ArrowLeft className="w-4 h-4 mr-2" />
					返回任务大厅
				</Link>
			</Button>

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
				{/* 主要内容区域 */}
				<div className="lg:col-span-2 space-y-6">
					{/* 任务基本信息 */}
					<Card>
						<CardHeader>
							<div className="flex items-start justify-between mb-4">
								<div className="flex-1">
									<div className="flex items-center gap-2 mb-3">
										{task.featured && (
											<Badge
												variant="secondary"
												className="bg-yellow-100 text-yellow-800"
											>
												<Star className="w-3 h-3 mr-1" />
												精选
											</Badge>
										)}
										<Badge
											variant="secondary"
											className={`text-white ${categoryInfo?.color || "bg-gray-500"}`}
										>
											{t(
												`tasks.detail.categories.${task.category}`,
												{
													defaultValue: task.category,
												},
											)}
										</Badge>
										<Badge
											variant="secondary"
											className={
												statusInfo?.color ||
												"bg-gray-100 text-gray-800"
											}
										>
											{t(
												`tasks.detail.status.${task.status}`,
												{
													defaultValue:
														statusInfo?.label ||
														task.status,
												},
											)}
										</Badge>
										<span
											className={`text-sm font-medium ${priorityInfo?.color || "text-gray-500"}`}
										>
											{t(
												`tasks.detail.priority.${task.priority}`,
												{
													defaultValue:
														priorityInfo?.label ||
														task.priority,
												},
											)}
										</span>
									</div>
									<CardTitle className="text-2xl leading-tight mb-2">
										{task.title}
									</CardTitle>
									{task.isUserTask && (
										<Badge
											variant="outline"
											className="mb-2"
										>
											用户发布
										</Badge>
									)}
								</div>
								<div className="text-right">
									<div className="flex items-center gap-1 text-primary font-semibold text-xl">
										<Coins className="w-5 h-5" />
										<span>{task.cpReward} CP</span>
									</div>
								</div>
							</div>

							{/* 时间信息 */}
							<div className="flex flex-wrap gap-4 text-sm text-gray-600">
								<div className="flex items-center gap-1">
									<Calendar className="w-4 h-4" />
									<span>
										发布于{" "}
										{format(
											new Date(task.createdAt),
											"yyyy-MM-dd HH:mm",
											{ locale: zhCN },
										)}
									</span>
								</div>
								{task.deadline && (
									<div
										className={`flex items-center gap-1 ${isExpired ? "text-red-500" : isExpiringSoon ? "text-orange-500" : ""}`}
									>
										<Clock className="w-4 h-4" />
										<span>
											截止时间：
											{format(
												new Date(task.deadline),
												"yyyy-MM-dd HH:mm",
												{ locale: zhCN },
											)}
											{isExpired && " (已过期)"}
											{!isExpired &&
												isExpiringSoon &&
												" (即将截止)"}
										</span>
									</div>
								)}
							</div>
						</CardHeader>

						<CardContent>
							<div className="prose max-w-none">
								<h3 className="text-lg font-semibold mb-3">
									任务描述
								</h3>
								<div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
									{task.description}
								</div>
							</div>

							{/* 标签 */}
							{task.tags?.length > 0 && (
								<div className="mt-6">
									<h3 className="text-sm font-medium text-gray-900 mb-2">
										标签
									</h3>
									<div className="flex flex-wrap gap-2">
										{task.tags.map((tag) => (
											<Badge key={tag} variant="outline">
												{tag}
											</Badge>
										))}
									</div>
								</div>
							)}
						</CardContent>
					</Card>

					{/* 提交内容展示 */}
					{task.status === "SUBMITTED" ||
					task.status === "COMPLETED" ||
					task.status === "REJECTED" ? (
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<FileText className="w-5 h-5" />
									提交内容
								</CardTitle>
							</CardHeader>
							<CardContent>
								{task.submissionNote && (
									<div className="mb-4">
										<h4 className="font-medium mb-2">
											提交说明
										</h4>
										<div className="bg-gray-50 p-3 rounded-md whitespace-pre-wrap">
											{task.submissionNote}
										</div>
									</div>
								)}
								{task.evidenceUrls &&
									task.evidenceUrls.length > 0 && (
										<div>
											<h4 className="font-medium mb-2">
												证据链接
											</h4>
											<div className="space-y-2">
												{task.evidenceUrls.map(
													(url, index) => (
														<div
															key={index}
															className="flex items-center gap-2"
														>
															<LinkIcon className="w-4 h-4 text-gray-400" />
															<a
																href={url}
																target="_blank"
																rel="noopener noreferrer"
																className="text-blue-600 hover:text-blue-800 underline break-all"
															>
																{url}
															</a>
														</div>
													),
												)}
											</div>
										</div>
									)}
								{task.submittedAt && (
									<div className="mt-4 text-sm text-gray-500">
										提交时间：
										{format(
											new Date(task.submittedAt),
											"yyyy-MM-dd HH:mm",
											{ locale: zhCN },
										)}
									</div>
								)}
							</CardContent>
						</Card>
					) : null}

					{/* 审核结果展示 */}
					{task.status === "COMPLETED" ||
					task.status === "REJECTED" ? (
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									{task.status === "COMPLETED" ? (
										<CheckCircle className="w-5 h-5 text-green-600" />
									) : (
										<XCircle className="w-5 h-5 text-red-600" />
									)}
									审核结果
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div
									className={`p-3 rounded-md mb-3 ${
										task.status === "COMPLETED"
											? "bg-green-50 border border-green-200"
											: "bg-red-50 border border-red-200"
									}`}
								>
									<div
										className={`font-medium ${
											task.status === "COMPLETED"
												? "text-green-800"
												: "text-red-800"
										}`}
									>
										{task.status === "COMPLETED"
											? "任务已通过审核"
											: "任务审核未通过"}
									</div>
								</div>
								{task.reviewNote && (
									<div>
										<h4 className="font-medium mb-2">
											审核备注
										</h4>
										<div className="bg-gray-50 p-3 rounded-md whitespace-pre-wrap">
											{task.reviewNote}
										</div>
									</div>
								)}
								{task.reviewedAt && (
									<div className="mt-3 text-sm text-gray-500">
										审核时间：
										{format(
											new Date(task.reviewedAt),
											"yyyy-MM-dd HH:mm",
											{ locale: zhCN },
										)}
									</div>
								)}
							</CardContent>
						</Card>
					) : null}
				</div>

				{/* 侧边栏 */}
				<div className="space-y-6">
					{/* 操作按钮 */}
					<Card>
						<CardHeader>
							<CardTitle>操作</CardTitle>
						</CardHeader>
						<CardContent className="space-y-3">
							{canClaim && !isExpired && (
								<Button
									className="w-full"
									onClick={handleClaimTask}
									disabled={actionLoading}
								>
									{actionLoading ? "认领中..." : "认领任务"}
								</Button>
							)}
							{canSubmit && (
								<Button
									className="w-full"
									onClick={() => setShowSubmitDialog(true)}
								>
									提交任务
								</Button>
							)}
							{canReview && (
								<div className="space-y-2">
									<Button
										className="w-full"
										onClick={() => {
											setReviewAction("approve");
											setShowReviewDialog(true);
										}}
									>
										通过审核
									</Button>
									<Button
										className="w-full"
										variant="destructive"
										onClick={() => {
											setReviewAction("reject");
											setShowReviewDialog(true);
										}}
									>
										拒绝任务
									</Button>
								</div>
							)}
							{isExpired && task.status === "PUBLISHED" && (
								<div className="text-center">
									<AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
									<p className="text-sm text-red-600">
										任务已过期
									</p>
								</div>
							)}
						</CardContent>
					</Card>

					{/* 发布者信息 */}
					<Card>
						<CardHeader>
							<CardTitle>发布者</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="flex items-center gap-3">
								<UserAvatar
									name={task.publisher.name}
									avatarUrl={task.publisher.image}
									className="w-12 h-12"
								/>
								<div>
									<div className="font-medium">
										{task.publisher.name}
									</div>
									{task.publisher.username && (
										<div className="text-sm text-gray-500">
											@{task.publisher.username}
										</div>
									)}
									{task.publisher.role === "admin" && (
										<Badge
											variant="secondary"
											className="text-xs"
										>
											管理员
										</Badge>
									)}
								</div>
							</div>
							{task.organization && (
								<div className="mt-4 pt-4 border-t">
									<div className="flex items-center gap-2 text-sm text-gray-600">
										<Building className="w-4 h-4" />
										<span>{task.organization.name}</span>
									</div>
								</div>
							)}
						</CardContent>
					</Card>

					{/* 认领者信息 */}
					{task.assignee && (
						<Card>
							<CardHeader>
								<CardTitle>认领者</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="flex items-center gap-3">
									<Avatar className="w-12 h-12">
										<AvatarImage
											src={task.assignee.image}
										/>
										<AvatarFallback>
											{task.assignee.name.charAt(0)}
										</AvatarFallback>
									</Avatar>
									<div>
										<div className="font-medium">
											{task.assignee.name}
										</div>
										{task.assignee.username && (
											<div className="text-sm text-gray-500">
												@{task.assignee.username}
											</div>
										)}
									</div>
								</div>
							</CardContent>
						</Card>
					)}
				</div>
			</div>

			{/* 提交任务对话框 */}
			<AlertDialog
				open={showSubmitDialog}
				onOpenChange={setShowSubmitDialog}
			>
				<AlertDialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
					<AlertDialogHeader>
						<AlertDialogTitle>提交任务</AlertDialogTitle>
						<AlertDialogDescription>
							请详细说明任务完成情况，并提供相关证据链接
						</AlertDialogDescription>
					</AlertDialogHeader>
					<div className="space-y-4">
						<div>
							<Label htmlFor="submissionNote">提交说明 *</Label>
							<Textarea
								id="submissionNote"
								placeholder="请详细描述任务完成情况、遇到的问题及解决方案..."
								value={submissionNote}
								onChange={(e) =>
									setSubmissionNote(e.target.value)
								}
								rows={6}
								className="mt-1"
							/>
						</div>
						<div>
							<Label>证据链接（可选）</Label>
							<div className="space-y-2 mt-1">
								{evidenceUrls.map((url, index) => (
									<div key={index} className="flex gap-2">
										<Input
											placeholder="https://..."
											value={url}
											onChange={(e) =>
												updateEvidenceUrl(
													index,
													e.target.value,
												)
											}
											className="flex-1"
										/>
										{evidenceUrls.length > 1 && (
											<Button
												variant="outline"
												size="sm"
												onClick={() =>
													removeEvidenceUrl(index)
												}
											>
												移除
											</Button>
										)}
									</div>
								))}
								{evidenceUrls.length < 5 && (
									<Button
										variant="outline"
										size="sm"
										onClick={addEvidenceUrl}
									>
										添加链接
									</Button>
								)}
							</div>
						</div>
					</div>
					<AlertDialogFooter>
						<AlertDialogCancel>取消</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleSubmitTask}
							disabled={actionLoading || !submissionNote.trim()}
						>
							{actionLoading ? "提交中..." : "确认提交"}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			{/* 审核任务对话框 */}
			<AlertDialog
				open={showReviewDialog}
				onOpenChange={setShowReviewDialog}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>
							{reviewAction === "approve"
								? "通过任务审核"
								: "拒绝任务"}
						</AlertDialogTitle>
						<AlertDialogDescription>
							{reviewAction === "approve"
								? "确认任务已按要求完成，将发放CP奖励给认领者"
								: "任务未达到要求，将拒绝此次提交"}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<div className="space-y-4">
						<div>
							<Label htmlFor="reviewNote">
								审核备注{" "}
								{reviewAction === "reject"
									? "(请说明拒绝原因)"
									: "(可选)"}
							</Label>
							<Textarea
								id="reviewNote"
								placeholder={
									reviewAction === "approve"
										? "可以添加一些鼓励或建议..."
										: "请说明任务不符合要求的具体原因..."
								}
								value={reviewNote}
								onChange={(e) => setReviewNote(e.target.value)}
								rows={4}
								className="mt-1"
							/>
						</div>
					</div>
					<AlertDialogFooter>
						<AlertDialogCancel>取消</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleReviewTask}
							disabled={
								actionLoading ||
								(reviewAction === "reject" &&
									!reviewNote.trim())
							}
							className={
								reviewAction === "reject"
									? "bg-red-600 hover:bg-red-700"
									: ""
							}
						>
							{actionLoading
								? "处理中..."
								: reviewAction === "approve"
									? "确认通过"
									: "确认拒绝"}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
