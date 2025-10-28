"use client";

import { Button } from "@/components/ui/button";
import { HeartIcon, BookmarkIcon } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { useSession } from "@/modules/dashboard/auth/hooks/use-session";

interface ProjectInteractionsProps {
	projectId: string;
	initialLikeCount: number;
	initialIsLiked: boolean;
	initialIsBookmarked: boolean;
	variant?: "default" | "overlay";
}

export function ProjectInteractions({
	projectId,
	initialLikeCount,
	initialIsLiked,
	initialIsBookmarked,
	variant = "default",
}: ProjectInteractionsProps) {
	const { user } = useSession();
	const [likeCount, setLikeCount] = useState(initialLikeCount);
	const [isLiked, setIsLiked] = useState(initialIsLiked);
	const [isBookmarked, setIsBookmarked] = useState(initialIsBookmarked);
	const [isPending, startTransition] = useTransition();

	const handleLike = () => {
		if (!user) {
			toast.error("请先登录");
			return;
		}

		startTransition(async () => {
			try {
				const response = await fetch(
					`/api/projects/${projectId}/like`,
					{
						method: isLiked ? "DELETE" : "POST",
						headers: {
							"Content-Type": "application/json",
						},
					},
				);

				if (!response.ok) {
					throw new Error("操作失败");
				}

				setIsLiked(!isLiked);
				setLikeCount((prev) => (isLiked ? prev - 1 : prev + 1));
			} catch (error) {
				toast.error("操作失败，请重试");
				console.error("Like error:", error);
			}
		});
	};

	const handleBookmark = () => {
		if (!user) {
			toast.error("请先登录");
			return;
		}

		startTransition(async () => {
			try {
				const response = await fetch(
					`/api/projects/${projectId}/bookmark`,
					{
						method: isBookmarked ? "DELETE" : "POST",
						headers: {
							"Content-Type": "application/json",
						},
					},
				);

				if (!response.ok) {
					throw new Error("操作失败");
				}

				setIsBookmarked(!isBookmarked);
				toast.success(isBookmarked ? "已取消收藏" : "已收藏");
			} catch (error) {
				toast.error("操作失败，请重试");
				console.error("Bookmark error:", error);
			}
		});
	};

	return (
		<div
			className={`flex gap-2 ${variant === "overlay" ? "flex-col" : ""}`}
		>
			<Button
				variant={variant === "overlay" ? "secondary" : "ghost"}
				size="sm"
				onClick={handleLike}
				disabled={isPending}
				className={`flex items-center gap-1 ${
					variant === "overlay"
						? "bg-white/90 hover:bg-white shadow-md backdrop-blur-sm"
						: "p-1"
				}`}
			>
				<HeartIcon
					className={`h-4 w-4 ${
						isLiked
							? "fill-red-500 text-red-500"
							: "text-muted-foreground"
					}`}
				/>
				{variant === "default" && (
					<span className="text-xs">{likeCount}</span>
				)}
			</Button>

			<Button
				variant={variant === "overlay" ? "secondary" : "ghost"}
				size="sm"
				onClick={handleBookmark}
				disabled={isPending}
				className={`${
					variant === "overlay"
						? "bg-white/90 hover:bg-white shadow-md backdrop-blur-sm"
						: "p-1"
				}`}
			>
				<BookmarkIcon
					className={`h-4 w-4 ${
						isBookmarked
							? "fill-blue-500 text-blue-500"
							: "text-muted-foreground"
					}`}
				/>
			</Button>
		</div>
	);
}
