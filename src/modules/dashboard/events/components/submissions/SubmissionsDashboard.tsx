"use client";

import Link from "next/link";
import { useLocale } from "next-intl";
import { useMemo } from "react";
import { Trash2 } from "lucide-react";
import { useSession } from "@dashboard/auth/hooks/use-session";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
	useDeleteSubmission,
	useEventSubmissions,
} from "@/features/event-submissions/hooks";
import type { EventSubmission } from "@/features/event-submissions/types";
import { cn } from "@/lib/utils";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface SubmissionsDashboardProps {
	eventId: string;
	eventTitle: string;
	isSubmissionOpen?: boolean;
}

const statusColorMap: Record<string, string> = {
	SUBMITTED: "bg-blue-100 text-blue-700",
	UNDER_REVIEW: "bg-amber-100 text-amber-700",
	APPROVED: "bg-emerald-100 text-emerald-700",
	AWARDED: "bg-purple-100 text-purple-700",
};

const SubmissionCard = ({
	submission,
}: {
	submission: EventSubmission;
}) => {
	// Current locale for linking to the public detail page
	const locale = useLocale();
	const thumbnail =
		submission.attachments.find(
			(attachment) => attachment.fileType === "image",
		)?.fileUrl || submission.coverImage;

	const deleteMutation = useDeleteSubmission(
		submission.id,
		submission.eventId,
	);

	const handleDelete = async () => {
		try {
			await deleteMutation.mutateAsync();
			toast.success("已删除作品");
		} catch (error) {
			toast.error(error instanceof Error ? error.message : "删除失败");
		}
	};

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
						<div className="flex flex-wrap justify-end gap-2">
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
							<AlertDialog>
								<AlertDialogTrigger asChild>
									<Button
										variant="destructive"
										size="sm"
										disabled={deleteMutation.isPending}
										className="gap-1"
									>
										<Trash2 className="h-4 w-4" />
										删除
									</Button>
								</AlertDialogTrigger>
								<AlertDialogContent>
									<AlertDialogHeader>
										<AlertDialogTitle>
											确认删除作品？
										</AlertDialogTitle>
										<AlertDialogDescription>
											此操作不可撤销。作品、附件及投票记录都会被删除。
										</AlertDialogDescription>
									</AlertDialogHeader>
									<AlertDialogFooter>
										<AlertDialogCancel>
											取消
										</AlertDialogCancel>
										<AlertDialogAction
											onClick={handleDelete}
											disabled={deleteMutation.isPending}
										>
											确认删除
										</AlertDialogAction>
									</AlertDialogFooter>
								</AlertDialogContent>
							</AlertDialog>
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
	isSubmissionOpen = false,
}: SubmissionsDashboardProps) {
	const locale = useLocale();
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
						{isSubmissionOpen
							? "在提交截止前，你可以随时编辑或再次提交作品。"
							: "提交已结束，你仍可以查看和管理你已提交的作品。"}
					</p>
				</div>
				<div className="flex flex-col gap-2 md:flex-row md:items-center">
					<Button variant="secondary" asChild>
						<Link href={`/${locale}/events/${eventId}/submissions`}>
							作品广场
						</Link>
					</Button>
					{isSubmissionOpen ? (
						<Button asChild>
							<Link
								href={`/app/events/${eventId}/submissions/new`}
							>
								提交新作品
							</Link>
						</Button>
					) : (
						<Button
							variant="outline"
							disabled
							title="作品提交已结束"
						>
							提交已结束
						</Button>
					)}
				</div>
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
