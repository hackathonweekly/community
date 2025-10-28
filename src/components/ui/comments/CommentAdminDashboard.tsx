"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useCallback, useEffect, useState } from "react";

import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { UserAvatar } from "@/components/shared/UserAvatar";
import type { CommentEntityType, CommentStatus } from "@prisma/client";
import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";
import {
	AlertTriangle,
	CheckCircle,
	Eye,
	EyeOff,
	MessageCircle,
	MoreHorizontal,
	RefreshCw,
	Search,
	Settings,
	Trash2,
	XCircle,
} from "lucide-react";
import { toast } from "sonner";

interface CommentAdminData {
	id: string;
	content: string;
	entityType: CommentEntityType;
	entityId: string;
	status: CommentStatus;
	isDeleted: boolean;
	likeCount: number;
	replyCount: number;
	createdAt: string;
	updatedAt: string;
	deletedAt?: string;
	user: {
		id: string;
		name: string;
		username?: string;
		email: string;
		image?: string;
	};
	deleter?: {
		id: string;
		name: string;
		username?: string;
	};
}

interface CommentFilter {
	status?: CommentStatus;
	entityType?: CommentEntityType;
	isDeleted?: boolean;
	userId?: string;
	search?: string;
}

interface CommentConfig {
	enabled: boolean;
	requireApproval: boolean;
	maxLength: number;
	allowAnonymous: boolean;
	rateLimit: number;
}

interface CommentStats {
	total: number;
	active: number;
	hidden: number;
	reviewing: number;
	rejected: number;
	deleted: number;
}

