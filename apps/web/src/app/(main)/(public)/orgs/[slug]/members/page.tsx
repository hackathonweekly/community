"use client";

import { useAuthStatus } from "@/hooks/useAuthStatus";
import { EmptyState } from "@/modules/public/shared/components/EmptyState";
import { MobilePageHeader } from "@/modules/public/shared/components/MobilePageHeader";
import { OrganizationLogo } from "@/modules/shared/organizations/components/OrganizationLogo";
import { MemberList } from "@community/ui/shared/MemberList";
import {
	useOrganizationMembers,
	SORT_OPTIONS,
} from "@account/organizations/hooks/use-organization-members";
import { OrganizationSwitcher } from "@account/organizations/components/OrganizationSwitcher";
import { ArrowLeft, Loader2, Settings, UserPlus } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo } from "react";

export default function OrganizationPublicMembersPage() {
	const params = useParams();
	const slug = params.slug as string;
	const authStatus = useAuthStatus();
	const currentUser = authStatus.user;

	const {
		organization,
		sortedMembers,
		transformedMembers,
		loading,
		error,
		setSearchTerm,
		setSortBy,
	} = useOrganizationMembers(slug);

	// Check if current user is a member/admin
	const userMembership = useMemo(() => {
		if (!currentUser || !transformedMembers.length) return null;
		return transformedMembers.find((m) => m.id === currentUser.id) || null;
	}, [currentUser, transformedMembers]);

	const isMemberAdmin =
		userMembership?.role === "owner" || userMembership?.role === "admin";

	// Persist org choice so /members redirects here next time
	useEffect(() => {
		if (slug) {
			localStorage.setItem("preferred-org-slug", slug);
		}
	}, [slug]);

	if (loading) {
		return (
			<>
				<MobilePageHeader title="成员" />
				<div className="max-w-6xl mx-auto px-4 lg:px-8 py-5 lg:py-6">
					<div className="flex items-center justify-center py-20">
						<Loader2 className="h-6 w-6 animate-spin text-gray-400" />
					</div>
				</div>
			</>
		);
	}

	if (error || !organization) {
		return (
			<>
				<MobilePageHeader title="成员" />
				<div className="max-w-6xl mx-auto px-4 lg:px-8 py-5 lg:py-6">
					<EmptyState
						title="加载失败"
						description="无法加载成员列表，请稍后重试。"
						action={
							<button
								type="button"
								onClick={() => window.location.reload()}
								className="bg-card border border-border text-foreground px-4 py-1.5 rounded-full text-xs font-bold hover:bg-muted transition-colors"
							>
								重新加载
							</button>
						}
					/>
				</div>
			</>
		);
	}

	return (
		<>
			<MobilePageHeader title={`${organization.name} · 成员`} />
			<div className="max-w-6xl mx-auto px-4 lg:px-8 py-5 lg:py-6">
				{/* Org Switcher / Back link */}
				{organization && currentUser ? (
					<div className="hidden md:flex items-center justify-between mb-4">
						<OrganizationSwitcher
							currentSlug={organization.slug}
							currentName={organization.name}
							currentLogo={organization.logo}
							linkSuffix="/members"
						/>
						<div className="flex items-center gap-2">
							{userMembership && (
								<Link
									href={`/orgs/${organization.slug}/invite-member`}
									className="flex items-center gap-1.5 px-3 py-1.5 bg-black dark:bg-white text-white dark:text-black rounded-md text-xs font-bold hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
								>
									<UserPlus className="h-3.5 w-3.5" />
									邀请成员
								</Link>
							)}
							{isMemberAdmin && (
								<Link
									href={`/orgs/${organization.slug}/settings/members`}
									className="flex items-center gap-1.5 px-3 py-1.5 bg-card border border-border text-gray-600 dark:text-muted-foreground rounded-md text-xs font-bold hover:bg-muted hover:text-black dark:hover:text-white transition-colors"
								>
									<Settings className="h-3.5 w-3.5" />
									管理成员
								</Link>
							)}
						</div>
					</div>
				) : (
					<Link
						href={
							organization
								? `/orgs/${organization.slug}`
								: "/orgs"
						}
						className="hidden md:inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-black dark:hover:text-white transition-colors mb-4"
					>
						<ArrowLeft className="h-3.5 w-3.5" />
						返回 {organization?.name || "组织列表"}
					</Link>
				)}

				{/* Page Header with Org Context */}
				<div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-5 gap-3">
					<Link
						href={`/orgs/${organization.slug}`}
						className="flex items-center gap-3 group"
					>
						<OrganizationLogo
							name={organization.name}
							logoUrl={organization.logo}
							className="h-10 w-10 rounded-lg"
						/>
						<div>
							<h1 className="font-brand text-2xl lg:text-3xl font-bold tracking-tight leading-none text-foreground group-hover:text-primary transition-colors">
								{organization.name} · 成员
							</h1>
							<div className="flex items-center gap-2 mt-1">
								<p className="text-[11px] text-muted-foreground font-mono">
									共 {transformedMembers.length} 位成员
								</p>
								{organization.summary && (
									<>
										<span className="text-[11px] text-gray-300 dark:text-[#333]">
											·
										</span>
										<p className="text-[11px] text-muted-foreground line-clamp-1">
											{organization.summary}
										</p>
									</>
								)}
							</div>
						</div>
					</Link>
					{userMembership && (
						<Link
							href={`/orgs/${organization.slug}/invite-member`}
							className="flex items-center gap-1.5 px-3 py-1.5 bg-black dark:bg-white text-white dark:text-black rounded-md text-xs font-bold hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors md:hidden"
						>
							<UserPlus className="h-3.5 w-3.5" />
							邀请成员
						</Link>
					)}
				</div>

				<MemberList
					members={sortedMembers}
					loading={loading}
					viewMode="grid"
					showViewModeToggle={false}
					defaultViewMode="grid"
					showAvatar={true}
					showLevel={true}
					showSkills={true}
					showRole={true}
					showInviter={isMemberAdmin}
					showBio={true}
					showRegion={true}
					showContactLinks={true}
					showJoinDate={false}
					enableSearch={true}
					enableSort={true}
					enableFilters={false}
					searchPlaceholder="搜索成员姓名、技能..."
					sortOptions={SORT_OPTIONS}
					onSearch={setSearchTerm}
					onSort={setSortBy}
				/>
			</div>
		</>
	);
}
