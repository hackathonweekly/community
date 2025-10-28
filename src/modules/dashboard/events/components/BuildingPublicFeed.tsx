"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	HeartIcon,
	CalendarIcon,
	LinkIcon,
	TrophyIcon,
	FireIcon,
	UsersIcon,
	ShareIcon,
} from "@heroicons/react/24/outline";
import { HeartIcon as HeartSolidIcon } from "@heroicons/react/24/solid";
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { CheckInComments } from "./CheckInComments";
import { usePagination, InfiniteScroll } from "@/components/shared/Pagination";
import { LoadingState, ErrorState } from "@/components/shared/StateComponents";
import { ApiClient } from "@/lib/api/client";

interface CheckInRecord {
	id: string;
	day: number;
	title: string;
	content: string;
	nextPlan?: string;
	imageUrls: string[];
	demoUrl?: string;
	isPublic: boolean;
	checkedInAt: string;
	likeCount: number;
	commentCount: number;
	isLiked?: boolean;
	user: {
		id: string;
		name: string;
		image?: string;
		username?: string;
	};
	registration: {
		id: string;
		checkInCount: number;
		project: {
			id: string;
			title: string;
			projectTags: string[];
		};
	};
}

interface BuildingRegistration {
	id: string;
	userId: string;
	checkInCount: number;
	isCompleted: boolean;
	finalScore?: number;
	user: {
		id: string;
		name: string;
		image?: string;
		username?: string;
	};
	project: {
		id: string;
		title: string;
		projectTags: string[];
	};
}

interface Event {
	id: string;
	title: string;
	buildingConfig?: {
		duration: number;
		requiredCheckIns: number;
		enableVoting: boolean;
		votingEndTime?: string;
	};
}

interface BuildingPublicFeedProps {
	event: Event;
	currentUserId?: string;
	refreshKey?: number;
}

