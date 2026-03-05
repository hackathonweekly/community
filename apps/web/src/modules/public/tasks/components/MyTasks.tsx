"use client";

import { EventAdminInvitations } from "@/modules/account/events/components/EventAdminInvitations";
import { useSession } from "@community/lib-client/auth/client";
import { UserAvatar } from "@community/ui/shared/UserAvatar";
import { Button } from "@community/ui/ui/button";
import { Card } from "@community/ui/ui/card";
import { Progress } from "@community/ui/ui/progress";
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@community/ui/ui/tabs";
import { format, formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";
import {
	AlertCircle,
	Calendar,
	CheckCircle,
	Clock,
	Coins,
	FileText,
	Plus,
	XCircle,
} from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useEffect, useState } from "react";

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
	claimedAt?: string;
	submittedAt?: string;
	reviewedAt?: string;
	reviewNote?: string;
	isUserTask: boolean;
	publisher: {
		id: string;
		name: string;
		image?: string;
		username?: string;
	};
	assignee?: {
		id: string;
		name: string;
		image?: string;
		username?: string;
	};
}

interface TaskStats {
	published: number;
	assigned: number;
	completed: number;
}

const TASK_CATEGORIES: Record<string, string> = {
	COMMUNITY_SERVICE: "社区服务",
	CONTENT_CREATION: "内容创作",
	PRODUCT_TECH: "产品技术",
	OPERATION_PROMOTION: "运营推广",
	OTHER: "其他",
};

const TASK_STATUS: Record<
	string,
	{ label: string; className: string; icon: typeof AlertCircle }
> = {
	PUBLISHED: {
		label: "待认领",
		className: "text-foreground bg-muted border-border",
		icon: AlertCircle,
	},
	CLAIMED: {
		label: "进行中",
		className: "text-blue-600 bg-blue-50 border-blue-100",
		icon: Clock,
	},
	SUBMITTED: {
		label: "已提交",
		className: "text-orange-600 bg-orange-50 border-orange-100",
		icon: FileText,
	},
	COMPLETED: {
		label: "已完成",
		className: "text-green-700 bg-green-50 border-green-100",
		icon: CheckCircle,
	},
	REJECTED: {
		label: "已驳回",
		className: "text-red-700 bg-red-50 border-red-100",
		icon: XCircle,
	},
	CANCELLED: {
		label: "已取消",
		className: "text-muted-foreground bg-muted border-border",
		icon: XCircle,
	},
};

const TASK_PRIORITY: Record<string, { label: string; className: string }> = {
	LOW: {
		label: "低",
		className: "text-muted-foreground bg-muted border-border",
	},
	NORMAL: {
		label: "普通",
		className: "text-foreground bg-muted border-border",
	},
	HIGH: {
		label: "高",
		className: "text-orange-600 bg-orange-50 border-orange-100",
	},
	URGENT: {
		label: "紧急",
		className: "text-red-700 bg-red-50 border-red-100",
	},
};

