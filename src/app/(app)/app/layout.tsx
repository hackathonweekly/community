import { config } from "@/config";
import { SessionProvider } from "@dashboard/auth/components/SessionProvider";
import { sessionQueryKey } from "@dashboard/auth/lib/api";
import { getOrganizationList, getSession } from "@dashboard/auth/lib/server";
import { ActiveOrganizationProvider } from "@dashboard/organizations/components/ActiveOrganizationProvider";
import { organizationListQueryKey } from "@dashboard/organizations/lib/api";
import { ConfirmationAlertProvider } from "@dashboard/shared/components/ConfirmationAlertProvider";
import { getServerQueryClient } from "@/lib/server";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import type { PropsWithChildren } from "react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Layout({ children }: PropsWithChildren) {
	const session = await getSession();

	const queryClient = getServerQueryClient();

	await queryClient.prefetchQuery({
		queryKey: sessionQueryKey,
		queryFn: () => session,
	});

	if (config.organizations.enable) {
		await queryClient.prefetchQuery({
			queryKey: organizationListQueryKey,
			queryFn: getOrganizationList,
		});
	}

	return (
		<HydrationBoundary state={dehydrate(queryClient)}>
			<SessionProvider initialSession={session}>
				<ActiveOrganizationProvider>
					<ConfirmationAlertProvider>
						{/* Add bottom padding for mobile tabbar spacing */}
						<div className="pb-20 md:pb-8">{children}</div>
					</ConfirmationAlertProvider>
				</ActiveOrganizationProvider>
			</SessionProvider>
		</HydrationBoundary>
	);
}
