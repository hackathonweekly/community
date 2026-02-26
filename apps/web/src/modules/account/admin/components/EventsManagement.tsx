"use client";

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
import { Badge } from "@community/ui/ui/badge";
import { Button } from "@community/ui/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@community/ui/ui/card";
import { Input } from "@community/ui/ui/input";
import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";
import {
	Calendar,
	Clock,
	ExternalLink,
	Eye,
	MapPin,
	Search,
	Star,
	StarOff,
	Trash2,
	TrendingUp,
	Users,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

interface AdminEvent {
	id: string;
	shortId?: string;
	title: string;
	richContent: string;
	shortDescription?: string;
	type: string;
	status: string;
	startTime: string;
	endTime: string;
	isOnline: boolean;
	address?: string;
	maxAttendees?: number;
	registrationCount: number;
	organizerName: string;
	organizationName?: string;
	createdAt: string;
	featured: boolean;
}

interface EventStats {
	total: number;
	published: number;
	draft: number;
	cancelled: number;
	totalRegistrations: number;
}

export function EventsManagement() {
	const [events, setEvents] = useState<AdminEvent[]>([]);
	const [stats, setStats] = useState<EventStats>({
		total: 0,
		published: 0,
		draft: 0,
		cancelled: 0,
		totalRegistrations: 0,
	});
	const [loading, setLoading] = useState(true);
	const [searchTerm, setSearchTerm] = useState("");
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [eventToDelete, setEventToDelete] = useState<AdminEvent | null>(null);

	useEffect(() => {
		fetchEvents();
		fetchStats();
	}, []);

	const fetchEvents = async () => {
		try {
			const response = await fetch("/api/super-admin/events");
			if (response.ok) {
				const data = await response.json();
				setEvents(data);
			}
		} catch (error) {
			console.error("获取活动列表失败:", error);
		} finally {
			setLoading(false);
		}
	};

	const fetchStats = async () => {
		try {
			const response = await fetch("/api/super-admin/events/stats");
			if (response.ok) {
				const data = await response.json();
				setStats(data);
			}
		} catch (error) {
			console.error("获取活动统计失败:", error);
		}
	};

	const handleDeleteEvent = async (event: AdminEvent) => {
		setEventToDelete(event);
		setDeleteDialogOpen(true);
	};

	const confirmDelete = async () => {
		if (!eventToDelete) {
			return;
		}

		try {
			const response = await fetch(
				`/api/super-admin/events/${eventToDelete.id}`,
				{
					method: "DELETE",
				},
			);

			if (response.ok) {
				setEvents(events.filter((e) => e.id !== eventToDelete.id));
				fetchStats(); // 重新获取统计数据
			} else {
				alert("删除失败，请重试");
			}
		} catch (error) {
			console.error("删除活动失败:", error);
			alert("删除失败，请重试");
		} finally {
			setDeleteDialogOpen(false);
			setEventToDelete(null);
		}
	};

	const toggleFeatured = async (event: AdminEvent) => {
		try {
			const response = await fetch(
				`/api/super-admin/events/${event.id}/featured`,
				{
					method: "PATCH",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						featured: !event.featured,
					}),
				},
			);

			if (response.ok) {
				// 更新本地状态
				setEvents(
					events.map((e) =>
						e.id === event.id ? { ...e, featured: !e.featured } : e,
					),
				);
			} else {
				alert("更新精选状态失败，请重试");
			}
		} catch (error) {
			console.error("更新精选状态失败:", error);
			alert("更新精选状态失败，请重试");
		}
	};

	const filteredEvents = events.filter(
		(event) =>
			event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
			event.organizerName
				.toLowerCase()
				.includes(searchTerm.toLowerCase()) ||
			event.organizationName
				?.toLowerCase()
				.includes(searchTerm.toLowerCase()),
	);

	const getStatusBadge = (status: string) => {
		const statusMap = {
			PUBLISHED: { label: "已发布", variant: "default" as const },
			DRAFT: { label: "草稿", variant: "secondary" as const },
			CANCELLED: { label: "已取消", variant: "destructive" as const },
		};
		const statusInfo = statusMap[status as keyof typeof statusMap] || {
			label: status,
			variant: "outline" as const,
		};
		return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
	};

	const getTypeBadge = (type: string) => {
		const typeMap = {
			MEETUP: "常规活动",
			HACKATHON: "黑客马拉松",
		};
		return typeMap[type as keyof typeof typeMap] || type;
	};

	if (loading) {
		return (
			<div className="p-6">
				<Card>
					<CardContent className="flex items-center justify-center p-8">
						<div className="text-center">
							<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
							<p className="text-muted-foreground">加载中...</p>
						</div>
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
			{/* 统计卡片 */}
			<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
				<Card>
					<CardContent className="p-3 sm:p-4">
						<div className="flex items-center space-x-2">
							<Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
							<div className="min-w-0">
								<p className="text-xs sm:text-sm font-medium truncate">
									总活动数
								</p>
								<p className="text-xl sm:text-2xl font-bold">
									{stats.total}
								</p>
							</div>
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="p-3 sm:p-4">
						<div className="flex items-center space-x-2">
							<TrendingUp className="h-4 w-4 text-green-600 flex-shrink-0" />
							<div className="min-w-0">
								<p className="text-xs sm:text-sm font-medium truncate">
									已发布
								</p>
								<p className="text-xl sm:text-2xl font-bold text-green-600">
									{stats.published}
								</p>
							</div>
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="p-3 sm:p-4">
						<div className="flex items-center space-x-2">
							<Clock className="h-4 w-4 text-orange-600 flex-shrink-0" />
							<div className="min-w-0">
								<p className="text-xs sm:text-sm font-medium truncate">
									草稿
								</p>
								<p className="text-xl sm:text-2xl font-bold text-orange-600">
									{stats.draft}
								</p>
							</div>
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="p-3 sm:p-4">
						<div className="flex items-center space-x-2">
							<Users className="h-4 w-4 text-blue-600 flex-shrink-0" />
							<div className="min-w-0">
								<p className="text-xs sm:text-sm font-medium truncate">
									总报名数
								</p>
								<p className="text-xl sm:text-2xl font-bold text-blue-600">
									{stats.totalRegistrations}
								</p>
							</div>
						</div>
					</CardContent>
				</Card>
				<Card className="col-span-2 sm:col-span-1">
					<CardContent className="p-3 sm:p-4">
						<div className="flex items-center space-x-2">
							<Trash2 className="h-4 w-4 text-red-600 flex-shrink-0" />
							<div className="min-w-0">
								<p className="text-xs sm:text-sm font-medium truncate">
									已取消
								</p>
								<p className="text-xl sm:text-2xl font-bold text-red-600">
									{stats.cancelled}
								</p>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* 搜索和操作 */}
			<Card>
				<CardHeader>
					<CardTitle>活动管理</CardTitle>
					<CardDescription>
						管理所有社区活动，包括查看、删除等操作
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="flex items-center space-x-2 mb-4">
						<Search className="h-4 w-4 text-muted-foreground" />
						<Input
							placeholder="搜索活动标题、组织者或组织名称..."
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
							className="flex-1"
						/>
					</div>

					{/* 活动列表 */}
					<div className="space-y-4">
						{filteredEvents.length === 0 ? (
							<div className="text-center py-8 text-muted-foreground">
								{searchTerm ? "未找到匹配的活动" : "暂无活动"}
							</div>
						) : (
							filteredEvents.map((event) => (
								<Card key={event.id}>
									<CardContent className="p-4">
										<div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
											<div className="flex-1 space-y-3">
												<div className="flex flex-col sm:flex-row sm:items-center gap-2">
													<h3 className="font-semibold text-lg">
														{event.title}
													</h3>
													<div className="flex flex-wrap gap-2">
														{getStatusBadge(
															event.status,
														)}
														<Badge variant="outline">
															{getTypeBadge(
																event.type,
															)}
														</Badge>
														{event.featured && (
															<Badge
																variant="secondary"
																className="bg-yellow-100 text-yellow-800 border-yellow-200"
															>
																<Star className="w-3 h-3 mr-1" />
																精选
															</Badge>
														)}
													</div>
												</div>

												<p className="text-sm text-muted-foreground line-clamp-2">
													{event.richContent ||
														event.shortDescription}
												</p>

												<div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-muted-foreground">
													<div className="flex items-center space-x-1">
														<Calendar className="h-4 w-4 flex-shrink-0" />
														<span className="break-all">
															{new Date(
																event.startTime,
															).toLocaleString(
																"zh-CN",
															)}
														</span>
													</div>

													<div className="flex items-center space-x-1">
														{event.isOnline ? (
															<div className="flex items-center space-x-1">
																<ExternalLink className="h-4 w-4 flex-shrink-0" />
																<span>
																	线上活动
																</span>
															</div>
														) : (
															<div className="flex items-center space-x-1">
																<MapPin className="h-4 w-4 flex-shrink-0" />
																<span className="break-all">
																	{event.address ||
																		"线下活动"}
																</span>
															</div>
														)}
													</div>

													<div className="flex items-center space-x-1">
														<Users className="h-4 w-4 flex-shrink-0" />
														<span>
															{
																event.registrationCount
															}{" "}
															人报名
														</span>
														{event.maxAttendees && (
															<span>
																/{" "}
																{
																	event.maxAttendees
																}{" "}
																人限制
															</span>
														)}
													</div>
												</div>

												<div className="flex flex-col sm:flex-row gap-2 sm:gap-4 text-sm">
													<span className="break-all">
														组织者:{" "}
														<strong>
															{
																event.organizerName
															}
														</strong>
													</span>
													{event.organizationName && (
														<span className="break-all">
															组织:{" "}
															<strong>
																{
																	event.organizationName
																}
															</strong>
														</span>
													)}
													<span className="text-muted-foreground">
														创建于{" "}
														{formatDistanceToNow(
															new Date(
																event.createdAt,
															),
															{
																addSuffix: true,
																locale: zhCN,
															},
														)}
													</span>
												</div>
											</div>

											<div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row gap-2">
												<Button
													variant="outline"
													size="sm"
													asChild
													className="w-full sm:w-auto"
												>
													<Link
														href={`/events/${event.shortId || event.id}`}
														target="_blank"
													>
														<Eye className="h-4 w-4 mr-1" />
														<span className="sm:inline">
															查看
														</span>
													</Link>
												</Button>

												<Button
													variant={
														event.featured
															? "default"
															: "outline"
													}
													size="sm"
													onClick={() =>
														toggleFeatured(event)
													}
													className={`w-full sm:w-auto ${
														event.featured
															? "bg-yellow-500 hover:bg-yellow-600 text-white"
															: ""
													}`}
												>
													{event.featured ? (
														<>
															<Star className="h-4 w-4 mr-1 fill-current" />
															<span className="sm:inline">
																取消精选
															</span>
														</>
													) : (
														<>
															<StarOff className="h-4 w-4 mr-1" />
															<span className="sm:inline">
																设为精选
															</span>
														</>
													)}
												</Button>

												<Button
													variant="destructive"
													size="sm"
													onClick={() =>
														handleDeleteEvent(event)
													}
													className="w-full sm:w-auto"
												>
													<Trash2 className="h-4 w-4 mr-1" />
													<span className="sm:inline">
														删除
													</span>
												</Button>
											</div>
										</div>
									</CardContent>
								</Card>
							))
						)}
					</div>
				</CardContent>
			</Card>

			{/* 删除确认对话框 */}
			<AlertDialog
				open={deleteDialogOpen}
				onOpenChange={setDeleteDialogOpen}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>确认删除活动</AlertDialogTitle>
						<AlertDialogDescription>
							您确定要删除活动 "{eventToDelete?.title}" 吗？
							<br />
							<strong className="text-red-600">
								此操作不可撤销，将删除所有相关数据包括报名信息、签到记录等。
							</strong>
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>取消</AlertDialogCancel>
						<AlertDialogAction
							onClick={confirmDelete}
							className="bg-red-600 hover:bg-red-700"
						>
							确认删除
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
