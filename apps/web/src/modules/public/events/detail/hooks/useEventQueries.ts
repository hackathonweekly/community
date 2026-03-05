"use client";
import React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
	cacheInvalidation,
	requestDeduplicator,
} from "@community/lib-client/cache-config";
import { parseRegistrationError } from "../../components/registrationErrorUtils";

// Query keys
export const eventKeys = {
	all: ["events"] as const,
	details: () => [...eventKeys.all, "detail"] as const,
	detail: (id: string) => [...eventKeys.details(), id] as const,
	engagement: (id: string) => [...eventKeys.all, "engagement", id] as const,
	photos: (id: string) => [...eventKeys.all, "photos", id] as const,
	bookmarkStatus: (id: string, userId?: string) =>
		[...eventKeys.all, "bookmark", id, userId] as const,
	likeStatus: (id: string, userId?: string) =>
		[...eventKeys.all, "like", id, userId] as const,
	likeCount: (id: string) => [...eventKeys.all, "likeCount", id] as const,
	userFeedback: (id: string, userId?: string) =>
		[...eventKeys.all, "userFeedback", id, userId] as const,
	projectSubmissions: (id: string) =>
		[...eventKeys.all, "projectSubmissions", id] as const,
};

// Event engagement hook
export function useEventEngagement(eventId: string, userId?: string) {
	const queryClient = useQueryClient();

	// 获取点赞数量
	const { data: likeCountData } = useQuery({
		queryKey: eventKeys.likeCount(eventId),
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

	// 获取用户收藏状态
	const { data: isBookmarked = false } = useQuery({
		queryKey: eventKeys.bookmarkStatus(eventId, userId),
		queryFn: async () => {
			if (!userId) return false;
			const key = `bookmark-status-${eventId}-${userId}`;
			return requestDeduplicator.deduplicate(key, async () => {
				const response = await fetch(
					`/api/user/events/${eventId}/bookmark-status`,
					{ credentials: "include" },
				);
				if (!response.ok) return false;
				const data = await response.json();
				return data.bookmarked;
			});
		},
		enabled: !!userId,
		staleTime: 5 * 1000, // 缩短到5秒，与新的 realtime 配置一致
	});

	// 获取用户点赞状态
	const { data: isLiked = false } = useQuery({
		queryKey: eventKeys.likeStatus(eventId, userId),
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

	// 切换收藏状态
	const toggleBookmarkMutation = useMutation({
		mutationFn: async () => {
			const response = await fetch(
				`/api/user/events/${eventId}/bookmark`,
				{
					method: isBookmarked ? "DELETE" : "POST",
					credentials: "include",
				},
			);
			if (!response.ok) throw new Error("Failed to toggle bookmark");
			return response.json();
		},
		onSuccess: () => {
			// 乐观更新本地状态
			queryClient.setQueryData(
				eventKeys.bookmarkStatus(eventId, userId),
				!isBookmarked,
			);
		},
		onError: () => {
			toast.error("操作失败，请稍后重试");
		},
	});

	// 切换点赞状态
	const toggleLikeMutation = useMutation({
		mutationFn: async () => {
			const response = await fetch(`/api/events/${eventId}/like`, {
				method: isLiked ? "DELETE" : "POST",
				credentials: "include",
			});
			if (!response.ok) throw new Error("Failed to toggle like");
			return response.json();
		},
		onMutate: async () => {
			// 取消正在进行的查询
			await queryClient.cancelQueries({
				queryKey: eventKeys.likeStatus(eventId, userId),
			});
			await queryClient.cancelQueries({
				queryKey: eventKeys.likeCount(eventId),
			});

			// 保存之前的值
			const previousLiked = queryClient.getQueryData(
				eventKeys.likeStatus(eventId, userId),
			);
			const previousCount = queryClient.getQueryData(
				eventKeys.likeCount(eventId),
			);

			// 乐观更新
			queryClient.setQueryData(
				eventKeys.likeStatus(eventId, userId),
				!isLiked,
			);
			queryClient.setQueryData(
				eventKeys.likeCount(eventId),
				(old: number) => old + (isLiked ? -1 : 1),
			);

			return { previousLiked, previousCount };
		},
		onError: (err, newLike, context) => {
			// 回滚乐观更新
			queryClient.setQueryData(
				eventKeys.likeStatus(eventId, userId),
				context?.previousLiked,
			);
			queryClient.setQueryData(
				eventKeys.likeCount(eventId),
				context?.previousCount,
			);
			toast.error("操作失败，请稍后重试");
		},
		onSettled: () => {
			// 始终重新获取以确保数据同步
			queryClient.invalidateQueries({
				queryKey: eventKeys.likeStatus(eventId, userId),
			});
			queryClient.invalidateQueries({
				queryKey: eventKeys.likeCount(eventId),
			});
		},
	});

	return {
		isBookmarked,
		isLiked,
		likeCount: likeCountData || 0,
		toggleBookmark: toggleBookmarkMutation.mutate,
		toggleLike: toggleLikeMutation.mutate,
		isToggleLikeLoading: toggleLikeMutation.isPending,
		isToggleBookmarkLoading: toggleBookmarkMutation.isPending,
	};
}

// Event photos hook
export function useEventPhotos(
	eventId: string,
	t: (key: string, values?: any) => string,
) {
	const queryClient = useQueryClient();

	const { data: photos = [], isLoading: isLoadingPhotos } = useQuery({
		queryKey: eventKeys.photos(eventId),
		queryFn: async () => {
			const key = `event-photos-${eventId}`;
			return requestDeduplicator.deduplicate(key, async () => {
				const response = await fetch(`/api/events/${eventId}/photos`, {
					credentials: "include",
				});
				if (!response.ok) throw new Error("Failed to fetch photos");
				const data = await response.json();
				return data.data.photos.map((photo: any) => photo.imageUrl);
			});
		},
		staleTime: 5 * 60 * 1000, // 5 minutes
	});

	const uploadPhotosMutation = useMutation({
		mutationFn: async (newPhotos: string[]) => {
			const existingPhotos = photos;
			const addedPhotos = newPhotos.filter(
				(url) => !existingPhotos.includes(url),
			);

			if (addedPhotos.length === 0) {
				return newPhotos;
			}

			// 上传新照片
			for (const photoUrl of addedPhotos) {
				const response = await fetch(`/api/events/${eventId}/photos`, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					credentials: "include",
					body: JSON.stringify({ imageUrl: photoUrl }),
				});

				if (!response.ok) {
					const errorText = await response.text();
					try {
						const errorData = JSON.parse(errorText);
						throw new Error(
							errorData.error ||
								`HTTP ${response.status}: ${response.statusText}`,
						);
					} catch {
						throw new Error(
							`HTTP ${response.status}: ${response.statusText} - ${errorText}`,
						);
					}
				}
			}

			return newPhotos;
		},
		onMutate: async (newPhotos) => {
			// 取消正在进行的查询
			await queryClient.cancelQueries({
				queryKey: eventKeys.photos(eventId),
			});

			// 保存之前的数据
			const previousPhotos = queryClient.getQueryData(
				eventKeys.photos(eventId),
			);

			// 乐观更新
			queryClient.setQueryData(eventKeys.photos(eventId), newPhotos);

			return { previousPhotos };
		},
		onError: (error, newPhotos, context) => {
			// 回滚
			queryClient.setQueryData(
				eventKeys.photos(eventId),
				context?.previousPhotos,
			);
			toast.error(
				t("events.photoUploadError", {
					error:
						error instanceof Error
							? error.message
							: t("events.unknownError"),
				}),
			);
		},
		onSuccess: () => {
			toast.success(t("events.photoUploadSuccess"));
		},
		onSettled: () => {
			// 重新获取以确保数据同步
			queryClient.invalidateQueries({
				queryKey: eventKeys.photos(eventId),
			});
		},
	});

	return {
		photos,
		isLoadingPhotos,
		handlePhotosChange: uploadPhotosMutation.mutate,
		isUploadingPhotos: uploadPhotosMutation.isPending,
	};
}

// View count increment hook
export function useIncrementViewCount(eventId: string) {
	const incrementMutation = useMutation({
		mutationFn: async () => {
			const response = await fetch(`/api/events/${eventId}/view`, {
				method: "POST",
			});

			if (!response.ok) {
				throw new Error("Failed to increment view count");
			}

			return response.json();
		},
		onError: (error) => {
			console.debug("Failed to increment view count:", error);
		},
	});

	// 在组件挂载时自动触发
	React.useEffect(() => {
		incrementMutation.mutate();
	}, [eventId]);

	return incrementMutation;
}

// Event registration mutations
export function useEventRegistration(
	eventId: string,
	t: (key: string) => string,
) {
	const queryClient = useQueryClient();

	// 注册事件
	const registerMutation = useMutation({
		mutationFn: async (registrationData: any) => {
			const response = await fetch(`/api/events/${eventId}/register`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				credentials: "include",
				body: JSON.stringify(registrationData),
			});

			if (!response.ok) {
				let errorMessage = "Registration failed";
				try {
					const errorData = await response.json();
					errorMessage = errorData.error || errorMessage;
				} catch (e) {
					// 如果无法解析错误响应，使用默认错误消息
					errorMessage = `HTTP ${response.status}: ${response.statusText}`;
				}
				throw new Error(errorMessage);
			}

			return response.json();
		},
		onSuccess: (data) => {
			// 使用新的缓存失效策略
			cacheInvalidation.onEventUpdate(queryClient, eventId);
			queryClient.invalidateQueries({
				queryKey: eventKeys.projectSubmissions(eventId),
			});
			toast.success(t("events.registrationSuccess"));
			return data;
		},
		onError: (error: Error) => {
			// 确保错误消息是字符串格式
			const errorMessage =
				typeof error.message === "string"
					? error.message
					: "注册失败，请稍后重试";
			toast.error(errorMessage);
		},
	});

	// 取消注册
	const cancelRegistrationMutation = useMutation({
		mutationFn: async () => {
			const response = await fetch(`/api/events/${eventId}/register`, {
				method: "DELETE",
				headers: { "Content-Type": "application/json" },
				credentials: "include",
			});

			if (!response.ok) {
				const message = await parseRegistrationError(
					response,
					t("events.registrationCancelFailed"),
				);
				throw new Error(message);
			}

			return response.json();
		},
		onSuccess: () => {
			// 使用新的缓存失效策略
			cacheInvalidation.onEventUpdate(queryClient, eventId);
			queryClient.invalidateQueries({
				queryKey: eventKeys.projectSubmissions(eventId),
			});
			toast.success(t("events.registrationCancelledSuccess"));
		},
		onError: (error: Error) => {
			// 确保错误消息是字符串格式
			const errorMessage =
				typeof error.message === "string"
					? error.message
					: t("events.registrationCancelFailed");
			toast.error(errorMessage);
		},
	});

	// 志愿者申请
	const volunteerApplyMutation = useMutation({
		mutationFn: async (eventVolunteerRoleId: string) => {
			const response = await fetch(
				`/api/events/${eventId}/volunteers/apply`,
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					credentials: "include",
					body: JSON.stringify({ eventVolunteerRoleId }),
				},
			);

			if (!response.ok) {
				const message = await parseRegistrationError(
					response,
					t("events.volunteerApplicationFailed"),
				);
				throw new Error(message);
			}

			return response.json();
		},
		onSuccess: (result) => {
			// 使用新的缓存失效策略
			cacheInvalidation.onEventUpdate(queryClient, eventId);
			toast.success(
				result.message || t("events.volunteerApplicationSubmitted"),
			);
		},
		onError: (error: Error) => {
			// 确保错误消息是字符串格式
			const errorMessage =
				typeof error.message === "string"
					? error.message
					: t("events.volunteerApplicationFailed");
			toast.error(errorMessage);
		},
	});

	return {
		register: registerMutation.mutate,
		cancelRegistration: cancelRegistrationMutation.mutate,
		volunteerApply: volunteerApplyMutation.mutate,
		isRegistering: registerMutation.isPending,
		isCancellingRegistration: cancelRegistrationMutation.isPending,
		isApplyingVolunteer: volunteerApplyMutation.isPending,
		registerMutation,
	};
}

// User feedback hook
export function useUserFeedback(eventId: string, userId?: string) {
	const { data: userFeedback, isLoading } = useQuery({
		queryKey: eventKeys.userFeedback(eventId, userId),
		queryFn: async () => {
			if (!userId) return null;
			const key = `user-feedback-${eventId}-${userId}`;
			return requestDeduplicator.deduplicate(key, async () => {
				const response = await fetch(
					`/api/events/${eventId}/my-feedback`,
					{
						credentials: "include",
					},
				);
				if (!response.ok) {
					// If user hasn't submitted feedback, this is expected
					if (response.status === 404) return null;
					throw new Error("Failed to fetch user feedback");
				}
				const data = await response.json();
				return data.data;
			});
		},
		enabled: !!userId,
		staleTime: 5 * 60 * 1000, // 5 minutes
	});

	return {
		userFeedback,
		isLoadingUserFeedback: isLoading,
		hasSubmittedFeedback: !!userFeedback,
	};
}

// Event project submissions hook
export function useEventProjectSubmissions(eventId: string, enabled = true) {
	const { data: projectSubmissions = [], isLoading } = useQuery({
		queryKey: eventKeys.projectSubmissions(eventId),
		queryFn: async () => {
			const key = `project-submissions-${eventId}`;
			return requestDeduplicator.deduplicate(key, async () => {
				const response = await fetch(
					`/api/events/${eventId}/project-submissions`,
					{
						credentials: "include",
					},
				);
				if (!response.ok) {
					// If there are no project submissions, this is expected
					if (response.status === 404) return [];
					throw new Error("Failed to fetch project submissions");
				}
				const data = await response.json();
				return data.data;
			});
		},
		enabled,
		staleTime: 5 * 60 * 1000, // 5 minutes
	});

	return {
		projectSubmissions,
		isLoadingProjectSubmissions: isLoading,
	};
}
