"use client";

import { Button } from "@/components/ui/button";
import { HeartIcon } from "@heroicons/react/24/outline";
import { HeartIcon as HeartSolidIcon } from "@heroicons/react/24/solid";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { eventKeys } from "@/app/(public)/[locale]/events/[eventId]/hooks/useEventQueries";
import { requestDeduplicator } from "@/lib/cache-config";
import { useTranslations } from "next-intl";

interface EventLikeButtonProps {
	eventId: string;
	userId?: string;
	isLoggedIn: boolean;
	variant?: "default" | "ghost" | "outline";
	size?: "sm" | "default" | "lg";
	showText?: boolean;
	showCount?: boolean;
}

export function EventLikeButton({
	eventId,
	userId,
	isLoggedIn,
	variant = "ghost",
	size = "sm",
	showText = true,
	showCount = false,
}: EventLikeButtonProps) {
	const queryClient = useQueryClient();
	const t = useTranslations("events.like");

	// 使用统一的查询键
	const likeStatusKey = eventKeys.likeStatus(eventId, userId);
	const likeCountKey = eventKeys.likeCount(eventId);

	// 获取用户点赞状态
	const { data: isLiked = false } = useQuery({
		queryKey: likeStatusKey,
		queryFn: async () => {
			if (!userId) return false;
			const key = `like-status-${eventId}-${userId}`;
			return requestDeduplicator.deduplicate(key, async () => {
				const response = await fetch(
					`/api/user/events/${eventId}/like-status`,
					{ credentials: "include" },
				);
				if (!response.ok) return false;
				const data = await response.json();
				return data.liked;
			});
		},
		enabled: !!userId,
		staleTime: 5 * 1000, // 缩短到5秒，与新的 realtime 配置一致
	});

	// 获取点赞数量
	const { data: likeCount = 0 } = useQuery({
		queryKey: likeCountKey,
		queryFn: async () => {
			const key = `like-count-${eventId}`;
			return requestDeduplicator.deduplicate(key, async () => {
				const response = await fetch(`/api/events/${eventId}/likes`, {
					credentials: "include",
				});
				if (!response.ok) throw new Error("Failed to fetch like count");
				const data = await response.json();
				return data.data.likeCount;
			});
		},
		staleTime: 5 * 1000, // 缩短到5秒，与新的 realtime 配置一致
		refetchOnWindowFocus: true,
	});

	// 切换点赞状态
	const toggleLikeMutation = useMutation({
		mutationFn: async () => {
			const response = await fetch(`/api/events/${eventId}/like`, {
				method: isLiked ? "DELETE" : "POST",
				credentials: "include",
			});
			if (!response.ok) {
				const errorData = await response.json();
				if (
					response.status === 409 &&
					errorData.error === "Already liked"
				) {
					// 更新本地状态为已点赞
					queryClient.setQueryData(likeStatusKey, true);
					toast.info(t("alreadyLiked"));
					return;
				}
				throw new Error(errorData.error || t("updateError"));
			}
			return response.json();
		},
		onMutate: async () => {
			// 取消正在进行的查询
			await queryClient.cancelQueries({ queryKey: likeStatusKey });
			await queryClient.cancelQueries({ queryKey: likeCountKey });

			// 保存之前的值
			const previousLiked = queryClient.getQueryData(likeStatusKey);
			const previousCount = queryClient.getQueryData(likeCountKey);

			// 乐观更新
			queryClient.setQueryData(likeStatusKey, !isLiked);
			queryClient.setQueryData(
				likeCountKey,
				(old: number) => old + (isLiked ? -1 : 1),
			);

			return { previousLiked, previousCount };
		},
		onError: (error, newLike, context) => {
			// 回滚乐观更新
			queryClient.setQueryData(likeStatusKey, context?.previousLiked);
			queryClient.setQueryData(likeCountKey, context?.previousCount);
			toast.error(
				error instanceof Error ? error.message : t("updateError"),
			);
		},
		onSuccess: () => {
			toast.success(isLiked ? t("unlikeSuccess") : t("likeSuccess"));
		},
		onSettled: () => {
			// 始终重新获取以确保数据同步
			queryClient.invalidateQueries({ queryKey: likeStatusKey });
			queryClient.invalidateQueries({ queryKey: likeCountKey });
		},
	});

	const handleLike = () => {
		if (!isLoggedIn) {
			toast.error(t("loginRequired"));
			return;
		}
		toggleLikeMutation.mutate();
	};

	return (
		<Button
			variant={variant}
			size={size}
			onClick={handleLike}
			disabled={toggleLikeMutation.isPending}
			className="flex items-center gap-2"
		>
			{isLiked ? (
				<HeartSolidIcon className="h-4 w-4 text-red-500" />
			) : (
				<HeartIcon className="h-4 w-4" />
			)}
			{showText && (isLiked ? "已点赞" : "点赞")}
			{showCount && likeCount > 0 && (
				<span className="text-xs">({likeCount})</span>
			)}
		</Button>
	);
}