function CheckInCard({
	checkIn,
	onLike,
	onCommentCountUpdate,
	onShare,
	currentUserId,
}: {
	checkIn: CheckInRecord;
	onLike: (checkInId: string) => void;
	onCommentCountUpdate: (checkInId: string, newCount: number) => void;
	onShare: (checkIn: CheckInRecord) => void;
	currentUserId?: string;
}) {
	return (
		<div className="bg-white rounded-lg border hover:shadow-md transition-shadow p-3 sm:p-4 space-y-3 sm:space-y-4">
			{/* 用户信息头部 - 移动端优化 */}
			<div className="flex items-start justify-between">
				<div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
					<Avatar className="w-9 h-9 sm:w-10 sm:h-10 flex-shrink-0">
						<AvatarImage
							src={checkIn.user.image}
							alt={checkIn.user.name}
						/>
						<AvatarFallback>
							{checkIn.user.name.charAt(0).toUpperCase()}
						</AvatarFallback>
					</Avatar>
					<div className="min-w-0 flex-1">
						<div className="flex items-center gap-2 mb-1">
							<span className="font-medium text-sm sm:text-base truncate">
								{checkIn.user.name}
							</span>
							<Badge
								variant="outline"
								className="text-xs px-1.5 py-0.5 flex-shrink-0"
							>
								第 {checkIn.day} 天
							</Badge>
						</div>
						<div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-xs text-muted-foreground">
							<span className="truncate">
								{checkIn.registration.project.title}
							</span>
							<span className="hidden sm:inline">•</span>
							<span className="flex-shrink-0">
								{new Date(
									checkIn.checkedInAt,
								).toLocaleDateString("zh-CN", {
									month: "short",
									day: "numeric",
									hour: "2-digit",
									minute: "2-digit",
								})}
							</span>
						</div>
					</div>
				</div>
				{checkIn.registration.checkInCount >= (checkIn.day || 0) && (
					<Badge
						variant="default"
						className="bg-green-100 text-green-800 text-xs px-2 py-1 flex-shrink-0 ml-2"
					>
						<FireIcon className="w-3 h-3 mr-1" />
						连续
					</Badge>
				)}
			</div>

			{/* 打卡内容 - 移动端优化 */}
			<div className="space-y-3">
				<div>
					<h3 className="font-medium text-sm sm:text-base mb-2 leading-snug">
						{checkIn.title}
					</h3>
					<p className="text-xs sm:text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
						{checkIn.content}
					</p>
				</div>

				{/* 图片展示 - 移动端单列优化 */}
				{checkIn.imageUrls.length > 0 && (
					<div className="space-y-2">
						{checkIn.imageUrls.length === 1 ? (
							<div className="relative">
								<img
									src={checkIn.imageUrls[0]}
									alt="Screenshot"
									className="w-full max-h-64 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
									onClick={() =>
										window.open(
											checkIn.imageUrls[0],
											"_blank",
										)
									}
								/>
							</div>
						) : (
							<div className="grid grid-cols-2 gap-1.5 sm:gap-2">
								{checkIn.imageUrls
									.slice(0, 4)
									.map((url, index) => (
										<div key={index} className="relative">
											<img
												src={url}
												alt={`Screenshot ${index + 1}`}
												className="w-full h-20 sm:h-24 md:h-32 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
												onClick={() =>
													window.open(url, "_blank")
												}
											/>
											{index === 3 &&
												checkIn.imageUrls.length >
													4 && (
													<div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center text-white font-medium text-sm">
														+
														{checkIn.imageUrls
															.length - 4}
													</div>
												)}
										</div>
									))}
							</div>
						)}
					</div>
				)}

				{/* Demo 链接 - 移动端优化 */}
				{checkIn.demoUrl && (
					<div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
						<LinkIcon className="w-4 h-4 text-blue-600 flex-shrink-0" />
						<a
							href={checkIn.demoUrl}
							target="_blank"
							rel="noopener noreferrer"
							className="text-xs sm:text-sm text-blue-600 hover:underline break-all"
						>
							{checkIn.demoUrl}
						</a>
					</div>
				)}

				{/* 明天计划 */}
				{checkIn.nextPlan && (
					<div className="p-3 bg-amber-50 rounded-lg border-l-4 border-amber-400">
						<div className="text-xs sm:text-sm font-medium text-amber-800 mb-1">
							明天计划
						</div>
						<div className="text-xs sm:text-sm text-amber-700 leading-relaxed">
							{checkIn.nextPlan}
						</div>
					</div>
				)}

				{/* 项目标签 - 移动端滚动优化 */}
				{checkIn.registration.project.projectTags.length > 0 && (
					<div className="flex items-center gap-1.5 overflow-x-auto pb-1">
						{checkIn.registration.project.projectTags
							.slice(0, 5)
							.map((tag) => (
								<Badge
									key={tag}
									variant="secondary"
									className="text-xs px-2 py-0.5 flex-shrink-0"
								>
									{tag}
								</Badge>
							))}
					</div>
				)}
			</div>

			{/* 底部操作栏 - 移动端触控优化 */}
			<div className="flex items-center justify-between pt-3 border-t">
				<div className="flex items-center gap-1">
					<Button
						variant="ghost"
						size="sm"
						onClick={() => onLike(checkIn.id)}
						className={cn(
							"text-muted-foreground hover:text-red-500 p-2 h-8 min-w-[60px]",
							checkIn.isLiked && "text-red-500",
						)}
					>
						{checkIn.isLiked ? (
							<HeartSolidIcon className="w-4 h-4" />
						) : (
							<HeartIcon className="w-4 h-4" />
						)}
						<span className="ml-1.5 text-xs font-medium">
							{checkIn.likeCount}
						</span>
					</Button>
					<Button
						variant="ghost"
						size="sm"
						onClick={() => onShare(checkIn)}
						className="text-muted-foreground hover:text-green-500 p-2 h-8 min-w-[60px]"
					>
						<ShareIcon className="w-4 h-4" />
						<span className="ml-1.5 text-xs font-medium">分享</span>
					</Button>
				</div>
				<div className="text-xs text-muted-foreground">
					{new Date(checkIn.checkedInAt).toLocaleTimeString("zh-CN", {
						hour: "2-digit",
						minute: "2-digit",
					})}
				</div>
			</div>

			{/* 评论区域 */}
			<CheckInComments
				checkInId={checkIn.id}
				commentCount={checkIn.commentCount}
				onCommentAdded={(newCount) =>
					onCommentCountUpdate(checkIn.id, newCount)
				}
				currentUserId={currentUserId}
			/>
		</div>
	);
}

