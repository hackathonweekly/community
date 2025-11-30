"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
	Edit,
	Heart,
	Loader2,
	Trophy,
	UserRound,
	Play,
	Music2,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useSession } from "@/modules/dashboard/auth/hooks/use-session";
import {
	useEventSubmissions,
	useVoteSubmission,
	useUnvoteSubmission,
} from "@/features/event-submissions/hooks";
import type { EventSubmission } from "@/features/event-submissions/types";
import { usePageVisibility } from "@/hooks/use-page-visibility";
import { cn } from "@/lib/utils";
// Removed fallback caption track for media preview per product decision

interface EventSubmissionsGalleryProps {
	eventId: string;
	locale: string;
	// When true, show final results (ranks and exact vote counts)
	showResults?: boolean;
	// When true, allow voting; when false, disable voting buttons
	isVotingOpen?: boolean;
	// When true (default), gallery shows vote counts and live standings; when false, hide them
	showVotesOnGallery?: boolean;
}

// Available sort options
const ALL_SORT_OPTIONS = [
	{ value: "createdAt:asc", label: "最早提交" },
	{ value: "createdAt:desc", label: "最新提交" },
	{ value: "voteCount:desc", label: "票数 (从高到低)" },
	{ value: "voteCount:asc", label: "票数 (从低到高)" },
	{ value: "name:asc", label: "名称 (A-Z)" },
];

const statusBadgeMap: Record<string, string> = {
	APPROVED: "bg-emerald-100 text-emerald-700",
	AWARDED: "bg-purple-100 text-purple-700",
	UNDER_REVIEW: "bg-amber-100 text-amber-700",
};

