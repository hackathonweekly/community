"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
	Edit,
	Heart,
	Image,
	LayoutGrid,
	List,
	Loader2,
	Music2,
	Play,
	Trophy,
	UserRound,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
	useEventSubmissions,
	useUnvoteSubmission,
	useVoteSubmission,
} from "@/features/event-submissions/hooks";
import { ACTIVE_REGISTRATION_STATUSES } from "@/features/event-submissions/constants";
import type { RegistrationStatus } from "@prisma/client";
import type { EventSubmission } from "@/features/event-submissions/types";
import { usePageVisibility } from "@/hooks/use-page-visibility";
import { cn } from "@/lib/utils";
import { useSession } from "@/modules/dashboard/auth/hooks/use-session";
import { SubmissionsActionButton } from "./SubmissionsActionButton";
import { useEventRegistrationStatus } from "./useEventRegistrationStatus";
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
	// Whether submissions are currently open for this event
	isSubmissionOpen?: boolean;
	// Whether to show the inline submission CTA within the gallery header
	showInlineSubmissionCta?: boolean;
}

// Available sort options
const ALL_SORT_OPTIONS = [
	{ value: "createdAt:asc", label: "最早提交" },
	{ value: "createdAt:desc", label: "最新提交" },
	{ value: "voteCount:desc", label: "票数 (从高到低)" },
	{ value: "voteCount:asc", label: "票数 (从低到高)" },
	{ value: "name:asc", label: "名称 (A-Z)" },
];

