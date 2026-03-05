import "server-only";
import { createQueryClient } from "@community/lib-shared/query-client";

import { getBaseUrl } from "@community/lib-shared/utils";
import type { AppRouter } from "@/server";
import { hc } from "hono/client";
import { headers } from "next/headers";
import { cache } from "react";

export const getServerQueryClient = cache(createQueryClient);

export const getServerApiClient = async () => {
	const headerObject = Object.fromEntries((await headers()).entries());

	return (
		hc<AppRouter>(getBaseUrl(), {
			init: {
				credentials: "include",
				headers: headerObject,
			},
		}) as any
	).api;
};
