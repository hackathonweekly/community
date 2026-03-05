import { unstable_cache } from "next/cache";
import type { Metadata } from "next";
import Link from "next/link";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { Button } from "@community/ui/ui/button";
import { OrganizationDiscovery } from "@/modules/public/organizations/components/OrganizationDiscovery";
import { canUserDoAction, RestrictedAction } from "@/features/permissions";
import type { MarketingOrganizationListParams } from "@community/lib-shared/api/api-fetchers";
import { CACHE_TAGS } from "@community/lib-server/cache/events-cache-constants";
import {
	getMarketingOrganizations,
	getUserOrganizations,
} from "@community/lib-server/database/prisma/queries/organizations";
import { getServerQueryClient } from "@community/lib-server/server";
import { getSession } from "@shared/auth/lib/server";
import type { MembershipLevel } from "@prisma/client";

const DEFAULT_ORG_QUERY: MarketingOrganizationListParams = {
	search: "",
	tags: [],
	page: 1,
	limit: 12,
};

const getCachedMarketingOrganizations = unstable_cache(
	(params: MarketingOrganizationListParams) =>
		getMarketingOrganizations(params),
	["marketing-organizations"],
	{
		revalidate: 300,
		tags: [CACHE_TAGS.organizations],
	},
);

export async function generateMetadata(): Promise<Metadata> {
	return {
		title: "发现组织",
		description: "探索和加入感兴趣的社区组织",
	};
}

export default async function OrganizationsPage({
	searchParams,
}: {
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
	await searchParams;

	const marketingPromise = getCachedMarketingOrganizations(DEFAULT_ORG_QUERY);
	const session = await getSession();

	// 简化用户组织信息获取 - 仅在登录时获取，不阻塞页面渲染
	let userOrganizations: Array<{
		id: string;
		name: string;
		slug: string | null;
	}> = [];

	// 只有登录用户才获取用户组织（这是次要功能，不应该影响主要性能）
	const userOrganizationsPromise = session?.user
		? getUserOrganizations(session.user.id).catch((error) => {
				console.error("Failed to fetch user organizations:", error);
				return [];
			})
		: Promise.resolve([]);

	const [marketingData, orgs] = await Promise.all([
		marketingPromise,
		userOrganizationsPromise,
	]);

	if (orgs.length > 0) {
		userOrganizations = orgs.map((org) => ({
			id: org.id,
			name: org.name,
			slug: org.slug,
		}));
	}

	// 检查用户是否有创建组织的权限
	const canCreateOrg = session?.user
		? canUserDoAction(
				{
					membershipLevel: session.user
						.membershipLevel as MembershipLevel,
				},
				RestrictedAction.CREATE_ORGANIZATION,
			).allowed
		: false;

	const queryClient = getServerQueryClient();

	queryClient.setQueryData(
		["organizations", DEFAULT_ORG_QUERY],
		marketingData,
	);

	const dehydratedState = dehydrate(queryClient);

	return (
		<HydrationBoundary state={dehydratedState}>
			<div className="mx-auto max-w-6xl px-4 pb-20 pt-5 lg:px-8 lg:pb-16 lg:pt-6">
				{/* Page Header */}
				<div className="hidden lg:flex flex-col md:flex-row justify-between items-start md:items-end mb-5 gap-3">
					<div>
						<h1 className="font-brand text-2xl lg:text-3xl font-bold tracking-tight leading-none text-foreground">
							发现组织
						</h1>
						<p className="text-sm text-muted-foreground mt-1.5">
							寻找伙伴，产生链接，与志同道合的人一起成长
						</p>
					</div>
					{canCreateOrg && (
						<Button asChild size="sm">
							<Link href="/orgs/new-organization">
								<Plus className="mr-1.5 size-4" />
								创建组织
							</Link>
						</Button>
					)}
				</div>

				<OrganizationDiscovery userOrganizations={userOrganizations} />
			</div>
		</HydrationBoundary>
	);
}
