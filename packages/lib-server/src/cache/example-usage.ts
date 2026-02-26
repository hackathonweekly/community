/**
 * 示例：在 API 路由中使用缓存管理
 * 展示如何在活动创建/更新时主动刷新缓存
 */

import { type NextRequest, NextResponse } from "next/server";
import {
	EventsCacheManager,
	invalidateEventsCache,
} from "@community/lib-server/cache/events-cache";

// 示例：活动创建 API
export async function POST(request: NextRequest) {
	try {
		// 这里是实际的活动创建逻辑
		const eventData = await request.json();

		// 假设创建了活动，获得活动 ID
		const newEventId = "example-event-id";

		// 活动创建成功后，立即刷新相关缓存
		await EventsCacheManager.onEventCreated(newEventId);

		// 或者使用更简单的辅助函数
		await invalidateEventsCache("create", newEventId);

		return NextResponse.json({
			success: true,
			eventId: newEventId,
		});
	} catch (error) {
		console.error("Failed to create event:", error);
		return NextResponse.json(
			{ error: "Failed to create event" },
			{ status: 500 },
		);
	}
}

// 示例：活动更新 API
export async function PUT(
	request: NextRequest,
	{ params }: { params: { id: string } },
) {
	try {
		const eventId = params.id;
		const updateData = await request.json();

		// 这里是实际的活动更新逻辑

		// 活动更新成功后，立即刷新相关缓存
		await EventsCacheManager.onEventUpdated(eventId);

		return NextResponse.json({
			success: true,
			eventId,
		});
	} catch (error) {
		console.error("Failed to update event:", error);
		return NextResponse.json(
			{ error: "Failed to update event" },
			{ status: 500 },
		);
	}
}

// 示例：用户报名 API
export async function POST_REGISTRATION(
	request: NextRequest,
	{ params }: { params: { eventId: string } },
) {
	try {
		const eventId = params.eventId;
		const { userId } = await request.json();

		// 这里是实际的报名逻辑

		// 报名成功后，刷新相关缓存
		await EventsCacheManager.onRegistrationChanged(eventId, userId);

		return NextResponse.json({
			success: true,
		});
	} catch (error) {
		console.error("Failed to register for event:", error);
		return NextResponse.json(
			{ error: "Failed to register" },
			{ status: 500 },
		);
	}
}

// 示例：获取缓存性能指标的管理接口
export async function GET(request: NextRequest) {
	const url = new URL(request.url);
	const action = url.searchParams.get("action");

	if (action === "cache-stats") {
		// 返回缓存统计信息（仅管理员可访问）
		const { CacheMonitor } = await import(
			"@community/lib-server/cache/events-cache-constants"
		);
		const metrics = CacheMonitor.getMetrics();

		return NextResponse.json({ metrics });
	}

	if (action === "invalidate-all") {
		// 强制刷新所有缓存（仅管理员可访问）
		await EventsCacheManager.invalidateAll();

		return NextResponse.json({
			success: true,
			message: "All caches invalidated",
		});
	}

	return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