function MyTaskCard({
	task,
	type,
}: { task: Task; type: "published" | "assigned" }) {
	const categoryLabel = TASK_CATEGORIES[task.category] || task.category;
	const statusInfo = TASK_STATUS[task.status];
	const priorityInfo = TASK_PRIORITY[task.priority];
	const StatusIcon = statusInfo?.icon || AlertCircle;

	const isExpired = task.deadline && new Date(task.deadline) < new Date();
	const isExpiringSoon =
		task.deadline &&
		!isExpired &&
		new Date(task.deadline) <
			new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);

	return (
		<Card className="group w-full cursor-pointer overflow-hidden rounded-lg border border-border bg-card p-0 shadow-subtle transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift">
			<Link
				href={`/tasks/${task.id}`}
				className="flex min-h-[44px] flex-col"
			>
				{/* Badges row */}
				<div className="flex flex-wrap items-center gap-1 sm:gap-1.5 border-b border-border/50 px-2.5 pt-2.5 pb-1.5 sm:px-3 sm:pt-3 sm:pb-2">
					<span className="rounded border border-border bg-white/90 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-tight text-foreground/80">
						{categoryLabel}
					</span>
					{statusInfo && (
						<span
							className={`flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-bold ${statusInfo.className}`}
						>
							<StatusIcon className="h-3 w-3" />
							{statusInfo.label}
						</span>
					)}
					{priorityInfo && task.priority !== "NORMAL" && (
						<span
							className={`rounded border px-1.5 py-0.5 text-[10px] font-bold ${priorityInfo.className}`}
						>
							{priorityInfo.label}
						</span>
					)}
					<span className="ml-auto flex items-center gap-1 font-mono text-xs font-bold text-foreground">
						<Coins className="h-3 w-3" />
						{task.cpReward}积分
					</span>
				</div>

				{/* Content */}
				<div className="flex flex-1 flex-col p-2.5 sm:p-3">
					<h3 className="mb-1 line-clamp-1 font-brand text-base font-bold leading-tight text-foreground transition-colors group-hover:text-foreground/70">
						{task.title}
					</h3>

					<p className="mb-2 line-clamp-2 text-xs text-muted-foreground">
						{task.description}
					</p>

					{/* Time info */}
					<div className="mb-2 space-y-1 font-mono text-[11px] text-muted-foreground">
						<div className="flex items-center gap-1">
							<Calendar className="h-3 w-3" />
							<span>
								创建于{" "}
								{formatDistanceToNow(new Date(task.createdAt), {
									addSuffix: true,
									locale: zhCN,
								})}
							</span>
						</div>
						{task.deadline && (
							<div
								className={`flex items-center gap-1 ${isExpired ? "text-red-600" : isExpiringSoon ? "text-orange-600" : ""}`}
							>
								<Clock className="h-3 w-3" />
								<span>
									截止{" "}
									{formatDistanceToNow(
										new Date(task.deadline),
										{
											addSuffix: true,
											locale: zhCN,
										},
									)}
									{isExpired && " (已过期)"}
								</span>
							</div>
						)}
					</div>

					{/* Review note */}
					{task.reviewNote &&
						(task.status === "COMPLETED" ||
							task.status === "REJECTED") && (
							<div className="mb-2 rounded-md bg-muted/60 p-2 text-xs text-muted-foreground">
								<span className="font-bold">审核反馈：</span>
								{task.reviewNote}
							</div>
						)}

					{/* Footer */}
					<div className="mt-auto flex items-center justify-between border-t border-border/50 pt-2">
						{type === "published" && task.assignee ? (
							<div className="flex items-center gap-2 truncate">
								<UserAvatar
									name={task.assignee.name}
									avatarUrl={task.assignee.image}
									className="h-5 w-5"
								/>
								<span className="truncate text-[10px] font-medium text-muted-foreground">
									认领者：{task.assignee.name}
								</span>
							</div>
						) : type === "assigned" ? (
							<div className="flex items-center gap-2 truncate">
								<UserAvatar
									name={task.publisher.name}
									avatarUrl={task.publisher.image}
									className="h-5 w-5"
								/>
								<span className="truncate text-[10px] font-medium text-muted-foreground">
									发布者：{task.publisher.name}
								</span>
							</div>
						) : (
							<span />
						)}
						<span className="text-[10px] font-mono text-muted-foreground">
							{task.reviewedAt
								? format(
										new Date(task.reviewedAt),
										"MM-dd HH:mm",
									)
								: task.submittedAt
									? format(
											new Date(task.submittedAt),
											"MM-dd HH:mm",
										)
									: format(
											new Date(task.createdAt),
											"MM-dd HH:mm",
										)}
						</span>
					</div>
				</div>
			</Link>
		</Card>
	);
}

function LoadingSkeleton() {
	return (
		<div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
			{[1, 2, 3].map((i) => (
				<div
					key={i}
					className="h-48 rounded-lg border border-border bg-card p-3 shadow-subtle"
				>
					<div className="animate-pulse space-y-3">
						<div className="flex gap-1.5">
							<div className="h-4 w-12 rounded bg-muted" />
							<div className="h-4 w-16 rounded bg-muted" />
						</div>
						<div className="h-5 w-3/4 rounded bg-muted" />
						<div className="h-3 w-full rounded bg-muted" />
						<div className="h-3 w-2/3 rounded bg-muted" />
					</div>
				</div>
			))}
		</div>
	);
}

