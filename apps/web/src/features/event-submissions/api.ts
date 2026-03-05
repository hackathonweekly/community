import type {
	EventSubmission,
	SubmissionFormValues,
	SubmissionListResponse,
	SubmissionVoteResponse,
	VoteStatsSummary,
	UserSearchResult,
} from "./types";

export class ApiError extends Error {
	code?: string;
	status?: number;
	payload?: unknown;

	constructor(
		message: string,
		options?: { code?: string; status?: number; payload?: unknown },
	) {
		super(message);
		this.name = "ApiError";
		this.code = options?.code;
		this.status = options?.status;
		this.payload = options?.payload;
	}
}

async function handleResponse<T>(response: Response): Promise<T> {
	// Clone before consuming body so we can fall back to text when JSON parse fails
	const cloned = response.clone();
	let payload: any = null;
	try {
		payload = await response.json();
	} catch (error) {
		// Ignore JSON parsing errors for non-JSON responses
	}

	if (!response.ok) {
		let message =
			payload?.error?.message ||
			payload?.message ||
			(typeof payload?.error === "string" ? payload.error : null);

		const code =
			typeof payload?.error === "string"
				? payload.error
				: typeof payload?.code === "string"
					? payload.code
					: typeof payload?.error?.code === "string"
						? payload.error.code
						: undefined;

		if (
			!message &&
			payload?.error?.issues &&
			Array.isArray(payload.error.issues)
		) {
			message = payload.error.issues
				.map((issue: any) => issue.message)
				.join(", ");
		}

		if (!message && payload?.details && Array.isArray(payload.details)) {
			message = payload.details.map((d: any) => d.message).join(", ");
		}

		if (!message) {
			try {
				const text = await cloned.text();
				const trimmed = text.trim();
				if (trimmed) {
					message = trimmed;
				}
			} catch (error) {
				// ignore text parsing fallback
			}
		}

		if (!message) {
			message = `Request failed (${response.status})`;
		}

		throw new ApiError(message, {
			code,
			status: response.status,
			payload,
		});
	}

	if (payload && "data" in payload) {
		return payload.data as T;
	}

	return payload as T;
}

const jsonHeaders = {
	"Content-Type": "application/json",
};

export async function getEventSubmissions(
	eventId: string,
	params?: {
		sort?: string;
		order?: "asc" | "desc";
		includeVotes?: boolean;
		includePrivateFields?: boolean;
	},
): Promise<SubmissionListResponse> {
	const searchParams = new URLSearchParams();
	if (params?.sort) {
		searchParams.set("sort", params.sort);
	}
	if (params?.order) {
		searchParams.set("order", params.order);
	}
	if (params?.includeVotes) {
		searchParams.set("includeVotes", String(params.includeVotes));
	}
	if (params?.includePrivateFields) {
		searchParams.set(
			"includePrivateFields",
			String(params.includePrivateFields),
		);
	}
	const query = searchParams.toString();

	const response = await fetch(
		`/api/events/${eventId}/submissions${query ? `?${query}` : ""}`,
		{
			credentials: "include",
		},
	);
	return handleResponse<SubmissionListResponse>(response);
}

export async function getSubmission(
	submissionId: string,
): Promise<EventSubmission> {
	const response = await fetch(`/api/submissions/${submissionId}`, {
		credentials: "include",
	});
	return handleResponse<EventSubmission>(response);
}

export async function createSubmission(
	eventId: string,
	payload: SubmissionFormValues,
): Promise<EventSubmission> {
	const response = await fetch(`/api/events/${eventId}/submissions`, {
		method: "POST",
		headers: jsonHeaders,
		credentials: "include",
		body: JSON.stringify(payload),
	});
	return handleResponse<EventSubmission>(response);
}

export async function updateSubmission(
	submissionId: string,
	payload: Partial<SubmissionFormValues>,
): Promise<EventSubmission> {
	const response = await fetch(`/api/submissions/${submissionId}`, {
		method: "PATCH",
		headers: jsonHeaders,
		credentials: "include",
		body: JSON.stringify(payload),
	});
	return handleResponse<EventSubmission>(response);
}

export async function deleteSubmission(submissionId: string): Promise<void> {
	const response = await fetch(`/api/submissions/${submissionId}`, {
		method: "DELETE",
		credentials: "include",
	});
	await handleResponse(response);
}

export async function voteSubmission(
	submissionId: string,
): Promise<SubmissionVoteResponse> {
	const response = await fetch(`/api/submissions/${submissionId}/vote`, {
		method: "POST",
		credentials: "include",
	});
	return handleResponse<SubmissionVoteResponse>(response);
}

export async function unvoteSubmission(
	submissionId: string,
): Promise<SubmissionVoteResponse> {
	const response = await fetch(`/api/submissions/${submissionId}/vote`, {
		method: "DELETE",
		credentials: "include",
	});
	return handleResponse<SubmissionVoteResponse>(response);
}

export async function updateSubmissionVoteCount(
	submissionId: string,
	voteCount: number,
): Promise<EventSubmission> {
	const response = await fetch(
		`/api/submissions/${submissionId}/vote-adjustment`,
		{
			method: "PATCH",
			headers: jsonHeaders,
			credentials: "include",
			body: JSON.stringify({ voteCount }),
		},
	);
	return handleResponse<EventSubmission>(response);
}

export async function getVoteStats(eventId: string): Promise<VoteStatsSummary> {
	const response = await fetch(`/api/events/${eventId}/votes/stats`, {
		credentials: "include",
	});
	return handleResponse<VoteStatsSummary>(response);
}

export async function searchParticipants({
	eventId,
	query,
	scope = "event",
	excludeIds = [],
}: {
	eventId: string;
	query: string;
	scope?: "event" | "global";
	excludeIds?: string[];
}): Promise<UserSearchResult[]> {
	const searchParams = new URLSearchParams();
	searchParams.set("q", query);
	searchParams.set("scope", scope);
	if (excludeIds.length > 0) {
		searchParams.set("excludeIds", excludeIds.join(","));
	}

	const response = await fetch(
		`/api/events/${eventId}/participants/search?${searchParams.toString()}`,
		{
			credentials: "include",
		},
	);
	const result = await handleResponse<{ users: UserSearchResult[] }>(
		response,
	);
	return result.users;
}
