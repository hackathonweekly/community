"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	CalendarIcon,
	ClockIcon,
	DocumentTextIcon,
	FireIcon,
	RocketLaunchIcon,
	TrophyIcon,
	UserGroupIcon,
} from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { BuildingPublicCheckIn } from "./BuildingPublicCheckIn";
import { BuildingPublicFeed } from "./BuildingPublicFeed";
import { BuildingPublicRegistration } from "./BuildingPublicRegistration";
import { CertificateGallery } from "./CertificateGallery";

interface Event {
	id: string;
	title: string;
	richContent: string;
	shortDescription?: string;
	startTime: string;
	endTime: string;
	status: string;
	buildingConfig?: {
		duration: number;
		requiredCheckIns: number;
		depositAmount: number;
		refundRate: number;
		isPublic: boolean;
		allowAnonymous: boolean;
		enableVoting: boolean;
		votingEndTime?: string;
		paymentType?: string;
		paymentUrl?: string;
		paymentQRCode?: string;
		paymentNote?: string;
	};
}

interface BuildingRegistration {
	id: string;
	eventId: string;
	userId: string;
	projectId: string;
	plan21Days: string;
	visibilityLevel: "PUBLIC" | "PARTICIPANTS_ONLY";
	checkInCount: number;
	isCompleted: boolean;
	depositPaid: boolean;
	depositAmount: number;
	depositStatus: string;
	user: {
		id: string;
		name: string;
		email: string;
	};
	project: {
		id: string;
		title: string;
		description: string;
		projectTags: string[];
	};
	checkIns: any[];
	depositTrans: any[];
}

interface BuildingPublicPageProps {
	event: Event;
	currentUserId?: string;
	eventRegistration?: {
		status: string;
	} | null;
	registrationStatusText?: string;
	onOpenRegistration?: () => void;
	onDataRefresh?: () => void;
}

