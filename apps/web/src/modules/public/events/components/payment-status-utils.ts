export const PAYMENT_PROVIDER_RECONCILE_INTERVAL_MS = 6_000;

export function shouldReconcilePaymentProvider(params: {
	status: string;
	now: number;
	lastQueryAt: number;
	isQueryInFlight: boolean;
	intervalMs?: number;
}) {
	if (params.status !== "PENDING" || params.isQueryInFlight) {
		return false;
	}
	return (
		params.now - params.lastQueryAt >=
		(params.intervalMs ?? PAYMENT_PROVIDER_RECONCILE_INTERVAL_MS)
	);
}
