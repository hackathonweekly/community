"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { getLevelTypeName, getFullLevelName } from "@/lib/level-utils";
import type { LevelApplication, LevelApplicationStatus } from "@prisma/client";
import {
	Clock,
	CheckCircle2,
	XCircle,
	Calendar,
	User as UserIcon,
	Mail,
	ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { UserLevelBadges } from "./LevelBadge";

interface ApplicationWithUser extends LevelApplication {
	user: {
		id: string;
		name: string;
		username: string | null;
		email: string;
		membershipLevel: string | null;
		creatorLevel: string | null;
		mentorLevel: string | null;
		contributorLevel: string | null;
	};
}

const getStatusColor = (status: LevelApplicationStatus) => {
	switch (status) {
		case "PENDING":
			return "bg-yellow-100 text-yellow-800 border-yellow-200";
		case "APPROVED":
			return "bg-green-100 text-green-800 border-green-200";
		case "REJECTED":
			return "bg-red-100 text-red-800 border-red-200";
		default:
			return "bg-gray-100 text-gray-800 border-gray-200";
	}
};

interface ReviewDialogProps {
	application: ApplicationWithUser;
	onReview: (
		applicationId: string,
		action: "APPROVE" | "REJECT",
		reviewNote?: string,
	) => void;
	isLoading: boolean;
}

function ReviewDialog({ application, onReview, isLoading }: ReviewDialogProps) {
	const [open, setOpen] = useState(false);
	const [reviewNote, setReviewNote] = useState("");
	const [action, setAction] = useState<"APPROVE" | "REJECT" | null>(null);

	const handleSubmit = () => {
		if (!action) {
			return;
		}

		onReview(application.id, action, reviewNote || undefined);
		setOpen(false);
		setReviewNote("");
		setAction(null);
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button variant="outline" size="sm">
					审核
				</Button>
			</DialogTrigger>
			<DialogContent className="max-w-2xl">
				<DialogHeader>
					<DialogTitle>审核等级申请</DialogTitle>
					<DialogDescription>
						请仔细审核申请内容后做出决定
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4">
					{/* 申请基本信息 */}
					<div className="p-4 border rounded-lg bg-muted/50">
						<div className="grid grid-cols-2 gap-4 text-sm">
							<div>
								<span className="font-medium">申请人:</span>{" "}
								{application.user.name}
							</div>
							<div>
								<span className="font-medium">邮箱:</span>{" "}
								{application.user.email}
							</div>
							<div>
								<span className="font-medium">目标等级:</span>{" "}
								{getFullLevelName(
									application.levelType,
									application.targetLevel,
								)}
							</div>
							<div>
								<span className="font-medium">申请时间:</span>{" "}
								{new Date(
									application.createdAt,
								).toLocaleDateString("zh-CN")}
							</div>
						</div>
					</div>

					{/* 用户当前等级 */}
					<div>
						<p className="font-medium mb-2">用户当前等级</p>
						<UserLevelBadges user={application.user} />
					</div>

					{/* 申请理由 */}
					<div>
						<p className="font-medium mb-2">申请理由</p>
						<div className="p-3 border rounded-lg bg-background">
							<p className="text-sm whitespace-pre-wrap">
								{application.reason}
							</p>
						</div>
					</div>

					{/* 证明材料 */}
					{application.evidence && (
						<div>
							<p className="font-medium mb-2">证明材料</p>
							<div className="p-3 border rounded-lg bg-background">
								<p className="text-sm text-blue-600 break-all">
									{application.evidence}
								</p>
							</div>
						</div>
					)}

					{/* 审核备注 */}
					<div>
						<p className="font-medium mb-2">审核备注（可选）</p>
						<Textarea
							placeholder="输入审核意见..."
							value={reviewNote}
							onChange={(e) => setReviewNote(e.target.value)}
							rows={3}
						/>
					</div>

					{/* 操作按钮 */}
					<div className="flex gap-3 pt-4">
						<Button
							onClick={() => setAction("APPROVE")}
							className={`flex-1 ${action === "APPROVE" ? "bg-green-600 hover:bg-green-700" : ""}`}
							disabled={isLoading}
						>
							<CheckCircle2 className="h-4 w-4 mr-2" />
							批准申请
						</Button>
						<Button
							variant="destructive"
							onClick={() => setAction("REJECT")}
							className={`flex-1 ${action === "REJECT" ? "bg-red-600 hover:bg-red-700" : ""}`}
							disabled={isLoading}
						>
							<XCircle className="h-4 w-4 mr-2" />
							拒绝申请
						</Button>
					</div>

					{action && (
						<Button
							onClick={handleSubmit}
							disabled={isLoading}
							className="w-full"
						>
							{isLoading
								? "处理中..."
								: `确认${action === "APPROVE" ? "批准" : "拒绝"}`}
						</Button>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
}

export function LevelApplicationReviewList() {
	const { toast } = useToast();
	const [applications, setApplications] = useState<ApplicationWithUser[]>([]);
	const [loading, setLoading] = useState(true);
	const [reviewLoading, setReviewLoading] = useState(false);

	useEffect(() => {
		fetchPendingApplications();
	}, []);

	const fetchPendingApplications = async () => {
		try {
			setLoading(true);
			const response = await fetch("/api/level/pending");
			const result = await response.json();

			if (result.success) {
				setApplications(result.applications);
			} else {
				toast({
					title: "获取申请列表失败",
					description: result.error || "请稍后重试",
					variant: "destructive",
				});
			}
		} catch (error) {
			console.error("获取待审核申请失败:", error);
			toast({
				title: "网络错误",
				description: "请检查网络连接后重试",
				variant: "destructive",
			});
		} finally {
			setLoading(false);
		}
	};

	const handleReview = async (
		applicationId: string,
		action: "APPROVE" | "REJECT",
		reviewNote?: string,
	) => {
		try {
			setReviewLoading(true);

			const response = await fetch("/api/level/review", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					applicationId,
					action,
					reviewNote,
				}),
			});

			const result = await response.json();

			if (result.success) {
				toast({
					title: `申请已${action === "APPROVE" ? "批准" : "拒绝"}`,
					description: "等级申请处理完成",
				});

				// 刷新申请列表
				fetchPendingApplications();
			} else {
				throw new Error(result.error || "审核失败");
			}
		} catch (error) {
			console.error("审核申请失败:", error);
			toast({
				title: "审核失败",
				description:
					error instanceof Error ? error.message : "请稍后重试",
				variant: "destructive",
			});
		} finally {
			setReviewLoading(false);
		}
	};

	const formatDate = (dateString: string) => {
		return new Intl.DateTimeFormat("zh-CN", {
			year: "numeric",
			month: "short",
			day: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		}).format(new Date(dateString));
	};

	if (loading) {
		return (
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Clock className="h-5 w-5" />
						待审核申请
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="flex items-center justify-center py-12">
						<div className="text-center">
							<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
							<p className="mt-2 text-sm text-muted-foreground">
								加载中...
							</p>
						</div>
					</div>
				</CardContent>
			</Card>
		);
	}

	if (applications.length === 0) {
		return (
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Clock className="h-5 w-5" />
						待审核申请
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="text-center py-12">
						<CheckCircle2 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
						<p className="text-lg font-medium mb-2">
							暂无待审核申请
						</p>
						<p className="text-muted-foreground">
							所有等级申请都已处理完成
						</p>
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<Clock className="h-5 w-5" />
					待审核申请 ({applications.length})
				</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="space-y-6">
					{applications.map((application, index) => (
						<div key={application.id}>
							<div className="p-4 border rounded-lg space-y-4">
								{/* 申请头部 */}
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-3">
										<Badge
											className={getStatusColor(
												application.status,
											)}
										>
											<Clock className="h-3 w-3 mr-1" />
											待审核
										</Badge>
										<span className="font-semibold">
											{getLevelTypeName(
												application.levelType,
											)}{" "}
											→{" "}
											{getFullLevelName(
												application.levelType,
												application.targetLevel,
											)}
										</span>
									</div>
									<div className="text-sm text-muted-foreground flex items-center gap-1">
										<Calendar className="h-3 w-3" />
										{formatDate(
											application.createdAt.toString(),
										)}
									</div>
								</div>

								{/* 申请人信息 */}
								<div className="flex items-center justify-between bg-muted/50 p-3 rounded-lg">
									<div className="flex items-center gap-3">
										<div className="flex items-center gap-2">
											<UserIcon className="h-4 w-4" />
											<span className="font-medium">
												{application.user.name}
											</span>
											{application.user.username && (
												<Link
													href={`/zh/u/${application.user.username}`}
													className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
													target="_blank"
												>
													@{application.user.username}
													<ExternalLink className="h-3 w-3" />
												</Link>
											)}
										</div>
										<div className="flex items-center gap-2 text-sm text-muted-foreground">
											<Mail className="h-3 w-3" />
											{application.user.email}
										</div>
									</div>

									<div className="flex items-center gap-3">
										<div className="text-right">
											<p className="text-sm text-muted-foreground mb-1">
												当前等级
											</p>
											<UserLevelBadges
												user={application.user}
												size="sm"
											/>
										</div>
										<ReviewDialog
											application={application}
											onReview={handleReview}
											isLoading={reviewLoading}
										/>
									</div>
								</div>

								{/* 申请内容预览 */}
								<div className="space-y-3">
									<div>
										<p className="text-sm font-medium text-muted-foreground mb-1">
											申请理由
										</p>
										<p className="text-sm line-clamp-3">
											{application.reason}
										</p>
									</div>

									{application.evidence && (
										<div>
											<p className="text-sm font-medium text-muted-foreground mb-1">
												证明材料
											</p>
											<p className="text-sm text-blue-600 line-clamp-2 break-all">
												{application.evidence}
											</p>
										</div>
									)}
								</div>
							</div>

							{index < applications.length - 1 && (
								<Separator className="my-6" />
							)}
						</div>
					))}
				</div>
			</CardContent>
		</Card>
	);
}
