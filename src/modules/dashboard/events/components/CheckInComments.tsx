"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

interface Comment {
	id: string;
	content: string;
	commentedAt: string;
	user: {
		id: string;
		name: string;
		image?: string;
		username?: string;
	};
}

interface CheckInCommentsProps {
	checkInId: string;
	commentCount: number;
	onCommentAdded: (newCount: number) => void;
	currentUserId?: string;
}

export function CheckInComments({
	checkInId,
	commentCount,
	onCommentAdded,
	currentUserId,
}: CheckInCommentsProps) {
	const [comments, setComments] = useState<Comment[]>([]);
	const [newComment, setNewComment] = useState("");
	const [loading, setLoading] = useState(false);
	const [submitting, setSubmitting] = useState(false);
	const [showComments, setShowComments] = useState(false);
	const toastsT = useTranslations("dashboard.events.checkInComments.toasts");

	useEffect(() => {
		if (showComments) {
			fetchComments();
		}
	}, [showComments, checkInId]);

	const fetchComments = async () => {
		setLoading(true);
		try {
			const response = await fetch(
				`/api/building-public/check-ins/${checkInId}/comments`,
			);
			if (response.ok) {
				const data = await response.json();
				setComments(data.data || []);
			}
		} catch (error) {
			console.error("Error fetching comments:", error);
			toast.error(toastsT("fetchFailed"));
		} finally {
			setLoading(false);
		}
	};

	const handleSubmitComment = async () => {
		if (!currentUserId) {
			toast.error(toastsT("loginRequired"));
			return;
		}

		if (!newComment.trim()) {
			toast.error(toastsT("contentRequired"));
			return;
		}

		setSubmitting(true);
		try {
			const response = await fetch(
				`/api/building-public/check-ins/${checkInId}/comments`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({ content: newComment.trim() }),
				},
			);

			if (response.ok) {
				const result = await response.json();
				setComments([...comments, result.data]);
				setNewComment("");
				onCommentAdded(commentCount + 1);
				toast.success(toastsT("submitSuccess"));
			} else {
				const error = await response.json();
				throw new Error(error.error || toastsT("submitFailed"));
			}
		} catch (error) {
			console.error("Error submitting comment:", error);
			toast.error(
				error instanceof Error
					? error.message
					: toastsT("submitFailed"),
			);
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<div className="border-t pt-3">
			{/* 评论按钮和数量 */}
			<Button
				variant="ghost"
				size="sm"
				onClick={() => setShowComments(!showComments)}
				className="text-muted-foreground hover:text-blue-500 p-0 h-auto"
			>
				💬 {commentCount} {showComments ? "收起评论" : "查看评论"}
			</Button>

			{/* 评论区域 */}
			{showComments && (
				<div className="mt-3 space-y-3">
					{/* 评论列表 */}
					{loading ? (
						<div className="text-sm text-muted-foreground">
							加载评论中...
						</div>
					) : comments.length > 0 ? (
						<div className="space-y-3 max-h-60 overflow-y-auto">
							{comments.map((comment) => (
								<div key={comment.id} className="flex gap-2">
									<Avatar className="w-6 h-6 flex-shrink-0">
										<AvatarImage
											src={comment.user.image}
											alt={comment.user.name}
										/>
										<AvatarFallback className="text-xs">
											{comment.user.name
												.charAt(0)
												.toUpperCase()}
										</AvatarFallback>
									</Avatar>
									<div className="flex-1 min-w-0">
										<div className="flex items-center gap-2 mb-1">
											<span className="text-xs font-medium">
												{comment.user.name}
											</span>
											<span className="text-xs text-muted-foreground">
												{new Date(
													comment.commentedAt,
												).toLocaleString("zh-CN")}
											</span>
										</div>
										<p className="text-sm text-gray-700 break-words">
											{comment.content}
										</p>
									</div>
								</div>
							))}
						</div>
					) : (
						<div className="text-sm text-muted-foreground">
							暂无评论
						</div>
					)}

					{/* 评论输入框 */}
					{currentUserId && (
						<div className="space-y-2">
							<Textarea
								placeholder="写下你的评论..."
								value={newComment}
								onChange={(e) => setNewComment(e.target.value)}
								className="min-h-[60px] text-sm"
							/>
							<div className="flex justify-end">
								<Button
									size="sm"
									onClick={handleSubmitComment}
									disabled={submitting || !newComment.trim()}
								>
									{submitting ? "发送中..." : "发送"}
								</Button>
							</div>
						</div>
					)}

					{!currentUserId && (
						<div className="text-sm text-muted-foreground">
							<a
								href="/auth/login"
								className="text-blue-600 hover:underline"
							>
								登录
							</a>{" "}
							后可以评论
						</div>
					)}
				</div>
			)}
		</div>
	);
}
