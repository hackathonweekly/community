"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
	Calendar,
	Clock,
	Coins,
	FileText,
	CheckCircle,
	XCircle,
	AlertCircle,
	Plus,
	Info,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useSession } from "@/lib/auth/client";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { EventAdminInvitations } from "@/modules/dashboard/events/components/EventAdminInvitations";

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

const TASK_CATEGORIES = {
	COMMUNITY_SERVICE: { key: "COMMUNITY_SERVICE", color: "bg-blue-500" },
	CONTENT_CREATION: { key: "CONTENT_CREATION", color: "bg-purple-500" },
	PRODUCT_TECH: { key: "PRODUCT_TECH", color: "bg-green-500" },
	OPERATION_PROMOTION: { key: "OPERATION_PROMOTION", color: "bg-orange-500" },
	OTHER: { key: "OTHER", color: "bg-gray-500" },
};

const TASK_STATUS = {
	PUBLISHED: {
		key: "PUBLISHED",
		color: "bg-green-100 text-green-800",
		icon: AlertCircle,
	},
	CLAIMED: {
		key: "CLAIMED",
		color: "bg-blue-100 text-blue-800",
		icon: Clock,
	},
	SUBMITTED: {
		key: "SUBMITTED",
		color: "bg-yellow-100 text-yellow-800",
		icon: FileText,
	},
	COMPLETED: {
		key: "COMPLETED",
		color: "bg-green-100 text-green-800",
		icon: CheckCircle,
	},
	REJECTED: {
		key: "REJECTED",
		color: "bg-red-100 text-red-800",
		icon: XCircle,
	},
	CANCELLED: {
		key: "CANCELLED",
		color: "bg-gray-100 text-gray-800",
		icon: XCircle,
	},
};

