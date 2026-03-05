import { getBaseUrl } from "@community/lib-shared/utils";

type ExtendedRequestInit = RequestInit & {
	next?: {
		revalidate?: number;
	};
};

function buildApiUrl(path: string, search?: URLSearchParams) {
	const base = typeof window === "undefined" ? getBaseUrl() : "";
	const normalizedPath = path.startsWith("/") ? path : `/${path}`;
	const query = search?.toString();
	return `${base}${normalizedPath}${query ? `?${query}` : ""}`;
}

function mergeHeaders(sources: Array<HeadersInit | undefined>) {
	const result = new Headers();
	for (const source of sources) {
		if (!source) continue;
		const headers = new Headers(source);
		headers.forEach((value, key) => {
			result.set(key, value);
		});
	}

	const iterator = result.keys();
	return iterator.next().done ? undefined : result;
}

function createRequestInit(init?: ExtendedRequestInit): ExtendedRequestInit {
	const merged: ExtendedRequestInit = {
		credentials: "include",
		...init,
	};

	// 智能缓存策略：如果有 revalidate 设置，使用兼容的缓存模式
	if (init?.next?.revalidate) {
		// 有 revalidate 时不设置 cache: "no-store"，让 Next.js ISR 发挥作用
		if (!init?.cache) {
			merged.cache = undefined; // 让 Next.js 决定最佳缓存策略
		}
	} else {
		// 没有 revalidate 时保持 no-store 的默认行为
		if (!init?.cache) {
			merged.cache = "no-store";
		}
	}

	// 为数据设置合理的重新验证时间
	const nextOptions = init?.next ? { ...init.next } : {};
	merged.next = {
		...nextOptions,
		revalidate: init?.next?.revalidate,
	};

	const headers = mergeHeaders([init?.headers]);
	if (headers) {
		merged.headers = headers;
	}

	return merged;
}

export interface EventListParams {
	search?: string;
	type?: string;
	organizationId?: string;
	isOnline?: string;
	status?: string;
	showExpired?: boolean;
	hostType?: "organization" | "individual";
	seriesId?: string;
	seriesSlug?: string;
	tags?: string;
}

export interface EventSeriesSummary {
	id: string;
	slug: string;
	title: string;
	description?: string;
	coverImage?: string;
	logoImage?: string;
	tags?: string[];
	isActive?: boolean;
	organizerId?: string | null;
	organizationId?: string | null;
	organizer?: {
		id: string;
		name: string;
		image?: string;
		username?: string;
	};
	organization?: {
		id: string;
		name: string;
		slug?: string;
		logo?: string;
	};
	_count?: {
		events: number;
		subscriptions: number;
	};
}

export interface EventListItem {
	id: string;
	shortId?: string;
	title: string;
	description: string;
	type: string;
	status: string;
	startTime: string;
	endTime: string;
	isOnline: boolean;
	address?: string;
	isExternalEvent: boolean;
	externalUrl?: string;
	coverImage?: string;
	tags: string[];
	featured: boolean;
	viewCount: number;
	createdAt: string;
	organizer: {
		id: string;
		name: string;
		image?: string;
		username?: string;
	};
	organization?: {
		id: string;
		name: string;
		slug: string;
		logo?: string;
	};
	series?: EventSeriesSummary | null;
	_count: {
		registrations: number;
	};
}

export async function fetchEventsList(
	params: EventListParams = {},
	init?: ExtendedRequestInit,
): Promise<EventListItem[]> {
	const searchParams = new URLSearchParams();
	if (params.search) searchParams.set("search", params.search);
	if (params.type) searchParams.set("type", params.type);
	if (params.organizationId)
		searchParams.set("organizationId", params.organizationId);
	if (params.isOnline) searchParams.set("isOnline", params.isOnline);
	if (params.status) searchParams.set("status", params.status);
	if (params.showExpired) searchParams.set("showExpired", "true");
	if (params.hostType) searchParams.set("hostType", params.hostType);
	if (params.seriesId) searchParams.set("seriesId", params.seriesId);
	if (params.seriesSlug) searchParams.set("seriesSlug", params.seriesSlug);
	if (params.tags) searchParams.set("tags", params.tags);

	const response = await fetch(
		buildApiUrl("/api/events", searchParams),
		createRequestInit({
			...init,
			// 为活动数据添加短时间缓存 - 活动数据更新非常频繁
			next: { revalidate: 30, ...init?.next }, // 30秒缓存
		}),
	);

	if (!response.ok) {
		throw new Error("Failed to fetch events");
	}

	const data = await response.json();
	return data.data?.events ?? [];
}

export interface EventOrganizationSummary {
	id: string;
	name: string;
	slug: string;
	logo?: string;
}

