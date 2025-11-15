"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	createSubmission,
	deleteSubmission,
	getEventSubmissions,
	getSubmission,
	getVoteStats,
	searchParticipants,
	unvoteSubmission,
	updateSubmission,
	voteSubmission,
} from "./api";
import type {
	EventSubmission,
	SubmissionFormValues,
	SubmissionListResponse,
	SubmissionVoteResponse,
	UserSearchResult,
	VoteStatsSummary,
} from "./types";

export const submissionKeys = {
	all: ["event-submissions"] as const,
	list: (eventId: string, sort?: string, order?: string) =>
		[...submissionKeys.all, "list", eventId, sort, order] as const,
	detail: (submissionId: string) =>
		[...submissionKeys.all, "detail", submissionId] as const,
	stats: (eventId: string) =>
		[...submissionKeys.all, "stats", eventId] as const,
	participants: (params: {
		eventId: string;
		query: string;
		scope?: string;
		excludeKey?: string;
	}) =>
		[
			...submissionKeys.all,
			"participants",
			params.eventId,
			params.scope,
			params.query,
			params.excludeKey,
		] as const,
};

export function useEventSubmissions(
	eventId?: string,
	options?: {
		sort?: string;
		order?: "asc" | "desc";
		includeVotes?: boolean;
		enabled?: boolean;
		refetchInterval?: number | false;
	},
) {
	return useQuery<SubmissionListResponse>({
		queryKey: submissionKeys.list(
			eventId || "",
			options?.sort,
			options?.order,
		),
		queryFn: () =>
			getEventSubmissions(eventId as string, {
				sort: options?.sort,
				order: options?.order,
				includeVotes: options?.includeVotes,
			}),
		enabled: Boolean(eventId && (options?.enabled ?? true)),
		refetchInterval: options?.refetchInterval,
	});
}

export function useEventSubmission(
	submissionId?: string,
	options?: { enabled?: boolean },
) {
	return useQuery<EventSubmission>({
		queryKey: submissionKeys.detail(submissionId || ""),
		queryFn: () => getSubmission(submissionId as string),
		enabled: Boolean(submissionId && (options?.enabled ?? true)),
	});
}

export function useCreateSubmission(eventId: string) {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (values: SubmissionFormValues) =>
			createSubmission(eventId, values),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: submissionKeys.all });
		},
	});
}

export function useUpdateSubmission(submissionId: string) {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (values: Partial<SubmissionFormValues>) =>
			updateSubmission(submissionId, values),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: submissionKeys.all });
		},
	});
}

export function useDeleteSubmission(submissionId: string, eventId: string) {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: () => deleteSubmission(submissionId),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: submissionKeys.all });
		},
	});
}

export function useVoteSubmission(eventId: string) {
	const queryClient = useQueryClient();
	return useMutation<SubmissionVoteResponse, Error, string>({
		mutationFn: (submissionId) => voteSubmission(submissionId),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: submissionKeys.all });
		},
	});
}

export function useUnvoteSubmission(eventId: string) {
	const queryClient = useQueryClient();
	return useMutation<SubmissionVoteResponse, Error, string>({
		mutationFn: (submissionId) => unvoteSubmission(submissionId),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: submissionKeys.all });
		},
	});
}

export function useVoteStats(
	eventId?: string,
	options?: { enabled?: boolean },
) {
	return useQuery<VoteStatsSummary>({
		queryKey: submissionKeys.stats(eventId || ""),
		queryFn: () => getVoteStats(eventId as string),
		enabled: Boolean(eventId && (options?.enabled ?? true)),
	});
}

export function useParticipantSearch(params: {
	eventId?: string;
	query: string;
	scope?: "event" | "global";
	excludeIds?: string[];
	enabled?: boolean;
}) {
	const { eventId, query, scope, excludeIds, enabled } = params;
	return useQuery<UserSearchResult[]>({
		queryKey: submissionKeys.participants({
			eventId: eventId || "",
			scope,
			query,
			excludeKey: excludeIds?.join(",") || "",
		}),
		queryFn: () =>
			searchParticipants({
				eventId: eventId as string,
				query,
				scope,
				excludeIds,
			}),
		enabled: Boolean(eventId && query.length >= 2 && (enabled ?? true)),
		staleTime: 1000 * 60,
	});
}
