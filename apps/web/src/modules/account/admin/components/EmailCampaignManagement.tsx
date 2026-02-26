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
import { Input } from "@community/ui/ui/input";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@community/ui/ui/table";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@community/ui/ui/select";
import {
	Search,
	Plus,
	Send,
	Edit,
	Trash2,
	Eye,
	Users,
	Mail,
} from "lucide-react";
import { useEffect, useState } from "react";

interface EmailCampaign {
	id: string;
	title: string;
	description?: string;
	type: string;
	status: string;
	subject: string;
	templateId: string;
	recipientCount: number;
	sentCount: number;
	deliveredCount: number;
	openedCount: number;
	clickedCount: number;
	createdAt: string;
	sentAt?: string;
	scheduledAt?: string;
	creator: {
		name: string;
		email: string;
	};
	_count: {
		jobs: number;
	};
}

export function EmailCampaignManagement() {
	const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
	const [loading, setLoading] = useState(true);
	const [searchTerm, setSearchTerm] = useState("");
	const [statusFilter, setStatusFilter] = useState("all");
	const [typeFilter, setTypeFilter] = useState("all");
	const [pagination, setPagination] = useState({
		page: 1,
		limit: 20,
		total: 0,
		totalPages: 0,
	});

	useEffect(() => {
		fetchCampaigns();
	}, [pagination.page, statusFilter, typeFilter]);

	const fetchCampaigns = async () => {
		try {
			const params = new URLSearchParams({
				page: pagination.page.toString(),
				limit: pagination.limit.toString(),
			});

			if (statusFilter !== "all") {
				params.append("status", statusFilter);
			}
			if (typeFilter !== "all") {
				params.append("type", typeFilter);
			}

			const response = await fetch(
				`/api/admin/emails/campaigns?${params}`,
			);
			if (response.ok) {
				const data = await response.json();
				setCampaigns(data.campaigns);
				setPagination(data.pagination);
			}
		} catch (error) {
			console.error("Failed to fetch campaigns:", error);
		} finally {
			setLoading(false);
		}
	};

	const sendCampaign = async (campaignId: string) => {
		try {
			const response = await fetch(
				`/api/admin/emails/campaigns/${campaignId}/send`,
				{
					method: "POST",
				},
			);
			if (response.ok) {
				const data = await response.json();
				alert(
					`活动发送已启动，预计发送给 ${data.recipientCount} 个用户`,
				);
				fetchCampaigns();
			}
		} catch (error) {
			console.error("Failed to send campaign:", error);
			alert("发送失败");
		}
	};

	const deleteCampaign = async (campaignId: string) => {
		if (!confirm("确定要删除这个邮件活动吗？此操作无法撤销。")) {
			return;
		}

		try {
			const response = await fetch(
				`/api/admin/emails/campaigns/${campaignId}`,
				{
					method: "DELETE",
				},
			);
			if (response.ok) {
				fetchCampaigns();
			}
		} catch (error) {
			console.error("Failed to delete campaign:", error);
			alert("删除失败");
		}
	};

	const getStatusBadge = (status: string) => {
		const statusConfig = {
			DRAFT: { variant: "secondary" as const, text: "草稿" },
			SCHEDULED: { variant: "default" as const, text: "已安排" },
			SENDING: { variant: "destructive" as const, text: "发送中" },
			COMPLETED: { variant: "outline" as const, text: "已完成" },
			CANCELLED: { variant: "secondary" as const, text: "已取消" },
			FAILED: { variant: "destructive" as const, text: "失败" },
		};
		return (
			statusConfig[status as keyof typeof statusConfig] ||
			statusConfig.DRAFT
		);
	};

	const getTypeBadge = (type: string) => {
		const typeConfig = {
			NEWSLETTER: { text: "周报", color: "bg-blue-100 text-blue-800" },
			NOTIFICATION: {
				text: "通知",
				color: "bg-green-100 text-green-800",
			},
			MARKETING: { text: "营销", color: "bg-purple-100 text-purple-800" },
			SYSTEM: { text: "系统", color: "bg-red-100 text-red-800" },
			ANNOUNCEMENT: {
				text: "公告",
				color: "bg-yellow-100 text-yellow-800",
			},
		};
		const config =
			typeConfig[type as keyof typeof typeConfig] ||
			typeConfig.NOTIFICATION;
		return (
			<span
				className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}
			>
				{config.text}
			</span>
		);
	};

	const filteredCampaigns = campaigns.filter(
		(campaign) =>
			campaign.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
			campaign.subject.toLowerCase().includes(searchTerm.toLowerCase()),
	);

	if (loading) {
		return (
			<div className="p-6">
				<div className="animate-pulse space-y-6">
					<div className="h-8 bg-muted rounded w-64" />
					<div className="h-96 bg-muted rounded" />
				</div>
			</div>
		);
	}

	return (
		<div className="p-6 space-y-6">
			{/* 页面标题 */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold">邮件活动管理</h1>
					<p className="text-muted-foreground mt-2">
						创建和管理全站邮件发送活动
					</p>
				</div>
				<Button>
					<Plus className="w-4 h-4 mr-2" />
					创建活动
				</Button>
			</div>

			{/* 活动统计概览 */}
			<div className="grid grid-cols-1 md:grid-cols-4 gap-6">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							总活动数
						</CardTitle>
						<Mail className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							{pagination.total}
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							发送中
						</CardTitle>
						<Send className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold text-green-600">
							{
								campaigns.filter((c) => c.status === "SENDING")
									.length
							}
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							总发送量
						</CardTitle>
						<Users className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							{campaigns
								.reduce((sum, c) => sum + c.sentCount, 0)
								.toLocaleString()}
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							平均打开率
						</CardTitle>
						<Eye className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold text-blue-600">
							{campaigns.length > 0
								? Math.round(
										campaigns.reduce(
											(sum, c) =>
												sum +
												(c.sentCount > 0
													? (c.openedCount /
															c.sentCount) *
														100
													: 0),
											0,
										) / campaigns.length,
									)
								: 0}
							%
						</div>
					</CardContent>
				</Card>
			</div>

			{/* 活动列表 */}
			<Card>
				<CardHeader>
					<CardTitle>邮件活动列表</CardTitle>
					<CardDescription>管理您的邮件发送活动</CardDescription>
				</CardHeader>
				<CardContent>
					{/* 搜索和筛选 */}
					<div className="flex items-center space-x-4 mb-6">
						<div className="relative flex-1">
							<Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
							<Input
								placeholder="搜索活动标题或主题..."
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								className="pl-10"
							/>
						</div>
						<Select
							value={statusFilter}
							onValueChange={setStatusFilter}
						>
							<SelectTrigger className="w-32">
								<SelectValue placeholder="状态筛选" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">全部状态</SelectItem>
								<SelectItem value="DRAFT">草稿</SelectItem>
								<SelectItem value="SCHEDULED">
									已安排
								</SelectItem>
								<SelectItem value="SENDING">发送中</SelectItem>
								<SelectItem value="COMPLETED">
									已完成
								</SelectItem>
							</SelectContent>
						</Select>
						<Select
							value={typeFilter}
							onValueChange={setTypeFilter}
						>
							<SelectTrigger className="w-32">
								<SelectValue placeholder="类型筛选" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">全部类型</SelectItem>
								<SelectItem value="NEWSLETTER">周报</SelectItem>
								<SelectItem value="NOTIFICATION">
									通知
								</SelectItem>
								<SelectItem value="MARKETING">营销</SelectItem>
								<SelectItem value="SYSTEM">系统</SelectItem>
								<SelectItem value="ANNOUNCEMENT">
									公告
								</SelectItem>
							</SelectContent>
						</Select>
					</div>

					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>活动信息</TableHead>
								<TableHead>类型</TableHead>
								<TableHead>状态</TableHead>
								<TableHead>发送统计</TableHead>
								<TableHead>创建时间</TableHead>
								<TableHead>操作</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{filteredCampaigns.map((campaign) => {
								const statusConfig = getStatusBadge(
									campaign.status,
								);
								return (
									<TableRow key={campaign.id}>
										<TableCell>
											<div>
												<div className="font-medium">
													{campaign.title}
												</div>
												<div className="text-sm text-muted-foreground truncate max-w-xs">
													{campaign.subject}
												</div>
												<div className="text-xs text-muted-foreground">
													创建者:{" "}
													{campaign.creator.name}
												</div>
											</div>
										</TableCell>
										<TableCell>
											{getTypeBadge(campaign.type)}
										</TableCell>
										<TableCell>
											<Badge
												variant={statusConfig.variant}
											>
												{statusConfig.text}
											</Badge>
										</TableCell>
										<TableCell>
											<div className="text-sm">
												<div>
													发送:{" "}
													{campaign.sentCount.toLocaleString()}
												</div>
												<div>
													投递:{" "}
													{campaign.deliveredCount.toLocaleString()}
												</div>
												<div>
													打开:{" "}
													{campaign.openedCount.toLocaleString()}
												</div>
											</div>
										</TableCell>
										<TableCell>
											<div className="text-sm">
												{new Date(
													campaign.createdAt,
												).toLocaleDateString()}
											</div>
											{campaign.sentAt && (
												<div className="text-xs text-muted-foreground">
													发送:{" "}
													{new Date(
														campaign.sentAt,
													).toLocaleDateString()}
												</div>
											)}
										</TableCell>
										<TableCell>
											<div className="flex items-center space-x-2">
												<Button
													size="sm"
													variant="outline"
												>
													<Eye className="w-4 h-4" />
												</Button>
												{campaign.status ===
													"DRAFT" && (
													<>
														<Button
															size="sm"
															variant="outline"
														>
															<Edit className="w-4 h-4" />
														</Button>
														<Button
															size="sm"
															onClick={() =>
																sendCampaign(
																	campaign.id,
																)
															}
														>
															<Send className="w-4 h-4" />
														</Button>
														<Button
															size="sm"
															variant="outline"
															onClick={() =>
																deleteCampaign(
																	campaign.id,
																)
															}
														>
															<Trash2 className="w-4 h-4" />
														</Button>
													</>
												)}
											</div>
										</TableCell>
									</TableRow>
								);
							})}
						</TableBody>
					</Table>

					{/* 分页 */}
					<div className="flex items-center justify-between mt-6">
						<div className="text-sm text-muted-foreground">
							显示 {(pagination.page - 1) * pagination.limit + 1}{" "}
							-{" "}
							{Math.min(
								pagination.page * pagination.limit,
								pagination.total,
							)}
							共 {pagination.total} 项
						</div>
						<div className="flex space-x-2">
							<Button
								variant="outline"
								size="sm"
								disabled={pagination.page <= 1}
								onClick={() =>
									setPagination((prev) => ({
										...prev,
										page: prev.page - 1,
									}))
								}
							>
								上一页
							</Button>
							<Button
								variant="outline"
								size="sm"
								disabled={
									pagination.page >= pagination.totalPages
								}
								onClick={() =>
									setPagination((prev) => ({
										...prev,
										page: prev.page + 1,
									}))
								}
							>
								下一页
							</Button>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