function ParticipantCard({
	registration,
	event,
}: {
	registration: BuildingRegistration;
	event: Event;
}) {
	const requiredCheckIns = event.buildingConfig?.requiredCheckIns || 6;
	const progressRate = Math.min(
		(registration.checkInCount / requiredCheckIns) * 100,
		100,
	);

	return (
		<div className="bg-white rounded-lg border hover:shadow-md transition-shadow p-3 sm:p-4">
			<div className="flex items-center gap-3">
				<Avatar className="w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0">
					<AvatarImage
						src={registration.user.image}
						alt={registration.user.name}
					/>
					<AvatarFallback>
						{registration.user.name.charAt(0).toUpperCase()}
					</AvatarFallback>
				</Avatar>
				<div className="flex-1 min-w-0">
					<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2 mb-1">
						<div className="flex items-center gap-2 min-w-0">
							<span className="font-medium text-sm sm:text-base truncate">
								{registration.user.name}
							</span>
							{registration.isCompleted && (
								<Badge
									variant="default"
									className="bg-green-100 text-green-800 text-xs px-1.5 py-0.5 flex-shrink-0"
								>
									<TrophyIcon className="w-3 h-3 mr-1" />
									完成
								</Badge>
							)}
						</div>
						{registration.finalScore && (
							<span className="text-xs text-orange-600 font-medium flex-shrink-0">
								评分 {registration.finalScore.toFixed(1)}
							</span>
						)}
					</div>
					<div className="text-xs sm:text-sm text-muted-foreground truncate mb-2">
						{registration.project.title}
					</div>
					<div className="flex items-center justify-between text-xs mb-2">
						<span className="text-muted-foreground">
							打卡 {registration.checkInCount}/{requiredCheckIns}{" "}
							次
						</span>
						<span className="text-xs text-muted-foreground">
							{progressRate.toFixed(0)}%
						</span>
					</div>
					{/* Progress bar - 移动端优化 */}
					<div className="w-full bg-gray-200 rounded-full h-2">
						<div
							className="bg-blue-500 h-2 rounded-full transition-all duration-300"
							style={{ width: `${progressRate}%` }}
						/>
					</div>
				</div>
			</div>
		</div>
	);
}

