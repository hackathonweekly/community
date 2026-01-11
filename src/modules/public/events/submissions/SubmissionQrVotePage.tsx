"use client";

import type { RegistrationStatus } from "@prisma/client";
import { CheckCircle2, ChevronRight, Loader2, XCircle } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { isActiveRegistrationStatus } from "@/features/event-submissions/constants";
import {
	useEventSubmissions,
	useUnvoteSubmission,
	useVoteSubmission,
} from "@/features/event-submissions/hooks";
import type { EventSubmission } from "@/features/event-submissions/types";
import { toVotingErrorMessage } from "@/features/event-submissions/utils/voting-error-messages";
import { cn } from "@/lib/utils";
import { useSession } from "@/modules/dashboard/auth/hooks/use-session";
import { useEventRegistrationStatus } from "./useEventRegistrationStatus";

export function SubmissionQrVotePage(props: {
	eventId: string;
	submissionId: string;
	locale: string;
	eventTitle: string | null;
	submission: EventSubmission;
	isVotingOpen: boolean;
}) {
	const {
		eventId,
		submissionId,
		locale,
		eventTitle,
		submission,
		isVotingOpen,
	} = props;

	const { user } = useSession();
	const userId = user?.id;
	const historyRef = useRef<HTMLDivElement>(null);
	const t = useTranslations("events.hackathon.voting");

	const [autoVoteState, setAutoVoteState] = useState<
		"idle" | "running" | "done"
	>("idle");
	const [pendingUnvoteId, setPendingUnvoteId] = useState<string | null>(null);
	const [hasVotedOverride, setHasVotedOverride] = useState<boolean | null>(
		null,
	);
	const [remainingVotesOverride, setRemainingVotesOverride] = useState<
		number | null
	>(null);
	const voteMutation = useVoteSubmission(eventId);
	const unvoteMutation = useUnvoteSubmission(eventId);

	const { data: registration, isLoading: isRegistrationLoading } =
		useEventRegistrationStatus(eventId, userId);
	const hasActiveRegistration = isActiveRegistrationStatus(
		(registration?.status as RegistrationStatus) ?? null,
	);

	const { data, isLoading } = useEventSubmissions(eventId, {
		sort: "createdAt",
		order: "asc",
		includeVotes: true,
		enabled: Boolean(userId),
	});

	const userVotes = useMemo(
		() => new Set(data?.userVotes ?? []),
		[data?.userVotes],
	);

	const hasVoted = hasVotedOverride ?? userVotes.has(submissionId);
	const remainingVotes =
		remainingVotesOverride ?? data?.remainingVotes ?? null;
	const publicVoting = data?.publicVoting;
	const allowPublicVoting = publicVoting?.allowPublicVoting ?? true;
	const votingScope = publicVoting?.scope ?? "PARTICIPANTS";
	const requiresParticipantRegistration = votingScope === "PARTICIPANTS";
	const isUnlimitedVotes = publicVoting?.mode === "PER_PROJECT_LIKE";
	const voteQuota =
		publicVoting?.mode === "FIXED_QUOTA"
			? (publicVoting.quota ?? null)
			: null;
	const noVotesLeft =
		!isUnlimitedVotes &&
		remainingVotes !== null &&
		remainingVotes <= 0 &&
		!hasVoted;

	const isOwnTeam =
		Boolean(userId) &&
		(submission.teamLeader?.id === userId ||
			submission.teamMembers?.some((member) => member.id === userId));

	const votedSubmissions = useMemo(() => {
		const list = data?.submissions ?? [];
		return list.filter((s) => userVotes.has(s.id));
	}, [data?.submissions, userVotes]);

	const scrollToHistory = useCallback(() => {
		historyRef.current?.scrollIntoView({
			behavior: "smooth",
			block: "start",
		});
	}, []);

	const registerHref = `/${locale}/events/${eventId}/register`;
	const submissionHref = `/${locale}/events/${eventId}/submissions/${submissionId}`;
	const submissionsHref = `/${locale}/events/${eventId}/submissions`;

	const handleVote = async () => {
		if (!userId) {
			toast.info("请先登录");
			return;
		}
		if (!isVotingOpen) {
			toast.info("投票未开放或已结束");
			return;
		}
		if (!allowPublicVoting) {
			toast.info("本场活动未开启观众投票");
			return;
		}
		if (requiresParticipantRegistration && isRegistrationLoading) {
			toast.info("正在确认您的报名信息，请稍后再试");
			return;
		}
		if (requiresParticipantRegistration && !hasActiveRegistration) {
			toast.info("报名活动后才可投票");
			return;
		}
		if (isOwnTeam) {
			toast.info("无法给自己的作品投票");
			return;
		}
		if (noVotesLeft) {
			toast.info("可用票数已用完", {
				description:
					voteQuota === null
						? "可先取消下方已投作品后再投"
						: `每人最多 ${voteQuota} 票，可先取消下方已投作品后再投`,
				action: {
					label: "查看已投",
					onClick: scrollToHistory,
				},
			});
			return;
		}

		try {
			const result = await voteMutation.mutateAsync(submissionId);
			setHasVotedOverride(true);
			setRemainingVotesOverride(result.remainingVotes);
			toast.success("投票成功", {
				description:
					result.remainingVotes === null
						? "已为该作品投票，可继续支持其他作品"
						: `还剩 ${result.remainingVotes} 票`,
			});
		} catch (error) {
			toast.error(toVotingErrorMessage(error, { voteQuota }));
		}
	};

	const handleUnvote = async (targetId: string) => {
		if (!isVotingOpen) {
			toast.info("投票未开放或已结束");
			return;
		}
		if (!allowPublicVoting) {
			toast.info("本场活动未开启观众投票");
			return;
		}
		if (requiresParticipantRegistration) {
			if (isRegistrationLoading) {
				toast.info("正在确认您的报名信息，请稍后再试");
				return;
			}
			if (!hasActiveRegistration) {
				toast.info("报名活动后才可投票");
				return;
			}
		}
		setPendingUnvoteId(targetId);
		try {
			const result = await unvoteMutation.mutateAsync(targetId);
			setRemainingVotesOverride(result.remainingVotes);
			if (targetId === submissionId) {
				setHasVotedOverride(false);
			}
			toast.success("已取消投票", {
				description:
					result.remainingVotes === null
						? "已取消对该作品的投票"
						: `还剩 ${result.remainingVotes} 票`,
			});
		} catch (error) {
			toast.error(toVotingErrorMessage(error, { voteQuota }));
		} finally {
			setPendingUnvoteId(null);
		}
	};

	useEffect(() => {
		if (autoVoteState !== "idle") return;
		if (!userId) return;
		if (!isVotingOpen) {
			setAutoVoteState("done");
			return;
		}
		if (isLoading || !data) return;
		if (!allowPublicVoting) {
			setAutoVoteState("done");
			return;
		}
		if (isOwnTeam) {
			setAutoVoteState("done");
			return;
		}
		if (requiresParticipantRegistration) {
			if (isRegistrationLoading) return;
			if (!hasActiveRegistration) {
				setAutoVoteState("done");
				return;
			}
		}
		if (hasVoted) {
			setAutoVoteState("done");
			return;
		}

		if (noVotesLeft) {
			setAutoVoteState("done");
			toast.info("可用票数已用完", {
				description:
					voteQuota === null
						? "可先取消下方已投作品后再投"
						: `每人最多 ${voteQuota} 票，可先取消下方已投作品后再投`,
				action: {
					label: "查看已投",
					onClick: scrollToHistory,
				},
			});
			scrollToHistory();
			return;
		}

		setAutoVoteState("running");
		void voteMutation
			.mutateAsync(submissionId)
			.then((result) => {
				setHasVotedOverride(true);
				setRemainingVotesOverride(result.remainingVotes);
				toast.success("投票成功", {
					description:
						result.remainingVotes === null
							? "已为该作品投票，可继续支持其他作品"
							: `还剩 ${result.remainingVotes} 票`,
				});
			})
			.catch((error) => {
				const message =
					error instanceof Error ? error.message : String(error);
				if (message.includes("already voted")) {
					setHasVotedOverride(true);
					return;
				}
				if (message.includes("used all available votes")) {
					toast.info("可用票数已用完", {
						description:
							voteQuota === null
								? "可先取消下方已投作品后再投"
								: `每人最多 ${voteQuota} 票，可先取消下方已投作品后再投`,
						action: {
							label: "查看已投",
							onClick: scrollToHistory,
						},
					});
					scrollToHistory();
					return;
				}
				toast.error(toVotingErrorMessage(error, { voteQuota }));
			})
			.finally(() => setAutoVoteState("done"));
	}, [
		autoVoteState,
		allowPublicVoting,
		data,
		hasActiveRegistration,
		hasVoted,
		isOwnTeam,
		isLoading,
		isRegistrationLoading,
		isVotingOpen,
		noVotesLeft,
		requiresParticipantRegistration,
		scrollToHistory,
		submissionId,
		userId,
		voteMutation,
	]);

	const headerStatus = (() => {
		if (!isVotingOpen) {
			return {
				tone: "muted" as const,
				title: "投票已结束",
				description: "本活动已停止投票",
			};
		}
		if (autoVoteState === "running") {
			return {
				tone: "muted" as const,
				title: "正在为你投票…",
				description: "请稍等片刻",
			};
		}
		if (!userId) {
			return {
				tone: "muted" as const,
				title: "正在加载账号信息…",
				description: "请稍等片刻",
			};
		}
		if (requiresParticipantRegistration && isRegistrationLoading) {
			return {
				tone: "muted" as const,
				title: "正在确认投票资格…",
				description: "请稍等片刻",
			};
		}
		if (isLoading || !data) {
			return {
				tone: "muted" as const,
				title: "正在加载投票规则…",
				description: "请稍等片刻",
			};
		}
		if (!allowPublicVoting) {
			return {
				tone: "muted" as const,
				title: "未开启观众投票",
				description: "本场活动未开启观众投票",
			};
		}
		if (requiresParticipantRegistration && !hasActiveRegistration) {
			return {
				tone: "warn" as const,
				title: "需要先报名才能投票",
				description: "报名通过后即可获得投票资格",
			};
		}
		if (isOwnTeam) {
			return {
				tone: "warn" as const,
				title: "不能给自己的作品投票",
				description: "你是该作品的队员/队长",
			};
		}
		if (hasVoted) {
			return {
				tone: "success" as const,
				title: "投票成功",
				description: "感谢你的支持",
			};
		}
		if (noVotesLeft) {
			return {
				tone: "warn" as const,
				title: "票已用完",
				description: "先取消下方已投作品，再投这一票",
			};
		}
		return {
			tone: "muted" as const,
			title: "还未投票",
			description: isUnlimitedVotes
				? "逐项点赞（每个作品最多 1 次）"
				: `你还有 ${remainingVotes ?? "—"} 票`,
		};
	})();

	const statusIcon =
		autoVoteState === "running" ? (
			<Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
		) : headerStatus.tone === "success" ? (
			<CheckCircle2 className="h-5 w-5 text-emerald-500" />
		) : headerStatus.tone === "warn" ? (
			<XCircle className="h-5 w-5 text-rose-500" />
		) : (
			<div className="h-5 w-5" />
		);

	const statusBorderClass =
		headerStatus.tone === "success"
			? "border-emerald-200/60 bg-emerald-50/40"
			: headerStatus.tone === "warn"
				? "border-rose-200/60 bg-rose-50/40"
				: "border-border bg-card";

	const actionDisabled =
		autoVoteState === "running" ||
		voteMutation.isPending ||
		unvoteMutation.isPending ||
		!userId ||
		(requiresParticipantRegistration && isRegistrationLoading) ||
		isLoading;

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between gap-3">
				<div className="min-w-0">
					<p className="text-xs text-muted-foreground truncate">
						{eventTitle ?? "活动投票"}
					</p>
					<h1 className="text-lg font-semibold leading-tight">
						{submission.name}
					</h1>
					{submission.tagline ? (
						<p className="mt-1 text-sm text-muted-foreground line-clamp-2">
							{submission.tagline}
						</p>
					) : null}
				</div>
				<div className="flex items-center gap-2 shrink-0 flex-wrap sm:flex-nowrap">
					<Badge variant={isVotingOpen ? "default" : "secondary"}>
						{isVotingOpen ? "投票中" : "已结束"}
					</Badge>
					<Button variant="outline" size="sm" asChild>
						<Link href={submissionsHref}>
							{t("submissions.viewAll")}
						</Link>
					</Button>
				</div>
			</div>

			<Card className={cn("border", statusBorderClass)}>
				<CardHeader className="pb-3">
					<CardTitle className="flex items-center gap-2 text-base">
						{statusIcon}
						{headerStatus.title}
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-3">
					<p className="text-sm text-muted-foreground">
						{headerStatus.description}
					</p>

					<Separator />

					<div className="flex gap-2">
						<Button
							className="flex-1"
							onClick={
								hasVoted
									? () => handleUnvote(submissionId)
									: handleVote
							}
							disabled={
								actionDisabled ||
								(!hasVoted &&
									(!isVotingOpen ||
										!allowPublicVoting ||
										(requiresParticipantRegistration &&
											!hasActiveRegistration) ||
										isOwnTeam ||
										noVotesLeft))
							}
							variant={hasVoted ? "outline" : "default"}
						>
							{(voteMutation.isPending && !hasVoted) ||
							(unvoteMutation.isPending && hasVoted) ? (
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							) : null}
							{hasVoted ? "撤销投票" : "投一票"}
						</Button>

						<Button variant="outline" asChild>
							<Link href={submissionHref}>
								详情 <ChevronRight className="ml-1 h-4 w-4" />
							</Link>
						</Button>
					</div>

					{noVotesLeft ? (
						<Button
							variant="ghost"
							className="w-full"
							onClick={scrollToHistory}
						>
							查看/取消已投作品
						</Button>
					) : null}

					{requiresParticipantRegistration &&
					!hasActiveRegistration &&
					isVotingOpen ? (
						<Button variant="secondary" className="w-full" asChild>
							<Link href={registerHref}>去报名活动</Link>
						</Button>
					) : null}
				</CardContent>
			</Card>

			<div ref={historyRef} className="pt-2">
				<Card>
					<CardHeader className="pb-3">
						<CardTitle className="text-base">
							已投票记录
							{isLoading ? null : (
								<span className="ml-2 text-sm font-normal text-muted-foreground">
									{votedSubmissions.length}
									{remainingVotes === null
										? null
										: ` / ${votedSubmissions.length + remainingVotes}`}
								</span>
							)}
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-3">
						{isLoading ? (
							<div className="flex items-center gap-2 text-sm text-muted-foreground">
								<Loader2 className="h-4 w-4 animate-spin" />
								加载中…
							</div>
						) : votedSubmissions.length === 0 ? (
							<p className="text-sm text-muted-foreground">
								你还没有投过票
							</p>
						) : (
							<div className="space-y-2">
								{votedSubmissions.map((item) => {
									const itemHref = `/${locale}/events/${eventId}/submissions/${item.id}`;
									const isPending =
										pendingUnvoteId === item.id;
									return (
										<div
											key={item.id}
											className={cn(
												"flex items-center justify-between gap-3 rounded-lg border p-3",
												item.id === submissionId &&
													"border-emerald-200 bg-emerald-50/40",
											)}
										>
											<Link
												href={itemHref}
												className="min-w-0"
											>
												<p className="font-medium truncate">
													{item.name}
												</p>
												{item.tagline ? (
													<p className="text-xs text-muted-foreground truncate">
														{item.tagline}
													</p>
												) : null}
											</Link>
											<Button
												variant="outline"
												size="sm"
												onClick={() =>
													handleUnvote(item.id)
												}
												disabled={
													actionDisabled || isPending
												}
												className="shrink-0 text-rose-600 border-rose-200 hover:bg-rose-50 hover:text-rose-700"
											>
												{isPending ? (
													<Loader2 className="h-4 w-4 animate-spin" />
												) : (
													"撤销投票"
												)}
											</Button>
										</div>
									);
								})}
							</div>
						)}
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
