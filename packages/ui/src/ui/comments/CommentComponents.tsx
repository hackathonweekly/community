"use client";

import { UserAvatar } from "@community/ui/shared/UserAvatar";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@community/ui/ui/dropdown-menu";
import { Skeleton } from "@community/ui/ui/skeleton";
import { Textarea } from "@community/ui/ui/textarea";
import type { CommentEntityType } from "@community/lib-shared/prisma-enums";
import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";
import {
	Edit,
	Heart,
	MessageCircle,
	MoreHorizontal,
	Reply,
	Send,
	Trash2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export interface CommentData {
	id: string;
	content: string;
	createdAt: string | Date;
	updatedAt: string | Date;
	likeCount: number;
	replyCount: number;
	isLikedByUser?: boolean;
	user: {
		id: string;
		name: string;
		username?: string;
		image?: string;
	};
	replyTo?: {
		id: string;
		user: {
			id: string;
			name: string;
			username?: string;
		};
	};
	isDeleted?: boolean;
	status?: string;
}

export interface CommentSystemProps {
	entityType: CommentEntityType;
	entityId: string;
	currentUserId?: string;
	maxLength?: number;
	placeholder?: string;
	showStats?: boolean;
	allowReplies?: boolean;
	className?: string;
	onCountChange?: (totalComments: number) => void;
}

export interface CommentItemProps {
	comment: CommentData;
	currentUserId?: string;
	level?: number;
	maxLevel?: number;
	onReply?: (parentId: string, replyToId?: string) => void;
	onLike?: (commentId: string) => Promise<void>;
	onEdit?: (commentId: string, content: string) => Promise<void>;
	onDelete?: (commentId: string) => Promise<void>;
	onLoadReplies?: (parentId: string) => Promise<void>;
	className?: string;
}

export interface CommentFormProps {
	onSubmit: (
		content: string,
		parentId?: string,
		replyToId?: string,
	) => Promise<void>;
	parentId?: string;
	replyToId?: string;
	replyToUser?: string;
	placeholder?: string;
	maxLength?: number;
	isSubmitting?: boolean;
	onCancel?: () => void;
	autoFocus?: boolean;
	className?: string;
}

// 评论表单组件
export function CommentForm({
	onSubmit,
	parentId,
	replyToId,
	replyToUser,
	placeholder = "写下你的评论...",
	maxLength = 2000,
	isSubmitting = false,
	onCancel,
	autoFocus = false,
	className,
}: CommentFormProps) {
	const [content, setContent] = useState("");
	const [isFocused, setIsFocused] = useState(autoFocus);

	const handleSubmit = async () => {
		if (!content.trim()) {
			toast.error("评论内容不能为空");
			return;
		}

		if (content.length > maxLength) {
			toast.error(`评论内容不能超过 ${maxLength} 个字符`);
			return;
		}

		try {
			await onSubmit(content.trim(), parentId, replyToId);
			setContent("");
			setIsFocused(false);
			onCancel?.();
			toast.success("评论发表成功");
		} catch (error) {
			console.error("发表评论失败:", error);

			// 检查是否为权限错误（403）
			if (error instanceof Error && error.message.includes("403")) {
				toast.error("发表评论需要成为社区成员，请联系社区负责人！");
			} else if (error instanceof Response && error.status === 403) {
				const errorData = await error.json().catch(() => ({}));
				toast.error(
					errorData.error ||
						"发表评论需要成为社区成员，请联系社区负责人！",
				);
			} else {
				toast.error("发表评论失败，请重试");
			}
		}
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
			e.preventDefault();
			handleSubmit();
		}
	};

	return (
		<div
			className={`bg-gray-50 dark:bg-[#1A1A1A] rounded-lg p-3 ${className ?? ""}`}
		>
			{replyToUser && (
				<div className="mb-2 text-[11px] font-mono text-gray-500 dark:text-[#A3A3A3]">
					回复 @{replyToUser}
				</div>
			)}

			<Textarea
				placeholder={placeholder}
				value={content}
				onChange={(e) => setContent(e.target.value)}
				onFocus={() => setIsFocused(true)}
				onKeyDown={handleKeyDown}
				className="min-h-[72px] resize-none border-gray-200 dark:border-[#262626] bg-white dark:bg-[#141414] text-sm focus-visible:ring-1 focus-visible:ring-gray-300 dark:focus-visible:ring-[#333]"
				maxLength={maxLength}
				autoFocus={autoFocus}
			/>

			<div className="flex items-center justify-between mt-2">
				<div className="text-[10px] font-mono text-gray-400 dark:text-[#A3A3A3]">
					{content.length}/{maxLength}
					{content.length > 0 && (
						<span className="ml-2">⌘+Enter 发送</span>
					)}
				</div>

				{(isFocused || content.trim()) && (
					<div className="flex gap-2">
						{onCancel && (
							<button
								type="button"
								onClick={onCancel}
								disabled={isSubmitting}
								className="px-3 py-1 rounded-md text-xs font-bold text-gray-600 dark:text-[#A3A3A3] hover:bg-gray-100 dark:hover:bg-[#1F1F1F] transition-colors disabled:opacity-50"
							>
								取消
							</button>
						)}
						<button
							type="button"
							onClick={handleSubmit}
							disabled={!content.trim() || isSubmitting}
							className="bg-black dark:bg-white text-white dark:text-black px-3 py-1 rounded-md text-xs font-bold hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors disabled:opacity-40 flex items-center gap-1"
						>
							{isSubmitting ? (
								<div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-r-transparent" />
							) : (
								<>
									<Send className="h-3 w-3" />
									发送
								</>
							)}
						</button>
					</div>
				)}
			</div>
		</div>
	);
}

