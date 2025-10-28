"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
	useEventBookmarksQuery,
	useMutualFriendsQuery,
	useParticipatedProjectsQuery,
	useProfileQuery,
	useProjectBookmarksQuery,
	useProjectsQuery,
	useUserEventsQuery,
	useUserFollowersQuery,
	useUserFollowingExcludingMutualQuery,
	useUserRegistrationsQuery,
} from "@/lib/api/api-hooks";
import { prefetchStrategies } from "@/lib/cache-config";
import { getLifeStatusLabel } from "@/lib/utils/life-status";
import {
	type ProfileRequirementStatus,
	validateCoreProfile,
} from "@/lib/utils/profile-validation";
import { ProfileCompletionNotice } from "@/modules/dashboard/profile/components/ProfileCompletionNotice";
import { ContactModal } from "@/modules/public/intro/components/ContactModal";
import { useSession } from "@dashboard/auth/hooks/use-session";
import { UserLevelBadges } from "@dashboard/level/components/LevelBadge";
import { useOrganizationsByRoleQuery } from "@dashboard/organizations/lib/api";
import { CompactQRCode } from "@dashboard/profile/components/CompactQRCode";
import { LocaleLink } from "@i18n/routing";
import type { ProjectStage } from "@prisma/client";
import { useQueryClient } from "@tanstack/react-query";
import {
	AlertCircle,
	ArrowRight,
	Award,
	BookOpen,
	Briefcase,
	Calendar,
	CalendarDays,
	Edit3,
	HelpCircle,
	Info,
	MessageCircle,
	RefreshCw,
	Share2,
	Users,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo } from "react";
import { toast } from "sonner";

interface Project {
	id: string;
	title: string;
	description: string;
	url?: string | null;
	imageUrl?: string | null;
	projectTags: string[];
	stage: ProjectStage;
	featured: boolean;
	viewCount: number;
	likeCount: number;
	commentCount: number;
	createdAt: string;
}

// 获取生命状态翻译
function getLifeStatusTranslation(status: string, t: any) {
	if (!status) return "";

	const translationKey = `lifeStatus.${status.toLowerCase()}`;
	const translated = t(translationKey);
	if (translated !== translationKey) return translated;

	const label = getLifeStatusLabel(status);
	return label || status;
}

