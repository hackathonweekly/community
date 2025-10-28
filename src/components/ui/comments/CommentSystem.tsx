"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
	MessageCircle,
	SortAsc,
	SortDesc,
	AlertCircle,
	RefreshCw,
} from "lucide-react";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	CommentForm,
	CommentItem,
	CommentSkeleton,
	type CommentData,
	type CommentSystemProps,
} from "./CommentComponents";
import { toast } from "sonner";

interface CommentStats {
	totalComments: number;
	topLevelComments: number;
	replies: number;
}

interface CommentListResponse {
	comments: CommentData[];
	pagination: {
		page: number;
		limit: number;
		total: number;
		totalPages: number;
	};
}

interface ReplyState {
	parentId?: string;
	replyToId?: string;
	replyToUser?: string;
}

type SortBy = "createdAt" | "likeCount";
type SortDirection = "asc" | "desc";

export function CommentSystem({
	entityType,
	entityId,
	currentUserId,
	maxLength = 2000,
	placeholder = "写下你的评论...",
	showStats = true,
	allowReplies = true,
	className,
}: CommentSystemProps) {
	const [comments, setComments] = useState<CommentData[]>([]);
	const [stats, setStats] = useState<CommentStats | null>(null);
	const [loading, setLoading] = useState(true);
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [enabled, setEnabled] = useState(true);

	// 分页和排序
	const [page, setPage] = useState(1);
	const [hasMore, setHasMore] = useState(false);
	const [sortBy, setSortBy] = useState<SortBy>("createdAt");
	const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

	// 回复状态
	const [replyState, setReplyState] = useState<ReplyState | null>(null);

	// 已加载的回复
	const [loadedReplies, setLoadedReplies] = useState<Set<string>>(new Set());

	// API 调用函数
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

				// 为403错误创建特殊的错误对象
				if (response.status === 403) {
					const error = new Error(errorData.error || "权限不足");
					(error as any).status = 403;
					throw error;
				}

				throw new Error(errorData.error || `HTTP ${response.status}`);
			}

			return response.json();
		},
		[],
	);

	// 加载评论列表
	const loadComments = useCallback(
		async (pageNum = 1, append = false) => {
			try {
				if (!append) {
					setLoading(true);
				}
				setError(null);

				const params = new URLSearchParams({
					page: pageNum.toString(),
					limit: "20",
					orderBy: sortBy,
					orderDirection: sortDirection,
				});

				const response: CommentListResponse = await apiCall(
					`/api/comments/entity/${entityType}/${entityId}?${params}`,
				);

				if (append) {
					setComments((prev) => [...prev, ...response.comments]);
				} else {
					setComments(response.comments);
				}

				setHasMore(pageNum < response.pagination.totalPages);
				setPage(pageNum);
			} catch (error) {
				console.error("加载评论失败:", error);
				setError(
					error instanceof Error ? error.message : "加载评论失败",
				);
			} finally {
				setLoading(false);
			}
		},
		[entityType, entityId, sortBy, sortDirection, apiCall],
	);

	// 加载评论统计
	const loadStats = useCallback(async () => {
		try {
			const response: CommentStats = await apiCall(
				`/api/comments/stats/${entityType}/${entityId}`,
			);
			setStats(response);
		} catch (error) {
			console.error("加载统计失败:", error);
		}
	}, [entityType, entityId, apiCall]);

	// 检查评论功能是否启用
	const checkEnabled = useCallback(async () => {
		try {
			await apiCall(
				`/api/comments/entity/${entityType}/${entityId}?limit=1`,
			);
			setEnabled(true);
		} catch (error) {
			if (error instanceof Error && error.message.includes("关闭")) {
				setEnabled(false);
			} else {
				setEnabled(true);
			}
		}
	}, [entityType, entityId, apiCall]);

	// 初始化加载
	useEffect(() => {
		const init = async () => {
			try {
				await checkEnabled();
			} catch (error) {
				console.error("检查评论功能状态失败:", error);
				// 如果检查失败，默认不显示评论功能
				setEnabled(false);
				return;
			}
		};
		init();
	}, [checkEnabled]);

	// 当确认评论功能启用后，再加载评论数据
	useEffect(() => {
		if (enabled) {
			loadComments();
			if (showStats) {
				loadStats();
			}
		}
	}, [enabled, loadComments, loadStats, showStats]);

	// 排序变化时重新加载
	useEffect(() => {
		if (enabled) {
			loadComments(1, false);
		}
	}, [sortBy, sortDirection, loadComments, enabled]);

	// 提交评论
	const handleSubmit = useCallback(
		async (content: string, parentId?: string, replyToId?: string) => {
			if (!currentUserId) {
				toast.error("请先登录");
				return;
			}

			setSubmitting(true);
			try {
				const newComment: CommentData = await apiCall("/api/comments", {
					method: "POST",
					body: JSON.stringify({
						content,
						entityType,
						entityId,
						parentId,
						replyToId,
					}),
				});

				// 更新本地状态
				if (parentId) {
					// 这是回复，更新父评论的回复数
					setComments((prev) =>
						prev.map((comment) =>
							comment.id === parentId
								? {
										...comment,
										replyCount: comment.replyCount + 1,
									}
								: comment,
						),
					);
				} else {
					// 这是顶级评论，添加到列表顶部
					setComments((prev) => [newComment, ...prev]);
				}

				// 更新统计
				if (stats) {
					setStats((prev) =>
						prev
							? {
									...prev,
									totalComments: prev.totalComments + 1,
									topLevelComments: parentId
										? prev.topLevelComments
										: prev.topLevelComments + 1,
									replies: parentId
										? prev.replies + 1
										: prev.replies,
								}
							: null,
					);
				}

				setReplyState(null);
			} catch (error) {
				console.error("提交评论失败:", error);

				// 检查是否为权限错误（403）
				if (error instanceof Error && (error as any).status === 403) {
					toast.error(
						error.message ||
							"发表评论需要成为共创伙伴，请联系社区负责人！",
					);
				} else {
					throw error;
				}
			} finally {
				setSubmitting(false);
			}
		},
		[currentUserId, entityType, entityId, stats, apiCall],
	);

	// 点赞评论
	const handleLike = useCallback(
		async (commentId: string) => {
			if (!currentUserId) {
				toast.error("请先登录");
				return;
			}

			const response = await apiCall(`/api/comments/${commentId}/like`, {
				method: "POST",
			});

			// 更新本地状态
			setComments((prev) =>
				prev.map((comment) => {
					if (comment.id === commentId) {
						return {
							...comment,
							isLikedByUser: response.liked,
							likeCount: response.liked
								? comment.likeCount + 1
								: comment.likeCount - 1,
						};
					}
					return comment;
				}),
			);
		},
		[currentUserId, apiCall],
	);

	// 编辑评论
	const handleEdit = useCallback(
		async (commentId: string, content: string) => {
			const updatedComment: CommentData = await apiCall(
				`/api/comments/${commentId}`,
				{
					method: "PUT",
					body: JSON.stringify({ content }),
				},
			);

			setComments((prev) =>
				prev.map((comment) =>
					comment.id === commentId ? updatedComment : comment,
				),
			);
		},
		[apiCall],
	);

	// 删除评论
	const handleDelete = useCallback(
		async (commentId: string) => {
			await apiCall(`/api/comments/${commentId}`, {
				method: "DELETE",
			});

			setComments((prev) =>
				prev.map((comment) =>
					comment.id === commentId
						? { ...comment, isDeleted: true }
						: comment,
				),
			);

			// 更新统计
			if (stats) {
				setStats((prev) =>
					prev
						? {
								...prev,
								totalComments: prev.totalComments - 1,
							}
						: null,
				);
			}
		},
		[stats, apiCall],
	);

	// 开始回复
	const handleReply = useCallback(
		(parentId: string, replyToId?: string) => {
			const replyToComment = comments.find(
				(c) => c.id === (replyToId || parentId),
			);
			setReplyState({
				parentId,
				replyToId,
				replyToUser: replyToComment?.user.name,
			});
		},
		[comments],
	);

	// 加载回复
	const handleLoadReplies = useCallback(
		async (parentId: string) => {
			if (loadedReplies.has(parentId)) {
				return;
			}

			try {
				const response = await apiCall(
					`/api/comments/${parentId}?limit=50`,
				);

				// 将回复插入到父评论后面
				const parentIndex = comments.findIndex(
					(c) => c.id === parentId,
				);
				if (parentIndex !== -1) {
					const newComments = [...comments];
					newComments.splice(parentIndex + 1, 0, ...response.replies);
					setComments(newComments);
					setLoadedReplies(
						(prev) => new Set(Array.from(prev).concat([parentId])),
					);
				}
			} catch (error) {
				console.error("加载回复失败:", error);
				throw error;
			}
		},
		[comments, loadedReplies, apiCall],
	);

	// 加载更多评论
	const handleLoadMore = useCallback(() => {
		if (hasMore && !loading) {
			loadComments(page + 1, true);
		}
	}, [hasMore, loading, page, loadComments]);

	// 刷新评论
	const handleRefresh = useCallback(() => {
		setLoadedReplies(new Set());
		loadComments(1, false);
		if (showStats) {
			loadStats();
		}
	}, [loadComments, loadStats, showStats]);

	if (!enabled) {
		return null;
	}

	return (
		<Card className={className}>
			<CardHeader>
				<div className="flex items-center justify-between">
					<CardTitle className="flex items-center gap-2">
						<MessageCircle className="h-5 w-5" />
						评论
						{showStats && stats && (
							<Badge variant="secondary">
								{stats.totalComments}
							</Badge>
						)}
					</CardTitle>

					<div className="flex items-center gap-2">
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button variant="ghost" size="sm">
									{sortBy === "createdAt" ? "时间" : "热度"}
									{sortDirection === "desc" ? (
										<SortDesc className="h-4 w-4 ml-1" />
									) : (
										<SortAsc className="h-4 w-4 ml-1" />
									)}
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end">
								<DropdownMenuItem
									onClick={() => {
										setSortBy("createdAt");
										setSortDirection("desc");
									}}
								>
									最新回复
								</DropdownMenuItem>
								<DropdownMenuItem
									onClick={() => {
										setSortBy("createdAt");
										setSortDirection("asc");
									}}
								>
									最早回复
								</DropdownMenuItem>
								<DropdownMenuItem
									onClick={() => {
										setSortBy("likeCount");
										setSortDirection("desc");
									}}
								>
									最多点赞
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>

						<Button
							variant="ghost"
							size="sm"
							onClick={handleRefresh}
						>
							<RefreshCw className="h-4 w-4" />
						</Button>
					</div>
				</div>

				{showStats && stats && (
					<div className="flex gap-4 text-sm text-muted-foreground">
						<span>{stats.topLevelComments} 条评论</span>
						<span>{stats.replies} 条回复</span>
					</div>
				)}
			</CardHeader>

			<CardContent className="space-y-6">
				{/* 评论表单 */}
				{currentUserId && (
					<>
						<CommentForm
							onSubmit={handleSubmit}
							placeholder={placeholder}
							maxLength={maxLength}
							isSubmitting={submitting}
						/>

						{/* 回复表单 */}
						{replyState && (
							<CommentForm
								onSubmit={handleSubmit}
								parentId={replyState.parentId}
								replyToId={replyState.replyToId}
								replyToUser={replyState.replyToUser}
								placeholder={`回复 ${replyState.replyToUser}...`}
								maxLength={maxLength}
								isSubmitting={submitting}
								onCancel={() => setReplyState(null)}
								autoFocus={true}
								className="border-l-4 border-primary/20"
							/>
						)}
					</>
				)}

				{/* 错误提示 */}
				{error && (
					<Alert variant="destructive">
						<AlertCircle className="h-4 w-4" />
						<AlertDescription>{error}</AlertDescription>
					</Alert>
				)}

				{/* 评论列表 */}
				{loading && comments.length === 0 ? (
					<div className="space-y-6">
						{Array.from({ length: 3 }).map((_, i) => (
							<CommentSkeleton key={i} />
						))}
					</div>
				) : (
					<div className="space-y-6">
						{comments.map((comment, index) => {
							const level = comment.replyTo ? 1 : 0;
							return (
								<div key={comment.id}>
									<CommentItem
										comment={comment}
										currentUserId={currentUserId}
										level={level}
										maxLevel={allowReplies ? 3 : 0}
										onReply={
											allowReplies
												? handleReply
												: undefined
										}
										onLike={handleLike}
										onEdit={handleEdit}
										onDelete={handleDelete}
										onLoadReplies={handleLoadReplies}
									/>
									{index < comments.length - 1 && (
										<Separator className="mt-6" />
									)}
								</div>
							);
						})}

						{/* 加载更多 */}
						{hasMore && (
							<div className="text-center">
								<Button
									variant="outline"
									onClick={handleLoadMore}
									disabled={loading}
								>
									{loading ? "加载中..." : "加载更多评论"}
								</Button>
							</div>
						)}

						{/* 空状态 */}
						{comments.length === 0 && !loading && (
							<div className="text-center py-8 text-muted-foreground">
								<MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
								<p>还没有评论，来发表第一条评论吧</p>
							</div>
						)}
					</div>
				)}
			</CardContent>
		</Card>
	);
}
