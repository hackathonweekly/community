"use client";

import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@community/ui/ui/dropdown-menu";
import {
	AlertCircle,
	MessageCircle,
	RefreshCw,
	SortAsc,
	SortDesc,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
	type CommentData,
	CommentForm,
	CommentItem,
	CommentSkeleton,
	type CommentSystemProps,
} from "./CommentComponents";

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
	onCountChange,
}: CommentSystemProps) {
	const [comments, setComments] = useState<CommentData[]>([]);
	const [stats, setStats] = useState<CommentStats | null>(null);
	const [loading, setLoading] = useState(true);
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [enabled, setEnabled] = useState(true);

	// Notify parent when comment count changes
	useEffect(() => {
		if (stats && onCountChange) {
			onCountChange(stats.totalComments);
		}
	}, [stats, onCountChange]);

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
							"发表评论需要成为社区成员，请联系社区负责人！",
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
			const deletedComment = comments.find((c) => c.id === commentId);
			const isReply = !!deletedComment?.replyTo;

			await apiCall(`/api/comments/${commentId}`, {
				method: "DELETE",
			});

			if (isReply) {
				// 找到父评论：向前遍历找到最近的顶级评论
				const deletedIndex = comments.findIndex(
					(c) => c.id === commentId,
				);
				let parentId: string | undefined;
				for (let i = deletedIndex - 1; i >= 0; i--) {
					if (!comments[i].replyTo) {
						parentId = comments[i].id;
						break;
					}
				}

				setComments((prev) =>
					prev
						.filter((c) => c.id !== commentId)
						.map((c) =>
							parentId && c.id === parentId
								? {
										...c,
										replyCount: Math.max(
											0,
											c.replyCount - 1,
										),
									}
								: c,
						),
				);
			} else {
				// 删除的是顶级评论，标记为已删除
				setComments((prev) =>
					prev.map((comment) =>
						comment.id === commentId
							? { ...comment, isDeleted: true }
							: comment,
					),
				);
			}

			// 更新统计
			if (stats) {
				setStats((prev) =>
					prev
						? {
								...prev,
								totalComments: prev.totalComments - 1,
								topLevelComments: isReply
									? prev.topLevelComments
									: prev.topLevelComments - 1,
								replies: isReply
									? prev.replies - 1
									: prev.replies,
							}
						: null,
				);
			}
		},
		[stats, comments, apiCall],
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
		<div className={className}>
			{/* Section Header */}
			<div className="flex items-center justify-between mb-4">
				<div className="flex items-center gap-3">
					<h3 className="font-brand text-sm font-bold uppercase tracking-wide text-gray-400 dark:text-[#A3A3A3]">
						评论
					</h3>
					{showStats && stats && (
						<span className="px-1.5 py-0.5 bg-gray-100 dark:bg-[#1F1F1F] text-gray-600 dark:text-[#A3A3A3] rounded-md text-[10px] font-bold border border-gray-200 dark:border-[#262626]">
							{stats.totalComments}
						</span>
					)}
					<div className="h-px bg-gray-100 dark:bg-[#262626] flex-1" />
				</div>

				<div className="flex items-center gap-1 ml-3">
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<button
								type="button"
								className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-bold text-gray-500 dark:text-[#A3A3A3] hover:bg-gray-100 dark:hover:bg-[#1F1F1F] transition-colors"
							>
								{sortBy === "createdAt" ? "时间" : "热度"}
								{sortDirection === "desc" ? (
									<SortDesc className="h-3.5 w-3.5" />
								) : (
									<SortAsc className="h-3.5 w-3.5" />
								)}
							</button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							<DropdownMenuItem
								onClick={() => {
									setSortBy("createdAt");
									setSortDirection("desc");
								}}
								className="text-xs"
							>
								最新回复
							</DropdownMenuItem>
							<DropdownMenuItem
								onClick={() => {
									setSortBy("createdAt");
									setSortDirection("asc");
								}}
								className="text-xs"
							>
								最早回复
							</DropdownMenuItem>
							<DropdownMenuItem
								onClick={() => {
									setSortBy("likeCount");
									setSortDirection("desc");
								}}
								className="text-xs"
							>
								最多点赞
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>

					<button
						type="button"
						onClick={handleRefresh}
						className="inline-flex items-center justify-center w-7 h-7 rounded-md text-gray-400 dark:text-[#A3A3A3] hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#1F1F1F] transition-colors"
					>
						<RefreshCw className="h-3.5 w-3.5" />
					</button>
				</div>
			</div>

			{showStats && stats && (
				<div className="flex gap-3 text-[11px] font-mono text-gray-400 dark:text-[#A3A3A3] mb-4">
					<span>{stats.topLevelComments} 条评论</span>
					<span className="w-px h-3 bg-gray-200 dark:bg-[#262626]" />
					<span>{stats.replies} 条回复</span>
				</div>
			)}

			<div className="space-y-4">
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
								className="border-l-2 border-gray-300 dark:border-[#333]"
							/>
						)}
					</>
				)}

				{/* 错误提示 */}
				{error && (
					<div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-800/20 text-red-600 dark:text-red-400 text-xs">
						<AlertCircle className="h-3.5 w-3.5 shrink-0" />
						{error}
					</div>
				)}

				{/* 评论列表 */}
				{loading && comments.length === 0 ? (
					<div className="space-y-4">
						{Array.from({ length: 3 }).map((_, i) => (
							<CommentSkeleton key={i} />
						))}
					</div>
				) : (
					<div className="space-y-0">
						{comments.map((comment, index) => {
							const level = comment.replyTo ? 1 : 0;
							return (
								<div key={comment.id}>
									{index > 0 && (
										<div className="h-px bg-gray-100 dark:bg-[#1F1F1F] my-3" />
									)}
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
								</div>
							);
						})}

						{/* 加载更多 */}
						{hasMore && (
							<div className="text-center pt-3">
								<button
									type="button"
									onClick={handleLoadMore}
									disabled={loading}
									className="px-4 py-1.5 rounded-full text-xs font-bold border border-gray-200 dark:border-[#262626] text-black dark:text-white hover:bg-gray-50 dark:hover:bg-[#1A1A1A] transition-colors disabled:opacity-40"
								>
									{loading ? "加载中..." : "加载更多评论"}
								</button>
							</div>
						)}

						{/* 空状态 */}
						{comments.length === 0 && !loading && (
							<div className="text-center py-10">
								<MessageCircle className="h-8 w-8 mx-auto mb-3 text-gray-300 dark:text-[#333]" />
								<p className="text-xs text-gray-400 dark:text-[#A3A3A3]">
									还没有评论，来发表第一条评论吧
								</p>
							</div>
						)}
					</div>
				)}
			</div>
		</div>
	);
}
