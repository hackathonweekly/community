import { db } from "@community/lib-server/database/prisma/client";
import { logger } from "@community/lib-server/logs";

const VIRTUAL_EMAIL_SUFFIXES = [
	"@wechat.app",
	"@sms.hackathonweekly.com",
] as const;

interface SyncRegistrationContactToUserInput {
	userId: string;
	contactEmail?: string | null;
	contactPhoneNumber?: string | null;
}

interface SyncRegistrationContactToUserResult {
	emailSynced: boolean;
	phoneNumberSynced: boolean;
}

const isVirtualEmail = (email: string) => {
	const normalized = email.trim().toLowerCase();
	return VIRTUAL_EMAIL_SUFFIXES.some((suffix) => normalized.endsWith(suffix));
};

export async function syncRegistrationContactToUser({
	userId,
	contactEmail,
	contactPhoneNumber,
}: SyncRegistrationContactToUserInput): Promise<SyncRegistrationContactToUserResult> {
	const result: SyncRegistrationContactToUserResult = {
		emailSynced: false,
		phoneNumberSynced: false,
	};

	try {
		const currentUser = await db.user.findUnique({
			where: { id: userId },
			select: {
				id: true,
				email: true,
				phoneNumber: true,
			},
		});

		if (!currentUser) {
			return result;
		}

		const data: {
			email?: string;
			emailVerified?: boolean;
			phoneNumber?: string;
			phoneNumberVerified?: boolean;
		} = {};

		const email = contactEmail?.trim();
		if (
			email &&
			!isVirtualEmail(email) &&
			email.toLowerCase() !== currentUser.email.toLowerCase()
		) {
			const existingEmailUser = await db.user.findFirst({
				where: {
					email: {
						equals: email,
						mode: "insensitive",
					},
					id: {
						not: userId,
					},
				},
				select: { id: true },
			});

			if (!existingEmailUser) {
				data.email = email;
				data.emailVerified = false;
				result.emailSynced = true;
			}
		}

		const phoneNumber = contactPhoneNumber?.trim();
		if (phoneNumber && phoneNumber !== currentUser.phoneNumber) {
			const existingPhoneUser = await db.user.findFirst({
				where: {
					phoneNumber,
					id: {
						not: userId,
					},
				},
				select: { id: true },
			});

			if (!existingPhoneUser) {
				data.phoneNumber = phoneNumber;
				data.phoneNumberVerified = false;
				result.phoneNumberSynced = true;
			}
		}

		if (Object.keys(data).length === 0) {
			return result;
		}

		await db.user.update({
			where: { id: userId },
			data,
		});
	} catch (error) {
		logger.warn("[REGISTRATION_CONTACT_SYNC] Failed to sync contact", {
			userId,
			error,
		});

		return {
			emailSynced: false,
			phoneNumberSynced: false,
		};
	}

	return result;
}
