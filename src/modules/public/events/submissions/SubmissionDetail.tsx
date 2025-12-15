"use client";

import type { RegistrationStatus } from "@prisma/client";
import {
	ArrowLeft,
	CalendarClock,
	ChevronDown,
	ChevronUp,
	Copy,
	Heart,
	Loader2,
	ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import QRCode from "react-qr-code";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ACTIVE_REGISTRATION_STATUSES } from "@/features/event-submissions/constants";
import {
	useEventSubmissions,
	useUnvoteSubmission,
	useVoteSubmission,
} from "@/features/event-submissions/hooks";
import type { EventSubmission } from "@/features/event-submissions/types";
import type { HackathonVoting } from "@/features/hackathon/config";
import { useSession } from "@/modules/dashboard/auth/hooks/use-session";
import { ShareSubmissionDialog } from "./ShareSubmissionDialog";
import { useEventRegistrationStatus } from "./useEventRegistrationStatus";
import { createFallbackCaptionSrc } from "./utils";

interface SubmissionDetailProps {
	submission: EventSubmission;
	locale: string;
	// When true, show final results (exact vote counts)
	showResults?: boolean;
	// Whether audience voting is currently open
	isVotingOpen?: boolean;
	// Voting configuration for hackathon events
	votingConfig?: HackathonVoting | null;
	// Canonical URL for this submission (used in QR code)
	submissionUrl: string;
	// Event title for big-screen display
	eventTitle?: string | null;
}

const statusLabels: Record<string, string> = {
	SUBMITTED: "已提交",
	UNDER_REVIEW: "审核中",
	APPROVED: "已通过",
	AWARDED: "已获奖",
};

async function copyText(text: string) {
	try {
		await navigator.clipboard.writeText(text);
		toast.success("链接已复制");
		return;
	} catch (error) {
		console.error("Failed to copy text:", error);
	}

	const textArea = document.createElement("textarea");
	textArea.value = text;
	document.body.appendChild(textArea);
	textArea.focus();
	textArea.select();
	try {
		document.execCommand("copy");
		toast.success("链接已复制");
	} catch (fallbackError) {
		console.error("Fallback copy failed:", fallbackError);
		toast.error("复制失败，请手动复制链接");
	} finally {
		document.body.removeChild(textArea);
	}
}

