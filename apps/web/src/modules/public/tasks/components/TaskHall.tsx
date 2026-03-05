"use client";

import { useEffect, useState } from "react";
import { Button } from "@community/ui/ui/button";
import { Card } from "@community/ui/ui/card";
import { Input } from "@community/ui/ui/input";
import { UserAvatar } from "@community/ui/shared/UserAvatar";
import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";
import { Building, Clock, Coins, Search, Star } from "lucide-react";
import Link from "next/link";
import { CardSkeleton } from "@/modules/public/shared/components/CardSkeleton";
import { EmptyState } from "@/modules/public/shared/components/EmptyState";

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

const TASK_CATEGORIES: Record<string, string> = {
	COMMUNITY_SERVICE: "社区服务",
	CONTENT_CREATION: "内容创作",
	PRODUCT_TECH: "产品技术",
	OPERATION_PROMOTION: "运营推广",
	OTHER: "其他",
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

function TaskCard({ task }: { task: Task }) {
	const categoryLabel = TASK_CATEGORIES[task.category] || task.category;
	const priorityInfo = TASK_PRIORITY[task.priority];
	const isExpiringSoon =
		task.deadline &&
		new Date(task.deadline) <
			new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);

	return (
		<Card className="group w-full cursor-pointer overflow-hidden rounded-lg border border-border bg-card p-0 shadow-subtle transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift">
			<Link
				href={`/tasks/${task.id}`}
				className="flex min-h-[44px] flex-col"
			>
				{/* Header with badges */}
				<div className="flex flex-wrap items-center gap-1.5 border-b border-border/50 px-3 pt-3 pb-2">
					{task.featured && (
						<span className="rounded-md bg-black/80 px-2 py-0.5 text-[10px] font-bold uppercase tracking-tight text-white shadow-sm backdrop-blur border border-white/10">
							精选
						</span>
					)}
					<span className="rounded border border-border bg-white/90 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-tight text-foreground/80">
						{categoryLabel}
					</span>
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
				<div className="flex flex-1 flex-col p-3">
					{/* Title */}
					<h3 className="mb-1 line-clamp-1 font-brand text-base font-bold leading-tight text-foreground transition-colors group-hover:text-foreground/70">
						{task.title}
					</h3>

					{/* Description */}
					<p className="mb-2 line-clamp-2 text-xs text-muted-foreground">
						{task.description}
					</p>

					{/* Tags */}
					{task.tags?.length > 0 && (
						<div className="mb-2 flex flex-wrap gap-1">
							{task.tags.slice(0, 3).map((tag) => (
								<span
									key={tag}
									className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground"
								>
									{tag}
								</span>
							))}
							{task.tags.length > 3 && (
								<span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
									+{task.tags.length - 3}
								</span>
							)}
						</div>
					)}

					{/* Deadline */}
					{task.deadline && (
						<div
							className={`mb-2 flex items-center gap-1 font-mono text-[11px] ${isExpiringSoon ? "text-red-600" : "text-muted-foreground"}`}
						>
							<Clock className="h-3 w-3" />
							<span>
								{isExpiringSoon ? "即将截止" : "截止"}：
								{formatDistanceToNow(new Date(task.deadline), {
									addSuffix: true,
									locale: zhCN,
								})}
							</span>
						</div>
					)}

					{/* Footer */}
					<div className="mt-auto flex items-center justify-between border-t border-border/50 pt-2">
						<div className="flex items-center gap-2 truncate">
							<UserAvatar
								name={task.publisher.name}
								avatarUrl={task.publisher.image}
								className="h-5 w-5"
							/>
							<span className="truncate text-[10px] font-medium text-muted-foreground">
								{task.organization?.name || task.publisher.name}
							</span>
						</div>
						<span className="text-[10px] font-mono text-muted-foreground">
							{formatDistanceToNow(new Date(task.createdAt), {
								addSuffix: true,
								locale: zhCN,
							})}
						</span>
					</div>
				</div>
			</Link>
		</Card>
	);
}

function TaskCardCompact({ task }: { task: Task }) {
	const categoryLabel = TASK_CATEGORIES[task.category] || task.category;
	const priorityInfo = TASK_PRIORITY[task.priority];
	const isExpiringSoon =
		task.deadline &&
		new Date(task.deadline) <
			new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);

	return (
		<Card className="group w-full overflow-hidden rounded-lg border border-border bg-card p-0 shadow-subtle transition-all duration-200 hover:shadow-lift">
			<Link href={`/tasks/${task.id}`} className="block min-h-[44px]">
				<div className="flex items-start gap-3 p-3">
					{/*积分 reward badge as visual anchor */}
					<div className="flex h-14 w-14 flex-shrink-0 flex-col items-center justify-center rounded-md border border-border bg-muted">
						<Coins className="mb-0.5 h-3.5 w-3.5 text-foreground" />
						<span className="font-mono text-xs font-bold text-foreground">
							{task.cpReward}
						</span>
					</div>

					<div className="min-w-0 flex-1 space-y-1">
						{/* Badges row */}
						<div className="flex flex-wrap items-center gap-1">
							{task.featured && (
								<span className="rounded bg-black/80 px-1 py-0.5 text-[8px] font-bold uppercase text-white backdrop-blur">
									精选
								</span>
							)}
							<span className="rounded border border-border bg-white/90 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-tight text-foreground/80">
								{categoryLabel}
							</span>
							{priorityInfo && task.priority !== "NORMAL" && (
								<span
									className={`rounded border px-1.5 py-0.5 text-[10px] font-bold ${priorityInfo.className}`}
								>
									{priorityInfo.label}
								</span>
							)}
						</div>

						{/* Title */}
						<h3 className="line-clamp-1 font-brand text-sm font-bold leading-tight text-foreground">
							{task.title}
						</h3>

						{/* Meta */}
						<div className="flex items-center gap-3 font-mono text-[11px] text-muted-foreground">
							{task.deadline && (
								<span
									className={`flex items-center gap-1 ${isExpiringSoon ? "text-red-600" : ""}`}
								>
									<Clock className="h-3 w-3" />
									<span className="truncate">
										{formatDistanceToNow(
											new Date(task.deadline),
											{
												addSuffix: true,
												locale: zhCN,
											},
										)}
									</span>
								</span>
							)}
							<span className="flex items-center gap-1">
								<Building className="h-3 w-3" />
								<span className="max-w-[120px] truncate">
									{task.organization?.name ||
										task.publisher.name}
								</span>
							</span>
						</div>
					</div>
				</div>
			</Link>
		</Card>
	);
}

