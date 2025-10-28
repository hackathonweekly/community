import { authClient } from "@/lib/auth/client";
import { useQuery } from "@tanstack/react-query";

export const sessionQueryKey = ["auth", "session"] as const;

type SessionQueryData = Awaited<
	ReturnType<typeof authClient.getSession>
>["data"];

type UseSessionQueryOptions = {
	initialData?: SessionQueryData;
};

export const useSessionQuery = (options: UseSessionQueryOptions = {}) => {
	const { initialData } = options;

	return useQuery({
		queryKey: sessionQueryKey,
		queryFn: async () => {
			const { data, error } = await authClient.getSession({
				query: {
					disableCookieCache: true,
				},
			});

			if (error) {
				throw new Error(error.message || "Failed to fetch session");
			}

			return data;
		},
		initialData,
		staleTime: 5 * 60 * 1000, // 5 minutes - balance between fresh data and performance
		refetchOnWindowFocus: true, // Refetch when window is focused
		retry: false,
	});
};

export const userAccountQueryKey = ["user", "accounts"] as const;
export const useUserAccountsQuery = () => {
	return useQuery({
		queryKey: userAccountQueryKey,
		queryFn: async () => {
			const { data, error } = await authClient.listAccounts();

			if (error) {
				throw error;
			}

			return data;
		},
	});
};

export const userPasskeyQueryKey = ["user", "passkeys"] as const;
export const useUserPasskeysQuery = () => {
	return useQuery({
		queryKey: userPasskeyQueryKey,
		queryFn: async () => {
			const { data, error } = await authClient.passkey.listUserPasskeys();

			if (error) {
				throw error;
			}

			return data;
		},
	});
};