// 用户概览卡片
function UserOverview() {
	const { user, loaded: sessionLoaded } = useSession();
	const t = useTranslations();
	const locale = useLocale();
	const router = useRouter();

	// 使用优化的hooks
	const { data: userProfile, isLoading: profileLoading } = useProfileQuery();

	const profileValidation = useMemo(() => {
		if (!userProfile) return null;

		return validateCoreProfile({
			name: userProfile.name,
			phoneNumber: userProfile.phoneNumber,
			email: userProfile.email,
			bio: userProfile.bio,
			userRoleString: userProfile.userRoleString,
			currentWorkOn: userProfile.currentWorkOn,
			lifeStatus: userProfile.lifeStatus,
			wechatId: userProfile.wechatId,
			skills: userProfile.skills,
			whatICanOffer: userProfile.whatICanOffer,
			whatIAmLookingFor: userProfile.whatIAmLookingFor,
		});
	}, [userProfile]);

	const needsProfileCompletion = profileValidation
		? profileValidation.missingCount > 0
		: false;

	const shouldShowProfileNotice =
		profileValidation &&
		(profileValidation.missingCount > 0 ||
			profileValidation.missingRecommendedFields.length > 0);

	const handleFixProfileField = useCallback(
		(field: ProfileRequirementStatus) => {
			const hash = field.sectionId ? `#${field.sectionId}` : "";
			router.push(`/app/profile${hash}`);
		},
		[router],
	);
	const { data: projects = [] } = useProjectsQuery();

	// 如果session还未加载完成，显示加载状态
	if (!sessionLoaded) {
		return (
			<Card>
				<CardContent className="pt-4">
					<div className="flex items-center space-x-3">
						<div className="h-12 w-12 bg-muted animate-pulse rounded-full" />
						<div className="flex-1">
							<div className="h-4 bg-muted animate-pulse rounded mb-2" />
							<div className="h-3 bg-muted animate-pulse rounded w-2/3" />
						</div>
					</div>
				</CardContent>
			</Card>
		);
	}

	if (!user) {
		return (
			<Card>
				<CardContent className="pt-4">
					<div className="flex items-center space-x-3">
						<div className="h-12 w-12 bg-muted animate-pulse rounded-full" />
						<div className="flex-1">
							<div className="h-4 bg-muted animate-pulse rounded mb-2" />
							<div className="h-3 bg-muted animate-pulse rounded w-2/3" />
						</div>
					</div>
				</CardContent>
			</Card>
		);
	}

	const cpValue = userProfile?.cpValue || 0;
	const joinDate = new Date(user.createdAt || Date.now());

	// 获取基础等级信息和建议行动
	const getBasicLevelInfo = () => {
		const level = userProfile?.membershipLevel;

		// 如果明确是 VISITOR，显示新朋友
		if (level === "VISITOR") {
			return {
				title: "L0 新朋友",
				nextStep: "参与活动或做一次志愿者",
				action: "参与活动",
				actionHref: `/${locale}/events`,
			};
		}

		// 如果明确是 MEMBER，显示共创伙伴
		if (level === "MEMBER") {
			return {
				title: "L1 共创伙伴",
				nextStep: "选择参与轨道开始升级",
				action: "了解参与模式",
				actionHref: "/app/level/apply",
			};
		}

		// 如果 membershipLevel 为 null/undefined，使用更保守的判断逻辑
		if (level === null || level === undefined) {
			// 检查用户是否有任何活动参与记录来判断是否为活跃用户
			const hasActivity =
				userProfile?.bio ||
				userProfile?.userRoleString ||
				userProfile?.lifeStatus ||
				(userProfile?.skills && userProfile.skills.length > 0);

			if (hasActivity) {
				// 有活动记录的用户默认为共创伙伴
				return {
					title: "L1 共创伙伴",
					nextStep: "选择参与轨道开始升级",
					action: "了解参与模式",
					actionHref: "/app/level/apply",
				};
			}
			// 完全新用户或无活动记录用户为新朋友
			return {
				title: "L0 新朋友",
				nextStep: "完善个人资料并参与活动",
				action: "完善资料",
				actionHref: "/app/profile",
			};
		}

		// 其他未知状态，默认为新朋友
		return {
			title: "L0 新朋友",
			nextStep: "参与活动或做一次志愿者",
			action: "参与活动",
			actionHref: `/${locale}/events`,
		};
	};

	const basicLevelInfo = getBasicLevelInfo();

	return (
		<Card className="shadow-sm">
			<CardContent className="pt-3 pb-3">
				{/* 用户基本信息 */}
				<div className="flex items-start justify-between mb-4">
					<div className="flex items-center space-x-4 flex-1 min-w-0">
						<Avatar className="h-12 w-12 flex-shrink-0">
							<AvatarImage
								src={user.image || ""}
								alt={user.name || "User"}
							/>
							<AvatarFallback className="bg-primary/10 text-primary text-lg font-semibold">
								{(user.name || "User")[0]?.toUpperCase() || "U"}
							</AvatarFallback>
						</Avatar>
						<div className="flex-1 min-w-0">
							{/* 确保使用一致的用户名来源 */}
							{(() => {
								const displayUsername =
									userProfile?.username || user.username;
								return (
									<Link
										href={
											displayUsername
												? `/zh/u/${displayUsername}`
												: "#"
										}
										className={`hover:opacity-80 transition-opacity ${!displayUsername ? "pointer-events-none" : ""}`}
									>
										<h3 className="font-semibold text-lg hover:underline truncate">
											{user.name || "用户"}
										</h3>
										<p className="text-sm text-muted-foreground truncate">
											@{displayUsername || "设置中"}
										</p>
									</Link>
								);
							})()}
							<div className="flex items-center flex-wrap gap-x-4 gap-y-1.5 mt-2">
								<div className="flex items-center gap-2 flex-shrink-0">
									<Link
										href="/app/level/apply"
										className="hover:opacity-80 transition-opacity flex-shrink-0"
									>
										{profileLoading ? (
											<div className="h-6 w-16 bg-muted animate-pulse rounded" />
										) : (
											<UserLevelBadges
												user={{
													// 使用 profile 中的等级字段来渲染徽章
													membershipLevel:
														userProfile?.membershipLevel ??
														null,
													creatorLevel:
														userProfile?.creatorLevel ??
														null,
													mentorLevel:
														userProfile?.mentorLevel ??
														null,
													contributorLevel:
														userProfile?.contributorLevel ??
														null,
													// 传递 createdAt 用于等级判断逻辑
													createdAt: user.createdAt,
												}}
												size="sm"
												showTooltip={false}
											/>
										)}
									</Link>
									<Link
										href="/app/level/apply"
										className="text-xs text-primary hover:text-primary/80 transition-colors flex items-center whitespace-nowrap flex-shrink-0"
									>
										<Info className="h-3 w-3 mr-1 flex-shrink-0" />
										了解参与模式
									</Link>
								</div>
								<div className="flex items-center gap-1 text-xs text-muted-foreground whitespace-nowrap flex-shrink-0">
									<CalendarDays className="h-3 w-3 flex-shrink-0" />
									<span className="whitespace-nowrap">
										{joinDate.toLocaleDateString("zh-CN")}{" "}
										加入
									</span>
								</div>
							</div>
						</div>
					</div>

					{/* 操作按钮 - 优化移动端和桌面端布局 */}
					<div className="flex items-center gap-2 flex-shrink-0">
						<Button
							size="sm"
							variant="ghost"
							className="h-8 w-8 p-0 flex-shrink-0"
							asChild
							title="编辑资料"
						>
							<Link href="/app/profile">
								<Edit3 className="h-4 w-4" />
							</Link>
						</Button>

						{userProfile?.username &&
							userProfile?.profilePublic && (
								<div className="flex-shrink-0">
									<CompactQRCode
										user={{
											id: user.id,
											name: user.name,
											username: userProfile.username,
											profilePublic:
												userProfile.profilePublic,
										}}
										className="h-8 w-8"
									/>
								</div>
							)}

						<Button
							size="sm"
							variant="default"
							className="h-8 px-3 flex-shrink-0 bg-primary hover:bg-primary/90 text-xs"
							onClick={async () => {
								try {
									// 确保有用户名才进行分享
									const displayUsername =
										userProfile?.username || user.username;
									if (!displayUsername) {
										toast.error("请先设置用户名");
										return;
									}

									const profileUrl = `${window.location.origin}/zh/u/${displayUsername}`;
									const shareData = {
										title: `${user.name || displayUsername} - 周周黑客松`,
										text: `查看 ${user.name || displayUsername} 的个人资料`,
										url: profileUrl,
									};

									// 检查是否支持 Web Share API
									if (
										navigator.share &&
										navigator.canShare?.(shareData)
									) {
										await navigator.share(shareData);
									} else {
										// 降级到剪贴板复制
										if (navigator.clipboard?.writeText) {
											await navigator.clipboard.writeText(
												profileUrl,
											);
											toast.success(
												"个人资料链接已复制到剪贴板",
											);
										} else {
											// 最后的降级方案：创建临时文本区域
											const textArea =
												document.createElement(
													"textarea",
												);
											textArea.value = profileUrl;
											textArea.style.position = "fixed";
											textArea.style.left = "-9999px";
											document.body.appendChild(textArea);
											textArea.focus();
											textArea.select();
											try {
												document.execCommand("copy");
												toast.success(
													"个人资料链接已复制到剪贴板",
												);
											} catch (fallbackError) {
												toast.error(
													`无法复制链接，请手动复制：${profileUrl}`,
												);
											} finally {
												document.body.removeChild(
													textArea,
												);
											}
										}
									}
								} catch (error) {
									console.error("分享失败:", error);
									// 如果所有方法都失败，提供手动复制选项
									const displayUsername =
										userProfile?.username || user.username;
									const profileUrl = `${window.location.origin}/zh/u/${displayUsername}`;
									toast.error(
										`分享失败，请手动复制：${profileUrl}`,
									);
								}
							}}
							title="分享名片"
						>
							<Share2 className="h-3.5 w-3.5 mr-1.5" />
							<span className="hidden sm:inline">分享</span>
						</Button>
					</div>
				</div>

				{/* 个人状态信息 - 响应式标签布局 */}
				{profileLoading ? (
					<div className="mt-3 flex flex-wrap gap-1.5">
						<div className="h-6 w-20 bg-muted animate-pulse rounded-full" />
						<div className="h-6 w-16 bg-muted animate-pulse rounded-full" />
						<div className="h-6 w-24 bg-muted animate-pulse rounded-full" />
					</div>
				) : (
					(userProfile?.userRoleString ||
						userProfile?.lifeStatus ||
						userProfile?.currentWorkOn) && (
						<div className="mt-3 flex flex-wrap gap-1.5">
							{userProfile?.userRoleString && (
								<span className="inline-flex items-center px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-medium whitespace-nowrap">
									<span className="mr-1">👤</span>
									{userProfile.userRoleString}
								</span>
							)}
							{userProfile?.lifeStatus && (
								<span className="inline-flex items-center px-2.5 py-1 rounded-full bg-green-50 text-green-700 border border-green-200 text-xs font-medium whitespace-nowrap">
									<span className="mr-1">📍</span>
									{getLifeStatusTranslation(
										userProfile.lifeStatus,
										t,
									)}
								</span>
							)}
							{userProfile?.currentWorkOn && (
								<span className="inline-flex items-center px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200 text-xs font-medium">
									<span className="mr-1 flex-shrink-0">
										🚀
									</span>
									<span className="truncate max-w-[150px] sm:max-w-none">
										{userProfile.currentWorkOn}
									</span>
								</span>
							)}
						</div>
					)
				)}

				{/* 个人成长状态 - 简化为一行关键信息 */}
				<div className="mt-4 p-3 rounded-lg bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20">
					{profileLoading ? (
						<div className="flex items-center justify-between text-sm">
							<div className="flex flex-col gap-2">
								<div className="h-4 w-16 bg-muted animate-pulse rounded" />
								<div className="h-3 w-32 bg-muted animate-pulse rounded" />
							</div>
							<div className="h-4 w-20 bg-muted animate-pulse rounded" />
						</div>
					) : (
						<div className="flex items-center justify-between text-sm">
							<div className="flex flex-col gap-2">
								<div className="flex items-center gap-1">
									<span className="text-muted-foreground">
										💎
									</span>
									<span className="font-medium">
										{cpValue} CP
									</span>
								</div>
								<div className="text-xs text-muted-foreground">
									<div>下一步：</div>
									<div>{basicLevelInfo.nextStep}</div>
								</div>
							</div>
							<div className="flex gap-3">
								<Link
									href={basicLevelInfo.actionHref}
									className="text-xs text-primary hover:underline"
								>
									{basicLevelInfo.action} →
								</Link>
							</div>
						</div>
					)}
				</div>
			</CardContent>
		</Card>
	);
}

