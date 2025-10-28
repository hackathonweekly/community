import { getBaseUrl } from "@/lib/utils";
import type { AppRouter } from "@/server";
import { hc } from "hono/client";

const baseUrl = typeof window === "undefined" ? getBaseUrl() : "";

export const apiClient = (
	hc<AppRouter>(baseUrl, {
		init: {
			credentials: "include",
		},
	}) as any
).api;
