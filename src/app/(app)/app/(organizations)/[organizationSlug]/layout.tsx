import { getActiveOrganization } from "@dashboard/auth/lib/server";
import { activeOrganizationQueryKey } from "@dashboard/organizations/lib/api";
import { AppWrapper } from "@dashboard/shared/components/AppWrapper";
import { getServerQueryClient } from "@/lib/server";
import { notFound } from "next/navigation";
import type { PropsWithChildren } from "react";

export default async function OrganizationLayout({
	children,
	params,
}: PropsWithChildren<{
	params: Promise<{
		organizationSlug: string;
	}>;
}>) {
	const { organizationSlug } = await params;

	const organization = await getActiveOrganization(organizationSlug);

	if (!organization) {
		return notFound();
	}

	const queryClient = getServerQueryClient();

	await queryClient.prefetchQuery({
		queryKey: activeOrganizationQueryKey(organizationSlug),
		queryFn: () => organization,
	});

	return <AppWrapper>{children}</AppWrapper>;
}
