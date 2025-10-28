"use client";
import { SettingsItem } from "@dashboard/shared/components/SettingsItem";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { OrganizationInvitationsList } from "./OrganizationInvitationsList";
import { OrganizationCommunityMembersList } from "./OrganizationCommunityMembersList";

export function OrganizationMembersBlock({
	organizationId,
}: {
	organizationId: string;
}) {
	const t = useTranslations();
	const [activeTab, setActiveTab] = useState("members");

	return (
		<SettingsItem
			title="成员管理"
			description="管理组织成员，查看成员等级和角色"
		>
			<Tabs value={activeTab} onValueChange={(tab) => setActiveTab(tab)}>
				<TabsList className="mb-4">
					<TabsTrigger value="members" className="whitespace-nowrap">
						活跃成员
					</TabsTrigger>
					<TabsTrigger
						value="invitations"
						className="whitespace-nowrap"
					>
						待处理邀请
					</TabsTrigger>
				</TabsList>
				<TabsContent value="members">
					<OrganizationCommunityMembersList
						organizationId={organizationId}
					/>
				</TabsContent>
				<TabsContent value="invitations">
					<OrganizationInvitationsList
						organizationId={organizationId}
					/>
				</TabsContent>
			</Tabs>
		</SettingsItem>
	);
}
