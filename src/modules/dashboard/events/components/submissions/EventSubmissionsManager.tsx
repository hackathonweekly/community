"use client";

import Link from "next/link";
import { useLocale } from "next-intl";
import { useMemo, useState } from "react";
import { FileDown, RefreshCw, SlidersHorizontal, Trash2 } from "lucide-react";
import { toast } from "sonner";

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
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
	useAdjustSubmissionVotes,
	useDeleteSubmission,
	useEventSubmissions,
} from "@/features/event-submissions/hooks";
import type {
	EventSubmission,
	SubmissionFormConfig,
} from "@/features/event-submissions/types";

interface EventSubmissionsManagerProps {
	eventId: string;
	eventTitle?: string;
	submissionFormConfig?: SubmissionFormConfig | null;
}

const STATUS_LABELS: Record<string, string> = {
	SUBMITTED: "已提交",
	UNDER_REVIEW: "审核中",
	APPROVED: "已通过",
	REJECTED: "已拒绝",
	AWARDED: "已获奖",
};

export function EventSubmissionsManager({
	eventId,
	eventTitle,
	submissionFormConfig,
}: EventSubmissionsManagerProps) {
	const locale = useLocale();
	const { data, isLoading, isFetching, refetch } = useEventSubmissions(
		eventId,
		{
			includeVotes: true,
			includePrivateFields: true,
		},
	);
	const submissions = data?.submissions ?? [];
	const [statusFilter, setStatusFilter] = useState<string>("all");
	const [submissionToAdjust, setSubmissionToAdjust] =
		useState<EventSubmission | null>(null);
	const [submissionToDelete, setSubmissionToDelete] =
		useState<EventSubmission | null>(null);
	const [voteInput, setVoteInput] = useState<string>("0");

	const adjustMutation = useAdjustSubmissionVotes(
		submissionToAdjust?.id || "",
	);
	const deleteMutation = useDeleteSubmission(
		submissionToDelete?.id || "",
		eventId,
	);

	const filteredSubmissions = useMemo(() => {
		if (statusFilter === "all") return submissions;
		return submissions.filter(
			(submission) => submission.status === statusFilter,
		);
	}, [submissions, statusFilter]);
	const sortedCustomFields = useMemo(
		() =>
			submissionFormConfig?.fields
				? [...submissionFormConfig.fields].sort(
						(a, b) => a.order - b.order,
					)
				: [],
		[submissionFormConfig],
	);

	const handleOpenAdjust = (submission: EventSubmission) => {
		setSubmissionToAdjust(submission);
		setVoteInput(
			String(
				submission.voteCount ??
					submission.baseVoteCount ??
					submission.manualVoteAdjustment ??
					0,
			),
		);
	};

	const handleSaveAdjust = async () => {
		if (!submissionToAdjust) return;

		const targetVotes = Number.parseInt(voteInput, 10);
		if (Number.isNaN(targetVotes) || targetVotes < 0) {
			toast.error("请输入合法的票数");
			return;
		}

		try {
			await adjustMutation.mutateAsync(targetVotes);
			toast.success("票数已更新");
			setSubmissionToAdjust(null);
		} catch (error) {
			console.error(error);
			toast.error(
				error instanceof Error ? error.message : "票数调整失败",
			);
		}
	};

	const handleConfirmDelete = async () => {
		if (!submissionToDelete) return;
		try {
			await deleteMutation.mutateAsync();
			toast.success("作品已删除");
		} catch (error) {
			console.error(error);
			toast.error(error instanceof Error ? error.message : "删除失败");
		} finally {
			setSubmissionToDelete(null);
		}
	};

	const handleExport = () => {
		if (!submissions.length) {
			toast.info("暂无作品可导出");
			return;
		}

		const hasCustomFieldData = submissions.some((submission) => {
			const customFields = normalizeCustomFields(submission.customFields);
			return customFields && Object.keys(customFields).length > 0;
		});

		const headers = [
			"ID",
			"作品",
			"状态",
			"票数",
			"基础票数",
			"手动调整",
			"提交人",
			"提交人邮箱",
			"提交人手机号",
			"提交人微信",
			"提交人用户名",
			"用户角色",
			"所在城市",
			"团队人数",
			"提交时间",
			"Demo URL",
			...sortedCustomFields.map((field) => field.label),
			...(!sortedCustomFields.length && hasCustomFieldData
				? ["自定义问卷"]
				: []),
		];

		const rows = submissions.map((submission) => {
			const contactUser = submission.teamLeader || submission.submitter;
			const customFields = normalizeCustomFields(submission.customFields);
			const customFieldValues = sortedCustomFields.map((field) =>
				formatCustomFieldValue(customFields?.[field.key]),
			);
			const rawCustomFieldValues =
				!sortedCustomFields.length && hasCustomFieldData
					? [formatCustomFieldValue(customFields ?? "")]
					: [];

			return [
				submission.id,
				submission.name,
				STATUS_LABELS[submission.status] ?? submission.status,
				submission.voteCount ?? 0,
				submission.baseVoteCount ?? "",
				submission.manualVoteAdjustment ?? "",
				contactUser?.name || submission.submitter?.name || "",
				contactUser?.email || "",
				contactUser?.phoneNumber || "",
				contactUser?.wechatId || "",
				contactUser?.username || "",
				contactUser?.userRoleString || "",
				contactUser?.region || "",
				submission.teamSize ?? "",
				submission.submittedAt
					? new Date(submission.submittedAt).toISOString()
					: "",
				submission.demoUrl || "",
				...customFieldValues,
				...rawCustomFieldValues,
			];
		});

		const csv = [headers, ...rows]
			.map((row) => row.map((value) => formatCsvValue(value)).join(","))
			.join("\n");

		const blob = new Blob([csv], {
			type: "text/csv;charset=utf-8;",
		});
		const url = URL.createObjectURL(blob);
		const link = document.createElement("a");
		link.href = url;
		link.download = `${eventTitle || "event"}-submissions.csv`;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		URL.revokeObjectURL(url);
		toast.success("导出成功");
	};

	const renderSkeleton = () => (
		<div className="space-y-3">
			{Array.from({ length: 4 }).map((_, index) => (
				<div
					key={index}
					className="grid grid-cols-6 items-center gap-4"
				>
					<Skeleton className="col-span-2 h-10" />
					<Skeleton className="h-10" />
					<Skeleton className="h-10" />
					<Skeleton className="h-10" />
					<Skeleton className="h-10" />
				</div>
			))}
		</div>
	);

	return (
		<Card>
			<CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
				<div className="space-y-1">
					<CardTitle>作品管理</CardTitle>
					<CardDescription>
						导出、删除或手动调整作品票数。
					</CardDescription>
				</div>
				<div className="flex flex-wrap gap-2">
					<Button
						variant="outline"
						size="sm"
						onClick={() => refetch()}
						disabled={isFetching}
					>
						<RefreshCw className="mr-2 h-4 w-4" />
						刷新
					</Button>
					<Button
						variant="secondary"
						size="sm"
						onClick={handleExport}
					>
						<FileDown className="mr-2 h-4 w-4" />
						导出 CSV
					</Button>
					<Select
						value={statusFilter}
						onValueChange={setStatusFilter}
					>
						<SelectTrigger className="w-[180px]">
							<SelectValue placeholder="按状态筛选" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">全部</SelectItem>
							<SelectItem value="SUBMITTED">
								{STATUS_LABELS.SUBMITTED}
							</SelectItem>
							<SelectItem value="UNDER_REVIEW">
								{STATUS_LABELS.UNDER_REVIEW}
							</SelectItem>
							<SelectItem value="APPROVED">
								{STATUS_LABELS.APPROVED}
							</SelectItem>
							<SelectItem value="REJECTED">
								{STATUS_LABELS.REJECTED}
							</SelectItem>
							<SelectItem value="AWARDED">
								{STATUS_LABELS.AWARDED}
							</SelectItem>
						</SelectContent>
					</Select>
				</div>
			</CardHeader>
			<CardContent>
				{isLoading ? (
					renderSkeleton()
				) : filteredSubmissions.length === 0 ? (
					<div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
						<p>暂时还没有作品提交</p>
						<p className="mt-1">有人提交后会显示在这里。</p>
					</div>
				) : (
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead className="w-[22%]">作品</TableHead>
								<TableHead>状态</TableHead>
								<TableHead>票数</TableHead>
								<TableHead>提交人</TableHead>
								<TableHead className="hidden md:table-cell">
									提交时间
								</TableHead>
								<TableHead className="text-right">
									操作
								</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{filteredSubmissions.map((submission) => (
								<TableRow key={submission.id}>
									<TableCell className="space-y-1">
										<div className="font-semibold">
											{submission.name}
										</div>
										<div className="text-xs text-muted-foreground">
											{submission.tagline ||
												submission.description}
										</div>
									</TableCell>
									<TableCell>
										<Badge variant="outline">
											{STATUS_LABELS[submission.status] ??
												submission.status}
										</Badge>
									</TableCell>
									<TableCell>
										<div className="font-semibold">
											{submission.voteCount ?? 0}
										</div>
										<div className="text-xs text-muted-foreground">
											基础 {submission.baseVoteCount ?? 0}
											{submission.manualVoteAdjustment ? (
												<>
													{" "}
													/ 手动{" "}
													{submission.manualVoteAdjustment >
													0
														? `+${submission.manualVoteAdjustment}`
														: submission.manualVoteAdjustment}
												</>
											) : null}
										</div>
									</TableCell>
									<TableCell>
										<div className="flex flex-col text-sm">
											<span className="font-medium">
												{submission.teamLeader?.name ||
													submission.submitter
														?.name ||
													"-"}
											</span>
											{submission.teamSize ? (
												<span className="text-muted-foreground">
													团队人数：
													{submission.teamSize}
												</span>
											) : null}
										</div>
									</TableCell>
									<TableCell className="hidden text-sm text-muted-foreground md:table-cell">
										{submission.submittedAt
											? new Date(
													submission.submittedAt,
												).toLocaleString()
											: "-"}
									</TableCell>
									<TableCell className="text-right">
										<div className="flex flex-wrap justify-end gap-2">
											<Button
												size="sm"
												variant="outline"
												asChild
											>
												<Link
													href={`/${locale}/events/${submission.eventId}/submissions/${submission.id}`}
												>
													查看
												</Link>
											</Button>
											<Button
												size="sm"
												variant="secondary"
												onClick={() =>
													handleOpenAdjust(submission)
												}
											>
												<SlidersHorizontal className="mr-1 h-4 w-4" />
												调整票数
											</Button>
											<Button
												size="sm"
												variant="ghost"
												className="text-destructive hover:text-destructive"
												onClick={() =>
													setSubmissionToDelete(
														submission,
													)
												}
											>
												<Trash2 className="mr-1 h-4 w-4" />
												删除
											</Button>
										</div>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				)}
			</CardContent>

			<Dialog
				open={Boolean(submissionToAdjust)}
				onOpenChange={(open) => {
					if (!open) setSubmissionToAdjust(null);
				}}
			>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>调整票数</DialogTitle>
						<DialogDescription>
							{submissionToAdjust?.name}
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-3">
						<p className="text-sm text-muted-foreground">
							设定最终显示的票数（不会影响真实投票记录）。
						</p>
						<div className="grid gap-2">
							<label className="text-sm font-medium">
								目标票数
							</label>
							<Input
								type="number"
								min={0}
								value={voteInput}
								onChange={(event) =>
									setVoteInput(event.target.value)
								}
							/>
							{submissionToAdjust ? (
								<p className="text-xs text-muted-foreground">
									基础 {submissionToAdjust.baseVoteCount ?? 0}{" "}
									/ 手动{" "}
									{submissionToAdjust.manualVoteAdjustment ??
										0}
								</p>
							) : null}
						</div>
						<div className="flex justify-end gap-2">
							<Button
								variant="outline"
								onClick={() => setSubmissionToAdjust(null)}
							>
								取消
							</Button>
							<Button
								onClick={handleSaveAdjust}
								disabled={adjustMutation.isPending}
							>
								<SlidersHorizontal className="mr-2 h-4 w-4" />
								保存
							</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>

			<AlertDialog
				open={Boolean(submissionToDelete)}
				onOpenChange={(open) => {
					if (!open) setSubmissionToDelete(null);
				}}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>确认删除作品？</AlertDialogTitle>
						<AlertDialogDescription>
							删除后无法恢复，票数与作品数据将被清理。
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>取消</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleConfirmDelete}
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
							disabled={deleteMutation.isPending}
						>
							删除
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</Card>
	);
}

function normalizeCustomFields(customFields: EventSubmission["customFields"]) {
	if (
		!customFields ||
		typeof customFields !== "object" ||
		Array.isArray(customFields)
	) {
		return null;
	}
	return customFields as Record<string, unknown>;
}

function formatCustomFieldValue(value: unknown): string {
	if (value === null || value === undefined) return "";
	if (Array.isArray(value)) {
		return value.map((item) => formatCustomFieldValue(item)).join("、");
	}
	if (typeof value === "object") {
		try {
			return JSON.stringify(value);
		} catch {
			return String(value);
		}
	}
	if (typeof value === "boolean") {
		return value ? "是" : "否";
	}
	return String(value);
}

function formatCsvValue(value: unknown): string {
	const asString = value === null || value === undefined ? "" : String(value);
	const escaped = asString.replace(/"/g, '""');
	return `"${escaped}"`;
}
