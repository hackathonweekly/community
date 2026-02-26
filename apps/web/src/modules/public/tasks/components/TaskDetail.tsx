"use client";

import { useState, useEffect } from "react";
import { Badge } from "@community/ui/ui/badge";
import { Button } from "@community/ui/ui/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@community/ui/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@community/ui/ui/avatar";
import { Textarea } from "@community/ui/ui/textarea";
import { Input } from "@community/ui/ui/input";
import { Label } from "@community/ui/ui/label";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@community/ui/ui/alert-dialog";
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
import { useSession } from "@community/lib-client/auth/client";
import { UserAvatar } from "@community/ui/shared/UserAvatar";

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
	COMMUNITY_SERVICE: { label: "社区服务", color: "bg-muted" },
	CONTENT_CREATION: { label: "内容创作", color: "bg-muted" },
	PRODUCT_TECH: { label: "产品技术", color: "bg-muted" },
	OPERATION_PROMOTION: { label: "运营推广", color: "bg-muted" },
	OTHER: { label: "其他", color: "bg-muted" },
};

const TASK_PRIORITY = {
	LOW: { label: "低", color: "text-muted-foreground" },
	NORMAL: { label: "普通", color: "text-foreground" },
	HIGH: { label: "高", color: "text-foreground" },
	URGENT: { label: "紧急", color: "text-destructive" },
};

