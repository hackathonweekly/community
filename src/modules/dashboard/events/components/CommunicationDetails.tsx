"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
	Mail,
	MessageSquare,
	CheckCircle,
	XCircle,
	Clock,
	Send,
	Users,
	Eye,
	RotateCcw,
	Download,
	Search,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";

interface CommunicationRecord {
	id: string;
	recipientId: string;
	recipientEmail?: string;
	recipientPhone?: string;
	status: "PENDING" | "SENT" | "DELIVERED" | "READ" | "FAILED" | "CANCELLED";
	sentAt?: string;
	deliveredAt?: string;
	readAt?: string;
	errorMessage?: string;
	retryCount: number;
	recipient: {
		id: string;
		name: string;
		image?: string;
		username?: string;
		email?: string;
		phoneNumber?: string;
	};
}

interface CommunicationData {
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
	};
}

interface CommunicationDetailsProps {
	communication: CommunicationData;
	records: CommunicationRecord[];
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onRetry?: (communicationId: string) => Promise<void>;
}

export function CommunicationDetails({
	communication,
	records,
	open,
	onOpenChange,
	onRetry,
}: CommunicationDetailsProps) {
	const [searchTerm, setSearchTerm] = useState("");
	const [isRetrying, setIsRetrying] = useState(false);

	const filteredRecords = records.filter((record) => {
		const searchLower = searchTerm.toLowerCase();
		return (
			record.recipient.name.toLowerCase().includes(searchLower) ||
			record.recipient.email?.toLowerCase().includes(searchLower) ||
			record.recipient.username?.toLowerCase().includes(searchLower)
		);
	});

	const handleRetry = async () => {
		if (!onRetry) return;

		setIsRetrying(true);
		try {
			await onRetry(communication.id);
		} finally {
			setIsRetrying(false);
		}
	};

	const getStatusIcon = (status: CommunicationRecord["status"]) => {
		switch (status) {
			case "PENDING":
				return <Clock className="h-4 w-4 text-yellow-500" />;
			case "SENT":
				return <Send className="h-4 w-4 text-blue-500" />;
			case "DELIVERED":
				return <CheckCircle className="h-4 w-4 text-green-500" />;
			case "READ":
				return <Eye className="h-4 w-4 text-green-600" />;
			case "FAILED":
				return <XCircle className="h-4 w-4 text-red-500" />;
			case "CANCELLED":
				return <XCircle className="h-4 w-4 text-gray-500" />;
		}
	};

	const getStatusText = (status: CommunicationRecord["status"]) => {
		switch (status) {
			case "PENDING":
				return "待发送";
			case "SENT":
				return "已发送";
			case "DELIVERED":
				return "已送达";
			case "READ":
				return "已阅读";
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
			case "SENT":
				return "bg-blue-100 text-blue-800 border-blue-200";
			case "DELIVERED":
				return "bg-green-100 text-green-800 border-green-200";
			case "READ":
				return "bg-green-100 text-green-900 border-green-300";
			case "FAILED":
				return "bg-red-100 text-red-800 border-red-200";
			case "CANCELLED":
				return "bg-gray-100 text-gray-800 border-gray-200";
		}
	};

	const getRecordsByStatus = (status: CommunicationRecord["status"]) => {
		return filteredRecords.filter((record) => record.status === status);
	};

	const successRate =
		communication.totalRecipients > 0
			? Math.round(
					(communication.deliveredCount /
						communication.totalRecipients) *
						100,
				)
			: 0;

	const failedRecords = getRecordsByStatus("FAILED");
	const canRetry = failedRecords.length > 0 && onRetry;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
				<DialogHeader>
					<div className="flex items-center space-x-3">
						{communication.type === "EMAIL" ? (
							<Mail className="h-6 w-6 text-blue-500" />
						) : (
							<MessageSquare className="h-6 w-6 text-green-500" />
						)}
						<div>
							<DialogTitle className="text-xl">
								{communication.subject}
							</DialogTitle>
							<DialogDescription className="mt-1">
								{communication.type === "EMAIL"
									? "邮件"
									: "短信"}
								通信详情 · 发送者：{communication.sender.name} ·
								{format(
									new Date(communication.createdAt),
									"yyyy年MM月dd日 HH:mm",
									{ locale: zhCN },
								)}
							</DialogDescription>
						</div>
					</div>
				</DialogHeader>

				<div className="space-y-6">
					{/* 统计概览 */}
					<Card>
						<CardHeader className="pb-3">
							<div className="flex items-center justify-between">
								<CardTitle className="text-base">
									发送统计
								</CardTitle>
								{canRetry && (
									<Button
										size="sm"
										variant="outline"
										onClick={handleRetry}
										disabled={isRetrying}
									>
										<RotateCcw className="h-4 w-4 mr-2" />
										{isRetrying
											? "重试中..."
											: `重试失败项 (${failedRecords.length})`}
									</Button>
								)}
							</div>
						</CardHeader>
						<CardContent>
							<div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
								<div className="text-center">
									<div className="text-2xl font-bold text-gray-900">
										{communication.totalRecipients}
									</div>
									<div className="text-sm text-gray-500">
										总接收人
									</div>
								</div>
								<div className="text-center">
									<div className="text-2xl font-bold text-blue-600">
										{communication.sentCount}
									</div>
									<div className="text-sm text-gray-500">
										已发送
									</div>
								</div>
								<div className="text-center">
									<div className="text-2xl font-bold text-green-600">
										{communication.deliveredCount}
									</div>
									<div className="text-sm text-gray-500">
										送达成功
									</div>
								</div>
								<div className="text-center">
									<div className="text-2xl font-bold text-red-600">
										{communication.failedCount}
									</div>
									<div className="text-sm text-gray-500">
										发送失败
									</div>
								</div>
							</div>

							{/* 成功率 */}
							<div className="space-y-2">
								<div className="flex justify-between text-sm">
									<span>发送成功率</span>
									<span
										className={`font-medium ${
											successRate >= 90
												? "text-green-600"
												: successRate >= 70
													? "text-yellow-600"
													: "text-red-600"
										}`}
									>
										{successRate}%
									</span>
								</div>
								<Progress value={successRate} className="h-2" />
							</div>
						</CardContent>
					</Card>

					{/* 消息内容预览 */}
					<Card>
						<CardHeader>
							<CardTitle className="text-base">
								消息内容
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="bg-gray-50 p-4 rounded-md">
								<div className="font-medium mb-2">
									{communication.subject}
								</div>
								<div className="text-gray-700 whitespace-pre-wrap">
									{communication.content}
								</div>
							</div>
						</CardContent>
					</Card>

					{/* 发送记录 */}
					<Card>
						<CardHeader>
							<div className="flex items-center justify-between">
								<CardTitle className="text-base">
									发送记录
								</CardTitle>
								<div className="flex items-center space-x-2">
									<div className="relative">
										<Search className="absolute left-3 top-1/2 h-4 w-4 transform -translate-y-1/2 text-gray-400" />
										<Input
											placeholder="搜索用户..."
											value={searchTerm}
											onChange={(e) =>
												setSearchTerm(e.target.value)
											}
											className="pl-10 w-64"
										/>
									</div>
									<Button size="sm" variant="outline">
										<Download className="h-4 w-4 mr-2" />
										导出
									</Button>
								</div>
							</div>
						</CardHeader>
						<CardContent>
							<Tabs defaultValue="all" className="w-full">
								<TabsList className="grid w-full grid-cols-6">
									<TabsTrigger
										value="all"
										className="text-xs"
									>
										全部 ({filteredRecords.length})
									</TabsTrigger>
									<TabsTrigger
										value="delivered"
										className="text-xs"
									>
										成功 (
										{getRecordsByStatus("DELIVERED").length}
										)
									</TabsTrigger>
									<TabsTrigger
										value="sent"
										className="text-xs"
									>
										已发送 (
										{getRecordsByStatus("SENT").length})
									</TabsTrigger>
									<TabsTrigger
										value="failed"
										className="text-xs"
									>
										失败 (
										{getRecordsByStatus("FAILED").length})
									</TabsTrigger>
									<TabsTrigger
										value="pending"
										className="text-xs"
									>
										待发送 (
										{getRecordsByStatus("PENDING").length})
									</TabsTrigger>
									<TabsTrigger
										value="read"
										className="text-xs"
									>
										已读 (
										{getRecordsByStatus("READ").length})
									</TabsTrigger>
								</TabsList>

								<div className="mt-4 max-h-96 overflow-y-auto">
									<TabsContent value="all">
										<RecordList records={filteredRecords} />
									</TabsContent>
									<TabsContent value="delivered">
										<RecordList
											records={getRecordsByStatus(
												"DELIVERED",
											)}
										/>
									</TabsContent>
									<TabsContent value="sent">
										<RecordList
											records={getRecordsByStatus("SENT")}
										/>
									</TabsContent>
									<TabsContent value="failed">
										<RecordList
											records={getRecordsByStatus(
												"FAILED",
											)}
										/>
									</TabsContent>
									<TabsContent value="pending">
										<RecordList
											records={getRecordsByStatus(
												"PENDING",
											)}
										/>
									</TabsContent>
									<TabsContent value="read">
										<RecordList
											records={getRecordsByStatus("READ")}
										/>
									</TabsContent>
								</div>
							</Tabs>
						</CardContent>
					</Card>
				</div>
			</DialogContent>
		</Dialog>
	);

	function RecordList({ records }: { records: CommunicationRecord[] }) {
		if (records.length === 0) {
			return (
				<div className="text-center py-8 text-gray-500">
					<Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
					<p>暂无记录</p>
				</div>
			);
		}

		return (
			<div className="space-y-2">
				{records.map((record) => (
					<div
						key={record.id}
						className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
					>
						<div className="flex items-center space-x-3">
							<Avatar className="h-8 w-8">
								<AvatarImage src={record.recipient.image} />
								<AvatarFallback className="text-xs">
									{record.recipient.name.charAt(0)}
								</AvatarFallback>
							</Avatar>
							<div className="min-w-0">
								<div className="font-medium text-sm truncate">
									{record.recipient.name}
									{record.recipient.username && (
										<span className="text-gray-500 ml-1">
											@{record.recipient.username}
										</span>
									)}
								</div>
								<div className="text-xs text-gray-500 truncate">
									{communication.type === "EMAIL"
										? record.recipientEmail
										: record.recipientPhone}
								</div>
							</div>
						</div>

						<div className="flex items-center space-x-3">
							{record.retryCount > 0 && (
								<Badge variant="outline" className="text-xs">
									重试 {record.retryCount} 次
								</Badge>
							)}
							<Badge
								variant="outline"
								className={`text-xs ${getStatusColor(record.status)}`}
							>
								{getStatusIcon(record.status)}
								<span className="ml-1">
									{getStatusText(record.status)}
								</span>
							</Badge>
							{record.sentAt && (
								<div className="text-xs text-gray-500 min-w-0">
									{format(new Date(record.sentAt), "HH:mm", {
										locale: zhCN,
									})}
								</div>
							)}
						</div>

						{record.errorMessage && (
							<div
								className="text-xs text-red-600 max-w-xs truncate ml-2"
								title={record.errorMessage}
							>
								{record.errorMessage}
							</div>
						)}
					</div>
				))}
			</div>
		);
	}
}
