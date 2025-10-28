import { useSession } from "@dashboard/auth/hooks/use-session";
import { useTranslations } from "next-intl";
import {
	Calendar,
	Target,
	Clock,
	CheckCircle,
	AlertCircle,
	Users,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

// 模拟数据接口
interface UpcomingEvent {
	id: string;
	title: string;
	date: string;
	type: "hackathon" | "workshop" | "meetup";
	daysUntil: number;
}

interface Task {
	id: string;
	title: string;
	description: string;
	progress: number;
	status: "pending" | "in_progress" | "completed";
	deadline?: string;
	points?: number;
}

export function RecentActivity() {
	const { user } = useSession();
	const t = useTranslations();
	const [upcomingEvents, setUpcomingEvents] = useState<UpcomingEvent[]>([]);
	const [tasks, setTasks] = useState<Task[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	// 模拟数据加载
	useEffect(() => {
		// 这里应该调用实际的API获取数据
		// 目前使用模拟数据
		const mockEvents: UpcomingEvent[] = [
			{
				id: "1",
				title: "黑客松决赛",
				date: "2024-10-18",
				type: "hackathon",
				daysUntil: 2,
			},
			{
				id: "2",
				title: "周末技术分享会",
				date: "2024-10-17",
				type: "workshop",
				daysUntil: 1,
			},
			{
				id: "3",
				title: "AI项目Workshop",
				date: "2024-10-20",
				type: "meetup",
				daysUntil: 4,
			},
		];

		const mockTasks: Task[] = [
			{
				id: "1",
				title: "完善个人资料",
				description: "添加技能标签和个人简介",
				progress: 80,
				status: "in_progress",
				points: 20,
			},
			{
				id: "2",
				title: "提交项目作品",
				description: "完成本周黑客松项目提交",
				progress: 60,
				status: "in_progress",
				deadline: "2024-10-18",
				points: 50,
			},
			{
				id: "3",
				title: "参与社区投票",
				description: "为优秀项目投票",
				progress: 100,
				status: "completed",
				points: 10,
			},
		];

		setUpcomingEvents(mockEvents);
		setTasks(mockTasks);
		setIsLoading(false);
	}, [user?.id]);

	// 获取事件类型图标和颜色
	function getEventTypeInfo(type: string) {
		switch (type) {
			case "hackathon":
				return {
					icon: Calendar,
					color: "text-green-600 bg-green-50 border-green-200",
					label: "黑客松",
				};
			case "workshop":
				return {
					icon: Users,
					color: "text-blue-600 bg-blue-50 border-blue-200",
					label: "工作坊",
				};
			case "meetup":
				return {
					icon: Calendar,
					color: "text-purple-600 bg-purple-50 border-purple-200",
					label: "聚会",
				};
			default:
				return {
					icon: Calendar,
					color: "text-gray-600 bg-gray-50 border-gray-200",
					label: "活动",
				};
		}
	}

	// 获取任务状态图标和颜色
	function getTaskStatusInfo(status: string) {
		switch (status) {
			case "completed":
				return {
					icon: CheckCircle,
					color: "text-green-600",
					bgColor: "bg-green-50",
				};
			case "in_progress":
				return {
					icon: Clock,
					color: "text-blue-600",
					bgColor: "bg-blue-50",
				};
			case "pending":
				return {
					icon: AlertCircle,
					color: "text-orange-600",
					bgColor: "bg-orange-50",
				};
			default:
				return {
					icon: Clock,
					color: "text-gray-600",
					bgColor: "bg-gray-50",
				};
		}
	}

	// 格式化天数显示
	function formatDaysUntil(days: number) {
		if (days === 0) return "今天";
		if (days === 1) return "明天";
		return `${days}天后`;
	}

	if (isLoading) {
		return <RecentActivitySkeleton />;
	}

	return (
		<div className="bg-white rounded-xl border border-gray-200 p-3 sm:p-4">
			<h3 className="text-sm font-medium text-gray-900 mb-3 sm:mb-4">
				最新动态
			</h3>

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
				{/* 左栏：即将开始的活动 */}
				<div>
					<h4 className="text-xs sm:text-sm font-medium text-gray-700 mb-2 sm:mb-3 flex items-center gap-2">
						<Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
						即将开始的活动
					</h4>
					<div className="space-y-2 sm:space-y-3">
						{upcomingEvents.slice(0, 3).map((event) => {
							const typeInfo = getEventTypeInfo(event.type);
							const Icon = typeInfo.icon;

							return (
								<Link
									key={event.id}
									href={`/app/events/${event.id}`}
									className="group block p-2 sm:p-3 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors"
								>
									<div className="flex items-start gap-2 sm:gap-3">
										<div
											className={`w-6 h-6 sm:w-8 sm:h-8 rounded-lg ${typeInfo.color} flex items-center justify-center flex-shrink-0`}
										>
											<Icon className="h-3 w-3 sm:h-4 sm:w-4" />
										</div>
										<div className="flex-1 min-w-0">
											<div className="flex items-center justify-between gap-2 mb-1">
												<span className="text-xs sm:text-sm font-medium text-gray-900 truncate">
													{event.title}
												</span>
												<span className="text-xs text-blue-600 font-medium whitespace-nowrap">
													{formatDaysUntil(
														event.daysUntil,
													)}
												</span>
											</div>
											<div className="flex items-center gap-2">
												<span
													className={`text-xs px-1.5 py-0.5 rounded-full ${typeInfo.color}`}
												>
													{typeInfo.label}
												</span>
												<span className="text-xs text-gray-500">
													{event.date}
												</span>
											</div>
										</div>
									</div>
								</Link>
							);
						})}
					</div>

					{/* 查看更多活动链接 */}
					<Link
						href="/app/events"
						className="mt-3 inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium"
					>
						查看所有活动
						<svg
							className="w-3 h-3"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M9 5l7 7-7 7"
							/>
						</svg>
					</Link>
				</div>

				{/* 右栏：待完成任务 */}
				<div>
					<h4 className="text-xs sm:text-sm font-medium text-gray-700 mb-2 sm:mb-3 flex items-center gap-2">
						<Target className="h-3 w-3 sm:h-4 sm:w-4" />
						待完成任务
					</h4>
					<div className="space-y-2 sm:space-y-3">
						{tasks.slice(0, 3).map((task) => {
							const statusInfo = getTaskStatusInfo(task.status);
							const Icon = statusInfo.icon;

							return (
								<div
									key={task.id}
									className="p-2 sm:p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
								>
									<div className="flex items-start gap-2 sm:gap-3">
										<div
											className={`w-6 h-6 sm:w-8 sm:h-8 rounded-lg ${statusInfo.bgColor} flex items-center justify-center flex-shrink-0`}
										>
											<Icon
												className={`h-3 w-3 sm:h-4 sm:w-4 ${statusInfo.color}`}
											/>
										</div>
										<div className="flex-1 min-w-0">
											<div className="flex items-center justify-between gap-2 mb-1">
												<span className="text-xs sm:text-sm font-medium text-gray-900 truncate">
													{task.title}
												</span>
												{task.points && (
													<span className="text-xs text-orange-600 font-medium whitespace-nowrap">
														+{task.points}CP
													</span>
												)}
											</div>
											<p className="text-xs text-gray-600 mb-2 line-clamp-2">
												{task.description}
											</p>

											{/* 进度条 */}
											<div className="space-y-1">
												<div className="flex items-center justify-between text-xs text-gray-500">
													<span>进度</span>
													<span>
														{task.progress}%
													</span>
												</div>
												<div className="w-full bg-gray-200 rounded-full h-1.5">
													<div
														className={`h-1.5 rounded-full transition-all duration-300 ${
															task.status ===
															"completed"
																? "bg-green-500"
																: "bg-blue-500"
														}`}
														style={{
															width: `${task.progress}%`,
														}}
													/>
												</div>
											</div>

											{task.deadline && (
												<div className="mt-2 text-xs text-gray-500 flex items-center gap-1">
													<Clock className="h-3 w-3" />
													截止：{task.deadline}
												</div>
											)}
										</div>
									</div>
								</div>
							);
						})}
					</div>

					{/* 查看更多任务链接 */}
					<Link
						href="/app/tasks"
						className="mt-3 inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium"
					>
						查看所有任务
						<svg
							className="w-3 h-3"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M9 5l7 7-7 7"
							/>
						</svg>
					</Link>
				</div>
			</div>
		</div>
	);
}

function RecentActivitySkeleton() {
	return (
		<div className="bg-white rounded-xl border border-gray-200 p-3 sm:p-4">
			<h3 className="text-sm font-medium text-gray-900 mb-3 sm:mb-4">
				<div className="h-4 w-16 bg-gray-200 animate-pulse rounded" />
			</h3>

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
				{/* 左栏骨架 */}
				<div>
					<div className="flex items-center gap-2 mb-2 sm:mb-3">
						<div className="h-3 w-3 sm:h-4 sm:w-4 bg-gray-200 animate-pulse rounded" />
						<div className="h-3 w-20 bg-gray-200 animate-pulse rounded" />
					</div>
					<div className="space-y-2 sm:space-y-3">
						{Array.from({ length: 3 }).map((_, index) => (
							<div
								key={index}
								className="p-2 sm:p-3 rounded-lg border border-gray-200"
							>
								<div className="flex items-start gap-2 sm:gap-3">
									<div className="w-6 h-6 sm:w-8 sm:h-8 bg-gray-200 animate-pulse rounded-lg flex-shrink-0" />
									<div className="flex-1 space-y-2">
										<div className="flex items-center justify-between gap-2">
											<div className="h-3 w-24 bg-gray-200 animate-pulse rounded" />
											<div className="h-3 w-12 bg-gray-200 animate-pulse rounded" />
										</div>
										<div className="flex items-center gap-2">
											<div className="h-3 w-16 bg-gray-200 animate-pulse rounded-full" />
											<div className="h-3 w-20 bg-gray-200 animate-pulse rounded" />
										</div>
									</div>
								</div>
							</div>
						))}
					</div>
				</div>

				{/* 右栏骨架 */}
				<div>
					<div className="flex items-center gap-2 mb-2 sm:mb-3">
						<div className="h-3 w-3 sm:h-4 sm:w-4 bg-gray-200 animate-pulse rounded" />
						<div className="h-3 w-16 bg-gray-200 animate-pulse rounded" />
					</div>
					<div className="space-y-2 sm:space-y-3">
						{Array.from({ length: 3 }).map((_, index) => (
							<div
								key={index}
								className="p-2 sm:p-3 rounded-lg border border-gray-200"
							>
								<div className="flex items-start gap-2 sm:gap-3">
									<div className="w-6 h-6 sm:w-8 sm:h-8 bg-gray-200 animate-pulse rounded-lg flex-shrink-0" />
									<div className="flex-1 space-y-2">
										<div className="flex items-center justify-between gap-2">
											<div className="h-3 w-20 bg-gray-200 animate-pulse rounded" />
											<div className="h-3 w-8 bg-gray-200 animate-pulse rounded" />
										</div>
										<div className="h-3 w-full bg-gray-200 animate-pulse rounded" />
										<div className="h-2 w-full bg-gray-200 animate-pulse rounded" />
										<div className="h-2 w-3/4 bg-gray-200 animate-pulse rounded" />
									</div>
								</div>
							</div>
						))}
					</div>
				</div>
			</div>
		</div>
	);
}