export interface EventSeriesListParams {
	page?: number;
	limit?: number;
	search?: string;
	mine?: boolean;
	includeInactive?: boolean;
	organizationId?: string;
}

export interface EventSeriesDetail extends EventSeriesSummary {
	richContent?: string;
	events?: EventListItem[];
}

export interface EventSeriesSubscription {
	id: string;
	seriesId: string;
	userId: string;
	notifyEmail: boolean;
	notifyInApp: boolean;
	createdAt: string;
	updatedAt: string;
}

export interface EventSeriesSubscriptionState {
	subscribed: boolean;
	subscription?: EventSeriesSubscription | null;
}

export interface EventSeriesMutationPayload {
	title?: string;
	slug?: string;
	description?: string;
	richContent?: string;
	coverImage?: string;
	logoImage?: string;
	tags?: string[];
	organizationId?: string | null;
	isActive?: boolean;
}

export async function fetchEventsOrganizations(
	init?: ExtendedRequestInit,
): Promise<EventOrganizationSummary[]> {
	const response = await fetch(
		buildApiUrl("/api/organizations"),
		createRequestInit(init),
	);

	if (!response.ok) {
		throw new Error("Failed to fetch organizations");
	}

	const data = await response.json();
	return data.organizations ?? [];
}

export async function fetchEventSeriesList(
	params: EventSeriesListParams = {},
	init?: ExtendedRequestInit,
): Promise<{
	series: EventSeriesSummary[];
	pagination: {
		page: number;
		limit: number;
		total: number;
		totalPages: number;
	};
}> {
	const searchParams = new URLSearchParams();
	if (params.page) searchParams.set("page", params.page.toString());
	if (params.limit) searchParams.set("limit", params.limit.toString());
	if (params.search) searchParams.set("search", params.search);
	if (params.mine) searchParams.set("mine", "true");
	if (params.includeInactive) searchParams.set("includeInactive", "true");
	if (params.organizationId)
		searchParams.set("organizationId", params.organizationId);

	const response = await fetch(
		buildApiUrl("/api/event-series", searchParams),
		createRequestInit(init),
	);

	if (!response.ok) {
		throw new Error("Failed to fetch event series");
	}

	const data = await response.json();
	return (
		data?.data ?? {
			series: [],
			pagination: {
				page: 1,
				limit: 20,
				total: 0,
				totalPages: 0,
			},
		}
	);
}

export async function fetchEventSeriesDetail(
	identifier: string,
	init?: ExtendedRequestInit,
): Promise<EventSeriesDetail | null> {
	const response = await fetch(
		buildApiUrl(`/api/event-series/${identifier}`),
		createRequestInit(init),
	);

	if (response.status === 404) {
		return null;
	}
	if (!response.ok) {
		throw new Error("Failed to fetch event series detail");
	}

	const data = await response.json();
	return data?.data ?? null;
}

function mergeJsonHeaders(init?: ExtendedRequestInit) {
	return {
		"Content-Type": "application/json",
		...(init?.headers ? Object.fromEntries(new Headers(init.headers)) : {}),
	};
}

async function extractErrorMessage(
	response: Response,
	fallback: string,
): Promise<string> {
	try {
		const data = await response.json();
		return data?.error || fallback;
	} catch {
		return fallback;
	}
}

export async function createEventSeries(
	payload: EventSeriesMutationPayload,
	init?: ExtendedRequestInit,
): Promise<EventSeriesDetail> {
	const response = await fetch(
		buildApiUrl("/api/event-series"),
		createRequestInit({
			...init,
			method: "POST",
			headers: mergeJsonHeaders(init),
			body: JSON.stringify(payload),
		}),
	);

	if (!response.ok) {
		throw new Error(
			await extractErrorMessage(
				response,
				"Failed to create event series",
			),
		);
	}

	const data = await response.json();
	return data?.data;
}

export async function updateEventSeries(
	identifier: string,
	payload: EventSeriesMutationPayload,
	init?: ExtendedRequestInit,
): Promise<EventSeriesDetail> {
	const response = await fetch(
		buildApiUrl(`/api/event-series/${identifier}`),
		createRequestInit({
			...init,
			method: "PUT",
			headers: mergeJsonHeaders(init),
			body: JSON.stringify(payload),
		}),
	);

	if (!response.ok) {
		throw new Error(
			await extractErrorMessage(
				response,
				"Failed to update event series",
			),
		);
	}

	const data = await response.json();
	return data?.data;
}

export async function archiveEventSeries(
	identifier: string,
	init?: ExtendedRequestInit,
): Promise<EventSeriesDetail> {
	const response = await fetch(
		buildApiUrl(`/api/event-series/${identifier}`),
		createRequestInit({
			...init,
			method: "DELETE",
		}),
	);

	if (!response.ok) {
		throw new Error(
			await extractErrorMessage(
				response,
				"Failed to archive event series",
			),
		);
	}

	const data = await response.json();
	return data?.data;
}

