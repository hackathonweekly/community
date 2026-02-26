"use client";

import { Button } from "@community/ui/ui/button";
import { cn } from "../lib/utils";
import { UserPlusIcon } from "@heroicons/react/24/outline";
import { UserPlusIcon as UserPlusSolidIcon } from "@heroicons/react/24/solid";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

interface UserFollowButtonProps {
	userId: string;
	initialFollowed: boolean;
	isMutualFollow?: boolean;
	isLoggedIn: boolean;
	className?: string;
}

export function UserFollowButton({
	userId,
	initialFollowed,
	isMutualFollow = false,
	isLoggedIn,
	className,
}: UserFollowButtonProps) {
	const t = useTranslations("app.users.follow");
	const [followed, setFollowed] = useState(initialFollowed);
	const [isLoading, setIsLoading] = useState(false);

	const handleFollow = async () => {
		if (!isLoggedIn) {
			toast.error(t("loginRequired"));
			return;
		}

		setIsLoading(true);
		try {
			const response = await fetch(`/api/user/${userId}/follow`, {
				method: followed ? "DELETE" : "POST",
			});

			if (!response.ok) {
				const errorData = await response.json();
				// 如果已经关注，更新本地状态为已关注
				if (
					response.status === 409 &&
					errorData.error === "Already following"
				) {
					setFollowed(true);
					toast.info(t("alreadyFollowing"));
					return;
				}
				throw new Error(errorData.error || t("updateError"));
			}

			setFollowed(!followed);
			toast.success(followed ? t("unfollowSuccess") : t("followSuccess"));

			// 通知会在后端API中自动创建，这里不需要额外处理
		} catch (error) {
			console.error("Error updating follow:", error);
			const fallbackMessage = t("updateError");
			toast.error(
				error instanceof Error ? error.message : fallbackMessage,
			);
		} finally {
			setIsLoading(false);
		}
	};

	const handleClick = () => {
		if (!isLoggedIn) {
			// 未登录，跳转到注册页面，并带上回调URL
			const currentUrl = window.location.pathname;
			window.location.href = `/auth/signup?redirect=${encodeURIComponent(currentUrl)}`;
			return;
		}
		handleFollow();
	};

	return (
		<Button
			variant={followed ? "outline" : "default"}
			size="sm"
			onClick={handleClick}
			disabled={isLoading}
			className={cn(
				"flex items-center gap-2",
				!followed
					? "bg-primary hover:bg-primary/90 text-white font-semibold shadow-sm"
					: "",
				className,
			)}
		>
			{followed ? (
				<UserPlusSolidIcon className="h-4 w-4 text-blue-500" />
			) : (
				<UserPlusIcon className="h-4 w-4" />
			)}
			{isMutualFollow && followed
				? "互相关注"
				: followed
					? "已关注"
					: "关注"}
		</Button>
	);
}
