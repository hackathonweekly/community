"use client";

import { Button } from "@/components/ui/button";
import { BookmarkIcon } from "@heroicons/react/24/outline";
import { BookmarkIcon as BookmarkSolidIcon } from "@heroicons/react/24/solid";
import { useState } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

interface EventBookmarkButtonProps {
	eventId: string;
	initialBookmarked: boolean;
	isLoggedIn: boolean;
	size?: "default" | "sm" | "lg" | "icon";
	variant?: "default" | "outline" | "ghost" | "floating";
	showLabel?: boolean;
	onBookmarkChange?: (eventId: string, isBookmarked: boolean) => void;
}

export function EventBookmarkButton({
	eventId,
	initialBookmarked,
	isLoggedIn,
	size = "sm",
	variant = "outline",
	showLabel = true,
	onBookmarkChange,
}: EventBookmarkButtonProps) {
	const [bookmarked, setBookmarked] = useState(initialBookmarked);
	const [isLoading, setIsLoading] = useState(false);
	const t = useTranslations("events.bookmark");

	const handleBookmark = async () => {
		if (!isLoggedIn) {
			toast.error(t("loginRequired"));
			return;
		}

		setIsLoading(true);
		try {
			const response = await fetch(
				`/api/user/events/${eventId}/bookmark`,
				{
					method: bookmarked ? "DELETE" : "POST",
				},
			);

			if (!response.ok) {
				const errorData = await response.json();
				// 如果已经收藏，更新本地状态为已收藏
				if (
					response.status === 409 &&
					errorData.error === "Already bookmarked"
				) {
					setBookmarked(true);
					toast.info(t("alreadyBookmarked"));
					return;
				}
				throw new Error(errorData.error || t("updateError"));
			}

			setBookmarked(!bookmarked);
			onBookmarkChange?.(eventId, !bookmarked);
			toast.success(
				bookmarked ? t("unbookmarkSuccess") : t("bookmarkSuccess"),
			);
		} catch (error) {
			console.error("Error updating event bookmark:", error);
			toast.error(
				error instanceof Error ? error.message : t("updateError"),
			);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<Button
			variant={
				variant === "floating"
					? "outline"
					: bookmarked
						? "default"
						: variant
			}
			size={size}
			onClick={handleBookmark}
			disabled={isLoading}
			className={`flex items-center gap-2 ${
				variant === "floating"
					? "bg-white/90 backdrop-blur-sm border-white/20 hover:bg-white shadow-lg"
					: ""
			}`}
		>
			{bookmarked ? (
				<BookmarkSolidIcon className="h-4 w-4" />
			) : (
				<BookmarkIcon className="h-4 w-4" />
			)}
			{showLabel && (bookmarked ? "已收藏" : "收藏")}
		</Button>
	);
}
