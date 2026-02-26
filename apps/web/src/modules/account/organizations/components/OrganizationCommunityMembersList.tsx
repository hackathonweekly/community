"use client";

import type { OrganizationMemberRole } from "@community/lib-server/auth";
import { authClient } from "@community/lib-client/auth/client";
import { isOrganizationAdmin } from "@community/lib-shared/auth/lib/helper";
import { useSession } from "@account/auth/hooks/use-session";
import {
	fullOrganizationQueryKey,
	useFullOrganizationQuery,
} from "@account/organizations/lib/api";
import {
	MemberList,
	type MemberData,
	type MemberAction,
	type FilterOption,
} from "@community/ui/shared/MemberList";
import { useQueryClient } from "@tanstack/react-query";
import { LogOutIcon, TrashIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

export function OrganizationCommunityMembersList({
	organizationId,
}: {
	organizationId: string;
}) {
	const t = useTranslations();
	const queryClient = useQueryClient();
	const { user } = useSession();
	const { data: organization } = useFullOrganizationQuery(organizationId);

	const userIsOrganizationAdmin = isOrganizationAdmin(organization, user);

	// 转换组织成员数据为 MemberData 格式
	const transformedMembers: MemberData[] = (organization?.members ?? []).map(
		(member: any) => ({
			id: member.id,
			name: member.user?.name || null,
			email: member.user?.email || "",
			username: (member.user as any)?.username || null,
			image: member.user?.image || null,
			role: member.role,
			cpValue: (member.user as any)?.cpValue || 0,
			createdAt: member.createdAt.toISOString(),
			skills: (member.user as any)?.skills || [],
			userRoleString: (member.user as any)?.userRoleString || null,
			membershipLevel: (member.user as any)?.membershipLevel || null,
			inviter: member.inviter
				? {
						id: member.inviter.id,
						name: member.inviter.name || null,
						username: member.inviter.username || null,
					}
				: null,
		}),
	);

	const updateMemberRole = async (
		memberId: string,
		role: OrganizationMemberRole,
	) => {
		toast.promise(
			async () => {
				await authClient.organization.updateMemberRole({
					memberId,
					role,
					organizationId,
				});
			},
			{
				loading: "更新成员角色中...",
				success: () => {
					queryClient.invalidateQueries({
						queryKey: fullOrganizationQueryKey(organizationId),
					});
					return "成员角色更新成功";
				},
				error: "成员角色更新失败",
			},
		);
	};

	const removeMember = async (memberId: string) => {
		toast.promise(
			async () => {
				await authClient.organization.removeMember({
					memberIdOrEmail: memberId,
					organizationId,
				});
			},
			{
				loading: "移除成员中...",
				success: () => {
					queryClient.invalidateQueries({
						queryKey: fullOrganizationQueryKey(organizationId),
					});
					return "成员移除成功";
				},
				error: "成员移除失败",
			},
		);
	};

	// 角色筛选选项
	const roleFilterOptions: FilterOption[] = [
		{ value: "member", label: "成员" },
		{ value: "admin", label: "管理员" },
		{ value: "owner", label: "负责人" },
		{ value: "viewer", label: "观众" },
	];

	// 主要操作按钮（对于非管理员，只显示角色选择）
	const primaryActions: MemberAction[] = userIsOrganizationAdmin
		? [
				{
					label: "角色设置",
					onClick: (member) => {
						// 这里需要实现角色设置逻辑
						// 由于 OrganizationRoleSelect 是一个特殊的组件，我们先保留原来的实现
					},
					hidden: (member) => member.role === "owner",
				},
			]
		: [];

	// 下拉菜单操作
	const dropdownActions: MemberAction[] = userIsOrganizationAdmin
		? [
				{
					label: (member: MemberData) =>
						member.id === user?.id ? "离开组织" : "移除成员",
					icon: (member: MemberData) =>
						member.id === user?.id ? LogOutIcon : TrashIcon,
					variant: "destructive",
					onClick: (member) => removeMember(member.id),
					disabled: (member) =>
						!userIsOrganizationAdmin || member.role === "owner",
				},
			]
		: [];

	return (
		<div className="space-y-4">
			<MemberList
				members={transformedMembers}
				loading={false}
				showAvatar={true}
				showLevel={true}
				showRole={true}
				showInviter={true}
				showSkills={true}
				showCP={true}
				showJoinDate={true}
				enableSearch={true}
				enableBatchSelect={false}
				enableFilters={true}
				searchPlaceholder="搜索成员姓名、邮箱或个人介绍..."
				roleFilterOptions={roleFilterOptions}
				primaryActions={primaryActions}
				dropdownActions={dropdownActions}
			/>
		</div>
	);
}