const TASK_PRIORITY = {
	LOW: { key: "LOW", color: "text-gray-500" },
	NORMAL: { key: "NORMAL", color: "text-blue-500" },
	HIGH: { key: "HIGH", color: "text-orange-500" },
	URGENT: { key: "URGENT", color: "text-red-500" },
};

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

	// Fetch my tasks
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
					// Compatible with old format
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

	// Task card component
	const TaskCard = ({
		task,
		type,
	}: { task: Task; type: "published" | "assigned" }) => {
		const categoryInfo =
			TASK_CATEGORIES[task.category as keyof typeof TASK_CATEGORIES];
		const statusInfo = TASK_STATUS[task.status as keyof typeof TASK_STATUS];
		const priorityInfo =
			TASK_PRIORITY[task.priority as keyof typeof TASK_PRIORITY];
		const StatusIcon = statusInfo?.icon || AlertCircle;

		const isExpired = task.deadline && new Date(task.deadline) < new Date();
		const isExpiringSoon =
			task.deadline &&
			!isExpired &&
			new Date(task.deadline) <
				new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);

		return (
			<Card className="h-full transition-all duration-200 hover:shadow-md">
				<CardHeader className="pb-3">
					<div className="flex items-start justify-between">
						<div className="flex-1">
							<div className="flex items-center gap-2 mb-2">
								<Badge
									variant="secondary"
									className={`text-white ${categoryInfo?.color || "bg-gray-500"}`}
								>
									{categoryInfo
										? t(
												`tasks.myTasks.categories.${categoryInfo.key}`,
											)
										: task.category}
								</Badge>
								<Badge
									variant="secondary"
									className={
										statusInfo?.color ||
										"bg-gray-100 text-gray-800"
									}
								>
									<StatusIcon className="w-3 h-3 mr-1" />
									{statusInfo
										? t(
												`tasks.myTasks.status.${statusInfo.key}`,
											)
										: task.status}
								</Badge>
								<span
									className={`text-xs font-medium ${priorityInfo?.color || "text-gray-500"}`}
								>
									{priorityInfo
										? t(
												`tasks.myTasks.priority.${priorityInfo.key}`,
											)
										: task.priority}
								</span>
							</div>
							<CardTitle className="text-lg leading-tight">
								<Link
									href={`/tasks/${task.id}`}
									className="hover:text-primary"
								>
									{task.title}
								</Link>
							</CardTitle>
						</div>
						<div className="flex items-center gap-1 text-primary font-semibold">
							<Coins className="w-4 h-4" />
							<span>{task.cpReward}</span>
						</div>
					</div>
					<CardDescription className="line-clamp-2">
						{task.description}
					</CardDescription>
				</CardHeader>

				<CardContent className="py-3">
					{/* Time information */}
					<div className="space-y-2 text-xs text-gray-600">
						<div className="flex items-center gap-1">
							<Calendar className="w-3 h-3" />
							<span>
								{t("tasks.myTasks.createdAt")}{" "}
								{formatDistanceToNow(new Date(task.createdAt), {
									addSuffix: true,
									locale: zhCN,
								})}
							</span>
						</div>
						{task.claimedAt && type === "published" && (
							<div className="flex items-center gap-1">
								<Clock className="w-3 h-3" />
								<span>
									{t("tasks.myTasks.claimedAt")}{" "}
									{formatDistanceToNow(
										new Date(task.claimedAt),
										{ addSuffix: true, locale: zhCN },
									)}
								</span>
							</div>
						)}
						{task.deadline && (
							<div
								className={`flex items-center gap-1 ${isExpired ? "text-red-500" : isExpiringSoon ? "text-orange-500" : ""}`}
							>
								<AlertCircle className="w-3 h-3" />
								<span>
									{t("tasks.myTasks.deadline")}{" "}
									{formatDistanceToNow(
										new Date(task.deadline),
										{ addSuffix: true, locale: zhCN },
									)}
									{isExpired &&
										` (${t("tasks.myTasks.expired")})`}
								</span>
							</div>
						)}
					</div>

					{/* User information section */}
					<div className="mt-3 pt-3 border-t">
						{type === "published" && task.assignee && (
							<div className="flex items-center gap-2">
								<UserAvatar
									name={task.assignee.name}
									avatarUrl={task.assignee.image}
									className="w-5 h-5"
								/>
								<span className="text-xs text-gray-600">
									{t("tasks.myTasks.userInfo.claimedBy")}
									{task.assignee.name}
								</span>
							</div>
						)}
						{type === "assigned" && (
							<div className="flex items-center gap-2">
								<UserAvatar
									name={task.publisher.name}
									avatarUrl={task.publisher.image}
									className="w-5 h-5"
								/>
								<span className="text-xs text-gray-600">
									{t("tasks.myTasks.userInfo.publishedBy")}
									{task.publisher.name}
								</span>
							</div>
						)}
					</div>

					{/* Review feedback */}
					{task.reviewNote &&
						(task.status === "COMPLETED" ||
							task.status === "REJECTED") && (
							<div className="mt-3 pt-3 border-t">
								<div className="text-xs text-gray-600">
									<strong>
										{t(
											"tasks.myTasks.userInfo.reviewFeedback",
										)}
									</strong>
									<p className="mt-1 bg-gray-50 p-2 rounded text-xs">
										{task.reviewNote}
									</p>
								</div>
							</div>
						)}
				</CardContent>

				<CardFooter className="pt-3">
					<div className="flex items-center justify-between w-full">
						<div className="text-xs text-gray-500">
							{task.reviewedAt
								? `${t("tasks.myTasks.timeInfo.reviewedAt")} ${format(new Date(task.reviewedAt), "MM-dd HH:mm")}`
								: task.submittedAt
									? `${t("tasks.myTasks.timeInfo.submittedAt")} ${format(new Date(task.submittedAt), "MM-dd HH:mm")}`
									: format(
											new Date(task.createdAt),
											"MM-dd HH:mm",
										)}
						</div>
						<Button asChild size="sm">
							<Link href={`/tasks/${task.id}`}>
								{t("tasks.myTasks.viewDetails")}
							</Link>
						</Button>
					</div>
				</CardFooter>
			</Card>
		);
	};

	if (!session?.user) {
		return (
			<div className="container mx-auto py-8">
				<div className="text-center">
					<h1 className="text-2xl font-bold text-gray-900 mb-2">
						{t("tasks.myTasks.pleaseLogin")}
					</h1>
					<p className="text-gray-600 mb-4">
						{t("tasks.myTasks.loginRequired")}
					</p>
					<Button asChild>
						<Link href="/auth/signin">
							{t("tasks.myTasks.loginNow")}
						</Link>
					</Button>
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-8">
			{/* Page header */}
			<div>
				<h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
					{t("tasks.myTasks.title")}
				</h1>
				<p className="text-muted-foreground mt-2">
					{t("tasks.myTasks.description")}
				</p>
			</div>

			{/* 内测提示 */}
			<Alert className="border-orange-200 bg-orange-50">
				<Info className="h-4 w-4 text-orange-600" />
				<AlertTitle className="text-orange-800">内测阶段</AlertTitle>
				<AlertDescription className="text-orange-700">
					任务系统目前处于内测阶段，功能仍在完善中。内测期间的数据可能不会保留，感谢您的参与和反馈！
				</AlertDescription>
			</Alert>

			{/* Statistics cards */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							{t("tasks.myTasks.stats.publishedTasks")}
						</CardTitle>
						<Plus className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							{stats.published}
						</div>
						<p className="text-xs text-muted-foreground">
							{t("tasks.myTasks.stats.publishedTasksDesc")}
						</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							{t("tasks.myTasks.stats.claimedTasks")}
						</CardTitle>
						<Clock className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							{stats.assigned}
						</div>
						<p className="text-xs text-muted-foreground">
							{t("tasks.myTasks.stats.claimedTasksDesc")}
						</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							{t("tasks.myTasks.stats.completedTasks")}
						</CardTitle>
						<CheckCircle className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							{stats.completed}
						</div>
						<p className="text-xs text-muted-foreground">
							{t("tasks.myTasks.stats.completedTasksDesc")}
						</p>
						{stats.assigned > 0 && (
							<div className="mt-2">
								<Progress
									value={
										(stats.completed / stats.assigned) * 100
									}
									className="h-2"
								/>
								<p className="text-xs text-muted-foreground mt-1">
									{t("tasks.myTasks.stats.completionRate")}{" "}
									{Math.round(
										(stats.completed / stats.assigned) *
											100,
									)}
									%
								</p>
							</div>
						)}
					</CardContent>
				</Card>
			</div>

			{/* Task list */}
			<Tabs defaultValue="assigned" className="space-y-6">
				<div className="flex items-center justify-between">
					<TabsList className="grid w-fit grid-cols-3">
						<TabsTrigger value="assigned">
							{t("tasks.myTasks.claimedTasks")}
						</TabsTrigger>
						<TabsTrigger value="published">
							{t("tasks.myTasks.publishedTasks")}
						</TabsTrigger>
						<TabsTrigger
							value="invitations"
							className="whitespace-nowrap"
						>
							活动邀请
						</TabsTrigger>
					</TabsList>
					<Button asChild>
						<Link href="/tasks/create">
							<Plus className="w-4 h-4 mr-2" />
							{t("tasks.myTasks.publishNewTask")}
						</Link>
					</Button>
				</div>

				<TabsContent value="assigned" className="space-y-6">
					{loading ? (
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
							{[1, 2, 3, 4, 5, 6].map((i) => (
								<Card key={i} className="h-64">
									<CardHeader>
										<div className="animate-pulse">
											<div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
											<div className="h-3 bg-gray-200 rounded w-1/2" />
										</div>
									</CardHeader>
									<CardContent>
										<div className="animate-pulse">
											<div className="h-3 bg-gray-200 rounded w-full mb-2" />
											<div className="h-3 bg-gray-200 rounded w-2/3" />
										</div>
									</CardContent>
								</Card>
							))}
						</div>
					) : assignedTasks.length > 0 ? (
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
							{assignedTasks.map((task) => (
								<TaskCard
									key={task.id}
									task={task}
									type="assigned"
								/>
							))}
						</div>
					) : (
						<div className="text-center py-12">
							<Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
							<h3 className="text-lg font-medium text-gray-900 mb-2">
								{t("tasks.myTasks.emptyStates.noClaimedTasks")}
							</h3>
							<p className="text-gray-600 mb-4">
								{t("tasks.myTasks.emptyStates.goToTaskHall")}
							</p>
							<Button asChild>
								<Link href="/tasks">
									{t("tasks.myTasks.emptyStates.browseTasks")}
								</Link>
							</Button>
						</div>
					)}
				</TabsContent>

				<TabsContent value="published" className="space-y-6">
					{loading ? (
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
							{[1, 2, 3, 4, 5, 6].map((i) => (
								<Card key={i} className="h-64">
									<CardHeader>
										<div className="animate-pulse">
											<div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
											<div className="h-3 bg-gray-200 rounded w-1/2" />
										</div>
									</CardHeader>
									<CardContent>
										<div className="animate-pulse">
											<div className="h-3 bg-gray-200 rounded w-full mb-2" />
											<div className="h-3 bg-gray-200 rounded w-2/3" />
										</div>
									</CardContent>
								</Card>
							))}
						</div>
					) : publishedTasks.length > 0 ? (
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
							{publishedTasks.map((task) => (
								<TaskCard
									key={task.id}
									task={task}
									type="published"
								/>
							))}
						</div>
					) : (
						<div className="text-center py-12">
							<Plus className="w-16 h-16 text-gray-400 mx-auto mb-4" />
							<h3 className="text-lg font-medium text-gray-900 mb-2">
								{t(
									"tasks.myTasks.emptyStates.noPublishedTasks",
								)}
							</h3>
							<p className="text-gray-600 mb-4">
								{t(
									"tasks.myTasks.emptyStates.publishTasksDesc",
								)}
							</p>
							<Button asChild>
								<Link href="/tasks/create">
									{t(
										"tasks.myTasks.emptyStates.publishFirstTask",
									)}
								</Link>
							</Button>
						</div>
					)}
				</TabsContent>

				<TabsContent value="invitations" className="space-y-6">
					<EventAdminInvitations />
				</TabsContent>
			</Tabs>
		</div>
	);
}