export function EventSubmissionsGallery({
	eventId,
	locale,
	showResults = false,
	isVotingOpen = false,
	showVotesOnGallery = true,
}: EventSubmissionsGalleryProps) {
	// Default to earliest submission order (Oldest -> Newest)
	const [sortValue, setSortValue] = useState("createdAt:asc");
	const [sortBy, sortOrder] = sortValue.split(":");

	// 筛选状态
	const [filter, setFilter] = useState<"all" | "mine" | "voted">("all");

	// Only show vote visuals when voting is open, not showing final results, and gallery display is enabled
	// This creates a fun "live" feel without revealing final ranks
	const showLiveVoteVisuals =
		isVotingOpen && !showResults && showVotesOnGallery;

	// Unified gate: whether we can show any vote numbers or standings in the gallery
	const canShowVotes =
		showVotesOnGallery && (showResults || showLiveVoteVisuals);

	// Ensure `voteCount` sort is only used when vote visibility is allowed
	useEffect(() => {
		if (sortBy === "voteCount" && !canShowVotes) {
			setSortValue("createdAt:asc");
		}
	}, [canShowVotes, sortBy]);

	const sortOptions = useMemo(() => {
		// Filter options based on visibility
		return ALL_SORT_OPTIONS.filter((opt) => {
			if (opt.value.startsWith("voteCount")) {
				return canShowVotes;
			}
			return true;
		});
	}, [canShowVotes]);

	const isVisible = usePageVisibility();
	const { user } = useSession();
	const pathname = usePathname();
	const router = useRouter();

	const { data, isLoading } = useEventSubmissions(eventId, {
		sort: sortBy,
		order: sortOrder as "asc" | "desc",
		includeVotes: true,
		refetchInterval: isVisible ? 2000 : false,
	});

	const voteMutation = useVoteSubmission(eventId);
	const unvoteMutation = useUnvoteSubmission(eventId);

	const submissions = data?.submissions ?? [];
	const remainingVotes = data?.remainingVotes ?? null;
	const votedIds = useMemo(
		() => new Set(data?.userVotes ?? []),
		[data?.userVotes],
	);

	// 筛选逻辑
	const filteredSubmissions = useMemo(() => {
		if (filter === "all") return submissions;

		if (filter === "mine") {
			return submissions.filter(
				(s) =>
					user &&
					(s.teamLeader?.id === user.id ||
						s.teamMembers?.some((m) => m.id === user.id)),
			);
		}

		if (filter === "voted") {
			return submissions.filter((s) => votedIds.has(s.id));
		}

		return submissions;
	}, [submissions, filter, user, votedIds]);

	// Top 3 Logic
	const top3Submissions = useMemo(() => {
		// Only show leaderboard when votes are visible
		if (!canShowVotes) return [];

		const getSubmissionTime = (submission: EventSubmission) => {
			const dateString =
				submission.submittedAt ||
				// Some payloads may include createdAt; fall back to it for tie-breaking
				(submission as any).createdAt ||
				submission.updatedAt;
			const time = dateString ? new Date(dateString).getTime() : 0;
			return Number.isNaN(time) ? 0 : time;
		};

		return [...submissions]
			.sort((a, b) => {
				// Sort by votes desc
				const voteDiff = b.voteCount - a.voteCount;
				if (voteDiff !== 0) return voteDiff;
				// Fallback: earlier submission wins when votes tie (align with awards ceremony)
				return getSubmissionTime(a) - getSubmissionTime(b);
			})
			.slice(0, 3)
			.filter((s) => s.voteCount > 0); // Optional: only show if they have votes
	}, [submissions, canShowVotes]);

	const scrollToSubmission = (id: string) => {
		const element = document.getElementById(`submission-${id}`);
		if (element) {
			element.scrollIntoView({ behavior: "smooth", block: "center" });
			// Add a temporary highlight effect
			element.classList.add("ring-2", "ring-primary", "ring-offset-2");
			setTimeout(() => {
				element.classList.remove(
					"ring-2",
					"ring-primary",
					"ring-offset-2",
				);
			}, 2000);
		}
	};

	const handleRequireAuth = () => {
		const redirectTo = encodeURIComponent(pathname || `/events/${eventId}`);
		router.push(`/auth/login?redirectTo=${redirectTo}`);
	};

	const handleVote = async (submission: EventSubmission) => {
		if (!user) {
			handleRequireAuth();
			return;
		}
		try {
			await voteMutation.mutateAsync(submission.id);
			toast.success("投票成功");
		} catch (error) {
			toast.error(error instanceof Error ? error.message : "投票失败");
		}
	};

	const handleUnvote = async (submission: EventSubmission) => {
		try {
			await unvoteMutation.mutateAsync(submission.id);
			toast.success("已取消投票");
		} catch (error) {
			toast.error(error instanceof Error ? error.message : "操作失败");
		}
	};

	const renderVoteButton = (submission: EventSubmission) => {
		const hasVoted = votedIds.has(submission.id);
		// Disable voting for anyone on the submission's team (leader or members)
		const isOwnTeam =
			Boolean(user) &&
			(submission.teamLeader?.id === user.id ||
				submission.teamMembers?.some((m) => m.id === user.id));
		const noVotesLeft = remainingVotes !== null && remainingVotes <= 0;

		// 投票未开放时禁用所有投票按钮
		if (!isVotingOpen) {
			return (
				<Button variant="outline" size="sm" disabled>
					投票已结束
				</Button>
			);
		}

		if (!user) {
			return (
				<Button variant="outline" size="sm" onClick={handleRequireAuth}>
					登录后投票
				</Button>
			);
		}

		if (isOwnTeam) {
			return (
				<Button variant="outline" size="sm" asChild>
					<Link
						href={`/app/events/${eventId}/submissions/${submission.id}/edit`}
					>
						<Edit className="w-4 h-4 mr-1" />
						编辑
					</Link>
				</Button>
			);
		}

		if (hasVoted) {
			return (
				<Button
					variant="outline"
					size="sm"
					onClick={() => handleUnvote(submission)}
					className="text-rose-600 border-rose-200 hover:bg-rose-50 hover:text-rose-700"
				>
					取消投票
				</Button>
			);
		}

		return (
			<Button
				variant="default"
				size="sm"
				disabled={noVotesLeft || voteMutation.isPending}
				onClick={() => handleVote(submission)}
			>
				{voteMutation.isPending ? (
					<Loader2 className="h-4 w-4 animate-spin" />
				) : (
					"投票"
				)}
			</Button>
		);
	};

	const renderLeaderboard = () => {
		if (top3Submissions.length === 0) return null;

		return (
			<Card className="sticky top-24 w-full border-amber-200 bg-amber-50/50 dark:border-amber-900/50 dark:bg-amber-950/10">
				<CardContent className="p-4 space-y-4">
					<div className="flex items-center gap-2 border-b border-amber-200 pb-3 dark:border-amber-900/50">
						<Trophy className="h-5 w-5 text-amber-500" />
						<h3 className="font-semibold text-amber-900 dark:text-amber-100">
							实时战况
						</h3>
						{isVotingOpen && (
							<span className="ml-auto flex h-2 w-2 relative">
								<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
								<span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
							</span>
						)}
					</div>

					<div className="space-y-3">
						{top3Submissions.map((submission, index) => {
							const isFirst = index === 0;
							const isSecond = index === 1;
							const isThird = index === 2;

							return (
								<div
									key={submission.id}
									className={cn(
										"group relative flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-white/60 dark:hover:bg-black/20 cursor-pointer",
										isFirst &&
											"bg-amber-100/50 dark:bg-amber-900/20",
									)}
									onClick={() =>
										scrollToSubmission(submission.id)
									}
								>
									<div
										className={cn(
											"flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-bold text-sm",
											isFirst
												? "bg-amber-400 text-white ring-2 ring-amber-200"
												: isSecond
													? "bg-slate-300 text-slate-600"
													: isThird
														? "bg-orange-300 text-orange-700"
														: "bg-muted text-muted-foreground",
										)}
									>
										{index + 1}
									</div>

									<div className="min-w-0 flex-1">
										<p className="truncate text-sm font-medium">
											{submission.name}
										</p>
										<div className="flex items-center gap-2 text-xs text-muted-foreground">
											<div className="flex items-center gap-1">
												<Avatar className="h-3 w-3">
													<AvatarImage
														src={
															submission
																.teamLeader
																?.avatar ??
															undefined
														}
													/>
													<AvatarFallback className="text-[8px]">
														{submission.teamLeader?.name?.[0]?.toUpperCase()}
													</AvatarFallback>
												</Avatar>
												<span className="truncate max-w-[80px]">
													{submission.teamLeader
														?.name ?? "Unknown"}
												</span>
											</div>
										</div>
									</div>

									<div className="text-right">
										<span className="text-lg font-bold text-rose-600 dark:text-rose-400">
											{submission.voteCount}
										</span>
										<p className="text-[10px] text-muted-foreground">
											票
										</p>
									</div>
								</div>
							);
						})}
					</div>

					{top3Submissions.length < 3 && (
						<p className="text-center text-xs text-muted-foreground py-2">
							虚位以待...
						</p>
					)}
				</CardContent>
			</Card>
		);
	};

	return (
		<div className="space-y-6">
			<div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
				<div>
					<h2 className="text-2xl font-semibold">作品展示与投票</h2>
					{isVotingOpen ? (
						user ? (
							<p className="text-sm text-muted-foreground">
								你还有 {remainingVotes ?? 3} 票
							</p>
						) : (
							<p className="text-sm text-muted-foreground">
								登录后即可拥有 3 票并参与投票
							</p>
						)
					) : showResults ? (
						<p className="text-sm text-muted-foreground">
							投票已结束，查看最终结果
						</p>
					) : (
						<p className="text-sm text-muted-foreground">
							尚未开放投票，尽请期待
						</p>
					)}
				</div>
				<div className="flex items-center gap-3">
					{/* 筛选按钮组 */}
					{user && (
						<div className="flex items-center gap-2 border rounded-lg p-1">
							<Button
								variant={filter === "all" ? "default" : "ghost"}
								size="sm"
								onClick={() => setFilter("all")}
							>
								全部
							</Button>
							<Button
								variant={
									filter === "mine" ? "default" : "ghost"
								}
								size="sm"
								onClick={() => setFilter("mine")}
							>
								我的作品
							</Button>
							<Button
								variant={
									filter === "voted" ? "default" : "ghost"
								}
								size="sm"
								onClick={() => setFilter("voted")}
							>
								已投票
							</Button>
						</div>
					)}
					<Select value={sortValue} onValueChange={setSortValue}>
						<SelectTrigger className="w-[140px] md:w-[200px]">
							<SelectValue placeholder="排序方式" />
						</SelectTrigger>
						<SelectContent>
							{sortOptions.map((option) => (
								<SelectItem
									key={option.value}
									value={option.value}
								>
									{option.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
			</div>

			<div className="flex flex-col lg:flex-row gap-6 relative items-start">
				<div className="flex-1 min-w-0 space-y-6">
					{isLoading ? (
						<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
							{Array.from({ length: 6 }).map((_, index) => (
								<Skeleton key={index} className="h-72 w-full" />
							))}
						</div>
					) : filteredSubmissions.length === 0 ? (
						<Card>
							<CardContent className="py-12 text-center text-muted-foreground">
								<p>
									{filter === "all"
										? "还没有作品提交，快来成为第一个吧！"
										: filter === "mine"
											? "你还没有提交作品"
											: "你还没有投票"}
								</p>
							</CardContent>
						</Card>
					) : (
						<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
							{filteredSubmissions.map((submission, index) => (
								<Card
									key={submission.id}
									id={`submission-${submission.id}`}
									className="flex flex-col overflow-hidden scroll-mt-24 transition-all duration-300"
								>
									{(() => {
										// Build a lightweight preview to avoid downloading full media in the gallery
										const firstVideo =
											submission.attachments?.find(
												(att) =>
													att.fileType === "video",
											);
										const firstAudio =
											submission.attachments?.find(
												(att) =>
													att.fileType === "audio",
											);
										const firstImage =
											submission.attachments?.find(
												(att) =>
													att.fileType === "image",
											);
										const previewImage =
											submission.coverImage ??
											firstImage?.fileUrl;
										// Avoid eager media loading in gallery; show a lightweight preview instead
										const mediaBadge = firstVideo
											? "video"
											: firstAudio
												? "audio"
												: null;

										return (
											<Link
												href={`/${locale}/events/${submission.eventId}/submissions/${submission.id}`}
												className="h-52 md:h-40 bg-muted overflow-hidden block group-hover:opacity-90 transition-opacity relative"
											>
												{previewImage ? (
													<img
														src={previewImage}
														alt={submission.name}
														loading="lazy"
														className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
													/>
												) : (
													<div className="w-full h-full flex items-center justify-center text-sm text-muted-foreground bg-gradient-to-br from-slate-100 to-slate-200">
														{mediaBadge === "video"
															? "视频作品，点击查看"
															: mediaBadge ===
																	"audio"
																? "音频作品，点击查看"
																: "暂无封面"}
													</div>
												)}

												{mediaBadge && (
													<div className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-black/60 px-2 py-1 text-[11px] font-medium text-white">
														{mediaBadge ===
														"video" ? (
															<Play className="h-3.5 w-3.5" />
														) : (
															<Music2 className="h-3.5 w-3.5" />
														)}
														<span>
															{mediaBadge ===
															"video"
																? "视频"
																: "音频"}
														</span>
													</div>
												)}
											</Link>
										);
									})()}
									<CardContent className="flex flex-col flex-1 space-y-4 p-5 md:p-4">
										<div className="flex items-start justify-between gap-3">
											<div className="flex-1 min-w-0 space-y-1">
												<div className="flex items-center gap-2 flex-wrap">
													<h3 className="font-semibold text-lg md:text-lg line-clamp-1 tracking-tight">
														{submission.name}
													</h3>
													{/* 我的作品标识 */}
													{user &&
														(submission.teamLeader
															?.id === user.id ||
															submission.teamMembers?.some(
																(m) =>
																	m.id ===
																	user.id,
															)) && (
															<Badge
																variant="secondary"
																className="text-[10px] h-5 px-1.5 font-normal"
															>
																我的作品
															</Badge>
														)}
													{/* 已投票标识 */}
													{user &&
														votedIds.has(
															submission.id,
														) && (
															<Badge
																variant="outline"
																className="text-[10px] h-5 px-1.5 text-rose-500 border-rose-300 font-normal"
															>
																已投票
															</Badge>
														)}
												</div>
												<p className="text-xs text-muted-foreground truncate flex items-center gap-1.5">
													<Avatar className="h-4 w-4">
														<AvatarImage
															src={
																submission
																	.teamLeader
																	?.avatar ??
																undefined
															}
														/>
														<AvatarFallback className="text-[8px]">
															{submission.teamLeader?.name?.[0]?.toUpperCase()}
														</AvatarFallback>
													</Avatar>
													<span>
														{submission.teamLeader
															?.name ?? "-"}
													</span>
												</p>
											</div>
											{showResults &&
												submission.rank &&
												submission.rank <= 3 && (
													<Badge
														variant="secondary"
														className="flex items-center gap-1 shrink-0 h-7 px-2 bg-amber-100 text-amber-700 border-amber-200"
													>
														<Trophy
															className={cn(
																"h-3.5 w-3.5",
																submission.rank ===
																	1 &&
																	"text-amber-600",
															)}
														/>
														<span className="font-semibold">
															#{submission.rank}
														</span>
													</Badge>
												)}
										</div>
										<p className="text-sm text-muted-foreground/80 line-clamp-2 leading-relaxed">
											{submission.tagline ||
												submission.description ||
												"暂未填写简介"}
										</p>
										<div className="flex items-center justify-between text-sm pt-2">
											<div className="flex items-center gap-1">
												{canShowVotes ? (
													<div
														className="flex items-center gap-1"
														title={
															showResults
																? "最终票数"
																: "实时热度"
														}
													>
														<Heart
															className={cn(
																"h-4 w-4 transition-colors",
																submission.voteCount >
																	0
																	? "text-rose-500 fill-rose-500"
																	: "text-muted-foreground",
															)}
														/>
														<span
															className={cn(
																"font-medium",
																showLiveVoteVisuals &&
																	"text-rose-600",
															)}
														>
															{
																submission.voteCount
															}
														</span>
													</div>
												) : (
													// Keep layout stable when votes are hidden
													<span className="invisible inline-flex items-center gap-1">
														<Heart className="h-4 w-4" />
														0
													</span>
												)}
											</div>
											<div className="flex items-center gap-1 text-muted-foreground">
												<UserRound className="h-4 w-4" />
												<span>
													{submission.teamSize} 人团队
												</span>
											</div>
										</div>

										<div className="flex items-center justify-between gap-2">
											<Button
												variant="link"
												asChild
												className="px-0"
											>
												<Link
													href={`/${locale}/events/${submission.eventId}/submissions/${submission.id}`}
												>
													查看详情
												</Link>
											</Button>
											{renderVoteButton(submission)}
										</div>
									</CardContent>
								</Card>
							))}
						</div>
					)}
				</div>

				{/* 右侧实时战况 (仅在大屏显示) */}
				<div className="hidden lg:block w-[280px] xl:w-[320px] shrink-0">
					{renderLeaderboard()}
				</div>
			</div>
		</div>
	);
}