export function BuildingPublicFeed({
	event,
	currentUserId,
	refreshKey = 0,
}: BuildingPublicFeedProps) {
	const [participants, setParticipants] = useState<BuildingRegistration[]>(
		[],
	);
	const [participantsLoading, setParticipantsLoading] = useState(true);
	const [sortBy, setSortBy] = useState<"latest" | "popular">("latest");
	const [filterUser, setFilterUser] = useState<string>("all");
	const [stats, setStats] = useState({
		totalCheckIns: 0,
		totalLikes: 0,
		totalComments: 0,
		topContributors: [] as Array<{
			userId: string;
			name: string;
			count: number;
		}>,
	});

	// 使用分页hook来管理打卡记录
	const fetchCheckIns = useCallback(
		async (page: number, pageSize: number) => {
			const response = await ApiClient.get<any>(
				`/api/events/${event.id}/building-public/check-ins?page=${page}&limit=${pageSize}&sort=${sortBy}&user=${filterUser}`,
			);
			return response;
		},
		[event.id, sortBy, filterUser],
	);

	const {
		data: checkIns,
		loading: checkInsLoading,
		loadingMore,
		hasNextPage,
		loadNextPage,
		reload: reloadCheckIns,
		error: checkInsError,
		updateData: updateCheckIns,
	} = usePagination<CheckInRecord>(fetchCheckIns, {
		pageSize: 10,
		initialLoad: true,
		errorHandling: "toast",
	});

	// 当筛选条件改变时重新加载
	useEffect(() => {
		reloadCheckIns();
	}, [sortBy, filterUser, reloadCheckIns]);

	useEffect(() => {
		reloadCheckIns();
	}, [event.id, refreshKey, reloadCheckIns]);

	useEffect(() => {
		fetchParticipants();
	}, [event.id, refreshKey]);

	useEffect(() => {
		if (!checkIns) {
			setStats({
				totalCheckIns: 0,
				totalLikes: 0,
				totalComments: 0,
				topContributors: [],
			});
			return;
		}

		const totalCheckIns = checkIns.length;
		const totalLikes = checkIns.reduce(
			(sum, checkIn) => sum + checkIn.likeCount,
			0,
		);
		const totalComments = checkIns.reduce(
			(sum, checkIn) => sum + checkIn.commentCount,
			0,
		);

		const contributionsMap = checkIns.reduce(
			(
				acc: { [key: string]: { name: string; count: number } },
				checkIn,
			) => {
				const userId = checkIn.user.id;
				if (!acc[userId]) {
					acc[userId] = { name: checkIn.user.name, count: 0 };
				}
				acc[userId].count += 1;
				return acc;
			},
			{},
		);

		const topContributors = Object.entries(contributionsMap)
			.map(([userId, data]) => ({ userId, ...data }))
			.sort((a, b) => b.count - a.count)
			.slice(0, 5);

		setStats({
			totalCheckIns,
			totalLikes,
			totalComments,
			topContributors,
		});
	}, [checkIns]);

	const fetchParticipants = async () => {
		setParticipantsLoading(true);
		try {
			const participantsData = await ApiClient.get<{
				data: BuildingRegistration[];
			}>(`/api/events/${event.id}/building-public/participants`);
			setParticipants(participantsData.data || []);
		} catch (error) {
			console.error("Error fetching participants:", error);
			toast.error("获取参与者列表失败");
		} finally {
			setParticipantsLoading(false);
		}
	};

	const handleLike = async (checkInId: string) => {
		if (!currentUserId) {
			toast.error("请先登录");
			return;
		}

		try {
			const response = await fetch(
				`/api/building-public/check-ins/${checkInId}/like`,
				{
					method: "POST",
				},
			);

			if (response.ok) {
				const result = await response.json();
				updateCheckIns((prev) =>
					prev.map((checkIn) =>
						checkIn.id === checkInId
							? {
									...checkIn,
									isLiked: result.data.liked,
									likeCount: result.data.likeCount,
								}
							: checkIn,
					),
				);
			}
		} catch (error) {
			console.error("Error liking check-in:", error);
			toast.error("操作失败");
		}
	};

	const handleComment = (checkInId: string) => {
		// This is now handled by the CheckInCommentDialog component
		console.log("Comment on check-in:", checkInId);
	};

	const handleCommentCountUpdate = (checkInId: string, newCount: number) => {
		updateCheckIns((prev) =>
			prev.map((checkIn) =>
				checkIn.id === checkInId
					? { ...checkIn, commentCount: newCount }
					: checkIn,
			),
		);
	};

	const handleShare = async (checkIn: CheckInRecord) => {
		const shareText = `🚀 ${checkIn.user.name} 在 #BuildingPublic 挑战中的第${checkIn.day}天打卡：

${checkIn.title}

${checkIn.content.slice(0, 100)}${checkIn.content.length > 100 ? "..." : ""}

项目：${checkIn.registration.project.title}
${checkIn.demoUrl ? `\n🔗 演示：${checkIn.demoUrl}` : ""}

#HackathonWeekly #开发者 #创业`;

		try {
			await navigator.clipboard.writeText(shareText);
			toast.success("分享内容已复制到剪贴板！");
		} catch (error) {
			console.error("复制失败:", error);
			toast.error("复制失败，请手动复制");
		}
	};

	return (
		<div className="space-y-4 sm:space-y-6">
			{/* 头部统计 - 移动端优化布局 */}
			<div className="mb-4 sm:mb-6">
				<h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 flex items-center gap-2 text-gray-900">
					<FireIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
					活动数据概览
				</h3>
				<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 sm:gap-3 md:gap-4">
					<div className="text-center p-3 bg-blue-50 rounded-lg">
						<div className="text-lg sm:text-xl md:text-2xl font-bold text-blue-600">
							{participants.length}
						</div>
						<div className="text-xs text-muted-foreground mt-1">
							参与者
						</div>
					</div>
					<div className="text-center p-3 bg-green-50 rounded-lg">
						<div className="text-lg sm:text-xl md:text-2xl font-bold text-green-600">
							{participants.filter((p) => p.isCompleted).length}
						</div>
						<div className="text-xs text-muted-foreground mt-1">
							已完成
						</div>
					</div>
					<div className="text-center p-3 bg-orange-50 rounded-lg">
						<div className="text-lg sm:text-xl md:text-2xl font-bold text-orange-600">
							{stats.totalCheckIns}
						</div>
						<div className="text-xs text-muted-foreground mt-1">
							总打卡
						</div>
					</div>
					<div className="text-center p-3 bg-red-50 rounded-lg">
						<div className="text-lg sm:text-xl md:text-2xl font-bold text-red-500">
							{stats.totalLikes}
						</div>
						<div className="text-xs text-muted-foreground mt-1">
							获赞数
						</div>
					</div>
					<div className="text-center p-3 bg-purple-50 rounded-lg">
						<div className="text-lg sm:text-xl md:text-2xl font-bold text-purple-600">
							{stats.totalComments}
						</div>
						<div className="text-xs text-muted-foreground mt-1">
							评论数
						</div>
					</div>
					<div className="text-center p-3 bg-gray-50 rounded-lg">
						<div className="text-lg sm:text-xl md:text-2xl font-bold text-gray-700">
							{participants.length > 0
								? Math.round(
										(participants.filter(
											(p) => p.isCompleted,
										).length /
											participants.length) *
											100,
									)
								: 0}
							%
						</div>
						<div className="text-xs text-muted-foreground mt-1">
							完成率
						</div>
					</div>
				</div>
			</div>

			<Tabs defaultValue="feed" className="space-y-3 sm:space-y-4">
				<TabsList className="grid w-full grid-cols-2 h-9 sm:h-10">
					<TabsTrigger value="feed" className="text-sm sm:text-base">
						打卡动态
					</TabsTrigger>
					<TabsTrigger
						value="participants"
						className="text-sm sm:text-base"
					>
						参与者
					</TabsTrigger>
				</TabsList>

				<TabsContent value="feed" className="space-y-4 sm:space-y-6">
					{/* 筛选器 - 移动端优化 */}
					<div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4">
						<Select
							value={sortBy}
							onValueChange={(value: "latest" | "popular") =>
								setSortBy(value)
							}
						>
							<SelectTrigger className="w-full sm:w-28 h-9">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="latest">最新</SelectItem>
								<SelectItem value="popular">最热</SelectItem>
							</SelectContent>
						</Select>

						<Select
							value={filterUser}
							onValueChange={setFilterUser}
						>
							<SelectTrigger className="w-full sm:w-36 h-9">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">全部用户</SelectItem>
								{participants
									.filter(
										(participant) =>
											participant.userId &&
											participant.userId.trim() !== "",
									)
									.map((participant) => (
										<SelectItem
											key={participant.userId}
											value={participant.userId}
										>
											{participant.user.name}
										</SelectItem>
									))}
							</SelectContent>
						</Select>

						{filterUser !== "all" && (
							<Button
								variant="outline"
								size="sm"
								onClick={() => {
									setFilterUser("all");
								}}
								className="w-full sm:w-auto h-9"
							>
								清除筛选
							</Button>
						)}
					</div>

					{/* 打卡列表 */}
					{checkInsError ? (
						<ErrorState
							variant="network"
							message="加载打卡记录失败"
							onAction={reloadCheckIns}
						/>
					) : (
						<InfiniteScroll
							data={checkIns || []}
							loading={checkInsLoading}
							loadingMore={loadingMore}
							hasNextPage={hasNextPage}
							onLoadMore={loadNextPage}
							renderItem={(checkIn, index) => (
								<CheckInCard
									key={checkIn.id}
									checkIn={checkIn}
									onLike={handleLike}
									onCommentCountUpdate={
										handleCommentCountUpdate
									}
									onShare={handleShare}
									currentUserId={currentUserId}
								/>
							)}
							loadingComponent={
								<div className="space-y-3 sm:space-y-4">
									{Array.from({ length: 3 }).map((_, i) => (
										<Card key={i} className="animate-pulse">
											<CardContent className="p-4 sm:p-6">
												<div className="flex items-center gap-3 mb-4">
													<div className="w-9 h-9 sm:w-10 sm:h-10 bg-muted rounded-full" />
													<div className="space-y-2 flex-1">
														<div className="w-28 sm:w-32 h-4 bg-muted rounded" />
														<div className="w-20 sm:w-24 h-3 bg-muted rounded" />
													</div>
												</div>
												<div className="space-y-2">
													<div className="w-full h-4 bg-muted rounded" />
													<div className="w-3/4 h-4 bg-muted rounded" />
												</div>
											</CardContent>
										</Card>
									))}
								</div>
							}
							endMessage={
								checkIns?.length === 0 ? (
									<Card>
										<CardContent className="text-center py-10 sm:py-12">
											<CalendarIcon className="w-10 h-10 sm:w-12 sm:h-12 mx-auto text-muted-foreground mb-3 sm:mb-4" />
											<h3 className="text-base sm:text-lg font-medium mb-2">
												暂无打卡记录
											</h3>
											<p className="text-sm text-muted-foreground px-4">
												还没有人打卡，成为第一个分享进展的人吧！
											</p>
										</CardContent>
									</Card>
								) : (
									<div className="text-center py-4 text-sm text-muted-foreground">
										已加载全部打卡记录
									</div>
								)
							}
						/>
					)}
				</TabsContent>

				<TabsContent
					value="participants"
					className="space-y-4 sm:space-y-6"
				>
					{participantsLoading ? (
						<LoadingState type="custom">
							<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
								{Array.from({ length: 6 }).map((_, i) => (
									<Card key={i} className="animate-pulse">
										<CardContent className="p-3 sm:p-4">
											<div className="flex items-center gap-3">
												<div className="w-10 h-10 sm:w-12 sm:h-12 bg-muted rounded-full" />
												<div className="space-y-2 flex-1">
													<div className="w-20 sm:w-24 h-4 bg-muted rounded" />
													<div className="w-28 sm:w-32 h-3 bg-muted rounded" />
												</div>
											</div>
										</CardContent>
									</Card>
								))}
							</div>
						</LoadingState>
					) : participants.length === 0 ? (
						<Card>
							<CardContent className="text-center py-10 sm:py-12">
								<UsersIcon className="w-10 h-10 sm:w-12 sm:h-12 mx-auto text-muted-foreground mb-3 sm:mb-4" />
								<h3 className="text-base sm:text-lg font-medium mb-2">
									暂无参与者
								</h3>
								<p className="text-sm text-muted-foreground px-4">
									还没有人报名参与这个挑战
								</p>
							</CardContent>
						</Card>
					) : (
						<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
							{participants.map((participant) => (
								<ParticipantCard
									key={participant.id}
									registration={participant}
									event={event}
								/>
							))}
						</div>
					)}
				</TabsContent>
			</Tabs>
		</div>
	);
}
