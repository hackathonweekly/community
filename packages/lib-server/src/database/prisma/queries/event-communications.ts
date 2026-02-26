import { db } from "@community/lib-server/database";
import {
	isSendableEmail,
	isVirtualEmail,
} from "@community/lib-server/mail/address";
import type { CommunicationType, CommunicationStatus } from "@prisma/client";

// 通信配置常量
const COMMUNICATION_LIMITS = {
	MAX_PER_EVENT: 8,
} as const;

// 检查是否可以发送通信
export async function canSendCommunication(eventId: string): Promise<{
	canSend: boolean;
	remainingCount: number;
	totalUsed: number;
	maxAllowed: number;
}> {
	const count = await db.eventCommunication.count({
		where: { eventId },
	});

	const maxAllowed = COMMUNICATION_LIMITS.MAX_PER_EVENT;
	return {
		canSend: count < maxAllowed,
		remainingCount: maxAllowed - count,
		totalUsed: count,
		maxAllowed,
	};
}

// 创建活动通信记录
export async function createEventCommunication(data: {
	eventId: string;
	sentBy: string;
	type: CommunicationType;
	subject: string;
	content: string;
	scheduledAt?: Date;
}) {
	const { canSend } = await canSendCommunication(data.eventId);

	if (!canSend) {
		throw new Error(
			`已达到该活动的最大通信次数限制（${COMMUNICATION_LIMITS.MAX_PER_EVENT}次）`,
		);
	}

	// 获取所有已确认报名的参与者
	const registrations = await db.eventRegistration.findMany({
		where: {
			eventId: data.eventId,
			status: {
				in: ["APPROVED", "PENDING"],
			},
		},
		include: {
			user: {
				select: {
					id: true,
					email: true,
					emailVerified: true,
					phoneNumber: true,
					phoneNumberVerified: true,
					name: true,
				},
			},
		},
	});

	if (registrations.length === 0) {
		throw new Error("该活动暂无报名用户，无法发送通信");
	}

	// 验证通信类型和用户信息（只发送给已验证的用户）
	let skippedVirtualEmails = 0;
	let missingEmailCount = 0;

	const validRecipients = registrations.filter((reg) => {
		if (data.type === "EMAIL") {
			const email = reg.user.email;
			if (!email || email.trim().length === 0) {
				missingEmailCount++;
				return false;
			}
			if (!isSendableEmail(email)) {
				if (isVirtualEmail(email)) {
					skippedVirtualEmails++;
				}
				return false;
			}
			return true;
		}
		if (data.type === "SMS") {
			return (
				reg.user.phoneNumber && reg.user.phoneNumberVerified === true
			);
		}
		return false;
	});

	const unreachableEmailCount = skippedVirtualEmails + missingEmailCount;

	if (validRecipients.length === 0) {
		const missingField =
			data.type === "EMAIL" ? "已验证邮箱" : "已验证手机号";
		throw new Error(
			`所有报名用户都没有${missingField}，无法发送${data.type === "EMAIL" ? "邮件" : "短信"}`,
		);
	}

	return await db.$transaction(async (tx) => {
		// 创建通信记录
		const communication = await tx.eventCommunication.create({
			data: {
				...data,
				totalRecipients: validRecipients.length,
				status: data.scheduledAt ? "PENDING" : "SENDING",
			},
			include: {
				event: {
					select: {
						id: true,
						title: true,
					},
				},
				sender: {
					select: {
						id: true,
						name: true,
						email: true,
					},
				},
			},
		});

		// 创建具体的发送记录
		const recordsData = validRecipients.map((reg) => ({
			communicationId: communication.id,
			eventId: data.eventId,
			recipientId: reg.user.id,
			recipientEmail: data.type === "EMAIL" ? reg.user.email : null,
			recipientPhone: data.type === "SMS" ? reg.user.phoneNumber : null,
		}));

		await tx.eventCommunicationRecord.createMany({
			data: recordsData,
		});

		return {
			...communication,
			validRecipientsCount: validRecipients.length,
			totalRegistrations: registrations.length,
			unverifiedUsersCount: unreachableEmailCount,
			virtualEmailCount: skippedVirtualEmails,
			missingEmailCount,
		};
	});
}

// 获取活动的通信历史
export async function getEventCommunications(
	eventId: string,
	params: {
		page?: number;
		limit?: number;
	} = {},
) {
	const { page = 1, limit = 20 } = params;
	const skip = (page - 1) * limit;

	const [communications, total] = await Promise.all([
		db.eventCommunication.findMany({
			where: { eventId },
			include: {
				sender: {
					select: {
						id: true,
						name: true,
						image: true,
						username: true,
					},
				},
				_count: {
					select: {
						records: true,
					},
				},
			},
			orderBy: {
				createdAt: "desc",
			},
			skip,
			take: limit,
		}),
		db.eventCommunication.count({
			where: { eventId },
		}),
	]);

	return {
		communications,
		pagination: {
			page,
			limit,
			total,
			totalPages: Math.ceil(total / limit),
		},
	};
}