// 资源匹配信息提示卡片
function ResourceMatchingPrompt() {
	const { user, loaded: sessionLoaded } = useSession();
	const { data: userProfile, isLoading } = useProfileQuery();

	if (!sessionLoaded || !user || isLoading) {
		return null;
	}

	const hasResourceInfo =
		userProfile?.whatICanOffer || userProfile?.whatIAmLookingFor;
	const hasSkills = userProfile?.skills && userProfile?.skills.length > 0;

	// 如果用户已经填写了资源信息，就不显示这个提示卡片
	if (hasResourceInfo && hasSkills) {
		return null;
	}

	return (
		<Card className="shadow-sm border-l-4 border-l-primary/50">
			<CardContent className="pt-4 pb-4">
				<div className="flex items-start justify-between">
					<div className="flex-1">
						<h3 className="font-medium text-foreground mb-2 flex items-center">
							<Users className="h-4 w-4 mr-2 text-primary" />
							完善资源匹配信息
						</h3>
						<p className="text-sm text-muted-foreground mb-3 leading-relaxed">
							填写你的技能专长和需求，让其他成员更容易找到你，发现更多合作机会。
						</p>
						<div className="space-y-1 text-xs text-muted-foreground">
							{!hasSkills && (
								<div className="flex items-center">
									<div className="w-1.5 h-1.5 rounded-full bg-amber-400 mr-2" />
									<span>技能标签未设置</span>
								</div>
							)}
							{!userProfile?.whatICanOffer && (
								<div className="flex items-center">
									<div className="w-1.5 h-1.5 rounded-full bg-amber-400 mr-2" />
									<span>我能提供的资源未设置</span>
								</div>
							)}
							{!userProfile?.whatIAmLookingFor && (
								<div className="flex items-center">
									<div className="w-1.5 h-1.5 rounded-full bg-amber-400 mr-2" />
									<span>我正在寻找的资源未设置</span>
								</div>
							)}
						</div>
					</div>
					<Link
						href="/app/profile#resource-matching"
						className="ml-4 flex items-center text-sm text-primary hover:text-primary/80 transition-colors font-medium"
					>
						立即填写
						<ArrowRight className="h-3.5 w-3.5 ml-1" />
					</Link>
				</div>
			</CardContent>
		</Card>
	);
}

