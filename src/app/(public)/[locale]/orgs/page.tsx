import {
	getMarketingOrganizations,
	getUserOrganizations,
} from "@/lib/database/prisma/queries/organizations";
import { OrganizationDiscovery } from "@/modules/public/organizations/components/OrganizationDiscovery";
import { PageHero } from "@/modules/public/shared/components/PageHero";
import { getSession } from "@dashboard/auth/lib/server";
import type { MarketingOrganizationListParams } from "@/lib/api/api-fetchers";
import { getServerQueryClient } from "@/lib/server";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import type { Metadata } from "next";

const DEFAULT_ORG_QUERY: MarketingOrganizationListParams = {
	search: "",
	tags: [],
	page: 1,
	limit: 12,
};

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

	const session = await getSession();

	// 简化用户组织信息获取 - 仅在登录时获取，不阻塞页面渲染
	let userOrganizations: Array<{
		id: string;
		name: string;
		slug: string | null;
	}> = [];

	// 只有登录用户才获取用户组织（这是次要功能，不应该影响主要性能）
	if (session?.user) {
		try {
			const orgs = await getUserOrganizations(session.user.id);
			userOrganizations = orgs.map((org) => ({
				id: org.id,
				name: org.name,
				slug: org.slug,
			}));
		} catch (error) {
			// 如果获取用户组织失败，不影响主页面渲染
			console.error("Failed to fetch user organizations:", error);
		}
	}

	const queryClient = getServerQueryClient();

	const marketingData = await getMarketingOrganizations(DEFAULT_ORG_QUERY);

	queryClient.setQueryData(
		["organizations", DEFAULT_ORG_QUERY],
		marketingData,
	);

	const dehydratedState = dehydrate(queryClient);

	return (
		<HydrationBoundary state={dehydratedState}>
			<div className="container max-w-6xl pt-8 md:pt-32 pb-32 md:pb-16">
				<PageHero
					title="发现组织"
					description="探索和加入感兴趣的社区组织，与志同道合的人一起成长"
				/>

				{/* 传递用户组织信息到客户端组件 */}
				<OrganizationDiscovery userOrganizations={userOrganizations} />

				{/* 创建分部提示 */}
				<div className="mt-16 text-center">
					<div className="max-w-xl mx-auto p-4 bg-muted/30 rounded-md border border-muted">
						<p className="text-sm text-muted-foreground mb-2">
							没找到你所在城市/学校的社区分部？
						</p>
						<a
							href="/docs/organization/chapter-management"
							className="text-sm text-primary hover:text-primary/80 transition-colors underline-offset-4 hover:underline"
						>
							了解如何创建社区分部
						</a>
						<p className="text-sm text-muted-foreground mb-2">
							社区系统免费开放给公益组织使用，如有需要可联系微信
							MakerJackie
						</p>
					</div>
				</div>
			</div>
		</HydrationBoundary>
	);
}
