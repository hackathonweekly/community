import { MobilePageHeader } from "@/modules/public/shared/components/MobilePageHeader";
import { SidebarContentLayout } from "@/modules/account/shared/components/SidebarContentLayout";
import { isOrganizationAdmin } from "@community/lib-shared/auth/lib/helper";
import { getActiveOrganization, getSession } from "@shared/auth/lib/server";
import { activeOrganizationQueryKey } from "@shared/organizations/lib/api";
import { getServerQueryClient } from "@community/lib-server/server";
import { redirect } from "next/navigation";
import type { PropsWithChildren } from "react";
import { OrgSettingsNav, OrgSettingsMobileNav } from "./OrgSettingsNav";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function OrgSettingsLayout({
	children,
	params,
}: PropsWithChildren<{
	params: Promise<{ slug: string }>;
}>) {
	const session = await getSession();
	const { slug } = await params;
	const organization = await getActiveOrganization(slug);

	if (!organization) {
		redirect("/");
	}

	if (!session) {
		return redirect("/auth/login");
	}

	const userIsOrganizationAdmin = isOrganizationAdmin(
		organization,
		session?.user,
	);

	if (!userIsOrganizationAdmin) {
		redirect(`/orgs/${slug}`);
	}

	// Prefetch organization data for client components
	const queryClient = getServerQueryClient();
	await queryClient.prefetchQuery({
		queryKey: activeOrganizationQueryKey(slug),
		queryFn: () => organization,
	});

	return (
		<>
			<MobilePageHeader title={`${organization.name} · 设置`} />
			<div className="max-w-6xl mx-auto px-4 lg:px-8 py-5 lg:py-6 pb-24">
				{/* Back link */}
				<Link
					href={`/orgs/${slug}`}
					className="hidden md:inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-black dark:hover:text-white transition-colors mb-4"
				>
					<ArrowLeft className="h-3.5 w-3.5" />
					返回 {organization.name}
				</Link>

				{/* Page Header */}
				<div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-5 gap-3">
					<div>
						<h1 className="font-brand text-2xl lg:text-3xl font-bold tracking-tight leading-none text-foreground">
							{organization.name} · 设置
						</h1>
						<p className="mt-1 text-xs text-muted-foreground">
							管理组织设置和配置
						</p>
					</div>
				</div>

				{/* Mobile Navigation */}
				<div className="lg:hidden">
					<OrgSettingsMobileNav slug={slug} />
				</div>

				{/* Desktop: Sidebar + Content */}
				<SidebarContentLayout
					sidebar={<OrgSettingsNav slug={slug} />}
					sidebarPosition="left"
					sidebarWidth={220}
					gap="md"
					wrapSidebar={true}
					hideSidebarOnMobile={true}
					sidebarInnerClassName="bg-card border-border"
				>
					{children}
				</SidebarContentLayout>
			</div>
		</>
	);
}
