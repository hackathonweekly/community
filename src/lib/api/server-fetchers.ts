/**
 * 服务端 API 获取函数
 * 用于在服务端组件中直接获取数据，支持分层缓存
 */

import type { EventListItem, EventOrganizationSummary } from "./api-fetchers";
import { CACHE_TAGS } from "../cache/events-cache-constants";

// 缓存时间配置
const CACHE_TIMES = {
	events: 10, // 10s - 活动列表、报名人数
	organizations: 3600, // 1小时 - 组织信息
	eventTypes: 86400, // 24小时 - 活动类型选项
} as const;

/**
 * 服务端获取活动列表
 */
export async function fetchEventsListServer(params?: {
	search?: string;
	type?: string;
	organizationId?: string;
	isOnline?: string;
	status?: string;
	showExpired?: boolean;
	hostType?: "organization" | "individual";
}): Promise<EventListItem[]> {
	const searchParams = new URLSearchParams();

	if (params?.search) searchParams.append("search", params.search);
	if (params?.type) searchParams.append("type", params.type);
	if (params?.organizationId)
		searchParams.append("organizationId", params.organizationId);
	if (params?.isOnline) searchParams.append("isOnline", params.isOnline);
	if (params?.status) searchParams.append("status", params.status);
	if (params?.showExpired) searchParams.append("showExpired", "true");
	if (params?.hostType) searchParams.append("hostType", params.hostType);

	const baseUrl =
		process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL;
	if (!baseUrl) {
		console.error(
			"Missing NEXT_PUBLIC_APP_URL or NEXT_PUBLIC_SITE_URL environment variable for server-side fetching",
		);
		return [];
	}

	const url = `${baseUrl}/api/events${
		searchParams.toString() ? `?${searchParams.toString()}` : ""
	}`;

	try {
		const response = await fetch(url, {
			next: {
				revalidate: CACHE_TIMES.events,
				tags: [CACHE_TAGS.events, CACHE_TAGS.eventsList],
			},
		});

		if (!response.ok) {
			console.error(
				`Failed to fetch events: ${response.status} ${response.statusText}`,
			);
			return [];
		}

		const data = await response.json();
		return data.data?.events || [];
	} catch (error) {
		console.error("Error fetching events:", error);
		return [];
	}
}

/**
 * 服务端获取组织列表
 */
export async function fetchEventsOrganizationsServer(): Promise<
	EventOrganizationSummary[]
> {
	const baseUrl =
		process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL;
	if (!baseUrl) {
		console.error(
			"Missing NEXT_PUBLIC_APP_URL or NEXT_PUBLIC_SITE_URL environment variable for server-side fetching",
		);
		return [];
	}

	const url = `${baseUrl}/api/organizations`;

	try {
		const response = await fetch(url, {
			next: {
				revalidate: CACHE_TIMES.organizations,
				tags: [
					CACHE_TAGS.organizations,
					CACHE_TAGS.eventsOrganizations,
				],
			},
		});

		if (!response.ok) {
			console.error(
				`Failed to fetch organizations: ${response.status} ${response.statusText}`,
			);
			return [];
		}

		const data = await response.json();
		return data.data?.organizations || [];
	} catch (error) {
		console.error("Error fetching organizations:", error);
		return [];
	}
}

/**
 * 服务端获取用户报名的活动
 */
export async function fetchUserRegistrationsServer(): Promise<any[]> {
	const baseUrl =
		process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL;
	if (!baseUrl) {
		console.error(
			"Missing NEXT_PUBLIC_APP_URL or NEXT_PUBLIC_SITE_URL environment variable for server-side fetching",
		);
		return [];
	}

	const url = `${baseUrl}/api/user/registrations`;

	try {
		const response = await fetch(url, {
			next: {
				revalidate: 300, // 5分钟缓存
				tags: [CACHE_TAGS.userRegistrations],
			},
		});

		if (!response.ok) {
			// 用户未登录或其他错误，返回空数组
			return [];
		}

		const data = await response.json();
		return data?.data?.registrations || [];
	} catch (error) {
		console.error("Error fetching user registrations:", error);
		return [];
	}
}

/**
 * 服务端获取用户创建的活动
 */
export async function fetchUserEventsServer(): Promise<any[]> {
	const baseUrl =
		process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL;
	if (!baseUrl) {
		console.error(
			"Missing NEXT_PUBLIC_APP_URL or NEXT_PUBLIC_SITE_URL environment variable for server-side fetching",
		);
		return [];
	}

	const url = `${baseUrl}/api/user/events`;

	try {
		const response = await fetch(url, {
			next: {
				revalidate: 300, // 5分钟缓存
				tags: [CACHE_TAGS.userEvents],
			},
		});

		if (!response.ok) {
			// 用户未登录或其他错误，返回空数组
			return [];
		}

		const data = await response.json();
		return data?.data?.events || [];
	} catch (error) {
		console.error("Error fetching user events:", error);
		return [];
	}
}

/**
 * 活动类型配置
 */
export const EVENT_TYPES = [
	{ value: "MEETUP", label: "常规活动" },
	{ value: "HACKATHON", label: "黑客马拉松" },
	{ value: "BUILDING_PUBLIC", label: "Build In Public" },
] as const;

/**
 * 获取活动类型标签
 */
export function getEventTypeLabel(value: string, t: (key: string) => string) {
	const typeLabels: Record<string, string> = {
		MEETUP: t("events.types.meetup"),
		HACKATHON: t("events.types.hackathon"),
		BUILDING_PUBLIC: t("events.types.buildingPublic"),
	};
	return typeLabels[value] || value;
}

/**
 * 获取主办方类型标签
 */
export function getHostTypeLabel(value: string, t: (key: string) => string) {
	const labels: Record<string, string> = {
		organization: t("events.filters.hostOrganizations"),
		individual: t("events.filters.hostIndividuals"),
		all: t("events.filters.hostAll"),
	};
	return labels[value] || value;
}