export function MyTasks() {
	const t = useTranslations();
	const { data: session } = useSession();
	const [loading, setLoading] = useState(true);
	const [publishedTasks, setPublishedTasks] = useState<Task[]>([]);
	const [assignedTasks, setAssignedTasks] = useState<Task[]>([]);
	const [stats, setStats] = useState<TaskStats>({
		published: 0,
		assigned: 0,
		completed: 0,
	});

	const fetchMyTasks = async () => {
		try {
			setLoading(true);
			const response = await fetch("/api/tasks/mine");
			if (response.ok) {
				const data = await response.json();
				if (data.tasks.published && data.tasks.assigned) {
					setPublishedTasks(data.tasks.published || []);
					setAssignedTasks(data.tasks.assigned || []);
				} else {
					setPublishedTasks([]);
					setAssignedTasks(data.tasks || []);
				}
				setStats(
					data.stats || { published: 0, assigned: 0, completed: 0 },
				);
			}
		} catch (error) {
			console.error("Failed to fetch my tasks:", error);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		if (session?.user) {
			fetchMyTasks();
		}
	}, [session]);

	if (!session?.user) {
		return (
			<div className="py-12 text-center">
				<h2 className="mb-2 font-brand text-xl font-bold text-foreground">
					{t("tasks.myTasks.pleaseLogin")}
				</h2>
				<p className="mb-4 text-sm text-muted-foreground">
					{t("tasks.myTasks.loginRequired")}
				</p>
				<Button asChild variant="pill">
					<Link href="/auth/signin">
						{t("tasks.myTasks.loginNow")}
					</Link>
				</Button>
			</div>
		);
	}

	return (
		<div className="space-y-3 sm:space-y-4">
			{/* Stats row */}
			<div className="grid grid-cols-3 gap-1.5 sm:gap-3">
				<div className="rounded-lg border border-border bg-card p-2 sm:p-3 shadow-subtle">
					<div className="mb-0.5 sm:mb-1 text-[10px] sm:text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
						{t("tasks.myTasks.stats.publishedTasks")}
					</div>
					<div className="font-mono text-lg sm:text-2xl font-bold text-foreground">
						{stats.published}
					</div>
				</div>
				<div className="rounded-lg border border-border bg-card p-2 sm:p-3 shadow-subtle">
					<div className="mb-0.5 sm:mb-1 text-[10px] sm:text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
						{t("tasks.myTasks.stats.claimedTasks")}
					</div>
					<div className="font-mono text-lg sm:text-2xl font-bold text-foreground">
						{stats.assigned}
					</div>
				</div>
				<div className="rounded-lg border border-border bg-card p-2 sm:p-3 shadow-subtle">
					<div className="mb-0.5 sm:mb-1 text-[10px] sm:text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
						{t("tasks.myTasks.stats.completedTasks")}
					</div>
					<div className="font-mono text-lg sm:text-2xl font-bold text-foreground">
						{stats.completed}
					</div>
					{stats.assigned > 0 && (
						<div className="mt-1.5">
							<Progress
								value={(stats.completed / stats.assigned) * 100}
								className="h-1"
							/>
							<p className="mt-0.5 font-mono text-[10px] text-muted-foreground">
								{Math.round(
									(stats.completed / stats.assigned) * 100,
								)}
								%
							</p>
						</div>
					)}
				</div>
			</div>

			{/* Task tabs */}
			<Tabs defaultValue="assigned" className="space-y-3 sm:space-y-4">
				<div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
					<TabsList className="grid h-10 w-full grid-cols-3 sm:w-fit">
						<TabsTrigger
							value="assigned"
							className="text-xs sm:text-sm"
						>
							{t("tasks.myTasks.claimedTasks")}
						</TabsTrigger>
						<TabsTrigger
							value="published"
							className="text-xs sm:text-sm"
						>
							{t("tasks.myTasks.publishedTasks")}
						</TabsTrigger>
						<TabsTrigger
							value="invitations"
							className="whitespace-nowrap text-xs sm:text-sm"
						>
							活动邀请
						</TabsTrigger>
					</TabsList>
					<Button
						asChild
						size="sm"
						variant="pill"
						className="hidden sm:inline-flex sm:w-auto"
					>
						<Link href="/tasks/create">
							<Plus className="mr-1 h-3.5 w-3.5" />
							{t("tasks.myTasks.publishNewTask")}
						</Link>
					</Button>
				</div>

				<TabsContent
					value="assigned"
					className="space-y-3 sm:space-y-4"
				>
					{loading ? (
						<LoadingSkeleton />
					) : assignedTasks.length > 0 ? (
						<div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
							{assignedTasks.map((task) => (
								<MyTaskCard
									key={task.id}
									task={task}
									type="assigned"
								/>
							))}
						</div>
					) : (
						<div className="py-12 text-center">
							<Clock className="mx-auto mb-4 h-10 w-10 text-muted-foreground" />
							<h3 className="mb-2 font-brand text-base font-medium text-foreground">
								{t("tasks.myTasks.emptyStates.noClaimedTasks")}
							</h3>
							<p className="mb-4 text-sm text-muted-foreground">
								{t("tasks.myTasks.emptyStates.goToTaskHall")}
							</p>
							<Button
								asChild
								variant="outline"
								className="rounded-full"
							>
								<Link href="/tasks">
									{t("tasks.myTasks.emptyStates.browseTasks")}
								</Link>
							</Button>
						</div>
					)}
				</TabsContent>

				<TabsContent
					value="published"
					className="space-y-3 sm:space-y-4"
				>
					{loading ? (
						<LoadingSkeleton />
					) : publishedTasks.length > 0 ? (
						<div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
							{publishedTasks.map((task) => (
								<MyTaskCard
									key={task.id}
									task={task}
									type="published"
								/>
							))}
						</div>
					) : (
						<div className="py-12 text-center">
							<Plus className="mx-auto mb-4 h-10 w-10 text-muted-foreground" />
							<h3 className="mb-2 font-brand text-base font-medium text-foreground">
								{t(
									"tasks.myTasks.emptyStates.noPublishedTasks",
								)}
							</h3>
							<p className="mb-4 text-sm text-muted-foreground">
								{t(
									"tasks.myTasks.emptyStates.publishTasksDesc",
								)}
							</p>
							<Button
								asChild
								variant="outline"
								className="rounded-full"
							>
								<Link href="/tasks/create">
									{t(
										"tasks.myTasks.emptyStates.publishFirstTask",
									)}
								</Link>
							</Button>
						</div>
					)}
				</TabsContent>

				<TabsContent value="invitations" className="space-y-4">
					<EventAdminInvitations />
				</TabsContent>
			</Tabs>
		</div>
	);
}
