"use client";

import { useOrganizationBySlug } from "@/modules/public/organizations/hooks/useOrganizationBySlug";
import { OrganizationLogo } from "@/modules/shared/organizations/components/OrganizationLogo";
import { OrganizationSwitcher } from "@account/organizations/components/OrganizationSwitcher";
import { Loader2, Settings } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { OrganizationEvents } from "./OrganizationEvents";
import { OrganizationMembersTab } from "./OrganizationMembersTab";
import { OrganizationOverview } from "./OrganizationOverview";
import { type OrganizationTabKey, OrganizationTabs } from "./OrganizationTabs";
import { isOrganizationTabKey } from "./organization-tabs-shared";

interface OrganizationTabbedPageProps {
	slug: string;
	defaultTab: OrganizationTabKey;
	isMember: boolean;
	isMemberAdmin: boolean;
}

export function OrganizationTabbedPage({
	slug,
	defaultTab,
	isMember,
	isMemberAdmin,
}: OrganizationTabbedPageProps) {
	const {
		data: organization,
		isLoading,
		error,
	} = useOrganizationBySlug(slug);
	const searchParams = useSearchParams();
	const currentTab = searchParams.get("tab");
	const activeTab = isOrganizationTabKey(currentTab)
		? currentTab
		: defaultTab;

	useEffect(() => {
		localStorage.setItem("preferred-org-slug", slug);
	}, [slug]);

	if (isLoading) {
		return (
			<div className="mx-auto max-w-6xl px-4 pb-20 pt-5 lg:px-8 lg:pb-16 lg:pt-6">
				<div className="flex items-center justify-center py-16">
					<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
				</div>
			</div>
		);
	}

	if (error || !organization) {
		return (
			<div className="mx-auto max-w-6xl px-4 pb-20 pt-5 lg:px-8 lg:pb-16 lg:pt-6">
				<div className="rounded-xl border border-border bg-card p-8 text-center">
					<p className="text-sm text-muted-foreground">
						组织信息加载失败，请稍后重试。
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="mx-auto max-w-6xl px-4 pb-20 pt-5 lg:px-8 lg:pb-16 lg:pt-6">
			<div className="mb-3 flex items-center justify-between gap-3">
				<div className="min-w-0">
					{isMember ? (
						<OrganizationSwitcher
							currentSlug={organization.slug}
							currentName={organization.name}
							currentLogo={organization.logo}
							linkSuffix={`?tab=${activeTab}`}
						/>
					) : (
						<div className="flex items-center gap-3">
							<OrganizationLogo
								name={organization.name}
								logoUrl={organization.logo}
								className="h-10 w-10 shrink-0 rounded-xl border border-border"
							/>
							<h1 className="truncate font-brand text-xl font-bold text-foreground lg:text-2xl">
								{organization.name}
							</h1>
						</div>
					)}
				</div>

				<div className="flex items-center gap-2">
					<Link
						href="/orgs"
						className="inline-flex items-center rounded-md border border-border bg-card px-2.5 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
					>
						发现组织
					</Link>
					{isMemberAdmin ? (
						<Link
							href={`/orgs/${slug}/settings/general`}
							className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-card text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
							aria-label="组织设置"
						>
							<Settings className="h-4 w-4" />
						</Link>
					) : null}
				</div>
			</div>

			<div className="mb-5">
				{isMember ? (
					<h1 className="sr-only">{organization.name}</h1>
				) : null}
				<p className="mt-1 line-clamp-1 text-sm text-muted-foreground">
					{organization.summary || "组织主页"}
				</p>
			</div>

			<OrganizationTabs slug={slug} defaultTab={defaultTab} />

			<div className="pt-5">
				{activeTab === "overview" ? (
					<OrganizationOverview organization={organization} />
				) : null}
				{activeTab === "events" ? (
					<OrganizationEvents
						organizationId={organization.id}
						organizationSlug={organization.slug}
					/>
				) : null}
				{activeTab === "members" ? (
					<OrganizationMembersTab
						slug={slug}
						isMember={isMember}
						isMemberAdmin={isMemberAdmin}
					/>
				) : null}
			</div>
		</div>
	);
}
