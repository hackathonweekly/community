import { useQuery, useQueryClient } from "@tanstack/react-query";

interface UserOrganization {
	id: string;
	name: string;
	slug: string;
	logo?: string;
	_count?: {
		members: number;
		events: number;
	};
}

interface UseUserOrganizationsOptions {
	enabled?: boolean;
}

export function useUserOrganizations(
	options: UseUserOrganizationsOptions = {},
) {
	const queryClient = useQueryClient();

	const query = useQuery({
		queryKey: ["user-organizations"],
		queryFn: async (): Promise<UserOrganization[]> => {
			const response = await fetch("/api/user/organizations");
			if (!response.ok) {
				throw new Error("Failed to fetch user organizations");
			}
			const data = await response.json();
			return data.data?.organizations || [];
		},
		enabled: options.enabled ?? true,
		staleTime: 5 * 60 * 1000, // 5 minutes
		gcTime: 10 * 60 * 1000, // 10 minutes
	});

	const refetchUserOrganizations = () => {
		return queryClient.invalidateQueries({
			queryKey: ["user-organizations"],
		});
	};

	const setUserOrganizations = (organizations: UserOrganization[]) => {
		queryClient.setQueryData(["user-organizations"], organizations);
	};

	return {
		...query,
		organizations: query.data || [],
		refetchUserOrganizations,
		setUserOrganizations,
	};
}