export function CommentAdminDashboard() {
	const [comments, setComments] = useState<CommentAdminData[]>([]);
	const [stats, setStats] = useState<CommentStats | null>(null);
	const [config, setConfig] = useState<CommentConfig | null>(null);
	const [loading, setLoading] = useState(true);
	const [submitting, setSubmitting] = useState(false);

	// 筛选和搜索
	const [filters, setFilters] = useState<CommentFilter>({});
	const [searchTerm, setSearchTerm] = useState("");
	const [page, setPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);

	// 对话框状态
	const [showConfigDialog, setShowConfigDialog] = useState(false);
	const [showDetailDialog, setShowDetailDialog] = useState(false);
	const [selectedComment, setSelectedComment] =
		useState<CommentAdminData | null>(null);

	// 批量操作
	const [selectedComments, setSelectedComments] = useState<Set<string>>(
		new Set(),
	);

	// API 调用
	const apiCall = useCallback(
		async (url: string, options: RequestInit = {}) => {
			const response = await fetch(url, {
				headers: {
					"Content-Type": "application/json",
					...options.headers,
				},
				...options,
			});

			if (!response.ok) {
				const errorData = await response
					.json()
					.catch(() => ({ error: "网络错误" }));
				throw new Error(errorData.error || `HTTP ${response.status}`);
			}

			return response.json();
		},
		[],
	);

	// 加载评论列表
	const loadComments = useCallback(async () => {
		try {
			setLoading(true);

			const params = new URLSearchParams();
			params.append("page", page.toString());
			params.append("limit", "20");

			// 添加筛选参数
			Object.entries(filters).forEach(([key, value]) => {
				if (value !== undefined && value !== null && value !== "") {
					params.append(key, value.toString());
				}
			});

			// 添加搜索参数
			if (searchTerm) {
				params.append("search", searchTerm);
			}

			const response = await apiCall(`/api/admin/comments?${params}`);
			setComments(response.comments);
			setTotalPages(response.pagination.totalPages);
		} catch (error) {
			console.error("加载评论失败:", error);
			toast.error("加载评论失败");
		} finally {
			setLoading(false);
		}
	}, [page, filters, searchTerm, apiCall]);

	// 加载统计数据
	const loadStats = useCallback(async () => {
		try {
			const response = await apiCall("/api/admin/comments/stats");
			setStats(response);
		} catch (error) {
			console.error("加载统计失败:", error);
		}
	}, [apiCall]);

	// 加载配置
	const loadConfig = useCallback(async () => {
		try {
			const response = await apiCall("/api/admin/comments/config");
			setConfig(response);
		} catch (error) {
			console.error("加载配置失败:", error);
		}
	}, [apiCall]);

	// 初始化
	useEffect(() => {
		loadComments();
		loadStats();
		loadConfig();
	}, [loadComments, loadStats, loadConfig]);

	// 更新评论状态
	const updateCommentStatus = useCallback(
		async (commentIds: string[], status: CommentStatus) => {
			try {
				setSubmitting(true);
				await apiCall("/api/admin/comments/batch-update", {
					method: "POST",
					body: JSON.stringify({ commentIds, status }),
				});

				await loadComments();
				await loadStats();
				toast.success("操作成功");
			} catch (error) {
				console.error("更新状态失败:", error);
				toast.error("操作失败");
			} finally {
				setSubmitting(false);
			}
		},
		[apiCall, loadComments, loadStats],
	);

	// 删除评论
	const deleteComments = useCallback(
		async (commentIds: string[]) => {
			try {
				setSubmitting(true);
				await apiCall("/api/admin/comments/batch-delete", {
					method: "POST",
					body: JSON.stringify({ commentIds }),
				});

				await loadComments();
				await loadStats();
				toast.success("删除成功");
			} catch (error) {
				console.error("删除失败:", error);
				toast.error("删除失败");
			} finally {
				setSubmitting(false);
			}
		},
		[apiCall, loadComments, loadStats],
	);

	// 更新配置
	const updateConfig = useCallback(
		async (newConfig: CommentConfig) => {
			try {
				setSubmitting(true);
				await apiCall("/api/admin/comments/config", {
					method: "POST",
					body: JSON.stringify(newConfig),
				});

				setConfig(newConfig);
				setShowConfigDialog(false);
				toast.success("配置已更新");
			} catch (error) {
				console.error("更新配置失败:", error);
				toast.error("更新配置失败");
			} finally {
				setSubmitting(false);
			}
		},
		[apiCall],
	);

	// 状态标识
	const getStatusBadge = (status: CommentStatus, isDeleted: boolean) => {
		if (isDeleted) {
			return <Badge variant="destructive">已删除</Badge>;
		}

		switch (status) {
			case "ACTIVE":
				return <Badge variant="default">正常</Badge>;
			case "HIDDEN":
				return <Badge variant="secondary">隐藏</Badge>;
			case "REVIEWING":
				return <Badge variant="outline">审核中</Badge>;
			case "REJECTED":
				return <Badge variant="destructive">已拒绝</Badge>;
			default:
				return <Badge variant="outline">{status}</Badge>;
		}
	};

	// 实体类型标识
	const getEntityTypeBadge = (entityType: CommentEntityType) => {
		const typeMap = {
			PROJECT: { label: "作品", variant: "default" as const },
			EVENT: { label: "活动", variant: "secondary" as const },
			TASK: { label: "任务", variant: "outline" as const },
			ARTICLE: { label: "文章", variant: "default" as const },
			ORGANIZATION: { label: "组织", variant: "secondary" as const },
		};

		const type = typeMap[entityType] || {
			label: entityType,
			variant: "outline" as const,
		};
		return <Badge variant={type.variant}>{type.label}</Badge>;
	};

	return (
		<div className="space-y-6">
			{/* 页面标题和统计 */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold">评论管理</h1>
					<p className="text-muted-foreground">管理和审核用户评论</p>
				</div>

				<div className="flex gap-2">
					<Button
						variant="outline"
						onClick={() => setShowConfigDialog(true)}
					>
						<Settings className="h-4 w-4 mr-2" />
						系统设置
					</Button>
					<Button
						variant="outline"
						onClick={() => {
							loadComments();
							loadStats();
							loadConfig();
						}}
					>
						<RefreshCw className="h-4 w-4 mr-2" />
						刷新
					</Button>
				</div>
			</div>

			{/* 统计卡片 */}
			{stats && (
				<div className="grid grid-cols-2 md:grid-cols-6 gap-4">
					<Card>
						<CardContent className="p-4">
							<div className="flex items-center gap-2">
								<MessageCircle className="h-4 w-4 text-muted-foreground" />
								<div>
									<p className="text-2xl font-bold">
										{stats.total}
									</p>
									<p className="text-xs text-muted-foreground">
										总评论
									</p>
								</div>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardContent className="p-4">
							<div className="flex items-center gap-2">
								<CheckCircle className="h-4 w-4 text-green-500" />
								<div>
									<p className="text-2xl font-bold">
										{stats.active}
									</p>
									<p className="text-xs text-muted-foreground">
										正常
									</p>
								</div>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardContent className="p-4">
							<div className="flex items-center gap-2">
								<EyeOff className="h-4 w-4 text-yellow-500" />
								<div>
									<p className="text-2xl font-bold">
										{stats.hidden}
									</p>
									<p className="text-xs text-muted-foreground">
										隐藏
									</p>
								</div>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardContent className="p-4">
							<div className="flex items-center gap-2">
								<AlertTriangle className="h-4 w-4 text-orange-500" />
								<div>
									<p className="text-2xl font-bold">
										{stats.reviewing}
									</p>
									<p className="text-xs text-muted-foreground">
										待审核
									</p>
								</div>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardContent className="p-4">
							<div className="flex items-center gap-2">
								<XCircle className="h-4 w-4 text-red-500" />
								<div>
									<p className="text-2xl font-bold">
										{stats.rejected}
									</p>
									<p className="text-xs text-muted-foreground">
										已拒绝
									</p>
								</div>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardContent className="p-4">
							<div className="flex items-center gap-2">
								<Trash2 className="h-4 w-4 text-gray-500" />
								<div>
									<p className="text-2xl font-bold">
										{stats.deleted}
									</p>
									<p className="text-xs text-muted-foreground">
										已删除
									</p>
								</div>
							</div>
						</CardContent>
					</Card>
				</div>
			)}

			{/* 筛选器 */}
			<Card>
				<CardContent className="p-4">
					<div className="flex flex-wrap gap-4">
						<div className="flex-1 min-w-[200px]">
							<Input
								placeholder="搜索评论内容或用户..."
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								className="w-full"
							/>
						</div>

						<Select
							value={filters.status || "all"}
							onValueChange={(value) =>
								setFilters((prev) => ({
									...prev,
									status:
										value === "all"
											? undefined
											: (value as CommentStatus),
								}))
							}
						>
							<SelectTrigger className="w-[120px]">
								<SelectValue placeholder="状态" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">全部状态</SelectItem>
								<SelectItem value="ACTIVE">正常</SelectItem>
								<SelectItem value="HIDDEN">隐藏</SelectItem>
								<SelectItem value="REVIEWING">
									审核中
								</SelectItem>
								<SelectItem value="REJECTED">已拒绝</SelectItem>
							</SelectContent>
						</Select>

						<Select
							value={filters.entityType || "all"}
							onValueChange={(value) =>
								setFilters((prev) => ({
									...prev,
									entityType:
										value === "all"
											? undefined
											: (value as CommentEntityType),
								}))
							}
						>
							<SelectTrigger className="w-[120px]">
								<SelectValue placeholder="类型" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">全部类型</SelectItem>
								<SelectItem value="PROJECT">作品</SelectItem>
								<SelectItem value="EVENT">活动</SelectItem>
								<SelectItem value="TASK">任务</SelectItem>
								<SelectItem value="ARTICLE">文章</SelectItem>
							</SelectContent>
						</Select>

						<Button variant="outline" onClick={loadComments}>
							<Search className="h-4 w-4 mr-2" />
							搜索
						</Button>
					</div>
				</CardContent>
			</Card>

			{/* 批量操作 */}
			{selectedComments.size > 0 && (
				<Card>
					<CardContent className="p-4">
						<div className="flex items-center gap-4">
							<span className="text-sm text-muted-foreground">
								已选择 {selectedComments.size} 条评论
							</span>

							<div className="flex gap-2">
								<Button
									size="sm"
									variant="outline"
									onClick={() =>
										updateCommentStatus(
											Array.from(selectedComments),
											"ACTIVE",
										)
									}
									disabled={submitting}
								>
									<CheckCircle className="h-4 w-4 mr-1" />
									批准
								</Button>

								<Button
									size="sm"
									variant="outline"
									onClick={() =>
										updateCommentStatus(
											Array.from(selectedComments),
											"HIDDEN",
										)
									}
									disabled={submitting}
								>
									<EyeOff className="h-4 w-4 mr-1" />
									隐藏
								</Button>

								<Button
									size="sm"
									variant="outline"
									onClick={() =>
										updateCommentStatus(
											Array.from(selectedComments),
											"REJECTED",
										)
									}
									disabled={submitting}
								>
									<XCircle className="h-4 w-4 mr-1" />
									拒绝
								</Button>

								<Button
									size="sm"
									variant="destructive"
									onClick={() =>
										deleteComments(
											Array.from(selectedComments),
										)
									}
									disabled={submitting}
								>
									<Trash2 className="h-4 w-4 mr-1" />
									删除
								</Button>
							</div>

							<Button
								size="sm"
								variant="ghost"
								onClick={() => setSelectedComments(new Set())}
							>
								取消选择
							</Button>
						</div>
					</CardContent>
				</Card>
			)}

			{/* 评论列表 */}
			<Card>
				<CardContent className="p-0">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead className="w-[50px]">
									<input
										type="checkbox"
										checked={
											selectedComments.size ===
												comments.length &&
											comments.length > 0
										}
										onChange={(e) => {
											if (e.target.checked) {
												setSelectedComments(
													new Set(
														comments.map(
															(c) => c.id,
														),
													),
												);
											} else {
												setSelectedComments(new Set());
											}
										}}
									/>
								</TableHead>
								<TableHead>用户</TableHead>
								<TableHead>内容</TableHead>
								<TableHead>类型</TableHead>
								<TableHead>状态</TableHead>
								<TableHead>统计</TableHead>
								<TableHead>时间</TableHead>
								<TableHead className="w-[80px]">操作</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{loading ? (
								Array.from({ length: 5 }).map((_, i) => (
									<TableRow key={i}>
										<TableCell colSpan={8}>
											<div className="flex items-center space-x-4">
												<div className="h-8 w-8 bg-muted rounded-full animate-pulse" />
												<div className="space-y-2 flex-1">
													<div className="h-4 bg-muted rounded animate-pulse" />
													<div className="h-3 bg-muted rounded w-3/4 animate-pulse" />
												</div>
											</div>
										</TableCell>
									</TableRow>
								))
							) : comments.length === 0 ? (
								<TableRow>
									<TableCell
										colSpan={8}
										className="text-center py-8 text-muted-foreground"
									>
										暂无评论数据
									</TableCell>
								</TableRow>
							) : (
								comments.map((comment) => (
									<TableRow key={comment.id}>
										<TableCell>
											<input
												type="checkbox"
												checked={selectedComments.has(
													comment.id,
												)}
												onChange={(e) => {
													const newSelected = new Set(
														selectedComments,
													);
													if (e.target.checked) {
														newSelected.add(
															comment.id,
														);
													} else {
														newSelected.delete(
															comment.id,
														);
													}
													setSelectedComments(
														newSelected,
													);
												}}
											/>
										</TableCell>

										<TableCell>
											<div className="flex items-center space-x-2">
												<UserAvatar
													name={comment.user.name}
													avatarUrl={
														comment.user.image
													}
													className="h-6 w-6"
												/>
												<div className="min-w-0">
													<p className="text-sm font-medium truncate">
														{comment.user.name}
													</p>
													{comment.user.username && (
														<p className="text-xs text-muted-foreground truncate">
															@
															{
																comment.user
																	.username
															}
														</p>
													)}
												</div>
											</div>
										</TableCell>

										<TableCell className="max-w-[300px]">
											<p className="text-sm truncate">
												{comment.content}
											</p>
										</TableCell>

										<TableCell>
											{getEntityTypeBadge(
												comment.entityType,
											)}
										</TableCell>

										<TableCell>
											{getStatusBadge(
												comment.status,
												comment.isDeleted,
											)}
										</TableCell>

										<TableCell>
											<div className="text-xs text-muted-foreground">
												<div>❤️ {comment.likeCount}</div>
												<div>
													💬 {comment.replyCount}
												</div>
											</div>
										</TableCell>

										<TableCell>
											<div className="text-xs text-muted-foreground">
												<div>
													{formatDistanceToNow(
														new Date(
															comment.createdAt,
														),
														{
															addSuffix: true,
															locale: zhCN,
														},
													)}
												</div>
												{comment.deletedAt && (
													<div className="text-red-500">
														删除于{" "}
														{formatDistanceToNow(
															new Date(
																comment.deletedAt,
															),
															{
																addSuffix: true,
																locale: zhCN,
															},
														)}
													</div>
												)}
											</div>
										</TableCell>

										<TableCell>
											<DropdownMenu>
												<DropdownMenuTrigger asChild>
													<Button
														variant="ghost"
														size="sm"
													>
														<MoreHorizontal className="h-4 w-4" />
													</Button>
												</DropdownMenuTrigger>
												<DropdownMenuContent align="end">
													<DropdownMenuItem
														onClick={() => {
															setSelectedComment(
																comment,
															);
															setShowDetailDialog(
																true,
															);
														}}
													>
														<Eye className="h-4 w-4 mr-2" />
														查看详情
													</DropdownMenuItem>

													{comment.status !==
														"ACTIVE" && (
														<DropdownMenuItem
															onClick={() =>
																updateCommentStatus(
																	[
																		comment.id,
																	],
																	"ACTIVE",
																)
															}
														>
															<CheckCircle className="h-4 w-4 mr-2" />
															批准
														</DropdownMenuItem>
													)}

													{comment.status !==
														"HIDDEN" && (
														<DropdownMenuItem
															onClick={() =>
																updateCommentStatus(
																	[
																		comment.id,
																	],
																	"HIDDEN",
																)
															}
														>
															<EyeOff className="h-4 w-4 mr-2" />
															隐藏
														</DropdownMenuItem>
													)}

													{comment.status !==
														"REJECTED" && (
														<DropdownMenuItem
															onClick={() =>
																updateCommentStatus(
																	[
																		comment.id,
																	],
																	"REJECTED",
																)
															}
														>
															<XCircle className="h-4 w-4 mr-2" />
															拒绝
														</DropdownMenuItem>
													)}

													<DropdownMenuItem
														onClick={() =>
															deleteComments([
																comment.id,
															])
														}
														className="text-destructive"
													>
														<Trash2 className="h-4 w-4 mr-2" />
														删除
													</DropdownMenuItem>
												</DropdownMenuContent>
											</DropdownMenu>
										</TableCell>
									</TableRow>
								))
							)}
						</TableBody>
					</Table>
				</CardContent>
			</Card>

			{/* 分页 */}
			{totalPages > 1 && (
				<div className="flex justify-center gap-2">
					<Button
						variant="outline"
						onClick={() => setPage((p) => Math.max(1, p - 1))}
						disabled={page === 1}
					>
						上一页
					</Button>
					<span className="px-4 py-2 text-sm">
						第 {page} 页，共 {totalPages} 页
					</span>
					<Button
						variant="outline"
						onClick={() =>
							setPage((p) => Math.min(totalPages, p + 1))
						}
						disabled={page === totalPages}
					>
						下一页
					</Button>
				</div>
			)}

			{/* 系统配置对话框 */}
			{config && (
				<Dialog
					open={showConfigDialog}
					onOpenChange={setShowConfigDialog}
				>
					<DialogContent className="max-w-md">
						<DialogHeader>
							<DialogTitle>评论系统设置</DialogTitle>
							<DialogDescription>
								配置评论系统的全局设置
							</DialogDescription>
						</DialogHeader>

						<div className="space-y-4">
							<div className="flex items-center justify-between">
								<Label htmlFor="enabled">启用评论功能</Label>
								<Switch
									id="enabled"
									checked={config.enabled}
									onCheckedChange={(checked) =>
										setConfig((prev) =>
											prev
												? { ...prev, enabled: checked }
												: null,
										)
									}
								/>
							</div>

							<div className="flex items-center justify-between">
								<Label htmlFor="requireApproval">
									评论需要审核
								</Label>
								<Switch
									id="requireApproval"
									checked={config.requireApproval}
									onCheckedChange={(checked) =>
										setConfig((prev) =>
											prev
												? {
														...prev,
														requireApproval:
															checked,
													}
												: null,
										)
									}
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="maxLength">最大字符数</Label>
								<Input
									id="maxLength"
									type="number"
									value={config.maxLength}
									onChange={(e) =>
										setConfig((prev) =>
											prev
												? {
														...prev,
														maxLength:
															Number.parseInt(
																e.target.value,
															) || 0,
													}
												: null,
										)
									}
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="rateLimit">
									频率限制（每分钟）
								</Label>
								<Input
									id="rateLimit"
									type="number"
									value={config.rateLimit}
									onChange={(e) =>
										setConfig((prev) =>
											prev
												? {
														...prev,
														rateLimit:
															Number.parseInt(
																e.target.value,
															) || 0,
													}
												: null,
										)
									}
								/>
							</div>
						</div>

						<DialogFooter>
							<Button
								variant="outline"
								onClick={() => setShowConfigDialog(false)}
							>
								取消
							</Button>
							<Button
								onClick={() => updateConfig(config)}
								disabled={submitting}
							>
								{submitting ? "保存中..." : "保存"}
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			)}

			{/* 评论详情对话框 */}
			<Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
				<DialogContent className="max-w-2xl">
					<DialogHeader>
						<DialogTitle>评论详情</DialogTitle>
					</DialogHeader>

					{selectedComment && (
						<div className="space-y-4">
							<div className="flex items-center space-x-4">
								<UserAvatar
									name={selectedComment.user.name}
									avatarUrl={selectedComment.user.image}
								/>
								<div>
									<p className="font-medium">
										{selectedComment.user.name}
									</p>
									<p className="text-sm text-muted-foreground">
										{selectedComment.user.email}
									</p>
								</div>
								{getStatusBadge(
									selectedComment.status,
									selectedComment.isDeleted,
								)}
							</div>

							<Separator />

							<div>
								<Label>评论内容</Label>
								<div className="mt-2 p-3 bg-muted rounded-md">
									<p className="whitespace-pre-wrap">
										{selectedComment.content}
									</p>
								</div>
							</div>

							<div className="grid grid-cols-2 gap-4">
								<div>
									<Label>实体类型</Label>
									<p className="mt-1">
										{getEntityTypeBadge(
											selectedComment.entityType,
										)}
									</p>
								</div>
								<div>
									<Label>实体 ID</Label>
									<p className="mt-1 text-sm font-mono">
										{selectedComment.entityId}
									</p>
								</div>
							</div>

							<div className="grid grid-cols-2 gap-4">
								<div>
									<Label>点赞数</Label>
									<p className="mt-1">
										{selectedComment.likeCount}
									</p>
								</div>
								<div>
									<Label>回复数</Label>
									<p className="mt-1">
										{selectedComment.replyCount}
									</p>
								</div>
							</div>

							<div className="grid grid-cols-2 gap-4">
								<div>
									<Label>创建时间</Label>
									<p className="mt-1 text-sm">
										{new Date(
											selectedComment.createdAt,
										).toLocaleString("zh-CN")}
									</p>
								</div>
								<div>
									<Label>更新时间</Label>
									<p className="mt-1 text-sm">
										{new Date(
											selectedComment.updatedAt,
										).toLocaleString("zh-CN")}
									</p>
								</div>
							</div>

							{selectedComment.deletedAt && (
								<div>
									<Label>删除时间</Label>
									<p className="mt-1 text-sm text-red-500">
										{new Date(
											selectedComment.deletedAt,
										).toLocaleString("zh-CN")}
									</p>
									{selectedComment.deleter && (
										<p className="text-sm text-muted-foreground">
											删除者：
											{selectedComment.deleter.name}
										</p>
									)}
								</div>
							)}
						</div>
					)}

					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setShowDetailDialog(false)}
						>
							关闭
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
