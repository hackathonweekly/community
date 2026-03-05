import { config } from "@community/config";
import { db } from "@community/lib-server/database/prisma/client";
import { sendEventOrderCancelled } from "@community/lib-server/mail/events";
import type { Locale } from "@community/lib-shared/i18n";
import { getBaseUrl } from "@community/lib-shared/utils";
import { nanoid } from "nanoid";
import type { EventOrderInvite, RegistrationStatus } from "@prisma/client";

const DEFAULT_ORDER_EXPIRE_MINUTES = 30;

export const getOrderExpireMinutes = () => {
	const minutes = config.payments.providers.wechatpay.orderExpireMinutes;
	return minutes && minutes > 0 ? minutes : DEFAULT_ORDER_EXPIRE_MINUTES;
};

export const generateEventOrderNo = () =>
	`EVT${Date.now()}${nanoid(6).toUpperCase()}`;

export const generateOrderInviteCode = () => nanoid(24);

export interface TicketPricingTier {
	quantity: number;
	price: number;
	currency?: string | null;
}

export const resolveTicketPricing = (params: {
	basePrice?: number | null;
	priceTiers: TicketPricingTier[];
	quantity: number;
}) => {
	const { basePrice, priceTiers, quantity } = params;
	const tier = priceTiers.find(
		(candidate) => candidate.quantity === quantity,
	);

	if (tier) {
		return {
			unitPrice: tier.price / quantity,
			totalAmount: tier.price,
			currency: tier.currency || "CNY",
		};
	}

	const normalizedBasePrice = basePrice ?? 0;
	if (quantity === 1) {
		return {
			unitPrice: normalizedBasePrice,
			totalAmount: normalizedBasePrice,
			currency: "CNY",
		};
	}

	throw new Error("所选数量暂不支持购买，请选择可用的票档。");
};

export const buildOrderExpiration = () => {
	const expiresInMs = getOrderExpireMinutes() * 60 * 1000;
	return new Date(Date.now() + expiresInMs);
};

export async function cancelEventOrder(
	orderId: string,
	_reason?: "EXPIRED" | "USER_CANCELLED",
) {
	const result = await db.$transaction(async (tx) => {
		const order = await tx.eventOrder.findUnique({
			where: { id: orderId },
			select: {
				id: true,
				status: true,
				quantity: true,
				ticketTypeId: true,
				orderNo: true,
				event: {
					select: {
						id: true,
						title: true,
						startTime: true,
						address: true,
					},
				},
				user: {
					select: {
						name: true,
						email: true,
						locale: true,
					},
				},
			},
		});

		if (!order || order.status !== "PENDING") {
			return {
				order: order ?? null,
				shouldNotify: false,
				event: order?.event ?? null,
				user: order?.user ?? null,
			};
		}

		const updatedOrder = await tx.eventOrder.update({
			where: { id: orderId },
			data: { status: "CANCELLED" },
		});

		await tx.eventRegistration.updateMany({
			where: { orderId },
			data: { status: "CANCELLED" },
		});

		await tx.eventOrderInvite.updateMany({
			where: { orderId, status: "PENDING" },
			data: { status: "INVALID" },
		});

		await tx.eventTicketType.update({
			where: { id: order.ticketTypeId },
			data: {
				currentQuantity: { decrement: order.quantity },
			},
		});

		return {
			order: updatedOrder,
			shouldNotify: true,
			event: order.event,
			user: order.user,
			orderNo: order.orderNo,
		};
	});

	if (
		result.shouldNotify &&
		result.event &&
		result.user?.email &&
		result.orderNo
	) {
		const locale = (result.user.locale || undefined) as Locale | undefined;
		await sendEventOrderCancelled({
			eventTitle: result.event.title,
			eventDate: result.event.startTime.toISOString(),
			eventLocation: result.event.address || "线上活动",
			eventUrl: `${getBaseUrl()}/events/${result.event.id}`,
			userName: result.user.name || "",
			userEmail: result.user.email,
			orderNo: result.orderNo,
			locale,
		});
	}

	return result.order;
}

export async function markEventOrderPaid(params: {
	orderNo: string;
	transactionId: string;
	paidAt?: Date;
}) {
	return await db.$transaction(async (tx) => {
		const order = await tx.eventOrder.findUnique({
			where: { orderNo: params.orderNo },
			include: {
				event: { select: { requireApproval: true } },
			},
		});

		if (!order || order.status !== "PENDING") {
			return order;
		}

		const updatedOrder = await tx.eventOrder.update({
			where: { id: order.id },
			data: {
				status: "PAID",
				transactionId: params.transactionId,
				paidAt: params.paidAt ?? new Date(),
			},
		});

		const nextStatus: RegistrationStatus = order.event.requireApproval
			? "PENDING"
			: "APPROVED";

		await tx.eventRegistration.updateMany({
			where: { orderId: order.id, status: "PENDING_PAYMENT" },
			data: { status: nextStatus },
		});

		return {
			order: updatedOrder,
			registrationStatus: nextStatus,
		};
	});
}

