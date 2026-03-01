export function canShowDirectCancellation(orderStatus?: string | null) {
	return orderStatus !== "PAID" && orderStatus !== "REFUND_PENDING";
}

export function canShowRefundAndCancelAction(orderStatus?: string | null) {
	return orderStatus === "PAID";
}

export function isRefundPending(orderStatus?: string | null) {
	return orderStatus === "REFUND_PENDING";
}
