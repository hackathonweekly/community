"use client";

import { Button } from "@community/ui/ui/button";
import { HeartIcon } from "@heroicons/react/24/outline";
import { HeartIcon as HeartSolidIcon } from "@heroicons/react/24/solid";
import { useState } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

interface UserLikeButtonProps {
	userId: string;
	initialLiked: boolean;
	isLoggedIn: boolean;
	variant?: "default" | "ghost" | "outline";
	size?: "sm" | "default" | "lg";
	showText?: boolean;
}

export function UserLikeButton({
	userId,
	initialLiked,
	isLoggedIn,
	variant = "ghost",
	size = "sm",
	showText = true,
}: UserLikeButtonProps) {
	const [liked, setLiked] = useState(initialLiked);
	const [isLoading, setIsLoading] = useState(false);
	const likeT = useTranslations("app.users.like");

	const handleLike = async () => {
		if (!isLoggedIn) {
			toast.error(likeT("loginRequired"));
			return;
		}

		setIsLoading(true);
		try {
			const response = await fetch(`/api/user/${userId}/like`, {
				method: liked ? "DELETE" : "POST",
			});

			if (!response.ok) {
				const errorData = await response.json();
				// 如果已经点赞，更新本地状态为已点赞
				if (
					response.status === 409 &&
					errorData.error === "Already liked"
				) {
					setLiked(true);
					toast.info(likeT("alreadyLiked"));
					return;
				}
				// 如果是自己
				if (
					response.status === 400 &&
					errorData.error === "Cannot like yourself"
				) {
					toast.error(likeT("cannotLikeSelf"));
					return;
				}
				throw new Error(errorData.error || likeT("updateError"));
			}

			setLiked(!liked);
			toast.success(
				liked ? likeT("unlikeSuccess") : likeT("likeSuccess"),
			);
		} catch (error) {
			console.error("Error updating user like:", error);
			const fallbackMessage = likeT("updateError");
			toast.error(
				error instanceof Error ? error.message : fallbackMessage,
			);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<Button
			variant={variant}
			size={size}
			onClick={handleLike}
			disabled={isLoading}
			className="flex items-center gap-2"
		>
			{liked ? (
				<HeartSolidIcon className="h-4 w-4 text-red-500" />
			) : (
				<HeartIcon className="h-4 w-4" />
			)}
			{showText && (liked ? "已点赞" : "点赞")}
		</Button>
	);
}
