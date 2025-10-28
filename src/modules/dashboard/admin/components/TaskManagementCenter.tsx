"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	CheckSquare,
	Plus,
	Edit,
	Trash2,
	Eye,
	Users,
	Clock,
	CheckCircle,
	XCircle,
	AlertTriangle,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface CommunityTask {
	id: string;
	title: string;
	description: string;
	category: string;
	cpReward: number;
	status: string;
	priority: string;
	deadline?: string;
	maxParticipants?: number;
	currentParticipants: number;
	createdAt: string;
	updatedAt: string;
	creator: {
		id: string;
		name: string;
		email: string;
	};
	organization?: {
		id: string;
		name: string;
	};
	assignments: TaskAssignment[];
}

interface TaskAssignment {
	id: string;
	userId: string;
	status: string;
	claimedAt: string;
	submittedAt?: string;
	reviewedAt?: string;
	evidence?: string;
	user: {
		id: string;
		name: string;
		email: string;
	};
}

interface TaskStats {
	totalTasks: number;
	publishedTasks: number;
	completedTasks: number;
	pendingSubmissions: number;
}

const STATUS_CONFIG = {
	DRAFT: { label: "草稿", color: "bg-gray-100 text-gray-800", icon: Edit },
	PUBLISHED: {
		label: "已发布",
		color: "bg-blue-100 text-blue-800",
		icon: CheckCircle,
	},
	COMPLETED: {
		label: "已完成",
		color: "bg-green-100 text-green-800",
		icon: CheckCircle,
	},
	CANCELLED: {
		label: "已取消",
		color: "bg-red-100 text-red-800",
		icon: XCircle,
	},
};

const PRIORITY_CONFIG = {
	LOW: { label: "低", color: "bg-gray-100 text-gray-800" },
	MEDIUM: { label: "中", color: "bg-yellow-100 text-yellow-800" },
	HIGH: { label: "高", color: "bg-red-100 text-red-800" },
	URGENT: { label: "紧急", color: "bg-purple-100 text-purple-800" },
};