// 获取通信的详细发送记录
export async function getCommunicationRecords(
	communicationId: string,
	params: {
		page?: number;
		limit?: number;
	} = {},
) {
	const { page = 1, limit = 50 } = params;
	const skip = (page - 1) * limit;

	const [records, total] = await Promise.all([
		db.eventCommunicationRecord.findMany({
			where: { communicationId },
			include: {
				recipient: {
					select: {
						id: true,
						name: true,
						image: true,
						username: true,
						email: true,
						phoneNumber: true,
					},
				},
			},
			orderBy: [
				{ status: "asc" }, // 失败的排在前面
				{ createdAt: "desc" },
			],
			skip,
			take: limit,
		}),
		db.eventCommunicationRecord.count({
			where: { communicationId },
		}),
	]);

	return {
		records,
		pagination: {
			page,
			limit,
			total,
			totalPages: Math.ceil(total / limit),
		},
	};
}

// 更新通信记录状态
export async function updateCommunicationRecord(
	recordId: string,
	data: {
		status?: "SENT" | "DELIVERED" | "READ" | "FAILED";
		deliveredAt?: Date;
		readAt?: Date;
		errorMessage?: string;
		externalMessageId?: string;
	},
) {
	return await db.eventCommunicationRecord.update({
		where: { id: recordId },
		data: {
			...data,
			sentAt: data.status === "SENT" ? new Date() : undefined,
		},
	});
}

// 批量更新通信记录状态
export async function batchUpdateCommunicationRecords(
	communicationId: string,
	updates: Array<{
		recordId: string;
		status: "SENT" | "DELIVERED" | "READ" | "FAILED";
		errorMessage?: string;
		externalMessageId?: string;
	}>,
) {
	return await db.$transaction(
		updates.map((update) =>
			db.eventCommunicationRecord.update({
				where: { id: update.recordId },
				data: {
					status: update.status,
					errorMessage: update.errorMessage,
					externalMessageId: update.externalMessageId,
					sentAt: update.status === "SENT" ? new Date() : undefined,
				},
			}),
		),
	);
}

// 更新通信主记录的统计数据
export async function updateCommunicationStats(communicationId: string) {
	const stats = await db.eventCommunicationRecord.groupBy({
		by: ["status"],
		where: { communicationId },
		_count: true,
	});

	const sentCount = stats.find((s) => s.status === "SENT")?._count || 0;
	const deliveredCount =
		stats.find((s) => s.status === "DELIVERED")?._count || 0;
	const failedCount = stats.find((s) => s.status === "FAILED")?._count || 0;

	const totalRecords = await db.eventCommunicationRecord.count({
		where: { communicationId },
	});

	// 判断整体状态
	let status: CommunicationStatus = "SENDING";
	if (failedCount === totalRecords) {
		status = "FAILED";
	} else if (sentCount + deliveredCount + failedCount === totalRecords) {
		status = "COMPLETED";
	}

	return await db.eventCommunication.update({
		where: { id: communicationId },
		data: {
			sentCount,
			deliveredCount,
			failedCount,
			status,
			sentAt:
				status === "COMPLETED" || status === "FAILED"
					? new Date()
					: undefined,
		},
	});
}

// 重试失败的通信记录
export async function retryFailedCommunicationRecords(communicationId: string) {
	const failedRecords = await db.eventCommunicationRecord.findMany({
		where: {
			communicationId,
			status: "FAILED",
			retryCount: {
				lt: 3, // 最多重试3次
			},
		},
		include: {
			recipient: {
				select: {
					id: true,
					name: true,
					email: true,
					phoneNumber: true,
				},
			},
			communication: {
				select: {
					type: true,
					subject: true,
					content: true,
				},
			},
		},
	});

	if (failedRecords.length === 0) {
		throw new Error("没有可重试的失败记录");
	}

	// 重置状态为PENDING，增加重试计数
	await db.eventCommunicationRecord.updateMany({
		where: {
			id: {
				in: failedRecords.map((r) => r.id),
			},
		},
		data: {
			status: "PENDING",
			retryCount: {
				increment: 1,
			},
			errorMessage: null,
		},
	});

	return failedRecords;
}

// 获取用户收到的活动通信
export async function getUserEventCommunications(
	userId: string,
	params: {
		eventId?: string;
		page?: number;
		limit?: number;
	} = {},
) {
	const { eventId, page = 1, limit = 20 } = params;
	const skip = (page - 1) * limit;

	const where = {
		recipientId: userId,
		...(eventId && { eventId }),
	};

	const [records, total] = await Promise.all([
		db.eventCommunicationRecord.findMany({
			where,
			include: {
				communication: {
					select: {
						id: true,
						type: true,
						subject: true,
						content: true,
						createdAt: true,
					},
				},
				event: {
					select: {
						id: true,
						title: true,
						startTime: true,
					},
				},
			},
			orderBy: {
				createdAt: "desc",
			},
			skip,
			take: limit,
		}),
		db.eventCommunicationRecord.count({ where }),
	]);

	return {
		records,
		pagination: {
			page,
			limit,
			total,
			totalPages: Math.ceil(total / limit),
		},
	};
}
