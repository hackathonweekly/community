import type { AIRecommendation } from "@community/lib-server/services/ai-recommendation";
import { generateEventRecommendations } from "@community/lib-server/services/ai-recommendation";
import { db } from "@community/lib-server/database";

// 获取活动的AI推荐（简化版，直接调用AI服务）
export async function getEventRecommendations(
	eventId: string,
	userId?: string,
): Promise<AIRecommendation | null> {
	try {
		// 获取活动详情和参与者
		const event = await db.event.findUnique({
			where: { id: eventId },
			include: {
				registrations: {
					where: { status: "APPROVED" },
					include: {
						user: true,
					},
				},
				projectSubmissions: {
					where: { status: "APPROVED" },
					take: 20,
				},
			},
		});

		if (!event) {
			return null;
		}

		// 获取当前用户信息（如果是个性化推荐）
		let currentUser = null;
		if (userId) {
			currentUser = await db.user.findUnique({
				where: { id: userId },
			});
		}

		// 决定推荐类型
		const type = userId ? "PERSONAL" : "UNIFIED";

		// 直接生成推荐（不使用缓存表，因为数据库schema还未更新）
		const recommendations = await generateEventRecommendations(
			type as any,
			event,
			currentUser || undefined,
		);

		return recommendations;
	} catch (error) {
		console.error("Error getting event recommendations:", error);
		return null;
	}
}

// 刷新推荐
export async function refreshEventRecommendations(
	eventId: string,
	userId?: string,
): Promise<AIRecommendation | null> {
	// 直接生成新的推荐
	return await getEventRecommendations(eventId, userId);
}

// 提交推荐反馈（简化版，写入日志）
export async function submitRecommendationFeedback(
	recommendationId: string,
	userId: string,
	helpful: boolean,
	comment?: string,
): Promise<boolean> {
	try {
		// 暂时写入控制台日志，等数据库schema更新后再写入数据库
		console.log("Recommendation feedback:", {
			recommendationId,
			userId,
			helpful,
			comment,
			timestamp: new Date().toISOString(),
		});

		return true;
	} catch (error) {
		console.error("Error submitting feedback:", error);
		return false;
	}
}

// 检查用户是否已报名活动
export async function checkUserRegistration(
	eventId: string,
	userId: string,
): Promise<boolean> {
	try {
		const registration = await db.eventRegistration.findUnique({
			where: {
				eventId_userId: {
					eventId,
					userId,
				},
			},
		});

		return registration?.status === "APPROVED";
	} catch (error) {
		console.error("Error checking user registration:", error);
		return false;
	}
}
