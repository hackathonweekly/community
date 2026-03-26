type ClientLogLevel = "info" | "warn" | "error";

interface ClientLogPayload {
	message: string;
	level?: ClientLogLevel;
	source?: string;
	meta?: Record<string, unknown>;
}

export const reportClientLog = async ({
	message,
	level = "info",
	source,
	meta,
}: ClientLogPayload) => {
	if (typeof window === "undefined") {
		return;
	}

	try {
		await fetch("/api/client-logs", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			keepalive: true,
			body: JSON.stringify({
				category: "MINI_BIND_CLIENT",
				level,
				message,
				source,
				path: `${window.location.pathname}${window.location.search}`,
				userAgent: navigator.userAgent,
				meta,
			}),
		});
	} catch (error) {
		console.warn("[MINI_BIND_CLIENT] Failed to upload client log", error);
	}
};
