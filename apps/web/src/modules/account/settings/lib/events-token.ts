import { useQuery } from "@tanstack/react-query";

export const eventsTokenQueryKey = ["settings", "events-token"] as const;

export type EventsTokenSummary = {
	status: "empty" | "active" | "revoked";
	tokenLastFour?: string | null;
	createdAt?: string;
	lastUsedAt?: string | null;
	lastUsedIp?: string | null;
	lastUsedUserAgent?: string | null;
	revokedAt?: string | null;
};

export type EventsTokenEligibility = {
	allowed: boolean;
	reason?: string;
};

export interface EventsTokenOverview {
	summary: EventsTokenSummary;
	eligibility: EventsTokenEligibility;
}

type EventsTokenOverviewResponse = {
	success: true;
	data: EventsTokenOverview;
};

type EventsTokenMutateResponse = {
	success: true;
	data: {
		token?: string;
		summary: EventsTokenSummary;
	};
};

type ApiError = {
	success: false;
	error?: string;
};

async function handleResponse<T>(response: Response): Promise<T> {
	const payload = (await response.json()) as T | ApiError;

	if (!response.ok || (payload as ApiError).success === false) {
		const errorMessage =
			(payload as ApiError).error ??
			"Failed to process events token request";
		throw new Error(errorMessage);
	}

	return payload as T;
}

export async function fetchEventsTokenOverview() {
	const res = await fetch("/api/events-token", {
		method: "GET",
		cache: "no-store",
	});

	const data = await handleResponse<EventsTokenOverviewResponse>(res);
	return data.data;
}

export async function generateEventsToken() {
	const res = await fetch("/api/events-token", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
	});

	const data = await handleResponse<EventsTokenMutateResponse>(res);
	return data.data;
}

export async function revokeEventsTokenRequest() {
	const res = await fetch("/api/events-token", {
		method: "DELETE",
	});

	const data = await handleResponse<EventsTokenMutateResponse>(res);
	return data.data;
}

export function useEventsTokenQuery() {
	return useQuery({
		queryKey: eventsTokenQueryKey,
		queryFn: () => fetchEventsTokenOverview(),
	});
}