export function TaskManagementCenter() {
	const [tasks, setTasks] = useState<CommunityTask[]>([]);
	const [stats, setStats] = useState<TaskStats | null>(null);
	const [loading, setLoading] = useState(true);
	const [selectedTask, setSelectedTask] = useState<CommunityTask | null>(
		null,
	);
	const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);

	// 获取任务统计数据
	const fetchStats = async () => {
		try {
			const response = await fetch("/api/tasks/stats");
			if (response.ok) {
				const data = await response.json();
				setStats(data.stats);
			}
		} catch (error) {
			console.error("获取统计数据失败:", error);
		}
	};

	// 获取任务列表
	const fetchTasks = async (status?: string) => {
		try {
			setLoading(true);
			const params = new URLSearchParams();
			if (status && status !== "ALL") {
				params.append("status", status);
			}

			const response = await fetch(
				`/api/tasks/admin?${params.toString()}`,
			);
			if (response.ok) {
				const data = await response.json();
				setTasks(data.tasks || []);
			} else {
				toast.error("获取任务列表失败");
			}
		} catch (error) {
			console.error("获取任务列表失败:", error);
			toast.error("网络错误");
		} finally {
			setLoading(false);
		}
	};

	// 更新任务状态
	const updateTaskStatus = async (taskId: string, status: string) => {
		try {
			const response = await fetch(`/api/tasks/${taskId}/admin`, {
				method: "PATCH",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ status }),
			});

			if (response.ok) {
				toast.success("状态更新成功");
				fetchTasks();
				fetchStats();
			} else {
				toast.error("状态更新失败");
			}
		} catch (error) {
			console.error("更新状态失败:", error);
			toast.error("网络错误");
		}
	};

	// 删除任务
	const deleteTask = async (taskId: string) => {
		if (!confirm("确定要删除这个任务吗？此操作不可恢复。")) {
			return;
		}

		try {
			const response = await fetch(`/api/tasks/${taskId}`, {
				method: "DELETE",
			});

			if (response.ok) {
				toast.success("任务删除成功");
				fetchTasks();
				fetchStats();
			} else {
				toast.error("删除失败");
			}
		} catch (error) {
			console.error("删除任务失败:", error);
			toast.error("网络错误");
		}
	};

	// 查看任务详情
	const viewTaskDetail = async (taskId: string) => {
		try {
			const response = await fetch(`/api/tasks/${taskId}`);
			if (response.ok) {
				const data = await response.json();
				setSelectedTask(data.task);
				setIsDetailDialogOpen(true);
			} else {
				toast.error("获取任务详情失败");
			}
		} catch (error) {
			console.error("获取任务详情失败:", error);
			toast.error("网络错误");
		}
	};

	useEffect(() => {
		fetchStats();
		fetchTasks();
	}, []);

	// 任务行组件
	const TaskRow = ({ task }: { task: CommunityTask }) => {
		const statusConfig =
			STATUS_CONFIG[task.status as keyof typeof STATUS_CONFIG];
		const priorityConfig =
			PRIORITY_CONFIG[task.priority as keyof typeof PRIORITY_CONFIG];
		const StatusIcon = statusConfig?.icon || AlertTriangle;

		return (
			<TableRow key={task.id}>
				<TableCell className="font-medium">
					<div>
						<div className="font-semibold">{task.title}</div>
						<div className="text-sm text-gray-500 line-clamp-1">
							{task.description}
						</div>
					</div>
				</TableCell>
				<TableCell>
					<Badge variant="outline">{task.category}</Badge>
				</TableCell>
				<TableCell>
					<Badge className={statusConfig?.color}>
						<StatusIcon className="w-3 h-3 mr-1" />
						{statusConfig?.label}
					</Badge>
				</TableCell>
				<TableCell>
					<Badge className={priorityConfig?.color}>
						{priorityConfig?.label}
					</Badge>
				</TableCell>
				<TableCell className="text-center">
					<div className="flex items-center justify-center gap-1">
						<Users className="w-4 h-4 text-gray-500" />
						<span>{task.currentParticipants}</span>
						{task.maxParticipants && (
							<span className="text-gray-500">
								/{task.maxParticipants}
							</span>
						)}
					</div>
				</TableCell>
				<TableCell className="text-center font-semibold text-primary">
					{task.cpReward} CP
				</TableCell>
				<TableCell className="text-sm text-gray-500">
					{task.deadline
						? format(new Date(task.deadline), "MM-dd HH:mm")
						: "无"}
				</TableCell>
				<TableCell>
					<div className="flex items-center gap-2">
						<Button
							variant="outline"
							size="sm"
							onClick={() => viewTaskDetail(task.id)}
						>
							<Eye className="w-4 h-4" />
						</Button>
						{task.status === "DRAFT" && (
							<Button
								variant="outline"
								size="sm"
								onClick={() =>
									updateTaskStatus(task.id, "PUBLISHED")
								}
							>
								发布
							</Button>
						)}
						{task.status === "PUBLISHED" && (
							<Button
								variant="outline"
								size="sm"
								onClick={() =>
									updateTaskStatus(task.id, "CANCELLED")
								}
							>
								取消
							</Button>
						)}
						<Button
							variant="destructive"
							size="sm"
							onClick={() => deleteTask(task.id)}
						>
							<Trash2 className="w-4 h-4" />
						</Button>
					</div>
				</TableCell>
			</TableRow>
		);
	};

	return (
		<div className="space-y-8">
			{/* 页头 */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
						任务管理中心
					</h1>
					<p className="text-muted-foreground mt-2">
						管理社区贡献任务的发布、审核和统计
					</p>
				</div>
				<Button asChild>
					<a href="/app/tasks/create">
						<Plus className="w-4 h-4 mr-2" />
						创建任务
					</a>
				</Button>
			</div>

			{/* 统计卡片 */}
			{stats && (
				<div className="grid grid-cols-1 md:grid-cols-4 gap-6">
					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-sm font-medium">
								总任务数
							</CardTitle>
							<CheckSquare className="h-4 w-4 text-muted-foreground" />
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold">
								{stats.totalTasks}
							</div>
						</CardContent>
					</Card>
					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-sm font-medium">
								已发布
							</CardTitle>
							<CheckCircle className="h-4 w-4 text-muted-foreground" />
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold">
								{stats.publishedTasks}
							</div>
						</CardContent>
					</Card>
					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-sm font-medium">
								已完成
							</CardTitle>
							<CheckCircle className="h-4 w-4 text-green-500" />
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold">
								{stats.completedTasks}
							</div>
						</CardContent>
					</Card>
					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-sm font-medium">
								待审核
							</CardTitle>
							<Clock className="h-4 w-4 text-yellow-500" />
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold">
								{stats.pendingSubmissions}
							</div>
						</CardContent>
					</Card>
				</div>
			)}

			{/* 任务列表 */}
			<Tabs defaultValue="ALL" className="space-y-6">
				<TabsList className="grid w-fit grid-cols-5">
					<TabsTrigger value="ALL" onClick={() => fetchTasks("ALL")}>
						全部
					</TabsTrigger>
					<TabsTrigger
						value="DRAFT"
						onClick={() => fetchTasks("DRAFT")}
					>
						草稿
					</TabsTrigger>
					<TabsTrigger
						value="PUBLISHED"
						onClick={() => fetchTasks("PUBLISHED")}
					>
						已发布
					</TabsTrigger>
					<TabsTrigger
						value="COMPLETED"
						onClick={() => fetchTasks("COMPLETED")}
					>
						已完成
					</TabsTrigger>
					<TabsTrigger
						value="CANCELLED"
						onClick={() => fetchTasks("CANCELLED")}
					>
						已取消
					</TabsTrigger>
				</TabsList>

				<TabsContent value="ALL" className="space-y-6">
					<Card>
						<CardHeader>
							<CardTitle>任务列表</CardTitle>
							<CardDescription>
								管理所有社区贡献任务
							</CardDescription>
						</CardHeader>
						<CardContent>
							{loading ? (
								<div className="text-center py-8">
									加载中...
								</div>
							) : tasks.length > 0 ? (
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>任务标题</TableHead>
											<TableHead>分类</TableHead>
											<TableHead>状态</TableHead>
											<TableHead>优先级</TableHead>
											<TableHead className="text-center">
												参与人数
											</TableHead>
											<TableHead className="text-center">
												CP奖励
											</TableHead>
											<TableHead>截止时间</TableHead>
											<TableHead>操作</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{tasks.map((task) => (
											<TaskRow
												key={task.id}
												task={task}
											/>
										))}
									</TableBody>
								</Table>
							) : (
								<div className="text-center py-8 text-gray-500">
									暂无任务记录
								</div>
							)}
						</CardContent>
					</Card>
				</TabsContent>

				{/* 其他状态标签页内容与ALL相同，只是数据不同 */}
				{["DRAFT", "PUBLISHED", "COMPLETED", "CANCELLED"].map(
					(status) => (
						<TabsContent
							key={status}
							value={status}
							className="space-y-6"
						>
							<Card>
								<CardHeader>
									<CardTitle>
										{
											STATUS_CONFIG[
												status as keyof typeof STATUS_CONFIG
											]?.label
										}
										任务
									</CardTitle>
									<CardDescription>
										管理
										{
											STATUS_CONFIG[
												status as keyof typeof STATUS_CONFIG
											]?.label
										}
										状态的任务
									</CardDescription>
								</CardHeader>
								<CardContent>
									{loading ? (
										<div className="text-center py-8">
											加载中...
										</div>
									) : tasks.length > 0 ? (
										<Table>
											<TableHeader>
												<TableRow>
													<TableHead>
														任务标题
													</TableHead>
													<TableHead>分类</TableHead>
													<TableHead>状态</TableHead>
													<TableHead>
														优先级
													</TableHead>
													<TableHead className="text-center">
														参与人数
													</TableHead>
													<TableHead className="text-center">
														CP奖励
													</TableHead>
													<TableHead>
														截止时间
													</TableHead>
													<TableHead>操作</TableHead>
												</TableRow>
											</TableHeader>
											<TableBody>
												{tasks.map((task) => (
													<TaskRow
														key={task.id}
														task={task}
													/>
												))}
											</TableBody>
										</Table>
									) : (
										<div className="text-center py-8 text-gray-500">
											暂无
											{
												STATUS_CONFIG[
													status as keyof typeof STATUS_CONFIG
												]?.label
											}
											任务
										</div>
									)}
								</CardContent>
							</Card>
						</TabsContent>
					),
				)}
			</Tabs>

			{/* 任务详情对话框 */}
			{selectedTask && (
				<Dialog
					open={isDetailDialogOpen}
					onOpenChange={setIsDetailDialogOpen}
				>
					<DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
						<DialogHeader>
							<DialogTitle>{selectedTask.title}</DialogTitle>
							<DialogDescription>
								任务详情和参与情况
							</DialogDescription>
						</DialogHeader>
						<div className="space-y-6">
							{/* 基本信息 */}
							<div className="grid grid-cols-2 gap-4">
								<div>
									<Label>状态</Label>
									<Badge
										className={
											STATUS_CONFIG[
												selectedTask.status as keyof typeof STATUS_CONFIG
											]?.color
										}
									>
										{
											STATUS_CONFIG[
												selectedTask.status as keyof typeof STATUS_CONFIG
											]?.label
										}
									</Badge>
								</div>
								<div>
									<Label>优先级</Label>
									<Badge
										className={
											PRIORITY_CONFIG[
												selectedTask.priority as keyof typeof PRIORITY_CONFIG
											]?.color
										}
									>
										{
											PRIORITY_CONFIG[
												selectedTask.priority as keyof typeof PRIORITY_CONFIG
											]?.label
										}
									</Badge>
								</div>
								<div>
									<Label>CP奖励</Label>
									<div className="font-semibold text-primary">
										{selectedTask.cpReward} CP
									</div>
								</div>
								<div>
									<Label>参与人数</Label>
									<div>
										{selectedTask.currentParticipants}
										{selectedTask.maxParticipants
											? `/${selectedTask.maxParticipants}`
											: ""}
									</div>
								</div>
							</div>

							{/* 描述 */}
							<div>
								<Label>任务描述</Label>
								<div className="mt-1 p-3 bg-gray-50 rounded-md">
									{selectedTask.description}
								</div>
							</div>

							{/* 参与者列表 */}
							{selectedTask.assignments.length > 0 && (
								<div>
									<Label>
										参与者 (
										{selectedTask.assignments.length})
									</Label>
									<div className="mt-2 space-y-2">
										{selectedTask.assignments.map(
											(assignment) => (
												<div
													key={assignment.id}
													className="flex items-center justify-between p-2 bg-gray-50 rounded"
												>
													<div>
														<div className="font-medium">
															{
																assignment.user
																	.name
															}
														</div>
														<div className="text-sm text-gray-500">
															{
																assignment.user
																	.email
															}
														</div>
													</div>
													<div className="text-right">
														<Badge
															variant={
																assignment.status ===
																"COMPLETED"
																	? "default"
																	: "secondary"
															}
														>
															{assignment.status ===
															"CLAIMED"
																? "已领取"
																: assignment.status ===
																		"SUBMITTED"
																	? "已提交"
																	: assignment.status ===
																			"COMPLETED"
																		? "已完成"
																		: assignment.status}
														</Badge>
														<div className="text-xs text-gray-500">
															{format(
																new Date(
																	assignment.claimedAt,
																),
																"MM-dd HH:mm",
															)}
														</div>
													</div>
												</div>
											),
										)}
									</div>
								</div>
							)}
						</div>
					</DialogContent>
				</Dialog>
			)}
		</div>
	);
}