// 轻量化分组组件
function CompactSection({
	title,
	icon: Icon,
	data,
	actionButton,
	isLoading = false,
	error = null,
	onRetry,
}: {
	title: string;
	icon: any;
	data: Array<{
		label: string;
		value: string | number;
		href?: string;
		disabled?: boolean;
	}>;
	actionButton?: React.ReactNode;
	isLoading?: boolean;
	error?: Error | null;
	onRetry?: () => void;
}) {
	if (error) {
		return (
			<div className="bg-card border rounded-lg p-4 shadow-sm">
				<div className="flex items-center justify-between mb-4">
					<div className="flex items-center">
						<div className="bg-destructive/10 text-destructive px-3 py-1.5 rounded-full flex items-center space-x-2">
							<AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
							<span className="text-sm font-medium">{title}</span>
						</div>
					</div>
					{onRetry && (
						<Button
							onClick={onRetry}
							variant="outline"
							size="sm"
							className="h-7 px-2"
						>
							<RefreshCw className="h-3 w-3 mr-1" />
							重试
						</Button>
					)}
				</div>
				<div className="text-center py-4">
					<p className="text-sm text-muted-foreground">
						数据加载失败，请重试
					</p>
				</div>
			</div>
		);
	}

	if (isLoading) {
		return (
			<div className="bg-card border rounded-lg p-4 shadow-sm">
				<div className="flex items-center justify-between mb-4">
					<div className="flex items-center">
						<div className="bg-primary/10 text-primary px-3 py-1.5 rounded-full flex items-center space-x-2">
							<Icon className="h-3.5 w-3.5 flex-shrink-0" />
							<span className="text-sm font-medium">{title}</span>
						</div>
					</div>
				</div>
				<div className="grid grid-cols-3 gap-2 sm:gap-3">
					{[1, 2, 3].map((i) => (
						<div key={i} className="text-center min-w-0 p-2 sm:p-3">
							<div className="h-6 bg-muted animate-pulse rounded mb-2" />
							<div className="h-3 bg-muted animate-pulse rounded" />
						</div>
					))}
				</div>
			</div>
		);
	}
	return (
		<div className="bg-card border rounded-lg p-4 shadow-sm">
			{/* 标题行 */}
			<div className="flex items-center justify-between mb-4">
				<div className="flex items-center">
					<div className="bg-primary/10 text-primary px-3 py-1.5 rounded-full flex items-center space-x-2">
						<Icon className="h-3.5 w-3.5 flex-shrink-0" />
						<span className="text-sm font-medium">{title}</span>
					</div>
				</div>
				{actionButton && (
					<div className="text-xs text-muted-foreground">
						{actionButton}
					</div>
				)}
			</div>

			{/* 数据行 - 响应式网格 */}
			<div className="grid grid-cols-3 gap-2 sm:gap-3">
				{data.map((item, index) => (
					<div key={index} className="text-center min-w-0">
						{item.href && !item.disabled ? (
							<Link
								href={item.href}
								className="block p-2 sm:p-3 hover:bg-muted/30 rounded-lg transition-all duration-200 group min-w-0"
							>
								<div className="text-lg sm:text-2xl font-bold text-foreground mb-1 group-hover:scale-105 transition-transform truncate">
									{item.value}
								</div>
								<div className="text-xs text-muted-foreground group-hover:text-foreground transition-colors leading-tight">
									{item.label}
								</div>
							</Link>
						) : (
							<div
								className={`p-2 sm:p-3 min-w-0 ${item.disabled ? "opacity-50" : ""}`}
							>
								<div
									className={`text-lg sm:text-2xl font-bold mb-1 truncate ${
										item.disabled
											? "text-muted-foreground"
											: "text-foreground"
									}`}
								>
									{item.value}
								</div>
								<div className="text-xs text-muted-foreground leading-tight">
									{item.label}
								</div>
							</div>
						)}
					</div>
				))}
			</div>
		</div>
	);
}