// 评论项组件
export function CommentItem({
	comment,
	currentUserId,
	level = 0,
	maxLevel = 3,
	onReply,
	onLike,
	onEdit,
	onDelete,
	onLoadReplies,
	className,
}: CommentItemProps) {
	const [isLiking, setIsLiking] = useState(false);
	const [isEditing, setIsEditing] = useState(false);
	const [editContent, setEditContent] = useState(comment.content);
	const [showReplies, setShowReplies] = useState(false);

	const isOwner = currentUserId === comment.user.id;
	const canReply = level < maxLevel && onReply;

	const handleLike = async () => {
		if (!onLike || isLiking) {
			return;
		}

		setIsLiking(true);
		try {
			await onLike(comment.id);
		} catch (error) {
			console.error("点赞失败:", error);
			toast.error("操作失败，请重试");
		} finally {
			setIsLiking(false);
		}
	};

	const handleEdit = async () => {
		if (!onEdit || !editContent.trim()) {
			return;
		}

		try {
			await onEdit(comment.id, editContent.trim());
			setIsEditing(false);
			toast.success("评论已更新");
		} catch (error) {
			console.error("编辑失败:", error);
			toast.error("编辑失败，请重试");
		}
	};

	const handleDelete = async () => {
		if (!onDelete) {
			return;
		}

		try {
			await onDelete(comment.id);
			toast.success("评论已删除");
		} catch (error) {
			console.error("删除失败:", error);
			toast.error("删除失败，请重试");
		}
	};

	const handleLoadReplies = async () => {
		if (!onLoadReplies) {
			return;
		}

		try {
			await onLoadReplies(comment.id);
			setShowReplies(true);
		} catch (error) {
			console.error("加载回复失败:", error);
			toast.error("加载回复失败，请重试");
		}
	};

	if (comment.isDeleted) {
		return (
			<div
				className={`flex gap-3 ${className ?? ""}`}
				style={{ marginLeft: `${level * 24}px` }}
			>
				<div className="text-[11px] font-mono text-gray-400 dark:text-[#A3A3A3] italic py-2">
					此评论已被删除
				</div>
			</div>
		);
	}

	return (
		<div
			className={`flex gap-3 ${className ?? ""}`}
			style={{ marginLeft: `${level * 24}px` }}
		>
			<UserAvatar
				name={comment.user.name}
				avatarUrl={comment.user.image}
				className="h-7 w-7 flex-shrink-0 rounded-full"
			/>

			<div className="flex-1 min-w-0">
				<div className="flex items-center gap-2 mb-0.5">
					<span className="text-xs font-bold text-black dark:text-white truncate">
						{comment.user.name}
					</span>
					{comment.user.username && (
						<span className="text-[10px] font-mono text-gray-400 dark:text-[#A3A3A3] truncate">
							@{comment.user.username}
						</span>
					)}
					<span className="text-[10px] font-mono text-gray-400 dark:text-[#A3A3A3] shrink-0">
						{formatDistanceToNow(new Date(comment.createdAt), {
							addSuffix: true,
							locale: zhCN,
						})}
					</span>
					{comment.status === "REVIEWING" && (
						<span className="px-1.5 py-0.5 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 rounded-md text-[10px] font-bold uppercase border border-orange-100 dark:border-orange-800/30">
							审核中
						</span>
					)}
				</div>

				{comment.replyTo && (
					<div className="text-[10px] font-mono text-gray-400 dark:text-[#A3A3A3] mb-1">
						回复 @{comment.replyTo.user.name}
					</div>
				)}

				{isEditing ? (
					<div className="space-y-2 mt-1">
						<Textarea
							value={editContent}
							onChange={(e) => setEditContent(e.target.value)}
							className="min-h-[60px] text-sm border-gray-200 dark:border-[#262626] bg-white dark:bg-[#141414]"
						/>
						<div className="flex gap-2">
							<button
								type="button"
								onClick={handleEdit}
								className="bg-black dark:bg-white text-white dark:text-black px-3 py-1 rounded-md text-xs font-bold hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
							>
								保存
							</button>
							<button
								type="button"
								onClick={() => {
									setIsEditing(false);
									setEditContent(comment.content);
								}}
								className="px-3 py-1 rounded-md text-xs font-bold text-gray-600 dark:text-[#A3A3A3] hover:bg-gray-100 dark:hover:bg-[#1F1F1F] transition-colors"
							>
								取消
							</button>
						</div>
					</div>
				) : (
					<div className="text-sm text-black dark:text-white whitespace-pre-wrap break-words leading-relaxed">
						{comment.content}
					</div>
				)}

				<div className="flex items-center gap-1 mt-1.5 -ml-1.5">
					<button
						type="button"
						className={`inline-flex items-center gap-1 px-1.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
							comment.isLikedByUser
								? "text-red-500"
								: "text-gray-400 dark:text-[#A3A3A3] hover:text-gray-600 dark:hover:text-white"
						} hover:bg-gray-100 dark:hover:bg-[#1F1F1F] disabled:opacity-40`}
						onClick={handleLike}
						disabled={isLiking || !currentUserId}
					>
						<Heart
							className={`h-3.5 w-3.5 ${comment.isLikedByUser ? "fill-current" : ""}`}
						/>
						{comment.likeCount > 0 && (
							<span>{comment.likeCount}</span>
						)}
					</button>

					{canReply && currentUserId && (
						<button
							type="button"
							className="inline-flex items-center gap-1 px-1.5 py-1 rounded-md text-[11px] font-medium text-gray-400 dark:text-[#A3A3A3] hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#1F1F1F] transition-colors"
							onClick={() => onReply?.(comment.id, comment.id)}
						>
							<Reply className="h-3.5 w-3.5" />
							回复
						</button>
					)}

					{comment.replyCount > 0 && (
						<button
							type="button"
							className="inline-flex items-center gap-1 px-1.5 py-1 rounded-md text-[11px] font-medium text-gray-400 dark:text-[#A3A3A3] hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#1F1F1F] transition-colors"
							onClick={handleLoadReplies}
						>
							<MessageCircle className="h-3.5 w-3.5" />
							{showReplies ? "隐藏" : "查看"} {comment.replyCount}{" "}
							条回复
						</button>
					)}

					{isOwner && (
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<button
									type="button"
									className="inline-flex items-center justify-center w-6 h-6 rounded-md text-gray-400 dark:text-[#A3A3A3] hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#1F1F1F] transition-colors"
								>
									<MoreHorizontal className="h-3.5 w-3.5" />
								</button>
							</DropdownMenuTrigger>
							<DropdownMenuContent
								align="end"
								className="min-w-[120px]"
							>
								{onEdit && (
									<DropdownMenuItem
										onClick={() => setIsEditing(true)}
										className="text-xs"
									>
										<Edit className="h-3.5 w-3.5 mr-2" />
										编辑
									</DropdownMenuItem>
								)}
								{onDelete && (
									<DropdownMenuItem
										onClick={handleDelete}
										className="text-xs text-red-600 dark:text-red-400"
									>
										<Trash2 className="h-3.5 w-3.5 mr-2" />
										删除
									</DropdownMenuItem>
								)}
							</DropdownMenuContent>
						</DropdownMenu>
					)}
				</div>
			</div>
		</div>
	);
}

// 评论骨架屏
export function CommentSkeleton() {
	return (
		<div className="flex gap-3">
			<Skeleton className="h-7 w-7 rounded-full flex-shrink-0" />
			<div className="flex-1 space-y-2">
				<div className="flex items-center gap-2">
					<Skeleton className="h-3 w-16 rounded" />
					<Skeleton className="h-3 w-12 rounded" />
				</div>
				<Skeleton className="h-12 w-full rounded" />
				<div className="flex items-center gap-2">
					<Skeleton className="h-5 w-10 rounded" />
					<Skeleton className="h-5 w-10 rounded" />
				</div>
			</div>
		</div>
	);
}
