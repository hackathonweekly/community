"use client";

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
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useEffect, useState } from "react";

import { Separator } from "@/components/ui/separator";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";
import { Building, Clock, Coins, Search, Star, Info } from "lucide-react";
import Link from "next/link";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

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
	publisher: {
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

export function TaskHall() {
	const [tasks, setTasks] = useState<Task[]>([]);
	const [featuredTasks, setFeaturedTasks] = useState<Task[]>([]);
	const [loading, setLoading] = useState(true);
	const [searchTerm, setSearchTerm] = useState("");
	const [selectedCategory, setSelectedCategory] = useState<string>("all");
	const [selectedPriority, setSelectedPriority] = useState<string>("all");
	const [showCompleted, setShowCompleted] = useState(false);

	// 获取任务列表
	const fetchTasks = async () => {
		try {
			setLoading(true);
			const params = new URLSearchParams({
				status: showCompleted ? "COMPLETED,PUBLISHED" : "PUBLISHED",
				organizationId: "null", // 只获取全局任务
				limit: "20",
			});

			if (searchTerm) {
				params.append("search", searchTerm);
			}
			if (selectedCategory !== "all") {
				params.append("category", selectedCategory);
			}
			if (selectedPriority !== "all") {
				params.append("priority", selectedPriority);
			}

			const response = await fetch(`/api/tasks?${params}`);
			if (response.ok) {
				const data = await response.json();
				setTasks(data.tasks || []);
			}
		} catch (error) {
			console.error("获取任务失败:", error);
		} finally {
			setLoading(false);
		}
	};

	// 获取精选任务
	const fetchFeaturedTasks = async () => {
		try {
			const response = await fetch(
				"/api/tasks/featured?organizationId=null",
			);
			if (response.ok) {
				const data = await response.json();
				setFeaturedTasks(data.tasks || []);
			}
		} catch (error) {
			console.error("获取精选任务失败:", error);
		}
	};

	useEffect(() => {
		fetchTasks();
		fetchFeaturedTasks();
	}, [searchTerm, selectedCategory, selectedPriority, showCompleted]);

	// 任务卡片组件
	const TaskCard = ({
		task,
		featured = false,
	}: { task: Task; featured?: boolean }) => {
		const categoryInfo =
			TASK_CATEGORIES[task.category as keyof typeof TASK_CATEGORIES];
		const priorityInfo =
			TASK_PRIORITY[task.priority as keyof typeof TASK_PRIORITY];
		const isExpiringSoon =
			task.deadline &&
			new Date(task.deadline) <
				new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);

		return (
			<Card
				className={`h-full transition-all duration-200 hover:shadow-md ${featured ? "border-yellow-200 bg-yellow-50/50" : ""}`}
			>
				<CardHeader className="pb-3">
					<div className="flex items-start justify-between">
						<div className="flex-1">
							<div className="flex items-center gap-2 mb-2">
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
									{categoryInfo?.label || task.category}
								</Badge>
								<span
									className={`text-xs font-medium ${priorityInfo?.color || "text-gray-500"}`}
								>
									{priorityInfo?.label || task.priority}
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
					{/* 标签 */}
					{task.tags?.length > 0 && (
						<div className="flex flex-wrap gap-1 mb-3">
							{task.tags.slice(0, 3).map((tag) => (
								<Badge
									key={tag}
									variant="outline"
									className="text-xs"
								>
									{tag}
								</Badge>
							))}
							{task.tags.length > 3 && (
								<Badge variant="outline" className="text-xs">
									+{task.tags.length - 3}
								</Badge>
							)}
						</div>
					)}

					{/* 截止时间 */}
					{task.deadline && (
						<div
							className={`flex items-center gap-1 text-xs mb-2 ${isExpiringSoon ? "text-red-500" : "text-gray-500"}`}
						>
							<Clock className="w-3 h-3" />
							<span>
								{isExpiringSoon ? "即将截止" : "截止"}：
								{formatDistanceToNow(new Date(task.deadline), {
									addSuffix: true,
									locale: zhCN,
								})}
							</span>
						</div>
					)}

					{/* 发布者信息 */}
					<div className="flex items-center gap-2 text-xs text-gray-600">
						<UserAvatar
							name={task.publisher.name}
							avatarUrl={task.publisher.image}
							className="w-5 h-5"
						/>
						<span>{task.publisher.name}</span>
						{task.organization && (
							<>
								<Separator
									orientation="vertical"
									className="h-3"
								/>
								<Building className="w-3 h-3" />
								<span>{task.organization.name}</span>
							</>
						)}
					</div>
				</CardContent>

				<CardFooter className="pt-3">
					<div className="flex items-center justify-between w-full">
						<span className="text-xs text-gray-500">
							{formatDistanceToNow(new Date(task.createdAt), {
								addSuffix: true,
								locale: zhCN,
							})}
						</span>
						<Button asChild size="sm">
							<Link href={`/tasks/${task.id}`}>查看详情</Link>
						</Button>
					</div>
				</CardFooter>
			</Card>
		);
	};

	return (
		<div className="space-y-8">
			{/* 内测提示 */}
			<Alert className="border-orange-200 bg-orange-50">
				<Info className="h-4 w-4 text-orange-600" />
				<AlertTitle className="text-orange-800">内测阶段</AlertTitle>
				<AlertDescription className="text-orange-700">
					任务系统目前处于内测阶段，功能仍在完善中。内测期间的数据可能不会保留，感谢您的参与和反馈！
				</AlertDescription>
			</Alert>

			{/* 精选任务区域 */}
			{featuredTasks.length > 0 && (
				<div className="mb-8">
					<h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
						<Star className="w-5 h-5 text-yellow-500" />
						精选任务
					</h2>
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
						{featuredTasks.map((task) => (
							<TaskCard key={task.id} task={task} featured />
						))}
					</div>
				</div>
			)}

			{/* 搜索和筛选 */}
			<div className="mb-6">
				<div className="flex flex-col sm:flex-row gap-4">
					<div className="relative flex-1">
						<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
						<Input
							placeholder="搜索任务标题或描述..."
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
							className="pl-10"
						/>
					</div>
					<div className="flex gap-2">
						<Select
							value={selectedCategory}
							onValueChange={setSelectedCategory}
						>
							<SelectTrigger className="w-[140px]">
								<SelectValue placeholder="选择分类" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">全部分类</SelectItem>
								{Object.entries(TASK_CATEGORIES).map(
									([key, value]) => (
										<SelectItem key={key} value={key}>
											{value.label}
										</SelectItem>
									),
								)}
							</SelectContent>
						</Select>
						<Select
							value={selectedPriority}
							onValueChange={setSelectedPriority}
						>
							<SelectTrigger className="w-[120px]">
								<SelectValue placeholder="优先级" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">全部优先级</SelectItem>
								{Object.entries(TASK_PRIORITY).map(
									([key, value]) => (
										<SelectItem key={key} value={key}>
											{value.label}
										</SelectItem>
									),
								)}
							</SelectContent>
						</Select>
						<div className="flex items-center space-x-2 px-3 py-2 border rounded-md">
							<Checkbox
								id="show-completed"
								checked={showCompleted}
								onCheckedChange={(checked) =>
									setShowCompleted(checked === true)
								}
							/>
							<Label
								htmlFor="show-completed"
								className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
							>
								显示已完成
							</Label>
						</div>
					</div>
				</div>
			</div>

			{/* 任务列表 */}
			<div className="space-y-6">
				<div className="flex items-center justify-between">
					<h2 className="text-xl font-semibold text-gray-900">
						所有任务
					</h2>
					<Button asChild variant="outline">
						<Link href="/tasks/create">发布任务</Link>
					</Button>
				</div>

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
				) : tasks.length > 0 ? (
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
						{tasks.map((task) => (
							<TaskCard key={task.id} task={task} />
						))}
					</div>
				) : (
					<div className="text-center py-12">
						<div className="text-gray-400 text-lg mb-2">
							暂无任务
						</div>
						<p className="text-gray-500 mb-4">
							{searchTerm ||
							selectedCategory !== "all" ||
							selectedPriority !== "all"
								? "没有找到符合条件的任务"
								: "还没有发布的任务"}
						</p>
						<Button asChild>
							<Link href="/tasks/create">发布第一个任务</Link>
						</Button>
					</div>
				)}
			</div>
		</div>
	);
}
