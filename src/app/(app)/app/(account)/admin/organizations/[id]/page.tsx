import { authClient } from "@/lib/auth/client";
import { OrganizationForm } from "@dashboard/admin/component/organizations/OrganizationForm";
import { getAdminPath } from "@dashboard/admin/lib/links";
import { fullOrganizationQueryKey } from "@dashboard/organizations/lib/api";
import { getServerQueryClient } from "@/lib/server";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ArrowLeftIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import Link from "next/link";

export default async function OrganizationFormPage({
	params,
	searchParams,
}: {
	params: Promise<{ id: string }>;
	searchParams: Promise<{ backTo?: string }>;
}) {
	const { id } = await params;
	const { backTo } = await searchParams;

	const t = await getTranslations();
	const queryClient = getServerQueryClient();

	await queryClient.prefetchQuery({
		queryKey: fullOrganizationQueryKey(id),
		queryFn: async () => {
			const { data, error } =
				await authClient.organization.getFullOrganization({
					query: {
						organizationId: id,
					},
				});

			if (error) {
				throw new Error(
					error.message || "Failed to fetch full organization",
				);
			}

			return data;
		},
	});

	return (
		<HydrationBoundary state={dehydrate(queryClient)}>
			<div>
				<div className="mb-2 flex justify-start">
					<Button variant="link" size="sm" asChild className="px-0">
						<Link href={backTo ?? getAdminPath("/organizations")}>
							<ArrowLeftIcon className="mr-1.5 size-4" />
							{t("admin.organizations.backToList")}
						</Link>
					</Button>
				</div>
				<OrganizationForm organizationId={id} />
			</div>
		</HydrationBoundary>
	);
}
