"use client";

import { useEffect } from "react";

type ClientErrorPayload = {
	message: string;
	stack?: string;
	source?: string;
	line?: number;
	column?: number;
	path?: string;
	userAgent?: string;
	meta?: Record<string, unknown>;
};

const REPORT_ENDPOINT = "/api/client-logs";

function sendClientError(payload: ClientErrorPayload) {
	const body = JSON.stringify(payload);

	if (navigator.sendBeacon) {
		const blob = new Blob([body], { type: "application/json" });
		navigator.sendBeacon(REPORT_ENDPOINT, blob);
		return;
	}

	// sendBeacon 不可用时退回 fetch
	void fetch(REPORT_ENDPOINT, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body,
		keepalive: true,
	});
}

export function ClientErrorTracker() {
	useEffect(() => {
		// 避免重复上报相同错误
		const reported = new Map<string, number>();
		const dedupeWindowMs = 30_000;

		const buildPayload = (data: Partial<ClientErrorPayload>) => ({
			path: window.location.pathname,
			userAgent: navigator.userAgent,
			...data,
		});

		const maybeReport = (payload: ClientErrorPayload) => {
			const key = `${payload.message}-${payload.source}-${payload.line}-${payload.column}`;
			const now = Date.now();
			const last = reported.get(key);

			if (!last || now - last > dedupeWindowMs) {
				reported.set(key, now);
				sendClientError(payload);
			}
		};

		const handleError = (event: ErrorEvent) => {
			maybeReport(
				buildPayload({
					message: event.message || "Unknown client error",
					stack: event.error?.stack,
					source: event.filename,
					line: event.lineno,
					column: event.colno,
				}) as ClientErrorPayload,
			);
		};

		const handleRejection = (event: PromiseRejectionEvent) => {
			const reason = (() => {
				if (event.reason instanceof Error) return event.reason;
				if (typeof event.reason === "string") {
					return new Error(event.reason);
				}
				try {
					return new Error(JSON.stringify(event.reason));
				} catch {
					return new Error(String(event.reason));
				}
			})();

			maybeReport(
				buildPayload({
					message: reason.message || "Unhandled rejection",
					stack: reason.stack,
					source: "unhandledrejection",
				}) as ClientErrorPayload,
			);
		};

		window.addEventListener("error", handleError);
		window.addEventListener("unhandledrejection", handleRejection);

		return () => {
			window.removeEventListener("error", handleError);
			window.removeEventListener("unhandledrejection", handleRejection);
		};
	}, []);

	return null;
}
