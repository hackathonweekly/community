/**
 * 缓存管理和按需重新验证工具
 * 用于在数据更新时主动刷新相关缓存
 * 注意：此文件只能在服务端使用，包含 Next.js 服务端 API
 */

import { revalidateTag, revalidatePath } from "next/cache";
import { CACHE_TAGS, CACHE_PATHS } from "./events-cache-constants";

/**
 * 活动相关缓存管理
 */
export class EventsCacheManager {
	/**
	 * 活动创建后刷新缓存
	 */
	static async onEventCreated(eventId: string) {
		await Promise.all([
			revalidateTag(CACHE_TAGS.events, {}),
			revalidateTag(CACHE_TAGS.eventsList, {}),
			revalidateTag(CACHE_TAGS.userEvents, {}),
			revalidateTag(CACHE_TAGS.eventsPage, {}),
			revalidatePath(CACHE_PATHS.events),
		]);

		console.log(`Cache invalidated for event creation: ${eventId}`);
	}

	/**
	 * 活动更新后刷新缓存
	 */
	static async onEventUpdated(eventId: string) {
		await Promise.all([
			revalidateTag(CACHE_TAGS.events, {}),
			revalidateTag(CACHE_TAGS.eventsList, {}),
			revalidateTag(CACHE_TAGS.eventDetails(eventId), {}),
			revalidateTag(CACHE_TAGS.userEvents, {}),
			revalidateTag(CACHE_TAGS.eventsPage, {}),
			revalidatePath(CACHE_PATHS.events),
		]);

		console.log(`Cache invalidated for event update: ${eventId}`);
	}

	/**
	 * 活动删除后刷新缓存
	 */
	static async onEventDeleted(eventId: string) {
		await Promise.all([
			revalidateTag(CACHE_TAGS.events, {}),
			revalidateTag(CACHE_TAGS.eventsList, {}),
			revalidateTag(CACHE_TAGS.eventDetails(eventId), {}),
			revalidateTag(CACHE_TAGS.userEvents, {}),
			revalidateTag(CACHE_TAGS.eventsPage, {}),
			revalidatePath(CACHE_PATHS.events),
		]);

		console.log(`Cache invalidated for event deletion: ${eventId}`);
	}

	/**
	 * 用户报名/取消报名后刷新缓存
	 */
	static async onRegistrationChanged(eventId: string, userId: string) {
		await Promise.all([
			revalidateTag(CACHE_TAGS.events, {}),
			revalidateTag(CACHE_TAGS.eventsList, {}),
			revalidateTag(CACHE_TAGS.eventDetails(eventId), {}),
			revalidateTag(CACHE_TAGS.userRegistrations, {}),
			revalidateTag(CACHE_TAGS.eventsPage, {}),
		]);

		console.log(
			`Cache invalidated for registration change: event ${eventId}, user ${userId}`,
		);
	}

	/**
	 * 组织信息更新后刷新缓存
	 */
	static async onOrganizationUpdated(organizationId: string) {
		await Promise.all([
			revalidateTag(CACHE_TAGS.organizations, {}),
			revalidateTag(CACHE_TAGS.eventsOrganizations, {}),
			revalidateTag(CACHE_TAGS.events, {}), // 组织活动也会受影响
			revalidateTag(CACHE_TAGS.eventsPage, {}),
			revalidatePath(CACHE_PATHS.events),
		]);

		console.log(
			`Cache invalidated for organization update: ${organizationId}`,
		);
	}

	/**
	 * 批量刷新所有活动相关缓存（用于重大更新）
	 */
	static async invalidateAll() {
		await Promise.all([
			revalidateTag(CACHE_TAGS.events, {}),
			revalidateTag(CACHE_TAGS.eventsList, {}),
			revalidateTag(CACHE_TAGS.organizations, {}),
			revalidateTag(CACHE_TAGS.eventsOrganizations, {}),
			revalidateTag(CACHE_TAGS.userRegistrations, {}),
			revalidateTag(CACHE_TAGS.userEvents, {}),
			revalidateTag(CACHE_TAGS.eventsPage, {}),
			revalidatePath(CACHE_PATHS.events),
		]);

		console.log("All events-related cache invalidated");
	}

	/**
	 * 定时刷新（可用于 cron job）
	 */
	static async scheduledRefresh() {
		await Promise.all([
			revalidateTag(CACHE_TAGS.events, {}),
			revalidateTag(CACHE_TAGS.eventsList, {}),
			revalidateTag(CACHE_TAGS.eventsPage, {}),
		]);

		console.log("Scheduled cache refresh completed");
	}
}

/**
 * API 路由中使用的缓存刷新辅助函数
 */
export async function invalidateEventsCache(
	type: "create" | "update" | "delete" | "registration",
	eventId?: string,
	userId?: string,
) {
	switch (type) {
		case "create":
			if (eventId) await EventsCacheManager.onEventCreated(eventId);
			break;
		case "update":
			if (eventId) await EventsCacheManager.onEventUpdated(eventId);
			break;
		case "delete":
			if (eventId) await EventsCacheManager.onEventDeleted(eventId);
			break;
		case "registration":
			if (eventId && userId)
				await EventsCacheManager.onRegistrationChanged(eventId, userId);
			break;
	}
}
