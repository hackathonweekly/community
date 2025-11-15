"use client";

import Link from "next/link";
import { useLocale } from "next-intl";
import { useMemo } from "react";
import { useSession } from "@dashboard/auth/hooks/use-session";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useEventSubmissions } from "@/features/event-submissions/hooks";
import type { EventSubmission } from "@/features/event-submissions/types";
import { cn } from "@/lib/utils";

interface SubmissionsDashboardProps {
	eventId: string;
	eventTitle: string;
}

const statusColorMap: Record<string, string> = {
	SUBMITTED: "bg-blue-100 text-blue-700",
	UNDER_REVIEW: "bg-amber-100 text-amber-700",
	APPROVED: "bg-emerald-100 text-emerald-700",
	AWARDED: "bg-purple-100 text-purple-700",
};

const SubmissionCard = ({ submission }: { submission: EventSubmission }) => {
	// Current locale for linking to the public detail page
	const locale = useLocale();
	const thumbnail =
		submission.attachments.find(
			(attachment) => attachment.fileType === "image",
		)?.fileUrl || submission.coverImage;

	return (
		<Card className="hover:shadow-md transition">
			<CardContent className="p-4 flex gap-4">
				<div className="w-24 h-24 rounded-md bg-muted overflow-hidden flex-shrink-0">
					{thumbnail ? (
						<img
							src={thumbnail}
							alt={submission.name}
							className="w-full h-full object-cover"
						/>
					) : (
						<div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
							无封面
						</div>
					)}
				</div>
				<div className="flex-1 space-y-2">
					<div className="flex items-center justify-between">
						<h4 className="font-semibold leading-tight">
							{submission.name}
						</h4>
						<Badge
							className={cn(
								"text-xs",
								statusColorMap[submission.status] ??
									"bg-slate-100 text-slate-700",
							)}
						>
							{submission.status}
						</Badge>
					</div>
					<p className="text-sm text-muted-foreground line-clamp-2">
						{submission.tagline || "暂未填写简介"}
					</p>
					<div className="flex items-center justify-between text-sm">
						<span className="text-muted-foreground">
							投票数：{submission.voteCount}
						</span>
						<div className="flex gap-2">
							<Button variant="outline" size="sm" asChild>
								<Link
									href={`/${locale}/events/${submission.eventId}/submissions/${submission.id}`}
								>
									查看
								</Link>
							</Button>
							<Button variant="secondary" size="sm" asChild>
								<Link
									href={`/app/events/${submission.eventId}/submissions/${submission.id}/edit`}
								>
									编辑
								</Link>
							</Button>
						</div>
					</div>
				</div>
			</CardContent>
		</Card>
	);
};

export function SubmissionsDashboard({
	eventId,
	eventTitle,
}: SubmissionsDashboardProps) {
	const { user } = useSession();
	const { data, isLoading } = useEventSubmissions(eventId, {
		includeVotes: true,
	});

	const mySubmissions = useMemo(
		() =>
			(data?.submissions || []).filter(
				(submission) => submission.teamLeader?.id === user?.id,
			),
		[data?.submissions, user?.id],
	);

	return (
		<div className="space-y-6">
			<div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
				<div>
					<h1 className="text-2xl font-semibold">
						{eventTitle} · 我的作品
					</h1>
					<p className="text-muted-foreground text-sm">
						在提交截止前，你可以随时编辑或再次提交作品。
					</p>
				</div>
				<Button asChild>
					<Link href={`/app/events/${eventId}/submissions/new`}>
						提交新作品
					</Link>
				</Button>
			</div>

			{isLoading ? (
				<div className="space-y-3">
					{Array.from({ length: 3 }).map((_, index) => (
						<Skeleton key={index} className="h-32 w-full" />
					))}
				</div>
			) : mySubmissions.length === 0 ? (
				<Card>
					<CardContent className="py-10 text-center text-muted-foreground">
						<p>你还没有提交作品，点击右上角开始提交。</p>
					</CardContent>
				</Card>
			) : (
				<div className="grid gap-4">
					{mySubmissions.map((submission) => (
						<SubmissionCard
							key={submission.id}
							submission={submission}
						/>
					))}
				</div>
			)}

			{/* Removed "全部作品" section per product requirement */}
		</div>
	);
}
