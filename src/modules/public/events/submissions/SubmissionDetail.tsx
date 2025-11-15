"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
	ArrowLeft,
	CalendarClock,
	Heart,
	Loader2,
	ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useSession } from "@/modules/dashboard/auth/hooks/use-session";
import type { EventSubmission } from "@/features/event-submissions/types";
import {
	useEventSubmissions,
	useVoteSubmission,
	useUnvoteSubmission,
} from "@/features/event-submissions/hooks";

interface SubmissionDetailProps {
	submission: EventSubmission;
	locale: string;
	// When true, show final results (exact vote counts)
	showResults?: boolean;
}

const statusLabels: Record<string, string> = {
	SUBMITTED: "已提交",
	UNDER_REVIEW: "审核中",
	APPROVED: "已通过",
	AWARDED: "已获奖",
};

export function SubmissionDetail({
	submission,
	locale,
	showResults = false,
}: SubmissionDetailProps) {
	const { user } = useSession();
	const router = useRouter();
	const pathname = usePathname();
	const voteMutation = useVoteSubmission(submission.eventId);
	const unvoteMutation = useUnvoteSubmission(submission.eventId);
	const { data } = useEventSubmissions(submission.eventId, {
		includeVotes: true,
		enabled: Boolean(user),
	});

	const userVotes = new Set(data?.userVotes ?? []);
	const hasVoted = userVotes.has(submission.id);
	const remainingVotes = data?.remainingVotes ?? (user ? 3 : null);
	const isLeader = user && submission.teamLeader?.id === user.id;
	// Block voting if current user is part of the team (leader or member)
	const isOwnTeam =
		Boolean(user) &&
		(submission.teamLeader?.id === user.id ||
			submission.teamMembers?.some((m) => m.id === user.id));

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
		if (isOwnTeam) {
			toast.info("无法给自己的作品投票");
			return;
		}
		try {
			await voteMutation.mutateAsync(submission.id);
			toast.success("投票成功");
		} catch (error) {
			toast.error(error instanceof Error ? error.message : "投票失败");
		}
	};

	const handleUnvote = async () => {
		try {
			await unvoteMutation.mutateAsync(submission.id);
			toast.success("已取消投票");
		} catch (error) {
			toast.error(error instanceof Error ? error.message : "操作失败");
		}
	};

	const renderVoteButton = () => {
		if (!user) {
			return (
				<Button variant="outline" onClick={handleRequireAuth}>
					登录后投票
				</Button>
			);
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
				) : (
					"投票"
				)}
			</Button>
		);
	};

	return (
		<div className="space-y-6">
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
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-2 text-lg font-semibold">
							{showResults ? (
								<>
									<Heart className="h-5 w-5 text-rose-500" />
									<span>{submission.voteCount} 票</span>
								</>
							) : (
								// Keep layout stable when votes are hidden
								<span className="invisible inline-flex items-center gap-2">
									<Heart className="h-5 w-5" />0 票
								</span>
							)}
						</div>
						{renderVoteButton()}
					</div>

					{submission.attachments.length > 0 && (
						<div className="grid gap-4 sm:grid-cols-2">
							{submission.attachments.map((attachment) => (
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
											<source src={attachment.fileUrl} />
											您的浏览器不支持视频播放
										</video>
									) : attachment.fileType === "audio" ? (
										<div className="p-4">
											<audio controls className="w-full">
												<source
													src={attachment.fileUrl}
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
							))}
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
		</div>
	);
}
