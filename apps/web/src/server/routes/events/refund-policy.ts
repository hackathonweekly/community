const ORGANIZER_REFUND_REQUIRED_ORDER_STATUSES = new Set([
	"PAID",
	"REFUND_PENDING",
]);

export const ORGANIZER_CANCELLATION_REQUIRES_REFUND_MESSAGE =
	"该报名对应的订单已支付或退款处理中，请先发起退款，退款完成后将自动取消报名。";

export const ORGANIZER_FULL_REFUND_ONLY_MESSAGE =
	"当前仅支持全额退款，请按订单实付金额退款。";

export function requiresRefundBeforeOrganizerCancellation(
	orderStatus?: string | null,
) {
	if (!orderStatus) return false;
	return ORGANIZER_REFUND_REQUIRED_ORDER_STATUSES.has(orderStatus);
}

export function resolveOrganizerRefundAmount(params: {
	orderStatus: string;
	orderTotalAmount: number;
	requestedAmount?: number;
}) {
	const { orderStatus, orderTotalAmount, requestedAmount } = params;

	if (orderStatus !== "PAID") {
		return {
			ok: false as const,
			error: "订单状态不允许退款",
		};
	}

	if (orderTotalAmount <= 0) {
		return {
			ok: false as const,
			error: "退款金额无效",
		};
	}

	if (
		typeof requestedAmount === "number" &&
		Math.abs(requestedAmount - orderTotalAmount) > 0.000001
	) {
		return {
			ok: false as const,
			error: ORGANIZER_FULL_REFUND_ONLY_MESSAGE,
		};
	}

	return {
		ok: true as const,
		refundAmount: orderTotalAmount,
	};
}