export function TaskHall() {
	const [tasks, setTasks] = useState<Task[]>([]);
	const [featuredTasks, setFeaturedTasks] = useState<Task[]>([]);
	const [loading, setLoading] = useState(true);
	const [searchTerm, setSearchTerm] = useState("");
	const [selectedCategory, setSelectedCategory] = useState<string>("all");
	const [selectedStatus, setSelectedStatus] = useState<string>("open");

	const fetchTasks = async () => {
		try {
			setLoading(true);
			const params = new URLSearchParams({
				status:
					selectedStatus === "completed"
						? "COMPLETED,PUBLISHED"
						: "PUBLISHED",
				organizationId: "null",
				limit: "20",
			});

			if (searchTerm) {
				params.append("search", searchTerm);
			}
			if (selectedCategory !== "all") {
				params.append("category", selectedCategory);
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
	}, [searchTerm, selectedCategory, selectedStatus]);

	const statusOptions = [
		{ value: "open", label: "进行中" },
		{ value: "completed", label: "已完成" },
	];

	const categoryOptions = [
		{ value: "all", label: "全部" },
		...Object.entries(TASK_CATEGORIES).map(([key, label]) => ({
			value: key,
			label,
		})),
	];

	return (
		<div className="space-y-4">
			{/* Status filter pills */}
			<div className="flex items-center gap-2 overflow-x-auto pb-1">
				{statusOptions.map((option) => (
					<Button
						key={option.value}
						variant={
							selectedStatus === option.value
								? "default"
								: "outline"
						}
						size="sm"
						onClick={() => setSelectedStatus(option.value)}
						className="flex-shrink-0 rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-wider"
					>
						{option.label}
					</Button>
				))}

				{/* Divider */}
				<div className="mx-1 h-4 w-px bg-border" />

				{/* Category pills */}
				{categoryOptions.map((option) => (
					<Button
						key={option.value}
						variant={
							selectedCategory === option.value
								? "default"
								: "outline"
						}
						size="sm"
						onClick={() => setSelectedCategory(option.value)}
						className="flex-shrink-0 rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-wider"
					>
						{option.label}
					</Button>
				))}
			</div>

			{/* Search */}
			<div className="relative">
				<Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
				<Input
					placeholder="搜索任务标题或描述..."
					value={searchTerm}
					onChange={(e) => setSearchTerm(e.target.value)}
					className="h-9 rounded-lg border-border pl-9 text-sm"
				/>
			</div>

			{/* Featured tasks */}
			{featuredTasks.length > 0 && (
				<div>
					<div className="mb-3 flex items-center gap-3">
						<h3 className="flex items-center gap-1.5 font-brand text-sm font-bold uppercase tracking-wide text-muted-foreground">
							<Star className="h-3.5 w-3.5" />
							精选任务
						</h3>
						<div className="h-px flex-1 bg-border/50" />
					</div>
					{/* Desktop grid */}
					<div className="hidden gap-4 sm:grid sm:grid-cols-2 lg:grid-cols-3">
						{featuredTasks.map((task) => (
							<TaskCard key={task.id} task={task} />
						))}
					</div>
					{/* Mobile compact list */}
					<div className="flex flex-col gap-3 sm:hidden">
						{featuredTasks.map((task) => (
							<TaskCardCompact key={task.id} task={task} />
						))}
					</div>
				</div>
			)}

			{/* All tasks */}
			<div>
				<div className="mb-3 flex items-center justify-between">
					<div className="flex items-center gap-3 flex-1">
						<h3 className="font-brand text-sm font-bold uppercase tracking-wide text-muted-foreground">
							所有任务
						</h3>
						<div className="h-px flex-1 bg-border/50" />
					</div>
					<Button
						asChild
						size="sm"
						variant="pill"
						className="ml-3 hidden sm:inline-flex"
					>
						<Link href="/tasks/create">发布任务</Link>
					</Button>
				</div>

				{loading ? (
					<CardSkeleton className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3" />
				) : tasks.length > 0 ? (
					<>
						{/* Desktop grid */}
						<div className="hidden gap-4 sm:grid sm:grid-cols-2 lg:grid-cols-3">
							{tasks.map((task) => (
								<TaskCard key={task.id} task={task} />
							))}
						</div>
						{/* Mobile compact list */}
						<div className="flex flex-col gap-3 sm:hidden">
							{tasks.map((task) => (
								<TaskCardCompact key={task.id} task={task} />
							))}
						</div>
					</>
				) : (
					<EmptyState
						title="暂无任务"
						description={
							searchTerm || selectedCategory !== "all"
								? "没有找到符合条件的任务"
								: "还没有发布的任务"
						}
						action={
							<Button asChild variant="pill">
								<Link href="/tasks/create">发布第一个任务</Link>
							</Button>
						}
					/>
				)}
			</div>
		</div>
	);
}
