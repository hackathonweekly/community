"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { UserAvatar } from "@/components/shared/UserAvatar";
import {
	Heart,
	MessageCircle,
	Reply,
	MoreHorizontal,
	Trash2,
	Edit,
	Send,
} from "lucide-react";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";
import { toast } from "sonner";
import type { CommentEntityType } from "@prisma/client";

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
				toast.error("发表评论需要成为共创伙伴，请联系社区负责人！");
			} else if (error instanceof Response && error.status === 403) {
				const errorData = await error.json().catch(() => ({}));
				toast.error(
					errorData.error ||
						"发表评论需要成为共创伙伴，请联系社区负责人！",
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
		<Card className={className}>
			<CardContent className="p-4">
				{replyToUser && (
					<div className="mb-3 text-sm text-muted-foreground">
						回复 @{replyToUser}
					</div>
				)}

				<div className="space-y-3">
					<Textarea
						placeholder={placeholder}
						value={content}
						onChange={(e) => setContent(e.target.value)}
						onFocus={() => setIsFocused(true)}
						onKeyDown={handleKeyDown}
						className="min-h-[80px] resize-none"
						maxLength={maxLength}
						autoFocus={autoFocus}
					/>

					<div className="flex items-center justify-between">
						<div className="text-xs text-muted-foreground">
							{content.length}/{maxLength} 字符
							{content.length > 0 && (
								<span className="ml-2">⌘+Enter 发送</span>
							)}
						</div>

						{(isFocused || content.trim()) && (
							<div className="flex gap-2">
								{onCancel && (
									<Button
										variant="outline"
										size="sm"
										onClick={onCancel}
										disabled={isSubmitting}
									>
										取消
									</Button>
								)}
								<Button
									size="sm"
									onClick={handleSubmit}
									disabled={!content.trim() || isSubmitting}
								>
									{isSubmitting ? (
										<div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent" />
									) : (
										<>
											<Send className="h-4 w-4 mr-1" />
											发送
										</>
									)}
								</Button>
							</div>
						)}
					</div>
				</div>
			</CardContent>
		</Card>
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
				className={`flex space-x-3 ${className}`}
				style={{ marginLeft: `${level * 24}px` }}
			>
				<div className="text-sm text-muted-foreground italic py-2">
					此评论已被删除
				</div>
			</div>
		);
	}

	return (
		<div
			className={`flex space-x-3 ${className}`}
			style={{ marginLeft: `${level * 24}px` }}
		>
			<UserAvatar
				name={comment.user.name}
				avatarUrl={comment.user.image}
				className="h-8 w-8 flex-shrink-0"
			/>

			<div className="flex-1 space-y-2">
				<div className="flex items-center space-x-2">
					<span className="font-medium text-sm">
						{comment.user.name}
					</span>
					{comment.user.username && (
						<span className="text-xs text-muted-foreground">
							@{comment.user.username}
						</span>
					)}
					<span className="text-xs text-muted-foreground">
						{formatDistanceToNow(new Date(comment.createdAt), {
							addSuffix: true,
							locale: zhCN,
						})}
					</span>
					{comment.status === "REVIEWING" && (
						<Badge variant="outline" className="text-xs">
							审核中
						</Badge>
					)}
				</div>

				{comment.replyTo && (
					<div className="text-xs text-muted-foreground">
						回复 @{comment.replyTo.user.name}
					</div>
				)}

				{isEditing ? (
					<div className="space-y-2">
						<Textarea
							value={editContent}
							onChange={(e) => setEditContent(e.target.value)}
							className="min-h-[60px] text-sm"
						/>
						<div className="flex gap-2">
							<Button size="sm" onClick={handleEdit}>
								保存
							</Button>
							<Button
								size="sm"
								variant="outline"
								onClick={() => {
									setIsEditing(false);
									setEditContent(comment.content);
								}}
							>
								取消
							</Button>
						</div>
					</div>
				) : (
					<div className="text-sm whitespace-pre-wrap break-words">
						{comment.content}
					</div>
				)}

				<div className="flex items-center space-x-4">
					<Button
						variant="ghost"
						size="sm"
						className={`h-8 px-2 ${comment.isLikedByUser ? "text-red-500" : ""}`}
						onClick={handleLike}
						disabled={isLiking || !currentUserId}
					>
						<Heart
							className={`h-4 w-4 mr-1 ${comment.isLikedByUser ? "fill-current" : ""}`}
						/>
						<span className="text-xs">{comment.likeCount}</span>
					</Button>

					{canReply && currentUserId && (
						<Button
							variant="ghost"
							size="sm"
							className="h-8 px-2"
							onClick={() => onReply?.(comment.id, comment.id)}
						>
							<Reply className="h-4 w-4 mr-1" />
							<span className="text-xs">回复</span>
						</Button>
					)}

					{comment.replyCount > 0 && (
						<Button
							variant="ghost"
							size="sm"
							className="h-8 px-2"
							onClick={handleLoadReplies}
						>
							<MessageCircle className="h-4 w-4 mr-1" />
							<span className="text-xs">
								{showReplies ? "隐藏" : "查看"}{" "}
								{comment.replyCount} 条回复
							</span>
						</Button>
					)}

					{(isOwner || currentUserId) && (
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button
									variant="ghost"
									size="sm"
									className="h-8 w-8 p-0"
								>
									<MoreHorizontal className="h-4 w-4" />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end">
								{isOwner && onEdit && (
									<DropdownMenuItem
										onClick={() => setIsEditing(true)}
									>
										<Edit className="h-4 w-4 mr-2" />
										编辑
									</DropdownMenuItem>
								)}
								{isOwner && onDelete && (
									<DropdownMenuItem
										onClick={handleDelete}
										className="text-destructive"
									>
										<Trash2 className="h-4 w-4 mr-2" />
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
		<div className="flex space-x-3">
			<Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
			<div className="flex-1 space-y-2">
				<div className="flex items-center space-x-2">
					<Skeleton className="h-4 w-20" />
					<Skeleton className="h-4 w-16" />
					<Skeleton className="h-4 w-12" />
				</div>
				<Skeleton className="h-16 w-full" />
				<div className="flex items-center space-x-4">
					<Skeleton className="h-6 w-12" />
					<Skeleton className="h-6 w-12" />
					<Skeleton className="h-6 w-12" />
				</div>
			</div>
		</div>
	);
}