// 我的朋友分组
function MyFriends() {
	const queryClient = useQueryClient();

	// 使用优化的hooks
	const {
		data: mutualFriendsData,
		isLoading: mutualLoading,
		error: mutualError,
	} = useMutualFriendsQuery(1);
	const {
		data: userFollowingExcludingMutual = [],
		isLoading: followingLoading,
		error: followingError,
	} = useUserFollowingExcludingMutualQuery();
	const {
		data: userFollowers = [],
		isLoading: followersLoading,
		error: followersError,
	} = useUserFollowersQuery();

	const loading = mutualLoading || followingLoading || followersLoading;
	const error = mutualError || followingError || followersError;

	const data = [
		{
			label: "互关好友",
			value: loading ? "..." : mutualFriendsData?.totalCount || 0,
			href: "/app/interactive-users",
		},
		{
			label: "我关注的",
			value: loading ? "..." : userFollowingExcludingMutual.length,
			href: "/app/following",
		},
		{
			label: "关注我的",
			value: loading ? "..." : userFollowers.length,
			href: "/app/followers",
		},
	];

	const handleRetry = () => {
		queryClient.invalidateQueries({ queryKey: ["user", "mutual-friends"] });
		queryClient.invalidateQueries({
			queryKey: ["user", "following-excluding-mutual"],
		});
		queryClient.invalidateQueries({
			queryKey: ["user", "followers"],
		});
	};

	return (
		<CompactSection
			title="我的朋友"
			icon={Users}
			data={data}
			isLoading={loading}
			error={error}
			onRetry={handleRetry}
			actionButton={
				!error && (
					<Link
						href="/app/interactive-users"
						className="text-primary hover:underline"
					>
						查看全部 →
					</Link>
				)
			}
		/>
	);
}