export function BuildingPublicPage({
	event,
	currentUserId,
	eventRegistration,
	registrationStatusText,
	onOpenRegistration,
	onDataRefresh,
}: BuildingPublicPageProps) {
	const [registration, setRegistration] =
		useState<BuildingRegistration | null>(null);
	const [loading, setLoading] = useState(true);
	const [submitting, setSubmitting] = useState(false);
	const [feedRefreshKey, setFeedRefreshKey] = useState(0);

	const triggerFeedRefresh = () => {
		setFeedRefreshKey((prev) => prev + 1);
	};

	useEffect(() => {
		if (currentUserId) {
			fetchRegistration();
		} else {
			setLoading(false);
		}
	}, [event.id, currentUserId]);

	const fetchRegistration = async () => {
		try {
			const response = await fetch(
				`/api/events/${event.id}/building-public/registration`,
			);
			if (response.ok) {
				const data = await response.json();
				setRegistration(data.data);
			}
		} catch (error) {
			console.error("Error fetching registration:", error);
		} finally {
			setLoading(false);
		}
	};

	const handleSetupSubmit = async (data: any) => {
		setSubmitting(true);
		try {
			const response = await fetch(
				`/api/events/${event.id}/building-public/register`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify(data),
				},
			);

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.error || "Registration failed");
			}

			const result = await response.json();
			setRegistration(result.data);
			triggerFeedRefresh();
			onDataRefresh?.();
			toast.success("打卡设置已保存！");
		} catch (error) {
			console.error("Error registering:", error);
			toast.error(error instanceof Error ? error.message : "保存失败");
		} finally {
			setSubmitting(false);
		}
	};

	const handleCheckIn = async (data: any) => {
		setSubmitting(true);
		try {
			const response = await fetch(
				`/api/events/${event.id}/building-public/check-in`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify(data),
				},
			);

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.error || "Check-in failed");
			}

			await fetchRegistration();
			triggerFeedRefresh();
			onDataRefresh?.();
			toast.success("打卡成功！");
		} catch (error) {
			console.error("Error checking in:", error);
			toast.error(error instanceof Error ? error.message : "打卡失败");
		} finally {
			setSubmitting(false);
		}
	};

	const eventRegistrationStatus = eventRegistration?.status ?? null;
	const activeRegistrationStatuses = new Set([
		"APPROVED",
		"PENDING",
		"WAITLISTED",
	]);
	const hasActiveEventRegistration =
		registration !== null ||
		(eventRegistrationStatus
			? activeRegistrationStatuses.has(eventRegistrationStatus)
			: false);
	const isRegistrationDenied =
		!registration &&
		eventRegistrationStatus !== null &&
		["REJECTED", "CANCELLED"].includes(eventRegistrationStatus);
	const needsEventRegistration =
		!registration && !hasActiveEventRegistration && !isRegistrationDenied;

	if (loading) {
		return (
			<div className="max-w-6xl mx-auto p-6">
				<div className="animate-pulse space-y-6">
					<div className="h-8 bg-muted rounded w-1/3" />
					<div className="h-32 bg-muted rounded" />
					<div className="h-96 bg-muted rounded" />
				</div>
			</div>
		);
	}

	const eventStarted = new Date() >= new Date(event.startTime);
	const eventEnded = new Date() > new Date(event.endTime);
	const canCompleteSetup =
		!eventEnded && !registration && hasActiveEventRegistration;
	const canCheckIn = eventStarted && !eventEnded && registration;

	return (
		<div className="container mx-auto max-w-6xl px-3 sm:px-4 py-4 sm:py-6 lg:py-10">
			{/* 头部 - 移动端优化 */}
			<div className="mb-6 sm:mb-8">
				<div className="flex flex-col gap-3 sm:gap-4 lg:gap-6 lg:flex-row lg:items-start lg:justify-between">
					<div className="flex-1">
						<div className="flex flex-col sm:flex-row sm:items-start sm:justify-between sm:gap-4 mb-3">
							<h1 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-semibold tracking-tight mb-2 sm:mb-0">
								{event.title}
							</h1>
							<div className="flex items-center gap-2 flex-shrink-0">
								<Badge
									variant={
										eventStarted
											? eventEnded
												? "destructive"
												: "default"
											: "secondary"
									}
									className="text-xs sm:text-sm px-2.5 py-1.5 font-medium"
								>
									{eventEnded
										? "已结束"
										: eventStarted
											? "进行中"
											: "未开始"}
								</Badge>
								{registration && (
									<Badge
										variant="default"
										className="text-xs sm:text-sm px-2.5 py-1.5 bg-green-100 text-green-800 font-medium"
									>
										设置已完成
									</Badge>
								)}
							</div>
						</div>
						<p className="text-sm sm:text-base lg:text-lg text-muted-foreground leading-relaxed mb-4 sm:mb-6">
							{event.shortDescription
								?.replace(/<[^>]*>/g, "")
								.slice(0, 30) || ""}
							{(
								event.shortDescription?.replace(
									/<[^>]*>/g,
									"",
								) || ""
							).length > 30
								? "..."
								: ""}
						</p>
						{/* 移动端改为垂直布局的信息卡片 */}
						<div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-wrap gap-3 sm:gap-4">
							<div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg lg:bg-transparent lg:p-0">
								<CalendarIcon className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
								<div>
									<div className="text-xs text-muted-foreground lg:hidden">
										活动时间
									</div>
									<span className="text-sm sm:text-base font-medium lg:font-normal lg:text-muted-foreground">
										{new Date(
											event.startTime,
										).toLocaleDateString("zh-CN", {
											month: "short",
											day: "numeric",
										})}{" "}
										-{" "}
										{new Date(
											event.endTime,
										).toLocaleDateString("zh-CN", {
											month: "short",
											day: "numeric",
										})}
									</span>
								</div>
							</div>
							<div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg lg:bg-transparent lg:p-0">
								<ClockIcon className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
								<div>
									<div className="text-xs text-muted-foreground lg:hidden">
										挑战周期
									</div>
									<span className="text-sm sm:text-base font-medium lg:font-normal lg:text-muted-foreground">
										{event.buildingConfig?.duration || 21}{" "}
										天挑战
									</span>
								</div>
							</div>
							<div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg lg:bg-transparent lg:p-0">
								<FireIcon className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
								<div>
									<div className="text-xs text-muted-foreground lg:hidden">
										打卡要求
									</div>
									<span className="text-sm sm:text-base font-medium lg:font-normal lg:text-muted-foreground">
										至少打卡{" "}
										{event.buildingConfig
											?.requiredCheckIns || 6}{" "}
										次
									</span>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* 主体 - 移动端优化布局 */}
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
				{/* 左侧主列 */}
				<div className="lg:col-span-2 space-y-4 sm:space-y-6">
					<Card>
						<CardHeader className="pb-3 sm:pb-6">
							<CardTitle className="flex items-center gap-2 text-base sm:text-lg">
								<RocketLaunchIcon className="h-4 w-4 sm:h-5 sm:w-5" />
								{registration ? "我的打卡设置" : "挑战准备"}
							</CardTitle>
						</CardHeader>
						<CardContent className="pt-0">
							{!currentUserId ? (
								<div className="text-center py-8 sm:py-10">
									<UserGroupIcon className="h-10 w-10 sm:h-12 sm:w-12 mx-auto text-muted-foreground/60 mb-3 sm:mb-4" />
									<h3 className="text-base sm:text-lg font-medium mb-2">
										请先登录
									</h3>
									<p className="text-sm text-muted-foreground mb-4 px-4">
										登录后即可报名活动并设置打卡计划
									</p>
									<Button
										onClick={() =>
											window.location.assign(
												"/auth/login",
											)
										}
										size="lg"
										className="w-full sm:w-auto"
									>
										立即登录
									</Button>
								</div>
							) : needsEventRegistration ? (
								<div className="text-center py-8 sm:py-10">
									<RocketLaunchIcon className="h-10 w-10 sm:h-12 sm:w-12 mx-auto text-muted-foreground/60 mb-3 sm:mb-4" />
									<h3 className="text-base sm:text-lg font-medium mb-2">
										请先完成活动报名
									</h3>
									<p className="text-sm text-muted-foreground px-4 mb-4">
										报名成功后即可设置打卡计划并开始挑战
									</p>
									<Button
										onClick={() => onOpenRegistration?.()}
										size="lg"
										className="w-full sm:w-auto"
									>
										立即报名
									</Button>
								</div>
							) : isRegistrationDenied ? (
								<div className="text-center py-8 sm:py-10">
									<RocketLaunchIcon className="h-10 w-10 sm:h-12 sm:w-12 mx-auto text-muted-foreground/60 mb-3 sm:mb-4" />
									<h3 className="text-base sm:text-lg font-medium mb-2">
										您的报名不可用
									</h3>
									<p className="text-sm text-muted-foreground px-4">
										{registrationStatusText
											? `当前状态：${registrationStatusText}`
											: "请联系活动组织者获取更多信息"}
									</p>
								</div>
							) : !registration && canCompleteSetup ? (
								<BuildingPublicRegistration
									event={event}
									onSubmit={handleSetupSubmit}
									isLoading={submitting}
									existingRegistration={registration}
								/>
							) : !registration ? (
								<div className="text-center py-8 sm:py-10">
									<RocketLaunchIcon className="h-10 w-10 sm:h-12 sm:w-12 mx-auto text-muted-foreground/60 mb-3 sm:mb-4" />
									<h3 className="text-base sm:text-lg font-medium mb-2">
										{eventEnded
											? "挑战已结束"
											: "设置暂不可用"}
									</h3>
									<p className="text-sm text-muted-foreground px-4">
										{eventEnded
											? "该 Building Public 挑战已经结束"
											: "请稍候，活动组织者稍后会开启打卡设置"}
									</p>
								</div>
							) : (
								<div className="space-y-4 sm:space-y-5">
									<div className="rounded-lg border bg-green-50/60 border-green-200 p-3 sm:p-4">
										<div className="flex items-start gap-3">
											<div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-green-100 flex items-center justify-center mt-0.5 flex-shrink-0">
												<TrophyIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-600" />
											</div>
											<div className="flex-1 min-w-0">
												<h4 className="text-sm font-medium text-green-800 mb-1">
													已完成打卡设置
												</h4>
												<p className="text-xs sm:text-sm text-green-700">
													您已准备好参与本次 Building
													Public 挑战，开始您的 21
													天开发之旅！
												</p>
											</div>
										</div>
									</div>

									{canCheckIn && (
										<div className="rounded-lg border bg-blue-50/60 border-blue-200 p-3 sm:p-4">
											<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
												<div className="flex-1">
													<h4 className="text-sm font-medium text-blue-800 mb-1">
														开始打卡
													</h4>
													<p className="text-xs sm:text-sm text-blue-700">
														记录您的开发进度，与社区分享您的成果
													</p>
												</div>
												<Button
													onClick={() => {
														const checkInSection =
															document.getElementById(
																"checkin-section",
															);
														if (checkInSection) {
															checkInSection.scrollIntoView(
																{
																	behavior:
																		"smooth",
																},
															);
														}
													}}
													size="sm"
													className="w-full sm:w-auto"
												>
													<DocumentTextIcon className="mr-2 h-4 w-4" />
													立即打卡
												</Button>
											</div>
										</div>
									)}

									{/* 移动端优化：项目信息和进度 */}
									<div className="space-y-3">
										<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
											<div className="p-3 bg-muted/50 rounded-lg">
												<div className="text-xs font-medium text-muted-foreground mb-1">
													关联作品
												</div>
												<p
													className="text-sm font-medium break-words"
													title={
														registration.project
															.title
													}
												>
													{registration.project.title}
												</p>
											</div>
											<div className="p-3 bg-muted/50 rounded-lg">
												<div className="text-xs font-medium text-muted-foreground mb-1">
													打卡进度
												</div>
												<p className="text-sm font-medium">
													{registration.checkInCount}{" "}
													/{" "}
													{event.buildingConfig
														?.requiredCheckIns ||
														6}{" "}
													次
												</p>
											</div>
										</div>
									</div>

									<div>
										<div className="text-xs font-medium text-muted-foreground mb-2">
											我的21天开发计划
										</div>
										<div className="rounded-lg bg-muted p-3 sm:p-4 max-h-32 overflow-y-auto">
											<p className="text-sm leading-relaxed whitespace-pre-wrap">
												{registration.plan21Days}
											</p>
										</div>
									</div>
								</div>
							)}
						</CardContent>
					</Card>

					{registration && canCheckIn && (
						<Card id="checkin-section">
							<CardHeader>
								<CardTitle className="flex items-center gap-2 text-base sm:text-lg">
									<DocumentTextIcon className="h-5 w-5" />
									我的打卡
								</CardTitle>
							</CardHeader>
							<CardContent>
								<BuildingPublicCheckIn
									event={event}
									registration={registration}
									onSubmit={handleCheckIn}
									isLoading={submitting}
								/>
							</CardContent>
						</Card>
					)}

					{registration && !canCheckIn && (
						<Card>
							<CardContent className="text-center py-10">
								{eventEnded ? (
									<>
										<ClockIcon className="h-12 w-12 mx-auto text-muted-foreground/60 mb-4" />
										<h3 className="text-base sm:text-lg font-medium mb-2">
											挑战已结束
										</h3>
										<p className="text-sm text-muted-foreground">
											{registration.isCompleted
												? "🎉 恭喜您完成了本次挑战！"
												: "很遗憾，挑战已结束"}
										</p>
									</>
								) : !eventStarted ? (
									<>
										<ClockIcon className="h-12 w-12 mx-auto text-muted-foreground/60 mb-4" />
										<h3 className="text-base sm:text-lg font-medium mb-2">
											挑战尚未开始
										</h3>
										<p className="text-sm text-muted-foreground">
											挑战将于{" "}
											{new Date(
												event.startTime,
											).toLocaleDateString("zh-CN")}{" "}
											开始
										</p>
									</>
								) : null}
							</CardContent>
						</Card>
					)}
				</div>

				{/* 右侧侧栏 */}
				<div className="lg:col-span-1">
					<div className="lg:sticky lg:top-20 space-y-6">
						{currentUserId &&
							registration &&
							registration.isCompleted && (
								<Card>
									<CardHeader>
										<CardTitle className="flex items-center gap-2 text-base sm:text-lg">
											<TrophyIcon className="h-5 w-5" />
											我的证书
										</CardTitle>
									</CardHeader>
									<CardContent>
										<CertificateGallery
											eventId={event.id}
											showActions={true}
											compact={true}
										/>
									</CardContent>
								</Card>
							)}
					</div>
				</div>
			</div>

			{/* 社区动态 */}
			<div className="mt-8">
				<div className="mb-4">
					<h2 className="flex items-center gap-2 text-xl font-semibold text-gray-900">
						<UserGroupIcon className="h-5 w-5" />
						社区动态
					</h2>
				</div>
				<BuildingPublicFeed
					event={event}
					currentUserId={currentUserId}
					refreshKey={feedRefreshKey}
				/>
			</div>
		</div>
	);
}