export function SubmissionDetail({
	submission,
	locale,
	showResults = false,
	isVotingOpen = true,
	votingConfig,
	submissionUrl,
	eventTitle,
}: SubmissionDetailProps) {
	const MAX_VOTES_PER_USER = 3;

	const { user } = useSession();
	const userId = user?.id;
	const router = useRouter();
	const pathname = usePathname();
	const voteMutation = useVoteSubmission(submission.eventId);
	const unvoteMutation = useUnvoteSubmission(submission.eventId);
	const { data } = useEventSubmissions(submission.eventId, {
		includeVotes: true,
		enabled: Boolean(user),
	});
	const { data: registration, isLoading: isRegistrationLoading } =
		useEventRegistrationStatus(submission.eventId, userId);
	const hasActiveRegistration = Boolean(
		registration?.status &&
			ACTIVE_REGISTRATION_STATUSES.includes(
				registration.status as RegistrationStatus,
			),
	);
	const votingScope = votingConfig?.publicVotingScope ?? "PARTICIPANTS";
	const requiresParticipantRegistration = votingScope === "PARTICIPANTS";
	const requiresAccountOnly = votingScope === "REGISTERED";
	const allowPublicVoting = votingConfig?.allowPublicVoting ?? true;
	const isVotingCurrentlyOpen = Boolean(isVotingOpen);
	const registerHref = `/${locale}/events/${submission.eventId}/register`;
	const qrStorageKey = useMemo(
		() => `submission-qr-collapsed:${submission.eventId}:${submission.id}`,
		[submission.eventId, submission.id],
	);
	const [isQrCollapsed, setIsQrCollapsed] = useState(false);

	useEffect(() => {
		try {
			const raw = window.localStorage.getItem(qrStorageKey);
			if (raw === null) return;
			setIsQrCollapsed(raw === "1");
		} catch {
			// Ignore storage failures
		}
	}, [qrStorageKey]);

	useEffect(() => {
		try {
			window.localStorage.setItem(
				qrStorageKey,
				isQrCollapsed ? "1" : "0",
			);
		} catch {
			// Ignore storage failures
		}
	}, [isQrCollapsed, qrStorageKey]);

	const userVotes = new Set(data?.userVotes ?? []);
	const hasVoted = userVotes.has(submission.id);
	const remainingVotes =
		data?.remainingVotes ?? (user ? MAX_VOTES_PER_USER : null);
	const isLeader = Boolean(userId) && submission.teamLeader?.id === userId;
	// Block voting if current user is part of the team (leader or member)
	const isOwnTeam =
		Boolean(userId) &&
		(submission.teamLeader?.id === userId ||
			submission.teamMembers?.some((m) => m.id === userId));
	const hasMedia =
		submission.attachments.length > 0 || Boolean(submission.coverImage);
	const customFieldAnswers = (submission.customFieldAnswers ?? [])
		.filter((field) => field.enabled !== false)
		.slice()
		.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
	const votingHint = (() => {
		if (!isVotingCurrentlyOpen) {
			return "投票未开放或已结束";
		}
		if (!allowPublicVoting) {
			return "本场活动未开启观众投票";
		}
		if (!user) {
			return requiresParticipantRegistration
				? "登录并报名活动后即可投票"
				: requiresAccountOnly
					? "登录后即可投票"
					: "登录后即可为作品投票";
		}
		if (requiresParticipantRegistration) {
			if (isRegistrationLoading) {
				return "正在确认您的报名状态…";
			}
			if (!hasActiveRegistration) {
				return "报名活动并通过后即可获得投票资格";
			}
		}
		if (isOwnTeam) {
			return "无法给自己的作品投票";
		}
		if (hasVoted) {
			return "已投票，可随时取消";
		}
		if (remainingVotes !== null) {
			return `你还有 ${remainingVotes} 票`;
		}
		return null;
	})();

	const toVotingErrorMessage = (error: unknown) => {
		if (!(error instanceof Error)) return "操作失败";

		const message = error.message;
		if (message.includes("used all available votes")) {
			return `可用票数已用完（每人最多 ${MAX_VOTES_PER_USER} 票）`;
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

	const handleRequireAuth = () => {
		const redirectTo = encodeURIComponent(
			pathname || `/events/${submission.eventId}`,
		);
		router.push(`/auth/login?redirectTo=${redirectTo}`);
	};

	const handleVote = async () => {
		if (!user) {
			handleRequireAuth();
			return;
		}
		if (!isVotingCurrentlyOpen) {
			toast.info("当前未开放投票");
			return;
		}
		if (!allowPublicVoting) {
			toast.info("本场活动未开启观众投票");
			return;
		}
		if (isOwnTeam) {
			toast.info("无法给自己的作品投票");
			return;
		}
		if (requiresParticipantRegistration) {
			if (isRegistrationLoading) {
				toast.info("正在确认您的报名信息，请稍后再试");
				return;
			}
			if (!hasActiveRegistration) {
				toast.info("报名活动后才可投票");
				router.push(registerHref);
				return;
			}
		}
		const noVotesLeft =
			remainingVotes !== null && remainingVotes <= 0 && !hasVoted;
		if (noVotesLeft) {
			toast.info("可用票数已用完", {
				description: `每人最多 ${MAX_VOTES_PER_USER} 票，可先取消已投作品后再投`,
			});
			return;
		}
		try {
			const result = await voteMutation.mutateAsync(submission.id);
			toast.success("投票成功", {
				description: `还剩 ${result.remainingVotes} 票`,
			});
		} catch (error) {
			toast.error(toVotingErrorMessage(error));
		}
	};

	const handleUnvote = async () => {
		if (!isVotingCurrentlyOpen) {
			toast.info("投票未开放");
			return;
		}
		try {
			const result = await unvoteMutation.mutateAsync(submission.id);
			toast.success("已取消投票", {
				description: `还剩 ${result.remainingVotes} 票`,
			});
		} catch (error) {
			toast.error(toVotingErrorMessage(error));
		}
	};

	const handleCopyLink = async () => {
		await copyText(submissionUrl);
	};

	const renderVoteButton = () => {
		if (!isVotingCurrentlyOpen) {
			return (
				<Button variant="outline" disabled>
					投票未开放
				</Button>
			);
		}

		if (!allowPublicVoting) {
			return (
				<Button variant="outline" disabled>
					观众投票未开放
				</Button>
			);
		}

		if (!user) {
			return (
				<Button variant="outline" onClick={handleRequireAuth}>
					登录后投票
				</Button>
			);
		}

		if (requiresParticipantRegistration) {
			if (isRegistrationLoading) {
				return (
					<Button variant="outline" disabled>
						<Loader2 className="mr-2 h-4 w-4 animate-spin" />
						确认报名中…
					</Button>
				);
			}
			if (!hasActiveRegistration) {
				return (
					<Button
						variant="outline"
						onClick={() => router.push(registerHref)}
					>
						报名后投票
					</Button>
				);
			}
		}

		if (isOwnTeam) {
			return (
				<Button variant="outline" disabled>
					无法投自己
				</Button>
			);
		}

		if (hasVoted) {
			return (
				<Button variant="secondary" onClick={handleUnvote}>
					已投票
				</Button>
			);
		}

		const noVotesLeft = remainingVotes !== null && remainingVotes <= 0;
		return (
			<Button
				onClick={handleVote}
				disabled={voteMutation.isPending || noVotesLeft}
			>
				{voteMutation.isPending ? (
					<Loader2 className="h-4 w-4 animate-spin" />
				) : noVotesLeft ? (
					"票数已用完"
				) : (
					"投票"
				)}
			</Button>
		);
	};

	const renderCustomFieldValue = (
		answer: (typeof customFieldAnswers)[number],
	) => {
		const value = answer.value;

		if (value === null || value === undefined || value === "") {
			return <span className="text-muted-foreground">未填写</span>;
		}

		if (Array.isArray(value)) {
			return value.length ? value.join("、") : "未填写";
		}

		if (answer.type === "url" && typeof value === "string") {
			return (
				<Link
					href={value}
					target="_blank"
					rel="noreferrer"
					className="underline break-all"
				>
					{value}
				</Link>
			);
		}

		if (answer.type === "image" && typeof value === "string") {
			return (
				<div className="space-y-2">
					<img
						src={value}
						alt={answer.label}
						className="h-32 w-full rounded-md object-cover"
					/>
					<Link
						href={value}
						target="_blank"
						rel="noreferrer"
						className="text-xs underline"
					>
						查看原图
					</Link>
				</div>
			);
		}

		if (answer.type === "file" && typeof value === "string") {
			return (
				<Link
					href={value}
					target="_blank"
					rel="noreferrer"
					className="underline break-all"
				>
					下载文件
				</Link>
			);
		}

		if (typeof value === "boolean") {
			return value ? "是" : "否";
		}

		if (typeof value === "object") {
			try {
				return JSON.stringify(value);
			} catch {
				return String(value);
			}
		}

		return String(value);
	};

	return (
		<div className="space-y-6 pb-24 md:pb-0">
			<div className="flex items-center justify-between">
				<Button variant="ghost" asChild>
					<Link
						href={`/${locale}/events/${submission.eventId}/submissions`}
					>
						<ArrowLeft className="h-4 w-4 mr-2" /> 返回列表
					</Link>
				</Button>
				{isLeader && (
					<Button asChild variant="outline">
						<Link
							href={`/app/events/${submission.eventId}/submissions/${submission.id}/edit`}
						>
							管理作品
						</Link>
					</Button>
				)}
			</div>

			<Card>
				<CardHeader className="space-y-2">
					{eventTitle && (
						<p className="text-sm text-muted-foreground">
							活动：{eventTitle}
						</p>
					)}
					<div className="flex items-center gap-2">
						<Badge variant="secondary">
							{statusLabels[submission.status] ??
								submission.status}
						</Badge>
						{submission.communityUseAuthorization && (
							<Badge
								variant="outline"
								className="flex items-center gap-1"
							>
								<ShieldCheck className="h-3 w-3" />
								已授权宣传
							</Badge>
						)}
					</div>
					<CardTitle className="text-3xl">
						{submission.name}
					</CardTitle>
					<CardDescription>{submission.tagline}</CardDescription>
				</CardHeader>
				<CardContent className="space-y-6">
					<div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
						<div className="space-y-2">
							<div className="flex items-center justify-between gap-3">
								<div className="flex items-center gap-2 text-lg font-semibold">
									{showResults ? (
										<>
											<Heart className="h-5 w-5 text-rose-500" />
											<span>
												{submission.voteCount} 票
											</span>
										</>
									) : (
										// Keep layout stable when votes are hidden
										<span className="invisible inline-flex items-center gap-2">
											<Heart className="h-5 w-5" />0 票
										</span>
									)}
								</div>
								<div className="hidden md:flex flex-wrap items-center gap-2">
									{renderVoteButton()}
									<Button
										variant="outline"
										size="icon"
										onClick={handleCopyLink}
										aria-label="复制作品链接"
									>
										<Copy className="h-4 w-4" />
									</Button>
									<ShareSubmissionDialog
										shareUrl={submissionUrl}
										submissionName={
											submission.name ?? "submission"
										}
										iconOnly
										triggerVariant="outline"
										triggerSize="icon"
										triggerClassName="shrink-0"
									/>
								</div>
							</div>
							{votingHint && (
								<p className="text-sm text-muted-foreground">
									{votingHint}
								</p>
							)}
						</div>
						<div className="hidden lg:block">
							<Collapsible
								open={!isQrCollapsed}
								onOpenChange={(open) => setIsQrCollapsed(!open)}
								className="rounded-xl border bg-muted/40"
							>
								<div className="flex items-center justify-between gap-2 p-4">
									<div className="min-w-0">
										<p className="text-sm font-semibold text-foreground">
											扫码投票
										</p>
										<p className="text-xs text-muted-foreground">
											适合现场大屏展示
										</p>
									</div>
									<div className="flex items-center gap-2">
										<ShareSubmissionDialog
											shareUrl={submissionUrl}
											submissionName={
												submission.name ?? "submission"
											}
											triggerLabel="分享"
											triggerVariant="ghost"
											triggerSize="sm"
											triggerClassName="h-8 px-2"
										/>
										<CollapsibleTrigger asChild>
											<Button
												variant="ghost"
												size="icon"
												aria-label={
													isQrCollapsed
														? "展开二维码"
														: "收起二维码"
												}
											>
												{isQrCollapsed ? (
													<ChevronDown className="h-4 w-4" />
												) : (
													<ChevronUp className="h-4 w-4" />
												)}
											</Button>
										</CollapsibleTrigger>
									</div>
								</div>
								<CollapsibleContent>
									<div className="px-4 pb-4">
										<div className="flex items-center gap-3">
											<div className="rounded-lg border bg-white p-2 shadow-sm">
												<QRCode
													value={submissionUrl}
													size={152}
													className="h-auto w-[152px]"
												/>
											</div>
											<div className="space-y-2 text-xs text-muted-foreground">
												<p className="leading-relaxed">
													手机扫码打开作品详情页后即可投票。
												</p>
												<div className="flex items-center gap-2">
													<Button
														variant="outline"
														size="sm"
														className="h-8 px-2 text-xs"
														onClick={handleCopyLink}
													>
														<Copy className="mr-1 h-3.5 w-3.5" />
														复制链接
													</Button>
												</div>
												<p className="text-[11px] text-muted-foreground/80">
													链接默认隐藏，可通过上方按钮复制或分享。
												</p>
											</div>
										</div>
									</div>
								</CollapsibleContent>
							</Collapsible>
						</div>
					</div>

					{hasMedia ? (
						<div className="grid gap-4 sm:grid-cols-2">
							{submission.attachments.length === 0 &&
								submission.coverImage && (
									<div className="rounded-lg border overflow-hidden">
										<img
											src={submission.coverImage}
											alt={submission.name}
											className="w-full h-56 object-cover"
										/>
									</div>
								)}

							{submission.attachments.map((attachment) => {
								const fallbackCaptionSrc =
									createFallbackCaptionSrc(
										attachment.fileName ??
											submission.description ??
											submission.tagline ??
											submission.name ??
											"媒体内容",
									);
								const captionLabel =
									locale === "en" ? "Captions" : "字幕";
								const captionLang =
									locale === "en" ? "en" : "zh";

								return (
									<div
										key={attachment.id}
										className="rounded-lg border overflow-hidden"
									>
										{attachment.fileType === "image" ? (
											<img
												src={attachment.fileUrl}
												alt={attachment.fileName}
												className="w-full h-56 object-cover"
											/>
										) : attachment.fileType === "video" ? (
											<video
												controls
												preload="metadata"
												className="w-full h-56 bg-black"
											>
												<source
													src={attachment.fileUrl}
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
										) : attachment.fileType === "audio" ? (
											<div className="p-4">
												<audio
													controls
													className="w-full"
												>
													<source
														src={attachment.fileUrl}
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
												<div className="mt-2 text-xs text-muted-foreground">
													{attachment.fileName}
												</div>
											</div>
										) : (
											<div className="p-4 text-sm text-muted-foreground">
												<a
													href={attachment.fileUrl}
													target="_blank"
													rel="noreferrer"
													className="underline"
												>
													{attachment.fileName}
												</a>
											</div>
										)}
									</div>
								);
							})}
						</div>
					) : (
						<div className="rounded-lg border bg-muted/30 py-10 text-center text-sm text-muted-foreground">
							暂无截图或演示素材
						</div>
					)}

					<div className="space-y-3">
						<h3 className="text-lg font-semibold">作品介绍</h3>
						<div
							className="prose prose-slate max-w-none text-sm"
							dangerouslySetInnerHTML={{
								__html:
									submission.description || "暂无详细介绍",
							}}
						/>
					</div>

					{customFieldAnswers.length > 0 && (
						<div className="space-y-3">
							<h3 className="text-lg font-semibold">补充信息</h3>
							<div className="grid gap-3 md:grid-cols-2">
								{customFieldAnswers.map((answer) => (
									<div
										key={answer.key}
										className="rounded-lg border p-3 space-y-2"
									>
										<div className="flex items-center justify-between gap-2">
											<p className="text-sm font-medium">
												{answer.label}
												{answer.required && (
													<span className="text-red-500 ml-1">
														*
													</span>
												)}
											</p>
											{answer.publicVisible === false && (
												<Badge
													variant="outline"
													className="text-xs"
												>
													仅管理员
												</Badge>
											)}
										</div>
										<div className="text-sm text-muted-foreground break-words">
											{renderCustomFieldValue(answer)}
										</div>
									</div>
								))}
							</div>
						</div>
					)}

					<div className="grid gap-4 md:grid-cols-2">
						<Card>
							<CardHeader>
								<CardTitle className="text-base">
									团队信息
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-3">
								<div className="flex items-center gap-3">
									<Avatar>
										<AvatarImage
											src={
												submission.teamLeader?.avatar ??
												undefined
											}
										/>
										<AvatarFallback>
											{submission.teamLeader?.name?.slice(
												0,
												2,
											) ?? "?"}
										</AvatarFallback>
									</Avatar>
									<div>
										<p className="font-medium">
											{submission.teamLeader?.name}
										</p>
										<p className="text-xs text-muted-foreground">
											队长
										</p>
									</div>
								</div>
								{submission.teamMembers.length > 0 && (
									<div className="flex flex-wrap gap-2">
										{submission.teamMembers.map(
											(member) => (
												<Badge
													key={member.id}
													variant="outline"
												>
													{member.name}
												</Badge>
											),
										)}
									</div>
								)}
							</CardContent>
						</Card>
						<Card>
							<CardHeader>
								<CardTitle className="text-base">
									提交信息
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-2 text-sm text-muted-foreground">
								<div className="flex items-center gap-2">
									<CalendarClock className="h-4 w-4" />
									提交于 {submission.submittedAt ?? "-"}
								</div>
								{submission.demoUrl && (
									<div>
										演示链接：
										<Link
											href={submission.demoUrl}
											target="_blank"
											rel="noreferrer"
											className="underline"
										>
											{submission.demoUrl}
										</Link>
									</div>
								)}
							</CardContent>
						</Card>
					</div>
				</CardContent>
			</Card>

			<div className="md:hidden fixed inset-x-0 bottom-0 z-40 border-t bg-background/80 backdrop-blur">
				<div className="container mx-auto max-w-4xl px-4 py-3">
					<div className="flex items-center gap-2">
						<div className="flex-1 [&>button]:w-full">
							{renderVoteButton()}
						</div>
						<Button
							variant="outline"
							size="icon"
							onClick={handleCopyLink}
							aria-label="复制作品链接"
						>
							<Copy className="h-4 w-4" />
						</Button>
						<ShareSubmissionDialog
							shareUrl={submissionUrl}
							submissionName={submission.name ?? "submission"}
							iconOnly
							triggerVariant="outline"
							triggerSize="icon"
						/>
					</div>
					{votingHint && (
						<p className="mt-2 text-xs text-muted-foreground line-clamp-2">
							{votingHint}
						</p>
					)}
				</div>
			</div>
		</div>
	);
}
