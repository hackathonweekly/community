/**
 * 服务端 API 获取函数
 * 用于在服务端组件中直接获取数据，支持分层缓存
 */

import "server-only";

import type {
	EventListItem,
	EventOrganizationSummary,
} from "@community/lib-shared/api/api-fetchers";
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
