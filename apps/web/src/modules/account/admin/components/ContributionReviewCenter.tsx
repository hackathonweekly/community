"use client";

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@community/ui/ui/card";
import { Badge } from "@community/ui/ui/badge";
import { Button } from "@community/ui/ui/button";
import { Textarea } from "@community/ui/ui/textarea";
import {
	Clock,
	CheckCircle,
	XCircle,
	User,
	Calendar,
	FileText,
} from "lucide-react";
import { useEffect, useState } from "react";

interface Contribution {
	id: string;
	type: string;
	title: string;
	description: string | null;
	cpValue: number;
	status: "PENDING" | "APPROVED" | "REJECTED";
	evidence?: string;
	createdAt: string;
	user: {
		id: string;
		name: string;
		email: string;
	};
}

export function ContributionReviewCenter() {
	const [contributions, setContributions] = useState<Contribution[]>([]);
	const [loading, setLoading] = useState(true);
	const [reviewing, setReviewing] = useState<string | null>(null);
	const [reviewNote, setReviewNote] = useState("");
	const [filter, setFilter] = useState<
		"ALL" | "PENDING" | "APPROVED" | "REJECTED"
	>("PENDING");
	const [stats, setStats] = useState({
		pending: 0,
		approved: 0,
		rejected: 0,
		total: 0,
	});

	useEffect(() => {
		fetchStats(); // 初始化时获取统计数据
		fetchContributions();
	}, [filter]);

	useEffect(() => {
		fetchStats(); // 组件初始化时获取统计数据
	}, []);

	const fetchContributions = async () => {
		try {
			const response = await fetch(
				`/api/super-admin/contributions?status=${filter}`,
			);
			if (response.ok) {
				const data = await response.json();
				setContributions(data.contributions);
			}
		} catch (error) {
			console.error("Failed to fetch contributions:", error);
		} finally {
			setLoading(false);
		}
	};

	// 获取统计数据
	const fetchStats = async () => {
		try {
			// 获取所有状态的统计
			const [allRes, pendingRes, approvedRes, rejectedRes] =
				await Promise.all([
					fetch("/api/super-admin/contributions?status=ALL"),
					fetch("/api/super-admin/contributions?status=PENDING"),
					fetch("/api/super-admin/contributions?status=APPROVED"),
					fetch("/api/super-admin/contributions?status=REJECTED"),
				]);

			const [allData, pendingData, approvedData, rejectedData] =
				await Promise.all([
					allRes.json(),
					pendingRes.json(),
					approvedRes.json(),
					rejectedRes.json(),
				]);

			setStats({
				total: allData.contributions?.length || 0,
				pending: pendingData.contributions?.length || 0,
				approved: approvedData.contributions?.length || 0,
				rejected: rejectedData.contributions?.length || 0,
			});
		} catch (error) {
			console.error("Failed to fetch stats:", error);
		}
	};

	const handleReview = async (
		contributionId: string,
		action: "APPROVE" | "REJECT",
	) => {
		setReviewing(contributionId);
		try {
			const response = await fetch(
				`/api/super-admin/contributions/${contributionId}/review`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						action,
						note: reviewNote,
					}),
				},
			);

			if (response.ok) {
				setReviewNote("");
				fetchContributions(); // 刷新列表
				fetchStats(); // 刷新统计数据
			}
		} catch (error) {
			console.error("Failed to review contribution:", error);
		} finally {
			setReviewing(null);
		}
	};

	const getStatusBadge = (status: string) => {
		switch (status) {
			case "PENDING":
				return (
					<Badge
						variant="outline"
						className="text-orange-600 border-orange-600"
					>
						<Clock className="w-3 h-3 mr-1" />
						待审核
					</Badge>
				);
			case "APPROVED":
				return (
					<Badge
						variant="outline"
						className="text-green-600 border-green-600"
					>
						<CheckCircle className="w-3 h-3 mr-1" />
						已通过
					</Badge>
				);
			case "REJECTED":
				return (
					<Badge
						variant="outline"
						className="text-red-600 border-red-600"
					>
						<XCircle className="w-3 h-3 mr-1" />
						已拒绝
					</Badge>
				);
			default:
				return null;
		}
	};

	const getTypeLabel = (type: string) => {
		const typeLabels: Record<string, string> = {
			EVENT_CHECKIN: "活动签到",
			EVENT_FEEDBACK: "活动反馈",
			PROJECT_CREATION: "作品创建",
			PROJECT_UPDATE: "作品更新",
			PROJECT_LIKE: "作品点赞",
			COMMENT_CREATION: "评论发布",
			PROFILE_COMPLETION: "完善资料",
			VOLUNTEER_SERVICE: "志愿服务",
			MANUAL_SUBMISSION: "手动提交",
		};
		return typeLabels[type] || type;
	};

	if (loading) {
		return (
			<div className="p-6">
				<div className="animate-pulse space-y-4">
					<div className="h-8 bg-muted rounded w-64" />
					{[...Array(3)].map((_, i) => (
						<div key={i} className="h-32 bg-muted rounded" />
					))}
				</div>
			</div>
		);
	}

	return (
		<div className="p-6 space-y-6">
			{/* 页面标题和筛选 */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold">贡献审核中心</h1>
					<p className="text-muted-foreground mt-2">
						审核用户提交的贡献申请
					</p>
				</div>

				<div className="flex space-x-2">
					{["ALL", "PENDING", "APPROVED", "REJECTED"].map(
						(status) => (
							<Button
								key={status}
								variant={
									filter === status ? "default" : "outline"
								}
								size="sm"
								onClick={() => setFilter(status as any)}
							>
								{status === "ALL" && "全部"}
								{status === "PENDING" && "待审核"}
								{status === "APPROVED" && "已通过"}
								{status === "REJECTED" && "已拒绝"}
							</Button>
						),
					)}
				</div>
			</div>

			{/* 统计卡片 */}
			<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
				<Card>
					<CardContent className="pt-6">
						<div className="flex items-center space-x-2">
							<Clock className="h-4 w-4 text-orange-600" />
							<div>
								<div className="text-2xl font-bold">
									{stats.pending}
								</div>
								<div className="text-sm text-muted-foreground">
									待审核
								</div>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="pt-6">
						<div className="flex items-center space-x-2">
							<CheckCircle className="h-4 w-4 text-green-600" />
							<div>
								<div className="text-2xl font-bold">
									{stats.approved}
								</div>
								<div className="text-sm text-muted-foreground">
									已通过
								</div>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="pt-6">
						<div className="flex items-center space-x-2">
							<XCircle className="h-4 w-4 text-red-600" />
							<div>
								<div className="text-2xl font-bold">
									{stats.rejected}
								</div>
								<div className="text-sm text-muted-foreground">
									已拒绝
								</div>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="pt-6">
						<div className="flex items-center space-x-2">
							<FileText className="h-4 w-4 text-blue-600" />
							<div>
								<div className="text-2xl font-bold">
									{stats.total}
								</div>
								<div className="text-sm text-muted-foreground">
									总计
								</div>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* 贡献列表 */}
			<div className="space-y-4">
				{contributions.length === 0 ? (
					<Card>
						<CardContent className="pt-6">
							<div className="text-center text-muted-foreground">
								<FileText className="mx-auto h-12 w-12 mb-4 opacity-50" />
								<p>
									暂无{filter !== "ALL" ? "相关" : ""}贡献记录
								</p>
							</div>
						</CardContent>
					</Card>
				) : (
					contributions.map((contribution) => (
						<Card key={contribution.id}>
							<CardHeader>
								<div className="flex items-center justify-between">
									<div className="flex items-center space-x-3">
										<User className="h-5 w-5 text-muted-foreground" />
										<div>
											<CardTitle className="text-lg">
												{contribution.title}
											</CardTitle>
											<CardDescription>
												{contribution.user.name} (
												{contribution.user.email})
											</CardDescription>
										</div>
									</div>
									<div className="flex items-center space-x-2">
										{getStatusBadge(contribution.status)}
										<Badge variant="secondary">
											{contribution.cpValue}积分
										</Badge>
									</div>
								</div>
							</CardHeader>

							<CardContent className="space-y-4">
								{/* 贡献信息 */}
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div>
										<div className="text-sm font-medium mb-1">
											贡献类型
										</div>
										<div className="text-sm text-muted-foreground">
											{getTypeLabel(contribution.type)}
										</div>
									</div>
									<div>
										<div className="text-sm font-medium mb-1">
											提交时间
										</div>
										<div className="text-sm text-muted-foreground flex items-center">
											<Calendar className="h-3 w-3 mr-1" />
											{new Date(
												contribution.createdAt,
											).toLocaleString("zh-CN")}
										</div>
									</div>
								</div>

								{/* 描述 */}
								{contribution.description && (
									<div>
										<div className="text-sm font-medium mb-2">
											贡献描述
										</div>
										<div className="text-sm text-muted-foreground bg-muted p-3 rounded">
											{contribution.description}
										</div>
									</div>
								)}

								{/* 证据链接 */}
								{contribution.evidence && (
									<div>
										<div className="text-sm font-medium mb-2">
											相关证据
										</div>
										<a
											href={contribution.evidence}
											target="_blank"
											rel="noopener noreferrer"
											className="text-sm text-blue-600 hover:underline"
										>
											查看证据 →
										</a>
									</div>
								)}

								{/* 审核操作 (仅待审核状态显示) */}
								{contribution.status === "PENDING" && (
									<div className="border-t pt-4 space-y-3">
										<div>
											<label className="text-sm font-medium mb-2 block">
												审核备注
											</label>
											<Textarea
												placeholder="请输入审核意见..."
												value={reviewNote}
												onChange={(e) =>
													setReviewNote(
														e.target.value,
													)
												}
												className="min-h-[80px]"
											/>
										</div>
										<div className="flex space-x-2">
											<Button
												size="sm"
												onClick={() =>
													handleReview(
														contribution.id,
														"APPROVE",
													)
												}
												disabled={
													reviewing ===
													contribution.id
												}
												className="bg-green-600 hover:bg-green-700"
											>
												<CheckCircle className="w-4 h-4 mr-1" />
												通过
											</Button>
											<Button
												size="sm"
												variant="destructive"
												onClick={() =>
													handleReview(
														contribution.id,
														"REJECT",
													)
												}
												disabled={
													reviewing ===
													contribution.id
												}
											>
												<XCircle className="w-4 h-4 mr-1" />
												拒绝
											</Button>
										</div>
									</div>
								)}
							</CardContent>
						</Card>
					))
				)}
			</div>
		</div>
	);
}
