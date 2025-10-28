"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	CalendarIcon,
	CheckCircleIcon,
	CurrencyDollarIcon,
	FireIcon,
	TrophyIcon,
	UserGroupIcon,
	XCircleIcon,
} from "@heroicons/react/24/outline";
import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

interface BuildingRegistration {
	id: string;
	userId: string;
	projectId: string;
	plan21Days: string;
	visibilityLevel: "PUBLIC" | "PARTICIPANTS_ONLY";
	checkInCount: number;
	isCompleted: boolean;
	depositPaid: boolean;
	depositAmount: number;
	depositStatus: string;
	finalScore?: number;
	user: {
		id: string;
		name: string;
		image?: string;
		email: string;
	};
	project: {
		id: string;
		title: string;
		description?: string;
		projectTags: string[];
	};
	depositTrans: Array<{
		id: string;
		amount: number;
		status: string;
		type: string;
		createdAt: string;
	}>;
}

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
	user: {
		id: string;
		name: string;
		image?: string;
	};
	registration: {
		project: {
			id: string;
			title: string;
		};
	};
}

interface Event {
	id: string;
	title: string;
	buildingConfig?: {
		duration: number;
		requiredCheckIns: number;
		depositAmount: number;
		refundRate: number;
	};
}

interface BuildingPublicManagementProps {
	eventId: string;
	event: Event;
}

