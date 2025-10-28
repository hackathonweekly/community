"use client";

import { Button } from "@/components/ui/button";
import { BookmarkIcon } from "@heroicons/react/24/outline";
import { BookmarkIcon as BookmarkSolidIcon } from "@heroicons/react/24/solid";
import { useState } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

interface ProjectBookmarkButtonProps {
	projectId: string;
	initialBookmarked: boolean;
	isLoggedIn: boolean;
}

export function ProjectBookmarkButton({
	projectId,
	initialBookmarked,
	isLoggedIn,
}: ProjectBookmarkButtonProps) {
	const [bookmarked, setBookmarked] = useState(initialBookmarked);
	const [isLoading, setIsLoading] = useState(false);
	const t = useTranslations("projects.bookmark");

	const handleBookmark = async () => {
		if (!isLoggedIn) {
			toast.error(t("loginRequired"));
			return;
		}

		setIsLoading(true);
		try {
			const response = await fetch(
				`/api/projects/${projectId}/bookmark`,
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
				// 如果是自己的作品
				if (
					response.status === 400 &&
					errorData.error === "Cannot bookmark your own project"
				) {
					toast.error(t("cannotBookmarkOwn"));
					return;
				}
				throw new Error(errorData.error || t("updateError"));
			}

			setBookmarked(!bookmarked);
			toast.success(
				bookmarked ? t("unbookmarkSuccess") : t("bookmarkSuccess"),
			);
		} catch (error) {
			console.error("Error updating project bookmark:", error);
			toast.error(
				error instanceof Error ? error.message : t("updateError"),
			);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<Button
			variant="outline"
			size="sm"
			onClick={handleBookmark}
			disabled={isLoading}
			className="flex items-center gap-2"
		>
			{bookmarked ? (
				<BookmarkSolidIcon className="h-4 w-4 text-blue-500" />
			) : (
				<BookmarkIcon className="h-4 w-4" />
			)}
			{bookmarked ? "已收藏" : "收藏"}
		</Button>
	);
}
