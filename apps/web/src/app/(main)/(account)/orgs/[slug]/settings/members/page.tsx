import { getActiveOrganization, getSession } from "@shared/auth/lib/server";
import { OrganizationMembersBlock } from "@account/organizations/components/OrganizationMembersBlock";
import { OrganizationMembersAdmin } from "@account/organizations/components/OrganizationMembersAdmin";
import { isOrganizationAdmin } from "@community/lib-shared/auth/lib/helper";
import { redirect } from "next/navigation";

export default async function OrganizationSettingsMembersPage({
	params,
}: {
	params: Promise<{ slug: string }>;
}) {
	const { slug } = await params;
	const organization = await getActiveOrganization(slug);
	const session = await getSession();

	if (!organization) {
		redirect("/");
	}

	const userIsAdmin = isOrganizationAdmin(organization, session?.user);

	if (userIsAdmin) {
		return <OrganizationMembersAdmin organizationSlug={slug} />;
	}
	return <OrganizationMembersBlock organizationId={organization.id} />;
}
