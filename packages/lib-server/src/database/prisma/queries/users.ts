import { nanoid } from "nanoid";
import { Prisma } from "@prisma/client";
import { db } from "../client";

/**
 * User and account management queries for HackathonWeekly platform
 */

/**
 * Retrieves users with optional search query and pagination
 * @param query - Optional search term to filter by name
 */
export async function getUsers({
	limit,
	offset,
	query,
}: {
	limit: number;
	offset: number;
	query?: string;
}) {
	const whereClause = query
		? {
				OR: [
					{ name: { contains: query, mode: "insensitive" as const } },
					{
						email: {
							contains: query,
							mode: "insensitive" as const,
						},
					},
				],
			}
		: undefined;

	return await db.user.findMany({
		where: whereClause,
		orderBy: { createdAt: "desc" },
		take: limit,
		skip: offset,
	});
}

/**
 * Returns the total count of all users in the system
 */
export async function countAllUsers() {
	return await db.user.count();
}

/**
 * Finds a user by their unique ID
 */
export async function getUserById(id: string) {
	return await db.user.findUnique({
		where: { id },
	});
}

/**
 * Finds a user by their email address
 */
export async function getUserByEmail(email: string) {
	return await db.user.findUnique({
		where: { email },
	});
}

/**
 * Creates a new user with specified attributes
 */
export async function createUser({
	email,
	name,
	role,
	emailVerified,
	onboardingComplete,
}: {
	email: string;
	name: string;
	role: "admin" | "user";
	emailVerified: boolean;
	onboardingComplete: boolean;
}) {
	const now = new Date();

	return await db.user.create({
		data: {
			id: nanoid(),
			email,
			name,
			role,
			emailVerified,
			onboardingComplete,
			createdAt: now,
			updatedAt: now,
		},
	});
}

/**
 * Finds an authentication account by ID
 */
export async function getAccountById(id: string) {
	return await db.account.findUnique({
		where: { id },
	});
}

/**
 * Creates a new authentication account for a user
 * Supports password-based and OAuth provider accounts
 */
export async function createUserAccount({
	userId,
	providerId,
	accountId,
	hashedPassword,
}: {
	userId: string;
	providerId: string;
	accountId: string;
	hashedPassword?: string;
}) {
	const now = new Date();

	return await db.account.create({
		data: {
			id: nanoid(),
			userId,
			accountId,
			providerId,
			password: hashedPassword,
			createdAt: now,
			updatedAt: now,
		},
	});
}

/**
 * Updates an existing user record
 */
export async function updateUser(
	user: Prisma.UserUncheckedUpdateInput & { id: string },
) {
	const { id, ...updateData } = user;

	return await db.user.update({
		where: { id },
		data: { ...updateData, updatedAt: new Date() },
	});
}
