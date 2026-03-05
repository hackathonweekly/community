"use client";

import {
	useInfiniteQuery,
	useMutation,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";
import type { PostChannel } from "@prisma/client";

interface PostFeedParams {
	channel?: PostChannel;
	sort?: "new" | "hot";
	limit?: number;
}

async function fetchJson(url: string, init?: RequestInit) {
	const res = await fetch(url, init);
	if (!res.ok) {
		const body = await res.json().catch(() => ({}));
		throw new Error(body.error || `Request failed: ${res.status}`);
	}
	return res.json();
}

export function usePostsFeed(params: PostFeedParams) {
	const { channel, sort = "new", limit = 20 } = params;

	return useInfiniteQuery({
		queryKey: ["posts", "feed", { channel, sort }],
		queryFn: async ({ pageParam }) => {
			const search = new URLSearchParams();
			if (channel) search.set("channel", channel);
			search.set("sort", sort);
			search.set("limit", String(limit));
			if (pageParam) search.set("cursor", pageParam);
			return fetchJson(`/api/posts/feed?${search.toString()}`);
		},
		initialPageParam: undefined as string | undefined,
		getNextPageParam: (lastPage: any) =>
			lastPage.hasMore ? lastPage.nextCursor : undefined,
		staleTime: 2 * 60 * 1000,
	});
}

export function usePostDetail(postId: string) {
	return useQuery({
		queryKey: ["posts", "detail", postId],
		queryFn: () => fetchJson(`/api/posts/${postId}`),
		enabled: !!postId,
	});
}

export function useCreatePost() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (data: {
			title?: string;
			content: string;
			images?: string[];
			channel: PostChannel;
			linkedProjectId?: string;
			linkedEventId?: string;
		}) =>
			fetchJson("/api/posts", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(data),
			}),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["posts", "feed"] });
		},
	});
}

export function useTogglePostLike() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (postId: string) =>
			fetchJson(`/api/posts/${postId}/like`, { method: "POST" }),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["posts"] });
		},
	});
}

export function useTogglePostBookmark() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (postId: string) =>
			fetchJson(`/api/posts/${postId}/bookmark`, { method: "POST" }),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["posts"] });
		},
	});
}

export function useDeletePost() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (postId: string) =>
			fetchJson(`/api/posts/${postId}`, { method: "DELETE" }),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["posts", "feed"] });
		},
	});
}
