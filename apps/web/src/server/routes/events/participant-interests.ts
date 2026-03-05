import { auth } from "@community/lib-server/auth";
import { db } from "@community/lib-server/database/prisma";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";

const toggleInterestSchema = z.object({
	targetUserId: z.string().min(1, "Target user ID is required"),
});

const getInterestsSchema = z.object({
	type: z.enum(["interested_in", "interested_by"]).optional(),
});

const app = new Hono();

// POST /api/events/:eventId/participant-interests - Toggle interest in a participant
app.post("/", zValidator("json", toggleInterestSchema), async (c) => {
	try {
		const session = await auth.api.getSession({
			headers: c.req.raw.headers,
		});

		if (!session) {
			return c.json(
				{
					success: false,
					error: "Authentication required",
				},
				401,
			);
		}

		const eventId = c.req.param("eventId");

		if (!eventId) {
			return c.json(
				{
					success: false,
					error: "Event ID is required",
				},
				400,
			);
		}

		const { targetUserId } = c.req.valid("json");

		// 不能对自己感兴趣
		if (session.user.id === targetUserId) {
			return c.json(
				{
					success: false,
					error: "Cannot be interested in yourself",
				},
				400,
			);
		}

		// 检查当前用户是否已报名该活动
		const userRegistration = await db.eventRegistration.findUnique({
			where: {
				eventId_userId: {
					eventId,
					userId: session.user.id,
				},
			},
		});

		if (!userRegistration || userRegistration.status !== "APPROVED") {
			return c.json(
				{
					success: false,
					error: "You must be an approved participant of this event",
				},
				403,
			);
		}

		// 检查目标用户是否已报名该活动
		const targetRegistration = await db.eventRegistration.findUnique({
			where: {
				eventId_userId: {
					eventId,
					userId: targetUserId,
				},
			},
		});

		if (!targetRegistration || targetRegistration.status !== "APPROVED") {
			return c.json(
				{
					success: false,
					error: "Target user must be an approved participant of this event",
				},
				403,
			);
		}

		// 检查是否已经存在感兴趣关系
		const existingInterest = await db.eventParticipantInterest.findUnique({
			where: {
				eventId_interestedUserId_targetUserId: {
					eventId,
					interestedUserId: session.user.id,
					targetUserId,
				},
			},
		});

		let result;
		if (existingInterest) {
			// 如果已存在，则删除（取消感兴趣）
			await db.eventParticipantInterest.delete({
				where: {
					id: existingInterest.id,
				},
			});
			result = { action: "removed", interested: false };
		} else {
			// 如果不存在，则创建（表示感兴趣）
			await db.eventParticipantInterest.create({
				data: {
					eventId,
					interestedUserId: session.user.id,
					targetUserId,
				},
			});
			result = { action: "added", interested: true };
		}

		return c.json({
			success: true,
			data: result,
		});
	} catch (error) {
		console.error("Error toggling participant interest:", error);
		return c.json(
			{
				success: false,
				error: "Failed to toggle participant interest",
			},
			500,
		);
	}
});

// GET /api/events/:eventId/participant-interests - Get interests for current user
app.get("/", zValidator("query", getInterestsSchema), async (c) => {
	try {
		const session = await auth.api.getSession({
			headers: c.req.raw.headers,
		});

		if (!session) {
			return c.json(
				{
					success: false,
					error: "Authentication required",
				},
				401,
			);
		}

		const eventId = c.req.param("eventId");

		if (!eventId) {
			return c.json(
				{
					success: false,
					error: "Event ID is required",
				},
				400,
			);
		}

		const { type } = c.req.valid("query");

		// 检查当前用户是否已报名该活动
		const userRegistration = await db.eventRegistration.findUnique({
			where: {
				eventId_userId: {
					eventId,
					userId: session.user.id,
				},
			},
		});

		if (!userRegistration || userRegistration.status !== "APPROVED") {
			return c.json(
				{
					success: false,
					error: "You must be an approved participant of this event",
				},
				403,
			);
		}

		let result = {};

		if (!type || type === "interested_in") {
			// 获取我感兴趣的人
			const interestedIn = await db.eventParticipantInterest.findMany({
				where: {
					eventId,
					interestedUserId: session.user.id,
				},
				include: {
					targetUser: {
						select: {
							id: true,
							name: true,
							image: true,
							username: true,
							userRoleString: true,
							currentWorkOn: true,
							bio: true,
						},
					},
				},
				orderBy: {
					createdAt: "desc",
				},
			});

			result = {
				...result,
				interestedIn: interestedIn.map((interest) => ({
					id: interest.id,
					user: interest.targetUser,
					createdAt: interest.createdAt,
				})),
			};
		}

		if (!type || type === "interested_by") {
			// 获取对我感兴趣的人
			const interestedBy = await db.eventParticipantInterest.findMany({
				where: {
					eventId,
					targetUserId: session.user.id,
				},
				include: {
					interestedUser: {
						select: {
							id: true,
							name: true,
							image: true,
							username: true,
							userRoleString: true,
							currentWorkOn: true,
							bio: true,
						},
					},
				},
				orderBy: {
					createdAt: "desc",
				},
			});

			result = {
				...result,
				interestedBy: interestedBy.map((interest) => ({
					id: interest.id,
					user: interest.interestedUser,
					createdAt: interest.createdAt,
				})),
			};
		}

		return c.json({
			success: true,
			data: result,
		});
	} catch (error) {
		console.error("Error fetching participant interests:", error);
		return c.json(
			{
				success: false,
				error: "Failed to fetch participant interests",
			},
			500,
		);
	}
});

// GET /api/events/:eventId/participant-interests/status/:targetUserId - Check if interested in specific user
app.get("/status/:targetUserId", async (c) => {
	try {
		const session = await auth.api.getSession({
			headers: c.req.raw.headers,
		});

		if (!session) {
			return c.json({
				success: true,
				data: { interested: false },
			});
		}

		const eventId = c.req.param("eventId");
		const targetUserId = c.req.param("targetUserId");

		if (!eventId) {
			return c.json(
				{
					success: false,
					error: "Event ID is required",
				},
				400,
			);
		}

		if (!targetUserId) {
			return c.json(
				{
					success: false,
					error: "Target user ID is required",
				},
				400,
			);
		}

		// 检查是否存在感兴趣关系
		const interest = await db.eventParticipantInterest.findUnique({
			where: {
				eventId_interestedUserId_targetUserId: {
					eventId,
					interestedUserId: session.user.id,
					targetUserId,
				},
			},
		});

		return c.json({
			success: true,
			data: { interested: !!interest },
		});
	} catch (error) {
		console.error("Error checking participant interest status:", error);
		return c.json(
			{
				success: false,
				error: "Failed to check participant interest status",
			},
			500,
		);
	}
});

export default app;
