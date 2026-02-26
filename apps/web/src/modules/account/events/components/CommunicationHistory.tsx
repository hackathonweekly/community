"use client";

import { useState } from "react";
import { Button } from "@community/ui/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@community/ui/ui/card";
import { Badge } from "@community/ui/ui/badge";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@community/ui/ui/alert-dialog";
import {
	Mail,
	MessageSquare,
	Send,
	Clock,
	CheckCircle,
	XCircle,
	RotateCcw,
	Users,
} from "lucide-react";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";

interface CommunicationRecord {
	id: string;
	type: "EMAIL" | "SMS";
	subject: string;
	content: string;
	status: "PENDING" | "SENDING" | "COMPLETED" | "FAILED" | "CANCELLED";
	totalRecipients: number;
	sentCount: number;
	deliveredCount: number;
	failedCount: number;
	createdAt: string;
	sentAt?: string;
	sender: {
		id: string;
		name: string;
		image?: string;
		username?: string;
	};
}

interface CommunicationHistoryProps {
	eventId: string;
	communications: CommunicationRecord[];
	canRetry?: boolean;
	onRetry?: (communicationId: string) => Promise<void>;
	onViewDetails?: (communication: CommunicationRecord) => void;
}

export function CommunicationHistory({
	eventId,
	communications,
	canRetry = false,
	onRetry,
	onViewDetails,
}: CommunicationHistoryProps) {
	const [retryingId, setRetryingId] = useState<string | null>(null);
	const [confirmRetry, setConfirmRetry] = useState<string | null>(null);

	const handleRetry = async (communicationId: string) => {
		if (!onRetry) return;

		setRetryingId(communicationId);
		try {
			await onRetry(communicationId);
		} finally {
			setRetryingId(null);
			setConfirmRetry(null);
		}
	};

	const getStatusIcon = (status: CommunicationRecord["status"]) => {
		switch (status) {
			case "PENDING":
				return <Clock className="h-4 w-4 text-yellow-500" />;
			case "SENDING":
				return <Send className="h-4 w-4 text-blue-500 animate-pulse" />;
			case "COMPLETED":
				return <CheckCircle className="h-4 w-4 text-green-500" />;
			case "FAILED":
				return <XCircle className="h-4 w-4 text-red-500" />;
			case "CANCELLED":
				return <XCircle className="h-4 w-4 text-muted-foreground" />;
		}
	};

	const getStatusText = (status: CommunicationRecord["status"]) => {
		switch (status) {
			case "PENDING":
				return "待发送";
			case "SENDING":
				return "发送中";
			case "COMPLETED":
				return "已完成";
			case "FAILED":
				return "发送失败";
			case "CANCELLED":
				return "已取消";
		}
	};

	const getStatusColor = (status: CommunicationRecord["status"]) => {
		switch (status) {
			case "PENDING":
				return "bg-yellow-100 text-yellow-800 border-yellow-200";
			case "SENDING":
				return "bg-blue-100 text-blue-800 border-blue-200";
			case "COMPLETED":
				return "bg-green-100 text-green-800 border-green-200";
			case "FAILED":
				return "bg-red-100 text-red-800 border-red-200";
			case "CANCELLED":
				return "bg-muted text-foreground border-border";
		}
	};

	const getSuccessRate = (comm: CommunicationRecord) => {
		if (comm.totalRecipients === 0) return 0;
		return Math.round((comm.deliveredCount / comm.totalRecipients) * 100);
	};

	if (communications.length === 0) {
		return (
			<Card>
				<CardContent className="p-8 text-center">
					<div className="flex flex-col items-center space-y-4">
						<div className="p-3 bg-muted rounded-full">
							<MessageSquare className="h-8 w-8 text-muted-foreground" />
						</div>
						<div>
							<h3 className="text-lg font-medium text-foreground mb-1">
								暂无通信记录
							</h3>
							<p className="text-muted-foreground">
								还没有向参与者发送过任何消息
							</p>
						</div>
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<div className="space-y-4">
			{communications.map((comm) => (
				<Card
					key={comm.id}
					className="hover:shadow-md transition-shadow"
				>
					<CardHeader className="pb-3">
						<div className="flex items-start justify-between">
							<div className="flex items-start space-x-3">
								<div className="flex-shrink-0 mt-1">
									{comm.type === "EMAIL" ? (
										<Mail className="h-5 w-5 text-blue-500" />
									) : (
										<MessageSquare className="h-5 w-5 text-green-500" />
									)}
								</div>
								<div className="flex-1 min-w-0">
									<div className="flex items-center space-x-2 mb-1">
										<CardTitle className="text-base truncate">
											{comm.subject}
										</CardTitle>
										<Badge
											variant="outline"
											className={`text-xs ${getStatusColor(comm.status)}`}
										>
											{getStatusIcon(comm.status)}
											<span className="ml-1">
												{getStatusText(comm.status)}
											</span>
										</Badge>
									</div>
									<CardDescription className="text-sm">
										由 {comm.sender.name} 发送于{" "}
										{format(
											new Date(comm.createdAt),
											"yyyy年MM月dd日 HH:mm",
											{ locale: zhCN },
										)}
									</CardDescription>
								</div>
							</div>
							<div className="flex items-center space-x-2">
								{canRetry &&
									comm.status === "FAILED" &&
									comm.failedCount > 0 && (
										<Button
											size="sm"
											variant="outline"
											onClick={() =>
												setConfirmRetry(comm.id)
											}
											disabled={retryingId === comm.id}
											className="text-xs"
										>
											<RotateCcw className="h-3 w-3 mr-1" />
											重试失败
										</Button>
									)}
								<Button
									size="sm"
									variant="ghost"
									onClick={() => onViewDetails?.(comm)}
									className="text-xs"
								>
									查看详情
								</Button>
							</div>
						</div>
					</CardHeader>
					<CardContent className="pt-0">
						<div className="space-y-3">
							{/* 内容预览 */}
							<div className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
								<p className="line-clamp-2">{comm.content}</p>
							</div>

							{/* 发送统计 */}
							<div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
								<div className="flex items-center space-x-2">
									<Users className="h-4 w-4 text-muted-foreground" />
									<div>
										<div className="font-medium">
											{comm.totalRecipients}
										</div>
										<div className="text-muted-foreground">
											总接收人
										</div>
									</div>
								</div>
								<div className="flex items-center space-x-2">
									<Send className="h-4 w-4 text-blue-400" />
									<div>
										<div className="font-medium">
											{comm.sentCount}
										</div>
										<div className="text-muted-foreground">
											已发送
										</div>
									</div>
								</div>
								<div className="flex items-center space-x-2">
									<CheckCircle className="h-4 w-4 text-green-400" />
									<div>
										<div className="font-medium">
											{comm.deliveredCount}
										</div>
										<div className="text-muted-foreground">
											送达成功
										</div>
									</div>
								</div>
								<div className="flex items-center space-x-2">
									<XCircle className="h-4 w-4 text-red-400" />
									<div>
										<div className="font-medium">
											{comm.failedCount}
										</div>
										<div className="text-muted-foreground">
											发送失败
										</div>
									</div>
								</div>
							</div>

							{/* 成功率 */}
							{comm.status === "COMPLETED" && (
								<div className="flex items-center justify-between text-sm">
									<span className="text-muted-foreground">
										发送成功率
									</span>
									<span
										className={`font-medium ${
											getSuccessRate(comm) >= 90
												? "text-green-600"
												: getSuccessRate(comm) >= 70
													? "text-yellow-600"
													: "text-red-600"
										}`}
									>
										{getSuccessRate(comm)}%
									</span>
								</div>
							)}

							{/* 发送时间 */}
							{comm.sentAt && (
								<div className="text-xs text-muted-foreground">
									发送完成时间：
									{format(
										new Date(comm.sentAt),
										"yyyy年MM月dd日 HH:mm",
										{ locale: zhCN },
									)}
								</div>
							)}
						</div>
					</CardContent>
				</Card>
			))}

			{/* 重试确认对话框 */}
			<AlertDialog
				open={!!confirmRetry}
				onOpenChange={() => setConfirmRetry(null)}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>确认重试发送</AlertDialogTitle>
						<AlertDialogDescription>
							这将重新尝试发送失败的消息。确定要继续吗？
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>取消</AlertDialogCancel>
						<AlertDialogAction
							onClick={() =>
								confirmRetry && handleRetry(confirmRetry)
							}
							disabled={retryingId !== null}
						>
							{retryingId ? "重试中..." : "确认重试"}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
