"use client";

import { useAuthStatus } from "@/hooks/useAuthStatus";
import {
	SORT_OPTIONS,
	useOrganizationMembers,
} from "@account/organizations/hooks/use-organization-members";
import { MemberList } from "@community/ui/shared/MemberList";
import { Loader2, UserPlus, Users } from "lucide-react";
import Link from "next/link";

interface OrganizationMembersTabProps {
	slug: string;
	isMember: boolean;
	isMemberAdmin: boolean;
}

export function OrganizationMembersTab({
	slug,
	isMember,
	isMemberAdmin,
}: OrganizationMembersTabProps) {
	const { user } = useAuthStatus();
	const {
		organization,
		sortedMembers,
		loading,
		error,
		setSearchTerm,
		setSortBy,
	} = useOrganizationMembers(slug);

	if (!isMember) {
		return (
			<div className="rounded-xl border border-border bg-card p-8 text-center">
				<Users className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
				<h3 className="mb-2 text-lg font-semibold text-foreground">
					加入组织后查看成员
				</h3>
				<p className="mx-auto mb-5 max-w-lg text-sm text-muted-foreground">
					成员列表仅对组织成员开放。加入后可查看完整成员信息并参与协作。
				</p>
				{!user ? (
					<Link
						href={`/auth/login?redirectTo=/orgs/${slug}?tab=members`}
						className="inline-flex rounded-md bg-black px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200"
					>
						登录后查看
					</Link>
				) : null}
			</div>
		);
	}

	if (loading) {
		return (
			<div className="flex items-center justify-center py-16">
				<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
			</div>
		);
	}

	if (error || !organization) {
		return (
			<div className="rounded-xl border border-border bg-card p-8 text-center">
				<p className="text-sm text-muted-foreground">
					成员数据加载失败，请稍后重试。
				</p>
			</div>
		);
	}

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between gap-3">
				<div>
					<h3 className="text-lg font-semibold text-foreground">
						成员列表
					</h3>
					<p className="text-sm text-muted-foreground">
						共 {sortedMembers.length} 位成员
					</p>
				</div>
				<div className="flex items-center gap-2">
					<Link
						href={`/orgs/${slug}/invite-member`}
						className="inline-flex items-center gap-1.5 rounded-md bg-black px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200"
					>
						<UserPlus className="h-3.5 w-3.5" />
						邀请成员
					</Link>
					{isMemberAdmin ? (
						<Link
							href={`/orgs/${slug}/settings/members`}
							className="inline-flex rounded-md border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-muted"
						>
							管理成员
						</Link>
					) : null}
				</div>
			</div>

			<MemberList
				members={sortedMembers}
				loading={false}
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
	);
}