// 我的活动分组
function MyActivities() {
	const queryClient = useQueryClient();

	// 使用优化的hooks
	const {
		data: events = [],
		isLoading: eventsLoading,
		error: eventsError,
	} = useUserRegistrationsQuery();
	const {
		data: eventBookmarks = [],
		isLoading: bookmarksLoading,
		error: bookmarksError,
	} = useEventBookmarksQuery();
	const {
		data: organizedEvents = [],
		isLoading: organizedLoading,
		error: organizedError,
	} = useUserEventsQuery();

	const loading = eventsLoading || bookmarksLoading || organizedLoading;
	const error = eventsError || bookmarksError || organizedError;

	const data = [
		{
			label: "我参与的",
			value: loading ? "..." : events.length,
			href: "/app/events#registered",
		},
		{
			label: "我发起的",
			value: loading ? "..." : organizedEvents.length,
			href: "/app/events#organized",
		},
		{
			label: "我收藏的",
			value: loading ? "..." : eventBookmarks.length,
			href: "/app/bookmarks?tab=events",
		},
	];

	const handleRetry = () => {
		queryClient.invalidateQueries({ queryKey: ["user", "registrations"] });
		queryClient.invalidateQueries({ queryKey: ["bookmarks", "events"] });
		queryClient.invalidateQueries({ queryKey: ["user", "events"] });
	};

	return (
		<CompactSection
			title="我的活动"
			icon={Calendar}
			data={data}
			isLoading={loading}
			error={error}
			onRetry={handleRetry}
			actionButton={
				!error && (
					<Link
						href="/app/events"
						className="text-primary hover:underline"
					>
						查看全部 →
					</Link>
				)
			}
		/>
	);
}

// 我的作品分组
function MyWorks() {
	const queryClient = useQueryClient();

	// 使用优化的hooks
	const {
		data: projects = [],
		isLoading: projectsLoading,
		error: projectsError,
	} = useProjectsQuery();
	const {
		data: projectBookmarks = [],
		isLoading: bookmarksLoading,
		error: bookmarksError,
	} = useProjectBookmarksQuery();
	const {
		data: participatedProjects = [],
		isLoading: participatedLoading,
		error: participatedError,
	} = useParticipatedProjectsQuery();

	const loading = projectsLoading || bookmarksLoading || participatedLoading;
	const error = projectsError || bookmarksError || participatedError;

	const data = [
		{
			label: "我发布的",
			value: loading ? "..." : projects.length,
			href: "/app/projects",
		},
		{
			label: "我收藏的",
			value: loading ? "..." : projectBookmarks.length,
			href: "/app/bookmarks?tab=projects",
		},
		{
			label: "我参与的",
			value: loading ? "..." : participatedProjects.length,
			href: "/app/projects",
		},
	];

	const handleRetry = () => {
		queryClient.invalidateQueries({ queryKey: ["projects"] });
		queryClient.invalidateQueries({ queryKey: ["bookmarks", "projects"] });
		queryClient.invalidateQueries({
			queryKey: ["projects", "participated"],
		});
	};

	return (
		<CompactSection
			title="我的作品"
			icon={Briefcase}
			data={data}
			isLoading={loading}
			error={error}
			onRetry={handleRetry}
			actionButton={
				!error && (
					<Link
						href="/app/projects"
						className="text-primary hover:underline"
					>
						查看全部 →
					</Link>
				)
			}
		/>
	);
}