export async function fetchEventSeriesSubscriptionStatus(
	identifier: string,
	init?: ExtendedRequestInit,
): Promise<EventSeriesSubscriptionState> {
	const response = await fetch(
		buildApiUrl(`/api/event-series/${identifier}/subscription`),
		createRequestInit(init),
	);

	if (response.status === 401) {
		return {
			subscribed: false,
		};
	}

	if (!response.ok) {
		throw new Error(
			await extractErrorMessage(
				response,
				"Failed to fetch event series subscription status",
			),
		);
	}

	const data = await response.json();
	return (
		data?.data ?? {
			subscribed: false,
		}
	);
}

export async function subscribeEventSeries(
	identifier: string,
	payload?: {
		notifyEmail?: boolean;
		notifyInApp?: boolean;
	},
	init?: ExtendedRequestInit,
): Promise<EventSeriesSubscriptionState> {
	const response = await fetch(
		buildApiUrl(`/api/event-series/${identifier}/subscription`),
		createRequestInit({
			...init,
			method: "POST",
			headers: mergeJsonHeaders(init),
			body: JSON.stringify({
				notifyEmail: payload?.notifyEmail ?? true,
				notifyInApp: payload?.notifyInApp ?? true,
			}),
		}),
	);

	if (!response.ok) {
		throw new Error(
			await extractErrorMessage(
				response,
				"Failed to subscribe event series",
			),
		);
	}

	const data = await response.json();
	return data?.data;
}

export async function unsubscribeEventSeries(
	identifier: string,
	init?: ExtendedRequestInit,
): Promise<EventSeriesSubscriptionState> {
	const response = await fetch(
		buildApiUrl(`/api/event-series/${identifier}/subscription`),
		createRequestInit({
			...init,
			method: "DELETE",
		}),
	);

	if (!response.ok) {
		throw new Error(
			await extractErrorMessage(
				response,
				"Failed to unsubscribe event series",
			),
		);
	}

	const data = await response.json();
	return data?.data;
}

export interface MarketingOrganizationListParams {
	search?: string;
	tags?: string[];
	page?: number;
	limit?: number;
}

export interface MarketingOrganizationListItem {
	id: string;
	name: string;
	summary: string | null;
	description: string | null;
	location: string | null;
	tags: string[];
	logo: string | null;
	slug: string | null;
	createdAt: string;
}

export interface MarketingOrganizationListResponse {
	organizations: MarketingOrganizationListItem[];
	pagination: {
		page: number;
		limit: number;
		total: number;
		totalPages: number;
	};
}

export async function fetchMarketingOrganizations(
	params: MarketingOrganizationListParams = {},
	init?: ExtendedRequestInit,
): Promise<MarketingOrganizationListResponse> {
	const searchParams = new URLSearchParams();
	if (params.page) searchParams.set("page", params.page.toString());
	if (params.limit) searchParams.set("limit", params.limit.toString());
	if (params.search) searchParams.set("search", params.search);
	if (params.tags && params.tags.length > 0)
		searchParams.set("tags", params.tags.join(","));

	const response = await fetch(
		buildApiUrl("/api/organizations", searchParams),
		createRequestInit(init),
	);

	if (!response.ok) {
		throw new Error("Failed to fetch organizations");
	}

	return response.json();
}

export interface ProjectSearchParams {
	stage?: string;
	search?: string;
	organization?: string;
	sort?: string;
	sortOrder?: "asc" | "desc";
}

export interface PublicProjectsResponse {
	projects: any[];
	stats: { stats: any[]; totalProjects: number };
	organizations: any[];
}

export async function fetchPublicProjects(
	params: ProjectSearchParams,
	init?: ExtendedRequestInit,
): Promise<PublicProjectsResponse> {
	const searchParams = new URLSearchParams();
	if (params.stage) searchParams.set("stage", params.stage);
	if (params.search) searchParams.set("search", params.search);
	if (params.organization)
		searchParams.set("organization", params.organization);
	if (params.sort) searchParams.set("sort", params.sort);
	if (params.sortOrder) searchParams.set("sortOrder", params.sortOrder);

	const response = await fetch(
		buildApiUrl("/api/projects/public", searchParams),
		createRequestInit({
			...init,
			// 为项目数据添加合理的缓存时间
			next: { revalidate: 600, ...init?.next }, // 10分钟缓存，项目数据更新频率适中
		}),
	);

	if (!response.ok) {
		throw new Error("Failed to fetch projects");
	}

	return response.json();
}
