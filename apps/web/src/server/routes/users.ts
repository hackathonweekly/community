import { auth } from "@community/lib-server/auth";
import { db } from "@community/lib-server/database/prisma/client";
import { zValidator } from "@hono/zod-validator";
import type { Prisma } from "@prisma/client";
import { Hono } from "hono";
import { z } from "zod";

const userSearchSchema = z.object({
	query: z.string().min(2, "Search query must be at least 2 characters"),
	limit: z
		.string()
		.optional()
		.default("20")
		.transform((val) => {
			const parsed = Number.parseInt(val, 10);
			return Number.isFinite(parsed) ? parsed : 20;
		}),
});

const app = new Hono();
const USER_SEARCH_MAX_RESULTS = 50;
const USER_SEARCH_CANDIDATE_LIMIT = 200;

interface SearchCandidateUser {
	id: string;
	name: string;
	email: string;
	username: string | null;
	image: string | null;
	userRoleString: string | null;
	membershipLevel: string | null;
	currentWorkOn: string | null;
	phoneNumber: string | null;
}

function normalizeQuery(query: string): string {
	return query.trim();
}

function normalizePhoneQuery(query: string): string {
	return query.replace(/\D/g, "");
}

function scoreSearchCandidate(
	user: SearchCandidateUser,
	queryLower: string,
	phoneQuery: string,
): number {
	const nameLower = user.name.toLowerCase();
	const usernameLower = (user.username ?? "").toLowerCase();
	const emailLower = user.email.toLowerCase();
	const phoneLower = (user.phoneNumber ?? "").toLowerCase();
	const phoneDigits = normalizePhoneQuery(user.phoneNumber ?? "");

	let score = 0;

	if (phoneQuery.length > 0) {
		if (phoneDigits === phoneQuery) score += 140;
		else if (phoneDigits.startsWith(phoneQuery)) score += 110;
		else if (phoneDigits.includes(phoneQuery)) score += 80;
	}

	if (usernameLower === queryLower) score += 130;
	else if (usernameLower.startsWith(queryLower)) score += 100;
	else if (usernameLower.includes(queryLower)) score += 70;

	if (nameLower === queryLower) score += 120;
	else if (nameLower.startsWith(queryLower)) score += 90;
	else if (nameLower.includes(queryLower)) score += 60;

	if (emailLower === queryLower) score += 90;
	else if (emailLower.startsWith(queryLower)) score += 70;
	else if (emailLower.includes(queryLower)) score += 40;

	if (phoneLower.startsWith(queryLower)) score += 50;
	else if (phoneLower.includes(queryLower)) score += 30;

	return score;
}

// GET /api/users/search - 搜索用户（需要认证）
app.get("/search", zValidator("query", userSearchSchema), async (c) => {
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

		const { query, limit } = c.req.valid("query");
		const normalizedQuery = normalizeQuery(query);
		if (normalizedQuery.length < 2) {
			return c.json(
				{
					success: false,
					error: "Search query must be at least 2 characters",
				},
				400,
			);
		}

		const normalizedQueryLower = normalizedQuery.toLowerCase();
		const normalizedPhone = normalizePhoneQuery(normalizedQuery);
		const safeLimit = Math.min(Math.max(limit, 1), USER_SEARCH_MAX_RESULTS);

		const searchConditions: Prisma.UserWhereInput[] = [
			{
				name: {
					contains: normalizedQuery,
					mode: "insensitive",
				},
			},
			{
				username: {
					contains: normalizedQuery,
					mode: "insensitive",
				},
			},
			{
				email: {
					contains: normalizedQuery,
					mode: "insensitive",
				},
			},
		];

		if (normalizedPhone.length >= 4) {
			searchConditions.push({
				phoneNumber: {
					contains: normalizedPhone,
				},
			});
		}

		// 搜索用户名、姓名或手机号
		const users = await db.user.findMany({
			where: {
				OR: searchConditions,
			},
			select: {
				id: true,
				name: true,
				email: true,
				username: true,
				image: true,
				userRoleString: true,
				membershipLevel: true,
				currentWorkOn: true,
				phoneNumber: true,
			},
			take: USER_SEARCH_CANDIDATE_LIMIT,
		});

		const rankedUsers = users
			.map((user) => ({
				user,
				score: scoreSearchCandidate(
					user,
					normalizedQueryLower,
					normalizedPhone,
				),
			}))
			.sort((a, b) => {
				if (b.score !== a.score) {
					return b.score - a.score;
				}
				return a.user.name.localeCompare(b.user.name, "zh-CN");
			})
			.slice(0, safeLimit)
			.map(({ user }) => {
				const { phoneNumber, email, ...safeUser } = user;
				return safeUser;
			});

		return c.json({
			success: true,
			data: rankedUsers,
		});
	} catch (error) {
		console.error("Error searching users:", error);
		return c.json(
			{
				success: false,
				error: "Failed to search users",
			},
			500,
		);
	}
});

export { app as usersRouter };