// 我的组织分组
function MyOrganizations() {
	const queryClient = useQueryClient();
	const {
		data: organizationsData,
		isLoading,
		error,
	} = useOrganizationsByRoleQuery();

	const data = [
		{
			label: "我加入的",
			value: isLoading
				? "..."
				: organizationsData
					? organizationsData.organizations.length
					: 0,
			href: (() => {
				if (
					organizationsData &&
					organizationsData.organizations.length > 0
				) {
					// 找到第一个有有效 slug 的组织
					const validOrg = organizationsData.organizations.find(
						(org: any) => org.slug?.trim(),
					);
					return validOrg
						? `/app/${validOrg.slug}`
						: "/app/new-organization";
				}
				return "/app/new-organization";
			})(),
		},
		{
			label: "我管理的",
			value: isLoading
				? "..."
				: organizationsData
					? organizationsData.managed.length
					: 0,
			href:
				organizationsData && organizationsData.managed.length > 0
					? `/app/${organizationsData.managed[0].slug}`
					: undefined,
			disabled:
				!organizationsData || organizationsData.managed.length === 0,
		},
		{
			label: "我创建的",
			value: isLoading
				? "..."
				: organizationsData
					? organizationsData.created.length
					: 0,
			href:
				organizationsData && organizationsData.created.length > 0
					? `/app/${organizationsData.created[0].slug}`
					: undefined,
			disabled:
				!organizationsData || organizationsData.created.length === 0,
		},
	];

	const handleRetry = () => {
		queryClient.invalidateQueries({
			queryKey: ["user", "organizations", "by-role"],
		});
	};

	return (
		<CompactSection
			title="我的组织"
			icon={Users}
			data={data}
			isLoading={isLoading}
			error={error}
			onRetry={handleRetry}
			actionButton={
				!error && (
					<Link href="/orgs" className="text-primary hover:underline">
						查看全部 →
					</Link>
				)
			}
		/>
	);
}

// 帮助支持
function HelpSupport() {
	interface HelpItemBase {
		title: string;
		icon: any;
	}

	interface LinkHelpItem extends HelpItemBase {
		type: "link";
		href: string;
	}

	interface ModalHelpItem extends HelpItemBase {
		type: "modal";
	}

	type HelpItem = LinkHelpItem | ModalHelpItem;

	const helpItems: HelpItem[] = [
		{
			title: "关于周周黑客松",
			icon: BookOpen,
			href: "/docs",
			type: "link",
		},
		{
			title: "等级身份",
			icon: Award,
			href: "/docs/user-level-system",
			type: "link",
		},
		{
			title: "常见问题",
			icon: HelpCircle,
			href: "/docs/faq",
			type: "link",
		},
		{ title: "联系我们", icon: MessageCircle, type: "modal" },
	];

	return (
		<div className="bg-card border rounded-lg p-4 shadow-sm">
			<div className="flex items-center mb-4">
				<div className="bg-primary/10 text-primary px-3 py-1.5 rounded-full flex items-center space-x-2">
					<HelpCircle className="h-3.5 w-3.5 flex-shrink-0" />
					<span className="text-sm font-medium">帮助与支持</span>
				</div>
			</div>
			<div className="grid grid-cols-2 gap-2 sm:gap-3">
				{helpItems.map((item) =>
					item.type === "modal" ? (
						<ContactModal key={item.title}>
							<div className="flex items-center p-3 hover:bg-muted/50 rounded-lg transition-colors group min-w-0 cursor-pointer">
								<div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center mr-3 group-hover:bg-primary/20 transition-colors flex-shrink-0">
									<item.icon className="h-4 w-4 text-primary" />
								</div>
								<span className="text-sm font-medium group-hover:text-primary transition-colors truncate">
									{item.title}
								</span>
							</div>
						</ContactModal>
					) : (
						<LocaleLink
							key={item.title}
							href={item.href}
							className="flex items-center p-3 hover:bg-muted/50 rounded-lg transition-colors group min-w-0"
						>
							<div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center mr-3 group-hover:bg-primary/20 transition-colors flex-shrink-0">
								<item.icon className="h-4 w-4 text-primary" />
							</div>
							<span className="text-sm font-medium group-hover:text-primary transition-colors truncate">
								{item.title}
							</span>
						</LocaleLink>
					),
				)}
			</div>
		</div>
	);
}