export function EventSubmissionsGallery({
	eventId,
	locale,
	showResults = false,
	isVotingOpen = false,
	showVotesOnGallery = true,
	isSubmissionOpen = false,
	showInlineSubmissionCta = true,
}: EventSubmissionsGalleryProps) {
	const MAX_VOTES_PER_USER = 3;

	// Default to earliest submission order (Oldest -> Newest)
	const [sortValue, setSortValue] = useState("createdAt:asc");
	const [sortBy, sortOrder] = sortValue.split(":");

	// 筛选状态
	const [filter, setFilter] = useState<"all" | "mine" | "voted">("all");
	const [viewMode, setViewMode] = useState<"grid" | "list">("list");
	const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
	const [pendingSubmissionIds, setPendingSubmissionIds] = useState<
		Set<string>
	>(() => new Set());
	const [remainingVotesOverride, setRemainingVotesOverride] = useState<
		number | null
	>(null);

	const markSubmissionPending = (id: string) => {
		setPendingSubmissionIds((prev) => {
			const next = new Set(prev);
			next.add(id);
			return next;
		});
	};

	const clearSubmissionPending = (id: string) => {
		setPendingSubmissionIds((prev) => {
			const next = new Set(prev);
			next.delete(id);
			return next;
		});
	};

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
	const userId = user?.id;
	const pathname = usePathname();
	const router = useRouter();
	const registerHref = `/${locale}/events/${eventId}/register`;
	const { data: registration, isLoading: isRegistrationLoading } =
		useEventRegistrationStatus(eventId, userId);
	const hasActiveRegistration = Boolean(
		registration?.status &&
			ACTIVE_REGISTRATION_STATUSES.includes(
				registration.status as RegistrationStatus,
			),
	);
	const isRegistrationApproved = registration?.status === "APPROVED";

	const { data, isLoading } = useEventSubmissions(eventId, {
		sort: sortBy,
		order: sortOrder as "asc" | "desc",
		includeVotes: true,
		refetchInterval: isVisible ? 2000 : false,
	});

	const voteMutation = useVoteSubmission(eventId);
	const unvoteMutation = useUnvoteSubmission(eventId);

	const submissions = data?.submissions ?? [];

	useEffect(() => {
		if (!user) {
			setRemainingVotesOverride(null);
			return;
		}
		if (data) {
			setRemainingVotesOverride(data.remainingVotes ?? null);
		}
	}, [data, user]);

	const remainingVotes =
		remainingVotesOverride ?? data?.remainingVotes ?? null;
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
					userId &&
					(s.teamLeader?.id === userId ||
						s.teamMembers?.some((m) => m.id === userId)),
			);
		}

		if (filter === "voted") {
			return submissions.filter((s) => votedIds.has(s.id));
		}

		return submissions;
	}, [submissions, filter, userId, votedIds]);
	const shouldShowRegistrationNotice = Boolean(
		user &&
			filter !== "all" &&
			!isRegistrationApproved &&
			!isRegistrationLoading,
	);

	const leaderboardSubmissions = useMemo(() => {
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

		return [...submissions].sort((a, b) => {
			// Sort by votes desc
			const voteDiff = b.voteCount - a.voteCount;
			if (voteDiff !== 0) return voteDiff;
			// Fallback: earlier submission wins when votes tie
			return getSubmissionTime(a) - getSubmissionTime(b);
		});
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

	const toVotingErrorMessage = (error: unknown) => {
		if (!(error instanceof Error)) return "操作失败";

		const message = error.message;
		if (message.includes("used all available votes")) {
			return `可用票数已用完（每人最多 ${MAX_VOTES_PER_USER} 票），可先取消已投作品后再投`;
		}
		if (
			message.includes("own submission") ||
			message.includes("own team's submission")
		) {
			return "无法给自己的作品投票";
		}
		if (message.includes("already voted")) {
			return "你已经投过该作品了";
		}
		if (message.includes("Voting has ended")) {
			return "投票已结束";
		}
		if (message.includes("You have not voted")) {
			return "你还没有给该作品投票";
		}
		return message;
	};

	const handleRequireAuth = (redirectPath?: string) => {
		const targetPath = redirectPath || pathname || `/events/${eventId}`;
		const redirectTo = encodeURIComponent(targetPath);
		router.push(`/auth/login?redirectTo=${redirectTo}`);
	};

	const handleVote = async (submission: EventSubmission) => {
		if (!user) {
			handleRequireAuth();
			return;
		}
		if (pendingSubmissionIds.has(submission.id)) return;
		try {
			markSubmissionPending(submission.id);
			const result = await voteMutation.mutateAsync(submission.id);
			setRemainingVotesOverride(result.remainingVotes);
			toast.success("投票成功", {
				description: `还剩 ${result.remainingVotes} 票`,
			});
		} catch (error) {
			toast.error(toVotingErrorMessage(error));
		} finally {
			clearSubmissionPending(submission.id);
		}
	};

	const handleUnvote = async (submission: EventSubmission) => {
		if (pendingSubmissionIds.has(submission.id)) return;
		try {
			markSubmissionPending(submission.id);
			const result = await unvoteMutation.mutateAsync(submission.id);
			setRemainingVotesOverride(result.remainingVotes);
			toast.success("已取消投票", {
				description: `还剩 ${result.remainingVotes} 票`,
			});
		} catch (error) {
			toast.error(toVotingErrorMessage(error));
		} finally {
			clearSubmissionPending(submission.id);
		}
	};

	const renderVoteButton = (submission: EventSubmission) => {
		const hasVoted = votedIds.has(submission.id);
		const userId = user?.id;
		// Disable voting for anyone on the submission's team (leader or members)
		const isOwnTeam =
			Boolean(userId) &&
			(submission.teamLeader?.id === userId ||
				submission.teamMembers?.some((m) => m.id === userId));
		const noVotesLeft =
			remainingVotes !== null && remainingVotes <= 0 && !hasVoted;
		const isPending = pendingSubmissionIds.has(submission.id);
		const buttonTouchClass = "h-10 px-4 text-sm md:h-8 md:px-3";

		// 投票未开放时禁用所有投票按钮
		if (!isVotingOpen) {
			return (
				<Button
					variant="outline"
					size="sm"
					disabled
					className={buttonTouchClass}
				>
					投票已结束
				</Button>
			);
		}

		if (!user) {
			return (
				<Button
					variant="outline"
					size="sm"
					onClick={() => handleRequireAuth()}
					className={buttonTouchClass}
				>
					登录后投票
				</Button>
			);
		}

		if (isOwnTeam) {
			return (
				<Button
					variant="outline"
					size="sm"
					asChild
					className={buttonTouchClass}
				>
					<Link
						href={`/app/events/${eventId}/submissions/${submission.id}/edit`}
						title="自己的作品，不能投票"
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
					disabled={isPending}
					className={cn(
						buttonTouchClass,
						"text-rose-600 border-rose-200 hover:bg-rose-50 hover:text-rose-700",
					)}
				>
					{isPending ? (
						<Loader2 className="h-4 w-4 animate-spin" />
					) : (
						"取消投票"
					)}
				</Button>
			);
		}

		if (noVotesLeft) {
			return (
				<Button
					variant="outline"
					size="sm"
					aria-disabled
					disabled={isPending}
					onClick={() => {
						if (isPending) return;
						toast.info("可用票数已用完", {
							description: `每人最多 ${MAX_VOTES_PER_USER} 票，可先取消已投作品后再投`,
							action: {
								label: "查看已投",
								onClick: () => setFilter("voted"),
							},
						});
					}}
					title={`每人最多 ${MAX_VOTES_PER_USER} 票，可先取消已投作品后再投`}
					className={cn(
						buttonTouchClass,
						"opacity-70 cursor-not-allowed",
					)}
				>
					票已用完
				</Button>
			);
		}

		return (
			<Button
				variant="default"
				size="sm"
				disabled={isPending}
				onClick={() => handleVote(submission)}
				className={buttonTouchClass}
			>
				{isPending ? (
					<Loader2 className="h-4 w-4 animate-spin" />
				) : (
					"投票"
				)}
			</Button>
		);
	};

	const getPreviewData = (submission: EventSubmission) => {
		const firstVideo = submission.attachments?.find(
			(att) => att.fileType === "video",
		);
		const firstAudio = submission.attachments?.find(
			(att) => att.fileType === "audio",
		);
		const firstImage = submission.attachments?.find(
			(att) => att.fileType === "image",
		);

		const previewImage =
			submission.coverImage || firstImage?.fileUrl || null;
		const mediaBadge = firstVideo ? "video" : firstAudio ? "audio" : null;

		return { previewImage, mediaBadge };
	};

	return (
		<div className="space-y-6">
			<div className="space-y-3">
				<div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
					<div className="min-w-0">
						<h2 className="text-2xl font-semibold">
							作品展示与投票
						</h2>
						{isVotingOpen ? (
							user ? (
								hasActiveRegistration ? (
									<div className="space-y-1">
										<p className="text-sm text-muted-foreground">
											你还有{" "}
											<span
												className={cn(
													"font-medium",
													remainingVotes === 0 &&
														"text-rose-600 font-semibold",
												)}
											>
												{remainingVotes ??
													MAX_VOTES_PER_USER}
											</span>{" "}
											票
										</p>
										<p className="text-xs text-muted-foreground">
											每人最多 {MAX_VOTES_PER_USER}{" "}
											票，可随时取消已投作品释放票数；不能投自己的作品
										</p>
									</div>
								) : isRegistrationLoading ? (
									<p className="text-sm text-muted-foreground">
										正在确认您的报名状态…
									</p>
								) : (
									<p className="text-sm text-muted-foreground">
										报名活动后即可拥有 {MAX_VOTES_PER_USER}{" "}
										票并参与投票
									</p>
								)
							) : (
								<p className="text-sm text-muted-foreground">
									登录后即可拥有 {MAX_VOTES_PER_USER}{" "}
									票并参与投票
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

					{showInlineSubmissionCta && (
						<SubmissionsActionButton
							eventId={eventId}
							locale={locale}
							isSubmissionOpen={isSubmissionOpen}
							size="sm"
							className="w-full sm:w-auto md:hidden"
						/>
					)}
				</div>

				<div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
					{user && (
						<ToggleGroup
							type="single"
							variant="outline"
							size="lg"
							value={filter}
							onValueChange={(value) => {
								if (value) setFilter(value as typeof filter);
							}}
							className="w-full md:w-auto"
						>
							<ToggleGroupItem value="all">全部</ToggleGroupItem>
							<ToggleGroupItem value="mine">
								我的作品
							</ToggleGroupItem>
							<ToggleGroupItem value="voted">
								已投票
							</ToggleGroupItem>
						</ToggleGroup>
					)}

					<div className="flex flex-wrap items-center gap-2 md:justify-end">
						<ToggleGroup
							type="single"
							variant="outline"
							size="sm"
							value={viewMode}
							onValueChange={(value) => {
								if (value)
									setViewMode(value as typeof viewMode);
							}}
						>
							<ToggleGroupItem value="grid" aria-label="网格模式">
								<LayoutGrid className="h-4 w-4" />
							</ToggleGroupItem>
							<ToggleGroupItem value="list" aria-label="列表模式">
								<List className="h-4 w-4" />
							</ToggleGroupItem>
						</ToggleGroup>

						{canShowVotes && (
							<Dialog
								open={isLeaderboardOpen}
								onOpenChange={setIsLeaderboardOpen}
							>
								<DialogTrigger asChild>
									<Button
										variant="outline"
										size="sm"
										className="gap-1"
									>
										<Trophy className="h-4 w-4" />
										排行榜
									</Button>
								</DialogTrigger>
								<DialogContent className="sm:max-w-md">
									<DialogHeader>
										<DialogTitle>
											{showResults
												? "最终榜单"
												: "实时榜单"}
										</DialogTitle>
										<DialogDescription>
											点击作品可定位到列表中的对应卡片。
										</DialogDescription>
									</DialogHeader>

									<div className="max-h-[60vh] overflow-auto pr-1 space-y-2">
										{leaderboardSubmissions.length === 0 ? (
											<p className="text-sm text-muted-foreground">
												暂无榜单数据
											</p>
										) : (
											leaderboardSubmissions
												.slice(0, 10)
												.map((submission, index) => (
													<button
														key={submission.id}
														type="button"
														className="w-full rounded-lg border p-2 text-left transition-colors hover:bg-muted/40"
														onClick={() => {
															setIsLeaderboardOpen(
																false,
															);
															scrollToSubmission(
																submission.id,
															);
														}}
													>
														<div className="flex items-center gap-3">
															<div
																className={cn(
																	"flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
																	index === 0
																		? "bg-amber-400 text-white"
																		: index ===
																				1
																			? "bg-slate-300 text-slate-700"
																			: index ===
																					2
																				? "bg-orange-300 text-orange-800"
																				: "bg-muted text-muted-foreground",
																)}
															>
																{index + 1}
															</div>
															<div className="min-w-0 flex-1">
																<p className="truncate text-sm font-medium">
																	{
																		submission.name
																	}
																</p>
																<p className="truncate text-xs text-muted-foreground">
																	{submission
																		.teamLeader
																		?.name ??
																		"-"}
																</p>
															</div>
															<div className="text-right">
																<p className="text-sm font-semibold text-rose-600">
																	{
																		submission.voteCount
																	}
																</p>
																<p className="text-[10px] text-muted-foreground">
																	票
																</p>
															</div>
														</div>
													</button>
												))
										)}
									</div>
								</DialogContent>
							</Dialog>
						)}

						<Select value={sortValue} onValueChange={setSortValue}>
							<SelectTrigger className="w-full sm:w-[160px] md:w-[220px]">
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
			</div>
			{shouldShowRegistrationNotice ? (
				<div className="rounded-2xl border border-dashed p-8 text-center space-y-4">
					<p className="text-base font-semibold">
						您还未报名参与该活动
					</p>
					<Button asChild size="lg" className="w-full sm:w-auto">
						<Link href={registerHref}>立即报名</Link>
					</Button>
				</div>
			) : isLoading ? (
				viewMode === "grid" ? (
					<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
						{Array.from({ length: 6 }).map((_, index) => (
							<Skeleton key={index} className="h-72 w-full" />
						))}
					</div>
				) : (
					<div className="space-y-3">
						{Array.from({ length: 6 }).map((_, index) => (
							<Skeleton key={index} className="h-24 w-full" />
						))}
					</div>
				)
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
				<div
					className={cn(
						viewMode === "grid"
							? "grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
							: "space-y-3",
					)}
				>
					{filteredSubmissions.map((submission) => {
						const { previewImage, mediaBadge } =
							getPreviewData(submission);
						const isMine =
							userId &&
							(submission.teamLeader?.id === userId ||
								submission.teamMembers?.some(
									(m) => m.id === userId,
								));

						if (viewMode === "list") {
							return (
								<Card
									key={submission.id}
									id={`submission-${submission.id}`}
									className="group overflow-hidden scroll-mt-24 transition-all duration-300"
								>
									<CardContent className="p-3">
										<div className="flex items-center gap-3">
											<Link
												href={`/${locale}/events/${submission.eventId}/submissions/${submission.id}`}
												className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md bg-muted"
											>
												{previewImage ? (
													<img
														src={previewImage}
														alt={submission.name}
														loading="lazy"
														className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
													/>
												) : (
													<div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 text-muted-foreground">
														{mediaBadge ===
														"video" ? (
															<Play className="h-5 w-5 opacity-70" />
														) : mediaBadge ===
															"audio" ? (
															<Music2 className="h-5 w-5 opacity-70" />
														) : (
															<Image className="h-5 w-5 opacity-70" />
														)}
													</div>
												)}

												{mediaBadge && (
													<div className="absolute left-1 top-1 inline-flex items-center gap-1 rounded-full bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white">
														{mediaBadge ===
														"video" ? (
															<Play className="h-2.5 w-2.5" />
														) : (
															<Music2 className="h-2.5 w-2.5" />
														)}
													</div>
												)}
											</Link>

											<div className="min-w-0 flex-1 flex flex-col gap-1">
												<div className="flex items-center gap-2 flex-wrap">
													<Link
														href={`/${locale}/events/${submission.eventId}/submissions/${submission.id}`}
														className="line-clamp-1 font-semibold leading-tight hover:underline text-sm md:text-base mb-0.5"
													>
														{submission.name}
													</Link>
													{isMine && (
														<Badge
															variant="secondary"
															className="text-[10px] h-5 px-1.5 font-normal"
														>
															我的作品
														</Badge>
													)}
													{isMine && isVotingOpen && (
														<Badge
															variant="outline"
															className="text-[10px] h-5 px-1.5 font-normal bg-amber-50 text-amber-700 border-amber-200"
														>
															不能投自己
														</Badge>
													)}
													{user &&
														votedIds.has(
															submission.id,
														) && (
															<Badge
																variant="outline"
																className="text-[10px] h-5 px-1.5 text-rose-500 border-rose-300 font-normal"
															>
																已投
															</Badge>
														)}
													{showResults &&
														submission.rank &&
														submission.rank <=
															3 && (
															<Badge
																variant="secondary"
																className="flex items-center gap-1 shrink-0 h-5 px-1.5 bg-amber-100 text-amber-700 border-amber-200 text-[10px]"
															>
																<Trophy
																	className={cn(
																		"h-3 w-3",
																		submission.rank ===
																			1 &&
																			"text-amber-600",
																	)}
																/>
																<span className="font-semibold">
																	#
																	{
																		submission.rank
																	}
																</span>
															</Badge>
														)}
												</div>

												<p className="text-xs text-muted-foreground/80 line-clamp-1">
													{submission.tagline ||
														submission.description ||
														"暂未填写简介"}
												</p>

												<div className="flex items-center gap-3 text-xs text-muted-foreground pt-0.5">
													<div className="flex items-center gap-1.5">
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
														<span className="truncate max-w-[100px]">
															{submission
																.teamLeader
																?.name ?? "-"}
														</span>
													</div>
													<div className="flex items-center gap-1">
														<UserRound className="h-3 w-3" />
														<span>
															{
																submission.teamSize
															}
														</span>
													</div>
												</div>
											</div>

											<div className="flex flex-col items-end gap-1 shrink-0 pl-2">
												{canShowVotes && (
													<div
														className="inline-flex items-center gap-1 text-xs mb-1"
														title={
															showResults
																? "最终票数"
																: "实时热度"
														}
													>
														<Heart
															className={cn(
																"h-3.5 w-3.5 transition-colors",
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
												)}
												<div className="md:scale-90 md:origin-right">
													{renderVoteButton(
														submission,
													)}
												</div>
											</div>
										</div>
									</CardContent>
								</Card>
							);
						}

						return (
							<Card
								key={submission.id}
								id={`submission-${submission.id}`}
								className="group flex flex-col overflow-hidden scroll-mt-24 transition-all duration-300"
							>
								<Link
									href={`/${locale}/events/${submission.eventId}/submissions/${submission.id}`}
									className="relative block aspect-[4/3] w-full bg-muted overflow-hidden transition-opacity group-hover:opacity-90"
								>
									{previewImage ? (
										<img
											src={previewImage}
											alt={submission.name}
											loading="lazy"
											className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
										/>
									) : (
										<div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-slate-100 to-slate-200 text-muted-foreground">
											<div className="rounded-full bg-white/70 p-2 shadow-sm">
												{mediaBadge === "video" ? (
													<Play className="h-5 w-5" />
												) : mediaBadge === "audio" ? (
													<Music2 className="h-5 w-5" />
												) : (
													<Image className="h-5 w-5" />
												)}
											</div>
											<div className="text-sm font-medium">
												{mediaBadge === "video"
													? "视频作品"
													: mediaBadge === "audio"
														? "音频作品"
														: "暂无封面"}
											</div>
											<div className="text-xs text-muted-foreground/80">
												点开查看详情
											</div>
										</div>
									)}

									{mediaBadge && (
										<div className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-black/60 px-2 py-1 text-[11px] font-medium text-white">
											{mediaBadge === "video" ? (
												<Play className="h-3.5 w-3.5" />
											) : (
												<Music2 className="h-3.5 w-3.5" />
											)}
											<span>
												{mediaBadge === "video"
													? "视频"
													: "音频"}
											</span>
										</div>
									)}
								</Link>

								<CardContent className="flex flex-col flex-1 space-y-4 p-5 md:p-4">
									<div className="flex items-start justify-between gap-3">
										<div className="flex-1 min-w-0 space-y-1">
											<div className="flex items-center gap-2 flex-wrap">
												<h3 className="font-semibold text-lg md:text-lg line-clamp-1 tracking-tight">
													{submission.name}
												</h3>
												{isMine && (
													<Badge
														variant="secondary"
														className="text-[10px] h-5 px-1.5 font-normal"
													>
														我的作品
													</Badge>
												)}
												{isMine && isVotingOpen && (
													<Badge
														variant="outline"
														className="text-[10px] h-5 px-1.5 font-normal bg-amber-50 text-amber-700 border-amber-200"
													>
														不能投自己
													</Badge>
												)}
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
														{submission.voteCount}
													</span>
												</div>
											) : (
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
						);
					})}
				</div>
			)}
		</div>
	);
}
