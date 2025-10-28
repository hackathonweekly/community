"use client";
import type { Session, User } from "@/lib/auth";
import { authClient } from "@/lib/auth/client";
import { sessionQueryKey, useSessionQuery } from "@dashboard/auth/lib/api";
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

	useEffect(() => {
		// Mark as loaded when we have initial data or when the query has completed (regardless of result)
		if (initialSession !== undefined || session !== undefined) {
			setLoaded(true);
		}
	}, [initialSession, session]);

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
