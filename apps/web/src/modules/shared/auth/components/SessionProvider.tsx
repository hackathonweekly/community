"use client";
import type { Session, User } from "@community/lib-server/auth";
import { authClient } from "@community/lib-client/auth/client";
import { prefetchStrategies } from "@community/lib-client/cache-config";
import { sessionQueryKey, useSessionQuery } from "@shared/auth/lib/api";
import { useQueryClient } from "@tanstack/react-query";
import { type ReactNode, useEffect, useState } from "react";
import { SessionContext } from "../lib/session-context";

type SessionProviderProps = {
	children: ReactNode;
	initialSession?: Session | null;
};

export function SessionProvider({
	children,
	initialSession,
}: SessionProviderProps) {
	const queryClient = useQueryClient();

	const { data: session } = useSessionQuery({
		initialData: initialSession ?? undefined,
	});

	const [loaded, setLoaded] = useState(initialSession !== undefined);
	const userId = session?.user?.id;

	useEffect(() => {
		// Mark as loaded when we have initial data or when the query has completed (regardless of result)
		if (initialSession !== undefined || session !== undefined) {
			setLoaded(true);
		}
	}, [initialSession, session]);

	useEffect(() => {
		if (!userId) {
			return;
		}

		const timeoutId = window.setTimeout(() => {
			prefetchStrategies.prefetchUserData(queryClient);
		}, 1000);

		return () => {
			window.clearTimeout(timeoutId);
		};
	}, [queryClient, userId]);

	return (
		<SessionContext.Provider
			value={{
				loaded,
				session: session?.session ?? null,
				user: (session?.user as User) ?? null,
				reloadSession: async () => {
					const { data: newSession, error } =
						await authClient.getSession({
							query: {
								disableCookieCache: true,
							},
						});

					if (error) {
						throw new Error(
							error.message || "Failed to fetch session",
						);
					}

					queryClient.setQueryData(sessionQueryKey, () => newSession);
					setLoaded(true);
				},
			}}
		>
			{children}
		</SessionContext.Provider>
	);
}
