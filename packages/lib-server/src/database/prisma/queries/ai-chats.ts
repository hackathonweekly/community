import { db } from "../client";
import type { AiChat } from "../zod";

/**
 * AI Chat database queries for HackathonWeekly community platform
 */

/**
 * Retrieves AI chat history for a specific user with pagination
 */
export async function getAiChatsByUserId({
	limit,
	offset,
	userId,
}: {
	limit: number;
	offset: number;
	userId: string;
}) {
	return await db.aiChat.findMany({
		where: { userId },
		orderBy: { createdAt: "desc" },
		take: limit,
		skip: offset,
	});
}

/**
 * Retrieves AI chat history for an organization with pagination
 */
export async function getAiChatsByOrganizationId({
	limit,
	offset,
	organizationId,
}: {
	limit: number;
	offset: number;
	organizationId: string;
}) {
	return await db.aiChat.findMany({
		where: { organizationId },
		orderBy: { createdAt: "desc" },
		take: limit,
		skip: offset,
	});
}

/**
 * Finds a single AI chat by ID
 */
export async function getAiChatById(id: string) {
	return await db.aiChat.findUnique({
		where: { id },
	});
}

/**
 * Creates a new AI chat session for a user or organization
 */
export async function createAiChat({
	organizationId,
	userId,
	title,
}: {
	organizationId?: string;
	userId: string;
	title?: string;
}) {
	return await db.aiChat.create({
		data: {
			organizationId,
			userId,
			title: title || "New Chat",
		},
	});
}

/**
 * Updates an existing AI chat with new title or messages
 */
export async function updateAiChat({
	id,
	title,
	messages,
}: {
	id: string;
	title?: string;
	messages?: AiChat["messages"];
}) {
	const updateData: { title?: string; messages?: AiChat["messages"] } = {};

	if (title !== undefined) updateData.title = title;
	if (messages !== undefined) updateData.messages = messages;

	return await db.aiChat.update({
		where: { id },
		data: updateData,
	});
}

/**
 * Deletes an AI chat session permanently
 */
export async function deleteAiChat(id: string) {
	return await db.aiChat.delete({
		where: { id },
	});
}
