"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Edit, Heart, Loader2, Trophy, UserRound } from "lucide-react";
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
import { createFallbackCaptionSrc } from "./utils";

interface EventSubmissionsGalleryProps {
	eventId: string;
	locale: string;
	// When true, show final results (ranks and exact vote counts)
	showResults?: boolean;
	// When true, allow voting; when false, disable voting buttons
	isVotingOpen?: boolean;
}

// Available sort options; `voteCount` only shown when in results stage
const ALL_SORT_OPTIONS = [
	{ value: "voteCount", label: "按票数排序" },
	{ value: "createdAt", label: "最新提交" },
	{ value: "name", label: "按名称排序" },
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
}: EventSubmissionsGalleryProps) {
	// Default to latest submission order
	const [sort, setSort] = useState("createdAt");
	// 筛选状态
	const [filter, setFilter] = useState<"all" | "mine" | "voted">("all");

	// Only show vote count animation when voting is open and not in results stage
	// This creates a fun "live" feel without revealing final ranks
	const showLiveVoteVisuals = isVotingOpen && !showResults;

	// Ensure `voteCount` is only used during results stage
	useEffect(() => {
		if (!showResults && sort === "voteCount") {
			// Switch to a safe default if toggled away from results
			setSort("createdAt");
		}
	}, [showResults, sort]);

	const sortOptions = useMemo(() => {
		return ALL_SORT_OPTIONS.filter((opt) =>
			opt.value === "voteCount" ? showResults : true,
		);
	}, [showResults]);
	const isVisible = usePageVisibility();
	const { user } = useSession();
	const pathname = usePathname();
	const router = useRouter();
	const { data, isLoading } = useEventSubmissions(eventId, {
		sort,
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

	// 应用筛选逻辑
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
				<div className="flex gap-2">
					<Button variant="outline" size="sm" asChild>
						<Link
							href={`/app/events/${eventId}/submissions/${submission.id}/edit`}
						>
							<Edit className="w-4 h-4 mr-1" />
							编辑
						</Link>
					</Button>
					<Button variant="outline" size="sm" disabled>
						无法投自己
					</Button>
				</div>
			);
		}

		if (hasVoted) {
			return (
				<Button
					variant="secondary"
					size="sm"
					onClick={() => handleUnvote(submission)}
					className="hover:bg-destructive hover:text-destructive-foreground group"
				>
					<span className="group-hover:hidden">已投票</span>
					<span className="hidden group-hover:inline">取消投票</span>
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
					<Select value={sort} onValueChange={setSort}>
						<SelectTrigger className="w-[200px]">
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

			{isLoading ? (
				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
					{filteredSubmissions.map((submission, index) => (
						<Card
							key={submission.id}
							className="flex flex-col overflow-hidden"
						>
							{(() => {
								// Prefer inline media player if submission has video/audio attachments
								const firstVideo = submission.attachments?.find(
									(att) => att.fileType === "video",
								);
								const firstAudio = submission.attachments?.find(
									(att) => att.fileType === "audio",
								);
								const fallbackCaptionSrc =
									createFallbackCaptionSrc(
										submission.description ??
											submission.tagline ??
											submission.name ??
											"媒体内容",
									);
								const captionLabel =
									locale === "en" ? "Captions" : "字幕";
								const captionLang =
									locale === "en" ? "en" : "zh";

								if (firstVideo) {
									return (
										<div className="h-40 bg-black overflow-hidden">
											<video
												controls
												preload="metadata"
												className="w-full h-full object-cover"
											>
												<source
													src={firstVideo.fileUrl}
												/>
												<track
													default
													kind="captions"
													srcLang={captionLang}
													label={captionLabel}
													src={fallbackCaptionSrc}
												/>
												您的浏览器不支持视频播放
											</video>
										</div>
									);
								}

								if (firstAudio) {
									return (
										<div className="h-40 bg-muted/50 flex items-center justify-center px-3">
											<audio controls className="w-full">
												<source
													src={firstAudio.fileUrl}
												/>
												<track
													default
													kind="captions"
													srcLang={captionLang}
													label={captionLabel}
													src={fallbackCaptionSrc}
												/>
												您的浏览器不支持音频播放
											</audio>
										</div>
									);
								}

								return (
									<div className="h-40 bg-muted overflow-hidden">
										{submission.coverImage ? (
											<img
												src={submission.coverImage}
												alt={submission.name}
												className="w-full h-full object-cover"
											/>
										) : (
											<div className="w-full h-full flex items-center justify-center text-sm text-muted-foreground">
												暂无封面
											</div>
										)}
									</div>
								);
							})()}
							<CardContent className="flex flex-col flex-1 space-y-3 p-4">
								<div className="flex items-center justify-between">
									<div className="flex-1">
										<div className="flex items-center gap-2 flex-wrap">
											<h3 className="font-semibold text-lg line-clamp-1">
												{submission.name}
											</h3>
											{/* 我的作品标识 */}
											{user &&
												(submission.teamLeader?.id ===
													user.id ||
													submission.teamMembers?.some(
														(m) => m.id === user.id,
													)) && (
													<Badge
														variant="secondary"
														className="text-xs"
													>
														我的作品
													</Badge>
												)}
											{/* 已投票标识 */}
											{user &&
												votedIds.has(submission.id) && (
													<Badge
														variant="outline"
														className="text-xs text-rose-500 border-rose-300"
													>
														已投票
													</Badge>
												)}
										</div>
										<p className="text-xs text-muted-foreground">
											队长：
											{submission.teamLeader?.name ?? "-"}
										</p>
									</div>
									{showResults &&
										submission.rank &&
										submission.rank <= 3 && (
											<Badge
												variant="secondary"
												className="flex items-center gap-1"
											>
												<Trophy
													className={cn(
														"h-4 w-4",
														submission.rank === 1 &&
															"text-amber-500",
													)}
												/>
												第 {submission.rank} 名
											</Badge>
										)}
								</div>
								<p className="text-sm text-muted-foreground line-clamp-2">
									{submission.tagline ||
										submission.description ||
										"暂未填写简介"}
								</p>
								<div className="flex items-center justify-between text-sm">
									<div className="flex items-center gap-1">
										{showResults || showLiveVoteVisuals ? (
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
														submission.voteCount > 0
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
											// Keep layout stable when votes are hidden
											<span className="invisible inline-flex items-center gap-1">
												<Heart className="h-4 w-4" />0
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

								<div className="flex items-center justify-between">
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
	);
}