const TASK_STATUS = {
	PUBLISHED: { label: "待认领", color: "bg-muted text-foreground" },
	CLAIMED: { label: "进行中", color: "bg-muted text-foreground" },
	SUBMITTED: { label: "待审核", color: "bg-muted text-foreground" },
	COMPLETED: { label: "已完成", color: "bg-muted text-foreground" },
	REJECTED: { label: "已拒绝", color: "bg-destructive/10 text-destructive" },
	CANCELLED: { label: "已取消", color: "bg-muted text-muted-foreground" },
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
			<div className="animate-pulse">
				<div className="mb-4 h-8 w-3/4 rounded bg-muted" />
				<div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
					<div className="space-y-4 lg:col-span-2">
						<Card className="rounded-lg border border-border bg-card p-0 shadow-subtle">
							<CardHeader className="p-3">
								<div className="mb-2 h-6 w-1/2 rounded bg-muted" />
								<div className="h-4 w-3/4 rounded bg-muted" />
							</CardHeader>
							<CardContent className="p-3 pt-0">
								<div className="space-y-3">
									<div className="h-4 w-full rounded bg-muted" />
									<div className="h-4 w-2/3 rounded bg-muted" />
								</div>
							</CardContent>
						</Card>
					</div>
					<div className="space-y-4">
						<Card className="rounded-lg border border-border bg-card p-0 shadow-subtle">
							<CardHeader className="p-3">
								<div className="h-5 w-1/2 rounded bg-muted" />
							</CardHeader>
							<CardContent className="p-3 pt-0">
								<div className="space-y-3">
									<div className="h-4 w-full rounded bg-muted" />
									<div className="h-4 w-3/4 rounded bg-muted" />
								</div>
							</CardContent>
						</Card>
					</div>
				</div>
			</div>
		);
	}

	if (!task) {
		return (
			<div className="py-12 text-center">
				<h1 className="mb-2 font-brand text-xl font-bold text-foreground">
					{t("tasks.detail.taskNotFound")}
				</h1>
				<p className="mb-4 text-sm text-muted-foreground">
					{t("tasks.detail.taskNotFoundDesc")}
				</p>
				<Button asChild variant="outline">
					<Link href="/tasks">{t("tasks.detail.backToTasks")}</Link>
				</Button>
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
		<div>
			{/* <Button
				variant="ghost"
				className="mb-4 h-8 rounded-full px-3 text-xs font-bold uppercase tracking-wider text-muted-foreground"
				asChild
			>
				<Link href="/tasks">
					<ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
					返回任务大厅
				</Link>
			</Button> */}

			<div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
				<div className="space-y-4 lg:col-span-2">
					<Card className="rounded-lg border border-border bg-card p-0 shadow-subtle">
						<CardHeader className="p-4">
							<div className="mb-3 flex items-start justify-between">
								<div className="flex-1">
									<div className="mb-2 flex flex-wrap items-center gap-1.5">
										{task.featured && (
											<Badge
												variant="secondary"
												className="bg-muted text-foreground"
											>
												<Star className="mr-1 h-3 w-3" />
												精选
											</Badge>
										)}
										<Badge
											variant="secondary"
											className={`text-foreground ${categoryInfo?.color || "bg-muted"}`}
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
												"bg-muted text-muted-foreground"
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
											className={`font-mono text-[11px] ${priorityInfo?.color || "text-muted-foreground"}`}
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
									<CardTitle className="mb-1 font-brand text-xl leading-tight text-foreground">
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
									<div className="flex items-center gap-1 font-mono text-lg font-semibold text-foreground">
										<Coins className="h-5 w-5" />
										<span>{task.cpReward}积分</span>
									</div>
								</div>
							</div>

							<div className="flex flex-wrap gap-3 font-mono text-xs text-muted-foreground">
								<div className="flex items-center gap-1">
									<Calendar className="h-3.5 w-3.5" />
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
										className={`flex items-center gap-1 ${isExpired ? "text-destructive" : isExpiringSoon ? "text-foreground" : ""}`}
									>
										<Clock className="h-3.5 w-3.5" />
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

						<CardContent className="border-t border-border p-4">
							<div>
								<h3 className="mb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
									任务描述
								</h3>
								<div className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
									{task.description}
								</div>
							</div>

							{task.tags?.length > 0 && (
								<div className="mt-4">
									<h3 className="mb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
										标签
									</h3>
									<div className="flex flex-wrap gap-1.5">
										{task.tags.map((tag) => (
											<Badge
												key={tag}
												variant="outline"
												className="text-xs"
											>
												{tag}
											</Badge>
										))}
									</div>
								</div>
							)}
						</CardContent>
					</Card>

					{task.status === "SUBMITTED" ||
					task.status === "COMPLETED" ||
					task.status === "REJECTED" ? (
						<Card className="rounded-lg border border-border bg-card p-0 shadow-subtle">
							<CardHeader className="p-4 pb-2">
								<CardTitle className="flex items-center gap-2 text-sm font-bold text-foreground">
									<FileText className="h-4 w-4" />
									提交内容
								</CardTitle>
							</CardHeader>
							<CardContent className="p-4 pt-0">
								{task.submissionNote && (
									<div className="mb-3">
										<h4 className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
											提交说明
										</h4>
										<div className="whitespace-pre-wrap rounded-md bg-muted/40 p-3 text-sm text-foreground">
											{task.submissionNote}
										</div>
									</div>
								)}
								{task.evidenceUrls &&
									task.evidenceUrls.length > 0 && (
										<div>
											<h4 className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
												证据链接
											</h4>
											<div className="space-y-1.5">
												{task.evidenceUrls.map(
													(url, index) => (
														<div
															key={index}
															className="flex items-center gap-2"
														>
															<LinkIcon className="h-3.5 w-3.5 text-muted-foreground" />
															<a
																href={url}
																target="_blank"
																rel="noopener noreferrer"
																className="break-all text-sm text-foreground underline hover:text-foreground/80"
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
									<div className="mt-3 text-xs text-muted-foreground">
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

					{task.status === "COMPLETED" ||
					task.status === "REJECTED" ? (
						<Card className="rounded-lg border border-border bg-card p-0 shadow-subtle">
							<CardHeader className="p-4 pb-2">
								<CardTitle className="flex items-center gap-2 text-sm font-bold text-foreground">
									{task.status === "COMPLETED" ? (
										<CheckCircle className="h-4 w-4 text-foreground" />
									) : (
										<XCircle className="h-4 w-4 text-destructive" />
									)}
									审核结果
								</CardTitle>
							</CardHeader>
							<CardContent className="p-4 pt-0">
								<div
									className={`mb-3 rounded-md p-3 ${
										task.status === "COMPLETED"
											? "border border-border bg-muted/40"
											: "border border-destructive/30 bg-destructive/5"
									}`}
								>
									<div
										className={`text-sm font-medium ${
											task.status === "COMPLETED"
												? "text-foreground"
												: "text-destructive"
										}`}
									>
										{task.status === "COMPLETED"
											? "任务已通过审核"
											: "任务审核未通过"}
									</div>
								</div>
								{task.reviewNote && (
									<div>
										<h4 className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
											审核备注
										</h4>
										<div className="whitespace-pre-wrap rounded-md bg-muted/40 p-3 text-sm text-foreground">
											{task.reviewNote}
										</div>
									</div>
								)}
								{task.reviewedAt && (
									<div className="mt-3 text-xs text-muted-foreground">
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

				<div className="space-y-4">
					<Card className="rounded-lg border border-border bg-card p-0 shadow-subtle">
						<CardHeader className="p-3 pb-2">
							<CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
								操作
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-2 p-3 pt-0">
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
									<AlertCircle className="mx-auto mb-2 h-8 w-8 text-destructive" />
									<p className="text-xs text-destructive">
										任务已过期
									</p>
								</div>
							)}
						</CardContent>
					</Card>

					<Card className="rounded-lg border border-border bg-card p-0 shadow-subtle">
						<CardHeader className="p-3 pb-2">
							<CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
								发布者
							</CardTitle>
						</CardHeader>
						<CardContent className="p-3 pt-0">
							<div className="flex items-center gap-3">
								<UserAvatar
									name={task.publisher.name}
									avatarUrl={task.publisher.image}
									className="h-10 w-10"
								/>
								<div>
									<div className="text-sm font-medium text-foreground">
										{task.publisher.name}
									</div>
									{task.publisher.username && (
										<div className="text-xs text-muted-foreground">
											@{task.publisher.username}
										</div>
									)}
									{task.publisher.role === "admin" && (
										<Badge
											variant="secondary"
											className="mt-1 text-xs"
										>
											管理员
										</Badge>
									)}
								</div>
							</div>
							{task.organization && (
								<div className="mt-3 border-t border-border pt-3">
									<div className="flex items-center gap-2 text-xs text-muted-foreground">
										<Building className="h-3.5 w-3.5" />
										<span>{task.organization.name}</span>
									</div>
								</div>
							)}
						</CardContent>
					</Card>

					{task.assignee && (
						<Card className="rounded-lg border border-border bg-card p-0 shadow-subtle">
							<CardHeader className="p-3 pb-2">
								<CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
									认领者
								</CardTitle>
							</CardHeader>
							<CardContent className="p-3 pt-0">
								<div className="flex items-center gap-3">
									<Avatar className="h-10 w-10">
										<AvatarImage
											src={task.assignee.image}
										/>
										<AvatarFallback>
											{task.assignee.name.charAt(0)}
										</AvatarFallback>
									</Avatar>
									<div>
										<div className="text-sm font-medium text-foreground">
											{task.assignee.name}
										</div>
										{task.assignee.username && (
											<div className="text-xs text-muted-foreground">
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
									? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
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