export default function CreatorDashboard() {
	const { user, loaded: sessionLoaded } = useSession();
	const t = useTranslations();
	const queryClient = useQueryClient();
	const router = useRouter();

	// 使用优化的hook，但只在session加载完成后才执行
	const { data: userProfile, isLoading: profileLoading } = useProfileQuery();

	const profileValidation = useMemo(() => {
		if (!userProfile) return null;

		return validateCoreProfile({
			name: userProfile.name,
			phoneNumber: userProfile.phoneNumber,
			email: userProfile.email,
			bio: userProfile.bio,
			userRoleString: userProfile.userRoleString,
			currentWorkOn: userProfile.currentWorkOn,
			lifeStatus: userProfile.lifeStatus,
			wechatId: userProfile.wechatId,
			skills: userProfile.skills,
			whatICanOffer: userProfile.whatICanOffer,
			whatIAmLookingFor: userProfile.whatIAmLookingFor,
		});
	}, [userProfile]);

	const needsProfileCompletion = profileValidation
		? profileValidation.missingCount > 0
		: false;

	const shouldShowProfileNotice =
		profileValidation &&
		(profileValidation.missingCount > 0 ||
			profileValidation.missingRecommendedFields.length > 0);

	const handleFixProfileField = useCallback(
		(field: ProfileRequirementStatus) => {
			const hash = field.sectionId ? `#${field.sectionId}` : "";
			router.push(`/app/profile${hash}`);
		},
		[router],
	);

	// 监听session状态变化，清除相关缓存
	useEffect(() => {
		if (sessionLoaded && user) {
			// Session准备好且有用户时，确保查询数据是最新的
			queryClient.invalidateQueries({ queryKey: ["profile"] });
		}
	}, [sessionLoaded, user?.id, queryClient]);

	// 数据预加载 - 在session准备好后才预加载仪表板数据
	useEffect(() => {
		// 只有在session加载完成且有用户时才预加载
		if (!sessionLoaded || !user) {
			return;
		}

		let isCancelled = false;

		const prefetchData = async () => {
			try {
				await prefetchStrategies.prefetchDashboardData(queryClient);
			} catch (error) {
				if (!isCancelled) {
					console.warn("预加载仪表板数据失败:", error);
					// 在开发环境下提供更详细的错误信息
					if (process.env.NODE_ENV === "development") {
						console.error("预加载错误详情:", error);
					}
				}
			}
		};

		prefetchData();

		// 清理函数，防止内存泄漏
		return () => {
			isCancelled = true;
		};
	}, [sessionLoaded, user?.id, queryClient]);

	// 如果session还没加载完成，显示加载状态
	if (!sessionLoaded) {
		return (
			<div className="space-y-4">
				<Card>
					<CardContent className="pt-4">
						<div className="flex items-center space-x-3">
							<div className="h-12 w-12 bg-muted animate-pulse rounded-full" />
							<div className="flex-1">
								<div className="h-4 bg-muted animate-pulse rounded mb-2" />
								<div className="h-3 bg-muted animate-pulse rounded w-2/3" />
							</div>
						</div>
					</CardContent>
				</Card>
			</div>
		);
	}

	const isNewUser =
		user &&
		new Date(user.createdAt || Date.now()).getTime() >
			Date.now() - 7 * 24 * 60 * 60 * 1000;

	return (
		<div className="space-y-4">
			{/* 用户概览 */}
			<UserOverview />

			{/* 新用户引导 */}
			{isNewUser && (
				<div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
					<h4 className="text-blue-900 font-medium text-sm mb-2">
						{t("dashboard.newUser.welcome")}
					</h4>
					<p className="text-blue-700 text-xs mb-3">
						{t("dashboard.newUser.description")}
					</p>
					<div className="flex flex-wrap gap-2">
						{!profileLoading && needsProfileCompletion && (
							<Button size="sm" className="h-8 text-xs" asChild>
								<Link href="/app/profile">
									{t("dashboard.newUser.completeProfile")}
								</Link>
							</Button>
						)}
						<Button
							size="sm"
							variant="outline"
							className="h-8 text-xs"
							asChild
						>
							<LocaleLink href="/docs">了解社区</LocaleLink>
						</Button>
						<Button
							size="sm"
							variant="outline"
							className="h-8 text-xs"
							asChild
						>
							<Link href="/events">
								{t("dashboard.newUser.viewEvents")}
							</Link>
						</Button>
					</div>
				</div>
			)}

			{/* 资料完善提示 */}
			{!isNewUser &&
				!profileLoading &&
				profileValidation &&
				shouldShowProfileNotice && (
					<ProfileCompletionNotice
						validation={profileValidation}
						variant="compact"
						actionHref="/app/profile"
						onFixField={handleFixProfileField}
					/>
				)}

			{/* 功能分组区域 - 桌面端并排显示 */}
			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				<MyFriends />
				<MyActivities />
				<MyWorks />
				<MyOrganizations />
			</div>

			{/* 帮助支持 - 全宽显示 */}
			<HelpSupport />
		</div>
	);
}
