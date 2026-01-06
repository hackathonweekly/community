"use client";

import type { RegistrationStatus } from "@prisma/client";
import {
	ArrowLeft,
	ArrowUpRight,
	Copy,
	Heart,
	Loader2,
	Play,
	Presentation,
	ShieldCheck,
	X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import QRCode from "react-qr-code";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent } from "@/components/ui/dialog";
import { ACTIVE_REGISTRATION_STATUSES } from "@/features/event-submissions/constants";
import {
	useEventSubmissions,
	useUnvoteSubmission,
	useVoteSubmission,
} from "@/features/event-submissions/hooks";
import type { EventSubmission } from "@/features/event-submissions/types";
import type { HackathonVoting } from "@/features/hackathon/config";
import { toVotingErrorMessage } from "@/features/event-submissions/utils/voting-error-messages";
import { cn } from "@/lib/utils";
import { useSession } from "@/modules/dashboard/auth/hooks/use-session";
import { ShareSubmissionDialog } from "./ShareSubmissionDialog";
import { useEventRegistrationStatus } from "./useEventRegistrationStatus";
import { createFallbackCaptionSrc } from "./utils";

interface SubmissionDetailProps {
	submission: EventSubmission;
	locale: string;
	showResults?: boolean;
	isVotingOpen?: boolean;
	votingConfig?: HackathonVoting | null;
	submissionUrl: string;
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
	const [isQrZoomOpen, setIsQrZoomOpen] = useState(false);
	const voteUrl = useMemo(
		() => (isVotingCurrentlyOpen ? `${submissionUrl}/vote` : submissionUrl),
		[isVotingCurrentlyOpen, submissionUrl],
	);

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
	const remainingVotes = data?.remainingVotes ?? null;
	const isLeader = Boolean(userId) && submission.teamLeader?.id === userId;
	const isOwnTeam =
		Boolean(userId) &&
		(submission.teamLeader?.id === userId ||
			submission.teamMembers?.some((m) => m.id === userId));
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
		if (votingConfig?.publicVotingMode === "PER_PROJECT_LIKE") {
			return "逐项点赞（每个作品最多 1 次）";
		}
		return null;
	})();

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
			const quota =
				votingConfig?.publicVotingMode === "FIXED_QUOTA"
					? (votingConfig.publicVoteQuota ?? null)
					: null;
			toast.info("可用票数已用完", {
				description:
					quota === null
						? "可先取消已投作品后再投"
						: `每人最多 ${quota} 票，可先取消已投作品后再投`,
			});
			return;
		}
		try {
			const result = await voteMutation.mutateAsync(submission.id);
			toast.success("投票成功", {
				description:
					result.remainingVotes === null
						? "已为该作品投票，可继续支持其他作品"
						: `还剩 ${result.remainingVotes} 票`,
			});
		} catch (error) {
			const voteQuota =
				votingConfig?.publicVotingMode === "FIXED_QUOTA"
					? (votingConfig.publicVoteQuota ?? null)
					: null;
			toast.error(toVotingErrorMessage(error, { voteQuota }));
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
				description:
					result.remainingVotes === null
						? "已取消对该作品的投票"
						: `还剩 ${result.remainingVotes} 票`,
			});
		} catch (error) {
			const voteQuota =
				votingConfig?.publicVotingMode === "FIXED_QUOTA"
					? (votingConfig.publicVoteQuota ?? null)
					: null;
			toast.error(toVotingErrorMessage(error, { voteQuota }));
		}
	};

	const handleCopyLink = async () => {
		await copyText(voteUrl);
	};

	const getMedia = () => {
		// Prefer video over image if available? Or just first attachment.
		// Logic similar to Slide Deck: Prefer cover image if no attachments, or specific logic.
		// But in detail page we might want to show EVERYTHING.
		// For the "Hero" media, let's pick the best one.
		if (submission.attachments.length > 0) {
			// Find first video
			const vid = submission.attachments.find(
				(a) => a.fileType === "video",
			);
			if (vid)
				return {
					type: "video" as const,
					url: vid.fileUrl,
					name: vid.fileName,
				};

			// Find first image
			const img = submission.attachments.find(
				(a) => a.fileType === "image",
			);
			if (img)
				return {
					type: "image" as const,
					url: img.fileUrl,
					name: img.fileName,
				};
		}
		if (submission.coverImage) {
			return {
				type: "image" as const,
				url: submission.coverImage,
				name: submission.name,
			};
		}
		return null;
	};

	const primaryMedia = getMedia();
	const otherAttachments = submission.attachments.filter(
		(a) => a.fileUrl !== primaryMedia?.url,
	);

	const captionLang = locale === "en" ? "en" : "zh";
	const captionLabel = locale === "en" ? "Captions" : "字幕";
	const fallbackCaptionSrc = createFallbackCaptionSrc(
		submission.tagline ?? submission.name,
		locale === "en" ? "Video content" : "视频内容",
	);

	return (
		<div className="min-h-[calc(100vh-80px)] w-full rounded-3xl overflow-hidden border border-slate-800 bg-slate-950 text-slate-100 shadow-2xl">
			{/* Background Ambient */}
			<div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black z-0" />

			<div className="relative z-10 flex flex-col h-full">
				{/* Header */}
				<div className="flex items-center justify-between p-4 md:p-6 border-b border-white/5 bg-white/5 backdrop-blur-md">
					<Button
						variant="ghost"
						asChild
						className="text-slate-300 hover:text-white hover:bg-white/10"
					>
						<Link
							href={`/${locale}/events/${submission.eventId}/submissions`}
						>
							<ArrowLeft className="h-4 w-4 mr-2" /> 返回列表
						</Link>
					</Button>
					<div className="flex items-center gap-2">
						{isLeader && (
							<Button
								asChild
								variant="outline"
								size="sm"
								className="border-white/10 bg-white/5 text-slate-200 hover:bg-white/10 hover:text-white"
							>
								<Link
									href={`/app/events/${submission.eventId}/submissions/${submission.id}/edit`}
								>
									管理作品
								</Link>
							</Button>
						)}
						<Button
							variant="default"
							className="bg-emerald-600 hover:bg-emerald-500 text-white border-0 shadow-lg shadow-emerald-500/20 hidden md:inline-flex"
							onClick={() =>
								router.push(
									`/${locale}/events/${submission.eventId}/submissions/slides?start=${submission.id}`,
								)
							}
						>
							<Presentation className="h-4 w-4 mr-2" />
							全屏投屏模式
						</Button>
					</div>
				</div>

				<div className="flex-1 grid lg:grid-cols-12 min-h-[600px]">
					{/* Left Column: Info & Details (Scrollable) */}
					<div className="lg:col-span-4 p-6 md:p-8 lg:p-10 space-y-8 overflow-y-auto max-h-[calc(100vh-140px)] scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10 hover:scrollbar-thumb-white/20 border-r border-white/5 bg-slate-950/50">
						<div className="space-y-6">
							<div className="space-y-4">
								<div className="flex flex-wrap items-center gap-2">
									<Badge
										variant="secondary"
										className="bg-white/10 text-slate-200 hover:bg-white/20 border-0"
									>
										{statusLabels[submission.status] ??
											submission.status}
									</Badge>
									{showResults && (
										<Badge
											variant="outline"
											className="border-emerald-500/30 text-emerald-400 bg-emerald-500/10"
										>
											{submission.voteCount} 票
										</Badge>
									)}
									{submission.communityUseAuthorization && (
										<Badge
											variant="outline"
											className="border-blue-500/30 text-blue-400 bg-blue-500/10 gap-1 pl-1"
										>
											<ShieldCheck className="h-3 w-3" />
											已授权
										</Badge>
									)}
								</div>

								<h1 className="text-3xl md:text-4xl font-bold leading-tight tracking-tight text-white drop-shadow-sm">
									{submission.name}
								</h1>

								{submission.tagline && (
									<p className="text-lg md:text-xl text-slate-400 font-light leading-relaxed">
										{submission.tagline}
									</p>
								)}
							</div>

							{/* Voting Card */}
							<div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent p-5 space-y-4 backdrop-blur-sm shadow-xl">
								<div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-2">
									<h3 className="text-base font-semibold text-white flex items-center gap-2">
										<Heart
											className={cn(
												"h-5 w-5",
												hasVoted
													? "fill-rose-500 text-rose-500"
													: "text-slate-400",
											)}
										/>
										给作品投票
									</h3>
									{votingHint && (
										<span className="text-xs text-slate-400 leading-snug sm:max-w-[60%] sm:text-right">
											{votingHint}
										</span>
									)}
								</div>

								<div className="grid grid-cols-2 gap-3">
									{!user ? (
										<Button
											className="w-full col-span-2"
											onClick={handleRequireAuth}
										>
											登录后投票
										</Button>
									) : isVotingCurrentlyOpen &&
										allowPublicVoting &&
										!isOwnTeam ? (
										hasVoted ? (
											<Button
												variant="secondary"
												className="w-full col-span-2 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20"
												onClick={handleUnvote}
											>
												已投票 (点击取消)
											</Button>
										) : (
											<Button
												className="w-full col-span-2 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white shadow-lg shadow-emerald-900/20 border-0"
												onClick={handleVote}
												disabled={
													voteMutation.isPending ||
													(remainingVotes !== null &&
														remainingVotes <= 0)
												}
											>
												{voteMutation.isPending && (
													<Loader2 className="mr-2 h-4 w-4 animate-spin" />
												)}
												投一票
											</Button>
										)
									) : (
										<Button
											disabled
											variant="outline"
											className="w-full col-span-2 border-white/10 text-slate-500"
										>
											暂无法投票
										</Button>
									)}
								</div>

								<div className="pt-2 border-t border-white/5 flex items-center justify-between gap-2">
									<p className="text-xs text-slate-500">
										{isVotingCurrentlyOpen
											? "适合现场大屏展示，扫码即可直接投票"
											: "扫码查看作品详情"}
									</p>
									<div className="flex gap-1">
										<Button
											variant="ghost"
											size="icon"
											className="h-8 w-8 hover:bg-white/10 text-slate-400 hover:text-white"
											onClick={handleCopyLink}
										>
											<Copy className="h-4 w-4" />
										</Button>
										<ShareSubmissionDialog
											shareUrl={voteUrl}
											submissionName={
												submission.name ?? "submission"
											}
											iconOnly
											triggerVariant="ghost"
											triggerSize="icon"
											triggerClassName="h-8 w-8 hover:bg-white/10 text-slate-400 hover:text-white"
										/>
									</div>
								</div>

								<button
									type="button"
									className="bg-white p-3 rounded-xl w-full flex justify-center shadow-inner cursor-zoom-in"
									onClick={() => setIsQrZoomOpen(true)}
									aria-label="放大二维码"
								>
									<QRCode
										value={voteUrl}
										size={160}
										className="h-auto w-full max-w-[180px]"
									/>
								</button>

								<Dialog
									open={isQrZoomOpen}
									onOpenChange={setIsQrZoomOpen}
								>
									<DialogContent
										showCloseButton={false}
										className="max-w-none sm:max-w-none w-[calc(min(92vw,70vh)+40px)] max-h-[calc(100vh-2rem)] rounded-3xl border-white/10 bg-slate-950 p-5 text-white"
									>
										<div className="flex items-start justify-between gap-3">
											<h2 className="min-w-0 text-4xl lg:text-5xl font-semibold leading-tight text-white/90">
												<span className="block truncate">
													{submission.name ??
														"作品二维码"}
												</span>
											</h2>
											<DialogClose asChild>
												<button
													type="button"
													className="shrink-0 rounded-full bg-white/5 p-2 text-white/70 ring-1 ring-white/10 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500"
													aria-label="关闭"
												>
													<X className="h-4 w-4" />
												</button>
											</DialogClose>
										</div>

										<button
											type="button"
											className="mt-4 w-full aspect-square rounded-3xl bg-white p-4 shadow-xl ring-1 ring-black/5 cursor-copy"
											onClick={() =>
												void copyText(voteUrl)
											}
											aria-label="点击复制链接"
										>
											<QRCode
												value={voteUrl || " "}
												size={1024}
												style={{
													height: "100%",
													width: "100%",
												}}
												className="h-full w-full"
											/>
										</button>
									</DialogContent>
								</Dialog>
							</div>

							{/* Description */}
							<div className="space-y-3 pt-4 border-t border-white/5">
								<h3 className="text-lg font-medium text-white">
									关于作品
								</h3>
								<div
									className="prose prose-invert prose-p:text-slate-300 prose-a:text-blue-400 max-w-none text-sm leading-relaxed"
									dangerouslySetInnerHTML={{
										__html:
											submission.description ||
											"暂无详细介绍",
									}}
								/>
							</div>

							{/* Team */}
							{(submission.teamLeader ||
								(submission.teamMembers &&
									submission.teamMembers.length > 0)) && (
								<div className="space-y-3 pt-4 border-t border-white/5">
									<h3 className="text-lg font-medium text-white">
										团队成员
									</h3>
									<div className="flex flex-wrap gap-4">
										{submission.teamLeader && (
											<div className="flex items-center gap-2">
												<Avatar className="h-8 w-8 border border-white/10">
													<AvatarImage
														src={
															submission
																.teamLeader
																.avatar ??
															undefined
														}
													/>
													<AvatarFallback>
														{submission.teamLeader.name?.slice(
															0,
															2,
														)}
													</AvatarFallback>
												</Avatar>
												<div className="text-sm">
													<p className="text-slate-200">
														{
															submission
																.teamLeader.name
														}
													</p>
													<p className="text-xs text-slate-500">
														队长
													</p>
												</div>
											</div>
										)}
										{submission.teamMembers?.map(
											(member) => (
												<div
													key={member.id}
													className="flex items-center gap-2"
												>
													<Avatar className="h-8 w-8 border border-white/10">
														<AvatarImage
															src={
																member.avatar ??
																undefined
															}
														/>
														<AvatarFallback>
															{member.name?.slice(
																0,
																2,
															)}
														</AvatarFallback>
													</Avatar>
													<div className="text-sm">
														<p className="text-slate-200">
															{member.name}
														</p>
														<p className="text-xs text-slate-500">
															成员
														</p>
													</div>
												</div>
											),
										)}
									</div>
								</div>
							)}

							{/* Custom Fields */}
							{customFieldAnswers.length > 0 && (
								<div className="space-y-4 pt-4 border-t border-white/5">
									<h3 className="text-lg font-medium text-white">
										补充信息
									</h3>
									<div className="grid gap-3">
										{customFieldAnswers.map((answer) => (
											<div
												key={answer.key}
												className="rounded-lg bg-white/5 p-3 space-y-1"
											>
												<p className="text-xs text-slate-500">
													{answer.label}
												</p>
												<p className="text-sm text-slate-200 break-words">
													{String(
														answer.value ??
															"未填写",
													)}
												</p>
											</div>
										))}
									</div>
								</div>
							)}
						</div>
					</div>

					{/* Right Column: Media Display */}
					<div className="lg:col-span-8 flex flex-col h-full bg-slate-900/30">
						<div className="flex-1 p-6 flex flex-col gap-6 overflow-y-auto">
							{/* Primary Media */}
							<div className="w-full aspect-video rounded-2xl bg-black border border-white/10 overflow-hidden shadow-2xl relative group">
								{primaryMedia?.type === "video" ? (
									<video
										controls
										preload="metadata"
										className="w-full h-full object-contain"
									>
										<source src={primaryMedia.url} />
										<track
											default
											kind="captions"
											srcLang={captionLang}
											label={captionLabel}
											src={fallbackCaptionSrc}
										/>
									</video>
								) : primaryMedia?.type === "image" ? (
									<img
										src={primaryMedia.url}
										alt={
											primaryMedia.name || submission.name
										}
										className="w-full h-full object-contain"
									/>
								) : (
									<div className="w-full h-full flex flex-col items-center justify-center text-slate-600 gap-4">
										<div className="p-4 rounded-full bg-white/5">
											<Play className="h-10 w-10 opacity-50" />
										</div>
										<p>暂无主媒体内容</p>
									</div>
								)}

								{submission.demoUrl && (
									<div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
										<Button
											size="sm"
											variant="secondary"
											className="shadow-lg backdrop-blur-md bg-white/10 hover:bg-white/20 text-white border-0"
											asChild
										>
											<Link
												href={submission.demoUrl}
												target="_blank"
											>
												<ArrowUpRight className="mr-2 h-3 w-3" />
												访问演示链接
											</Link>
										</Button>
									</div>
								)}
							</div>

							{/* Other Attachments Grid */}
							{otherAttachments.length > 0 && (
								<div className="grid grid-cols-2 md:grid-cols-3 gap-4">
									{otherAttachments.map((att) => (
										<div
											key={att.id}
											className="aspect-video rounded-xl border border-white/10 bg-black/40 overflow-hidden relative group hover:ring-2 hover:ring-emerald-500/50 transition-all"
										>
											{att.fileType === "image" ? (
												<img
													src={att.fileUrl}
													alt={att.fileName}
													className="w-full h-full object-cover"
												/>
											) : att.fileType === "video" ? (
												<div className="w-full h-full flex items-center justify-center bg-slate-900 group-hover:bg-slate-800 transition-colors">
													<Play className="h-8 w-8 text-white/50" />
												</div>
											) : (
												<div className="w-full h-full flex items-center justify-center bg-slate-900 text-xs text-slate-500 p-2 text-center">
													{att.fileName}
												</div>
											)}
											<a
												href={att.fileUrl}
												target="_blank"
												rel="noreferrer"
												className="absolute inset-0 z-10"
												aria-label="查看附件"
											>
												<span className="sr-only">
													查看附件
												</span>
											</a>
										</div>
									))}
								</div>
							)}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