export async function markEventOrderRefunded(params: {
	orderNo: string;
	refundId: string;
	refundedAt?: Date;
}) {
	return await db.$transaction(async (tx) => {
		const order = await tx.eventOrder.findUnique({
			where: { orderNo: params.orderNo },
			select: {
				id: true,
				status: true,
				quantity: true,
				ticketTypeId: true,
			},
		});

		if (!order || order.status === "REFUNDED") {
			return order;
		}

		const updatedOrder = await tx.eventOrder.update({
			where: { id: order.id },
			data: {
				status: "REFUNDED",
				refundId: params.refundId,
				refundedAt: params.refundedAt ?? new Date(),
			},
		});

		await tx.eventRegistration.updateMany({
			where: { orderId: order.id },
			data: { status: "CANCELLED" },
		});

		await tx.eventOrderInvite.updateMany({
			where: { orderId: order.id, status: "PENDING" },
			data: { status: "INVALID" },
		});

		await tx.eventTicketType.update({
			where: { id: order.ticketTypeId },
			data: {
				currentQuantity: { decrement: order.quantity },
			},
		});

		return updatedOrder;
	});
}

export async function createOrderInvites(params: {
	orderId: string;
	count: number;
}) {
	const { orderId, count } = params;
	if (count <= 0) {
		return [] as EventOrderInvite[];
	}

	const invites = Array.from({ length: count }, () => ({
		orderId,
		code: generateOrderInviteCode(),
	}));

	await db.eventOrderInvite.createMany({ data: invites });

	return await db.eventOrderInvite.findMany({
		where: { orderId },
		orderBy: { createdAt: "asc" },
	});
}

export async function redeemOrderInvite(params: {
	eventId: string;
	code: string;
	userId: string;
	allowDigitalCardDisplay?: boolean;
	answers?: Array<{ questionId: string; answer: string }>;
}) {
	const {
		eventId,
		code,
		userId,
		allowDigitalCardDisplay,
		answers = [],
	} = params;

	return await db.$transaction(async (tx) => {
		const invite = await tx.eventOrderInvite.findFirst({
			where: { code },
			include: {
				order: {
					include: {
						event: { select: { id: true, requireApproval: true } },
					},
				},
			},
		});

		if (!invite || invite.order.event.id !== eventId) {
			throw new Error("邀请链接无效或已过期。");
		}

		if (invite.status !== "PENDING") {
			throw new Error("邀请链接已被使用或失效。");
		}

		if (invite.order.status !== "PAID") {
			throw new Error("该订单尚未完成支付。");
		}

		const existingRegistration = await tx.eventRegistration.findUnique({
			where: {
				eventId_userId: {
					eventId,
					userId,
				},
			},
		});

		if (
			existingRegistration &&
			existingRegistration.status !== "CANCELLED"
		) {
			throw new Error("你已报名该活动。");
		}

		if (existingRegistration?.status === "CANCELLED") {
			await tx.eventAnswer.deleteMany({
				where: { registrationId: existingRegistration.id },
			});
		}

		const registrationStatus: RegistrationStatus = invite.order.event
			.requireApproval
			? "PENDING"
			: "APPROVED";

		const registration = existingRegistration
			? await tx.eventRegistration.update({
					where: { id: existingRegistration.id },
					data: {
						eventId,
						userId,
						status: registrationStatus,
						ticketTypeId: invite.order.ticketTypeId,
						orderId: invite.orderId,
						orderInviteId: invite.id,
						inviteId: null,
						allowDigitalCardDisplay,
						reviewedAt: null,
						reviewedBy: null,
						reviewNote: null,
						registeredAt: new Date(),
					},
				})
			: await tx.eventRegistration.create({
					data: {
						eventId,
						userId,
						status: registrationStatus,
						ticketTypeId: invite.order.ticketTypeId,
						orderId: invite.orderId,
						orderInviteId: invite.id,
						allowDigitalCardDisplay,
					},
				});

		if (answers.length > 0) {
			await tx.eventAnswer.createMany({
				data: answers.map((answer) => ({
					questionId: answer.questionId,
					answer: answer.answer,
					userId,
					eventId,
					registrationId: registration.id,
				})),
			});
		}

		await tx.eventOrderInvite.update({
			where: { id: invite.id },
			data: {
				status: "REDEEMED",
				redeemedAt: new Date(),
				redeemedBy: userId,
			},
		});

		return registration;
	});
}

export async function cancelExpiredOrders(now = new Date()) {
	const expiredOrders = await db.eventOrder.findMany({
		where: {
			status: "PENDING",
			expiredAt: { lt: now },
		},
		select: { id: true },
	});

	let cancelledCount = 0;

	for (const order of expiredOrders) {
		await cancelEventOrder(order.id, "EXPIRED");
		cancelledCount += 1;
	}

	return { cancelledCount };
}

export async function listOrderInvites(orderId: string) {
	return await db.eventOrderInvite.findMany({
		where: { orderId },
		orderBy: { createdAt: "asc" },
		include: {
			redeemer: {
				select: { id: true, name: true, email: true },
			},
		},
	});
}
