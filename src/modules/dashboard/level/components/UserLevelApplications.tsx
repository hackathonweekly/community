"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getLevelTypeName, getFullLevelName } from "@/lib/level-utils";
import type { LevelApplication, LevelApplicationStatus } from "@prisma/client";
import {
	Clock,
	CheckCircle2,
	XCircle,
	Calendar,
	User as UserIcon,
} from "lucide-react";
import { useState, useEffect } from "react";

interface ApplicationWithReviewer extends LevelApplication {
	reviewer?: {
		id: string;
		name: string;
		username: string | null;
	} | null;
}

const getStatusColor = (status: LevelApplicationStatus) => {
	switch (status) {
		case "PENDING":
			return "bg-yellow-100 text-yellow-800 border-yellow-200";
		case "APPROVED":
			return "bg-green-100 text-green-800 border-green-200";
		case "REJECTED":
			return "bg-red-100 text-red-800 border-red-200";
		case "CANCELLED":
			return "bg-gray-100 text-gray-800 border-gray-200";
		default:
			return "bg-gray-100 text-gray-800 border-gray-200";
	}
};

const getStatusIcon = (status: LevelApplicationStatus) => {
	switch (status) {
		case "PENDING":
			return <Clock className="h-4 w-4" />;
		case "APPROVED":
			return <CheckCircle2 className="h-4 w-4" />;
		case "REJECTED":
			return <XCircle className="h-4 w-4" />;
		case "CANCELLED":
			return <XCircle className="h-4 w-4" />;
		default:
			return <Clock className="h-4 w-4" />;
	}
};

const getStatusText = (status: LevelApplicationStatus) => {
	switch (status) {
		case "PENDING":
			return "待审核";
		case "APPROVED":
			return "已批准";
		case "REJECTED":
			return "已拒绝";
		case "CANCELLED":
			return "已取消";
		default:
			return "未知状态";
	}
};

export function UserLevelApplications() {
	const [applications, setApplications] = useState<ApplicationWithReviewer[]>(
		[],
	);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		fetchApplications();
	}, []);

	const fetchApplications = async () => {
		try {
			setLoading(true);
			const response = await fetch("/api/level/applications");
			const result = await response.json();

			if (result.success) {
				setApplications(result.applications);
			}
		} catch (error) {
			console.error("获取申请记录失败:", error);
		} finally {
			setLoading(false);
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
					<CardTitle>我的申请记录</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="flex items-center justify-center py-8">
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
					<CardTitle>我的申请记录</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="text-center py-8">
						<UserIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
						<p className="text-muted-foreground">
							您还没有提交过等级申请
						</p>
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>我的申请记录</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="space-y-4">
					{applications.map((application, index) => (
						<div key={application.id}>
							<div className="p-4 border rounded-lg space-y-3">
								{/* 申请头部信息 */}
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-3">
										<Badge
											className={getStatusColor(
												application.status,
											)}
										>
											{getStatusIcon(application.status)}
											{getStatusText(application.status)}
										</Badge>
										<span className="font-medium">
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

								{/* 申请详情 */}
								<div className="space-y-2">
									<div>
										<p className="text-sm font-medium text-muted-foreground">
											申请理由
										</p>
										<p className="text-sm mt-1">
											{application.reason}
										</p>
									</div>

									{application.evidence && (
										<div>
											<p className="text-sm font-medium text-muted-foreground">
												证明材料
											</p>
											<p className="text-sm mt-1 text-blue-600 break-all">
												{application.evidence}
											</p>
										</div>
									)}

									{/* 审核信息 */}
									{(application.reviewedAt ||
										application.reviewNote) && (
										<div className="mt-3 pt-3 border-t">
											<div className="flex items-center justify-between mb-2">
												<p className="text-sm font-medium text-muted-foreground">
													审核信息
												</p>
												{application.reviewedAt && (
													<span className="text-xs text-muted-foreground">
														{formatDate(
															application.reviewedAt.toString(),
														)}
													</span>
												)}
											</div>

											{application.reviewer && (
												<p className="text-xs text-muted-foreground mb-1">
													审核人:{" "}
													{application.reviewer.name}
												</p>
											)}

											{application.reviewNote && (
												<p className="text-sm">
													{application.reviewNote}
												</p>
											)}
										</div>
									)}
								</div>
							</div>

							{index < applications.length - 1 && (
								<Separator className="my-4" />
							)}
						</div>
					))}
				</div>
			</CardContent>
		</Card>
	);
}
