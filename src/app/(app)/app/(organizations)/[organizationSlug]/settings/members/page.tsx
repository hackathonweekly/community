import { getActiveOrganization, getSession } from "@dashboard/auth/lib/server";
import { OrganizationMembersBlock } from "@dashboard/organizations/components/OrganizationMembersBlock";
import { OrganizationMembersAdmin } from "@dashboard/organizations/components/OrganizationMembersAdmin";
import { isOrganizationAdmin } from "@/lib/auth/lib/helper";
import { redirect } from "next/navigation";

export default async function OrganizationSettingsMembersPage({
	params,
}: {
	params: Promise<{ organizationSlug: string }>;
}) {
	const { organizationSlug } = await params;
	const organization = await getActiveOrganization(organizationSlug);
	const session = await getSession();

	if (!organization) {
		redirect("/app");
	}

	const userIsAdmin = isOrganizationAdmin(organization, session?.user);

	// 如果是管理员，显示管理界面；否则显示普通成员列表
	if (userIsAdmin) {
		return <OrganizationMembersAdmin organizationSlug={organizationSlug} />;
	}
	return <OrganizationMembersBlock organizationId={organization.id} />;
}