export function BuildingPublicManagement({
	eventId,
	event,
}: BuildingPublicManagementProps) {
	const [registrations, setRegistrations] = useState<BuildingRegistration[]>(
		[],
	);
	const [checkIns, setCheckIns] = useState<CheckInRecord[]>([]);
	const [loading, setLoading] = useState(true);
	const [statusFilter, setStatusFilter] = useState<string>("all");
	const [selectedRegistration, setSelectedRegistration] =
		useState<BuildingRegistration | null>(null);
	const [scoreDialogOpen, setScoreDialogOpen] = useState(false);
	const [score, setScore] = useState<number>(0);
	const [feedback, setFeedback] = useState<string>("");
	const [stats, setStats] = useState({
		total: 0,
		completed: 0,
		active: 0,
		totalCheckIns: 0,
		totalDeposit: 0,
	});
	const toastsT = useTranslations(
		"dashboard.events.buildingPublicManagement.toasts",
	);

	useEffect(() => {
		fetchData();
	}, [eventId]);

	const fetchData = async () => {
		try {
			setLoading(true);

			// 获取参与者列表
			const participantsResponse = await fetch(
				`/api/events/${eventId}/building-public/participants`,
			);
			if (participantsResponse.ok) {
				const data = await participantsResponse.json();
				setRegistrations(data.data || []);

				// 计算统计数据
				const registrationList = data.data || [];
				const completed = registrationList.filter(
					(r: BuildingRegistration) => r.isCompleted,
				).length;
				const totalCheckIns = registrationList.reduce(
					(sum: number, r: BuildingRegistration) =>
						sum + r.checkInCount,
					0,
				);
				const totalDeposit = registrationList.reduce(
					(sum: number, r: BuildingRegistration) =>
						sum + r.depositAmount,
					0,
				);

				setStats({
					total: registrationList.length,
					completed,
					active: registrationList.length - completed,
					totalCheckIns,
					totalDeposit,
				});
			}

			// 获取打卡记录
			const checkInsResponse = await fetch(
				`/api/events/${eventId}/building-public/check-ins`,
			);
			if (checkInsResponse.ok) {
				const data = await checkInsResponse.json();
				setCheckIns(data.data || []);
			}
		} catch (error) {
			console.error("Error fetching data:", error);
			toast.error(toastsT("fetchFailed"));
		} finally {
			setLoading(false);
		}
	};

	const handleMarkCompleted = async (
		registrationId: string,
		completed: boolean,
	) => {
		try {
			const response = await fetch(
				`/api/building-public/registrations/${registrationId}/completion`,
				{
					method: "PATCH",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({ isCompleted: completed }),
				},
			);

			if (response.ok) {
				setRegistrations((prev) =>
					prev.map((r) =>
						r.id === registrationId
							? { ...r, isCompleted: completed }
							: r,
					),
				);
				toast.success(
					toastsT(completed ? "markCompleted" : "markUncompleted"),
				);
				fetchData(); // 刷新统计数据
			} else {
				throw new Error(toastsT("operationFailed"));
			}
		} catch (error) {
			console.error("Error updating completion status:", error);
			toast.error(toastsT("operationFailed"));
		}
	};

	const handleScoreSubmit = async () => {
		if (!selectedRegistration) {
			return;
		}

		try {
			const response = await fetch(
				`/api/building-public/registrations/${selectedRegistration.id}/score`,
				{
					method: "PATCH",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						finalScore: score,
						feedback: feedback.trim() || undefined,
					}),
				},
			);

			if (response.ok) {
				setRegistrations((prev) =>
					prev.map((r) =>
						r.id === selectedRegistration.id
							? { ...r, finalScore: score }
							: r,
					),
				);
				toast.success(toastsT("scoreSuccess"));
				setScoreDialogOpen(false);
				setSelectedRegistration(null);
				setScore(0);
				setFeedback("");
			} else {
				throw new Error(toastsT("scoreFailed"));
			}
		} catch (error) {
			console.error("Error submitting score:", error);
			toast.error(toastsT("scoreFailed"));
		}
	};

	const filteredRegistrations = registrations.filter((registration) => {
		if (statusFilter === "completed") {
			return registration.isCompleted;
		}
		if (statusFilter === "active") {
			return !registration.isCompleted;
		}
		if (statusFilter === "deposit-pending") {
			return !registration.depositPaid;
		}
		return true;
	});

	const requiredCheckIns = event.buildingConfig?.requiredCheckIns || 6;

	if (loading) {
		return (
			<div className="space-y-6">
				<div className="grid grid-cols-1 md:grid-cols-5 gap-4">
					{Array.from({ length: 5 }).map((_, i) => (
						<Card key={i} className="animate-pulse">
							<CardContent className="p-6">
								<div className="h-8 bg-muted rounded mb-2" />
								<div className="h-4 bg-muted rounded" />
							</CardContent>
						</Card>
					))}
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* 统计卡片 */}
			<div className="grid grid-cols-1 md:grid-cols-5 gap-4">
				<Card>
					<CardContent className="p-6">
						<div className="flex items-center gap-2">
							<UserGroupIcon className="h-5 w-5 text-blue-500" />
							<span className="text-sm font-medium text-muted-foreground">
								总参与者
							</span>
						</div>
						<div className="text-2xl font-bold mt-2">
							{stats.total}
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="p-6">
						<div className="flex items-center gap-2">
							<TrophyIcon className="h-5 w-5 text-green-500" />
							<span className="text-sm font-medium text-muted-foreground">
								已完成
							</span>
						</div>
						<div className="text-2xl font-bold mt-2">
							{stats.completed}
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="p-6">
						<div className="flex items-center gap-2">
							<FireIcon className="h-5 w-5 text-orange-500" />
							<span className="text-sm font-medium text-muted-foreground">
								进行中
							</span>
						</div>
						<div className="text-2xl font-bold mt-2">
							{stats.active}
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="p-6">
						<div className="flex items-center gap-2">
							<CalendarIcon className="h-5 w-5 text-purple-500" />
							<span className="text-sm font-medium text-muted-foreground">
								总打卡数
							</span>
						</div>
						<div className="text-2xl font-bold mt-2">
							{stats.totalCheckIns}
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="p-6">
						<div className="flex items-center gap-2">
							<CurrencyDollarIcon className="h-5 w-5 text-green-600" />
							<span className="text-sm font-medium text-muted-foreground">
								总押金
							</span>
						</div>
						<div className="text-2xl font-bold mt-2">
							¥{stats.totalDeposit}
						</div>
					</CardContent>
				</Card>
			</div>

			<Tabs defaultValue="participants">
				<TabsList>
					<TabsTrigger value="participants">参与者管理</TabsTrigger>
					<TabsTrigger value="checkins">打卡记录</TabsTrigger>
				</TabsList>

				<TabsContent value="participants" className="space-y-4">
					{/* 筛选器 */}
					<div className="flex items-center gap-4">
						<Select
							value={statusFilter}
							onValueChange={setStatusFilter}
						>
							<SelectTrigger className="w-48">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">全部参与者</SelectItem>
								<SelectItem value="active">进行中</SelectItem>
								<SelectItem value="completed">
									已完成
								</SelectItem>
								<SelectItem value="deposit-pending">
									押金待支付
								</SelectItem>
							</SelectContent>
						</Select>
					</div>

					{/* 参与者列表 */}
					<Card>
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>参与者</TableHead>
									<TableHead>项目</TableHead>
									<TableHead>打卡进度</TableHead>
									<TableHead>押金状态</TableHead>
									<TableHead>完成状态</TableHead>
									<TableHead>评分</TableHead>
									<TableHead>操作</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{filteredRegistrations.map((registration) => (
									<TableRow key={registration.id}>
										<TableCell>
											<div className="flex items-center gap-3">
												<Avatar className="h-8 w-8">
													<AvatarImage
														src={
															registration.user
																.image
														}
													/>
													<AvatarFallback>
														{registration.user.name.charAt(
															0,
														)}
													</AvatarFallback>
												</Avatar>
												<div>
													<div className="font-medium">
														{registration.user.name}
													</div>
													<div className="text-sm text-muted-foreground">
														{
															registration.user
																.email
														}
													</div>
												</div>
											</div>
										</TableCell>
										<TableCell>
											<div>
												<div className="font-medium">
													{registration.project.title}
												</div>
												<div className="text-sm text-muted-foreground">
													{registration.project.description?.substring(
														0,
														50,
													)}
													...
												</div>
											</div>
										</TableCell>
										<TableCell>
											<div className="space-y-1">
												<div className="flex items-center gap-2">
													<span className="text-sm font-medium">
														{
															registration.checkInCount
														}{" "}
														/ {requiredCheckIns}
													</span>
													<Badge
														variant={
															registration.checkInCount >=
															requiredCheckIns
																? "default"
																: "secondary"
														}
													>
														{Math.round(
															(registration.checkInCount /
																requiredCheckIns) *
																100,
														)}
														%
													</Badge>
												</div>
												<div className="w-full bg-muted rounded-full h-2">
													<div
														className="bg-primary h-2 rounded-full transition-all"
														style={{
															width: `${Math.min((registration.checkInCount / requiredCheckIns) * 100, 100)}%`,
														}}
													/>
												</div>
											</div>
										</TableCell>
										<TableCell>
											<Badge
												variant={
													registration.depositPaid
														? "default"
														: "destructive"
												}
											>
												{registration.depositPaid
													? "已支付"
													: "待支付"}{" "}
												¥{registration.depositAmount}
											</Badge>
										</TableCell>
										<TableCell>
											<Badge
												variant={
													registration.isCompleted
														? "default"
														: "secondary"
												}
											>
												{registration.isCompleted
													? "已完成"
													: "进行中"}
											</Badge>
										</TableCell>
										<TableCell>
											{registration.finalScore ? (
												<Badge variant="outline">
													{registration.finalScore.toFixed(
														1,
													)}{" "}
													分
												</Badge>
											) : (
												<span className="text-muted-foreground">
													未评分
												</span>
											)}
										</TableCell>
										<TableCell>
											<div className="flex items-center gap-2">
												{!registration.isCompleted && (
													<Button
														size="sm"
														variant="outline"
														onClick={() =>
															handleMarkCompleted(
																registration.id,
																true,
															)
														}
													>
														<CheckCircleIcon className="h-4 w-4 mr-1" />
														标记完成
													</Button>
												)}
												{registration.isCompleted && (
													<Button
														size="sm"
														variant="outline"
														onClick={() =>
															handleMarkCompleted(
																registration.id,
																false,
															)
														}
													>
														<XCircleIcon className="h-4 w-4 mr-1" />
														取消完成
													</Button>
												)}
												<Button
													size="sm"
													variant="outline"
													onClick={() => {
														setSelectedRegistration(
															registration,
														);
														setScore(
															registration.finalScore ||
																0,
														);
														setScoreDialogOpen(
															true,
														);
													}}
												>
													<TrophyIcon className="h-4 w-4 mr-1" />
													评分
												</Button>
											</div>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</Card>
				</TabsContent>

				<TabsContent value="checkins" className="space-y-4">
					{/* 打卡记录列表 */}
					<div className="space-y-4">
						{checkIns.map((checkIn) => (
							<Card key={checkIn.id}>
								<CardHeader>
									<div className="flex items-start justify-between">
										<div className="flex items-center gap-3">
											<Avatar className="h-10 w-10">
												<AvatarImage
													src={checkIn.user.image}
												/>
												<AvatarFallback>
													{checkIn.user.name.charAt(
														0,
													)}
												</AvatarFallback>
											</Avatar>
											<div>
												<div className="flex items-center gap-2">
													<span className="font-medium">
														{checkIn.user.name}
													</span>
													<Badge variant="outline">
														第 {checkIn.day} 天
													</Badge>
												</div>
												<div className="text-sm text-muted-foreground">
													{
														checkIn.registration
															.project.title
													}
												</div>
											</div>
										</div>
										<div className="text-sm text-muted-foreground">
											{new Date(
												checkIn.checkedInAt,
											).toLocaleString("zh-CN")}
										</div>
									</div>
								</CardHeader>
								<CardContent>
									<div className="space-y-3">
										<div>
											<h4 className="font-medium">
												{checkIn.title}
											</h4>
											<p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">
												{checkIn.content}
											</p>
										</div>

										{checkIn.imageUrls.length > 0 && (
											<div className="grid grid-cols-4 gap-2">
												{checkIn.imageUrls
													.slice(0, 4)
													.map((url, index) => (
														<img
															key={index}
															src={url}
															alt={`Screenshot ${index + 1}`}
															className="w-full h-20 object-cover rounded cursor-pointer"
															onClick={() =>
																window.open(
																	url,
																	"_blank",
																)
															}
														/>
													))}
											</div>
										)}

										{checkIn.demoUrl && (
											<div className="p-3 bg-muted rounded-lg">
												<div className="text-sm font-medium mb-1">
													演示链接
												</div>
												<a
													href={checkIn.demoUrl}
													target="_blank"
													rel="noopener noreferrer"
													className="text-sm text-blue-600 hover:underline"
												>
													{checkIn.demoUrl}
												</a>
											</div>
										)}

										<div className="flex items-center justify-between text-sm text-muted-foreground">
											<div className="flex items-center gap-4">
												<span>
													❤️ {checkIn.likeCount} 点赞
												</span>
												<span>
													💬 {checkIn.commentCount}{" "}
													评论
												</span>
												<Badge
													variant={
														checkIn.isPublic
															? "default"
															: "secondary"
													}
												>
													{checkIn.isPublic
														? "公开"
														: "仅参与者"}
												</Badge>
											</div>
										</div>
									</div>
								</CardContent>
							</Card>
						))}
					</div>
				</TabsContent>
			</Tabs>

			{/* 评分对话框 */}
			<Dialog open={scoreDialogOpen} onOpenChange={setScoreDialogOpen}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>为参与者评分</DialogTitle>
						<DialogDescription>
							为 {selectedRegistration?.user.name} 的表现评分
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-4">
						<div>
							<Label htmlFor="score">评分 (0-100)</Label>
							<Input
								id="score"
								type="number"
								min="0"
								max="100"
								value={score}
								onChange={(e) =>
									setScore(Number(e.target.value))
								}
							/>
						</div>
						<div>
							<Label htmlFor="feedback">评价反馈 (可选)</Label>
							<Textarea
								id="feedback"
								placeholder="为参与者提供一些建设性的反馈..."
								value={feedback}
								onChange={(e) => setFeedback(e.target.value)}
								rows={3}
							/>
						</div>
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setScoreDialogOpen(false)}
						>
							取消
						</Button>
						<Button onClick={handleScoreSubmit}>确认评分</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
