import { Button } from "@/components/ui/button";
import { LocaleLink } from "@/modules/i18n/routing";
import { getActiveOrganization } from "@dashboard/auth/lib/server";
import { ChangeOrganizationNameForm } from "@dashboard/organizations/components/ChangeOrganizationNameForm";
import { DeleteOrganizationForm } from "@dashboard/organizations/components/DeleteOrganizationForm";
import { OrganizationCommunityForm } from "@dashboard/organizations/components/OrganizationCommunityForm";
import { OrganizationCoverImageForm } from "@dashboard/organizations/components/OrganizationCoverImageForm";
import { OrganizationLogoForm } from "@dashboard/organizations/components/OrganizationLogoForm";
import { SettingsList } from "@dashboard/shared/components/SettingsList";
import { ExternalLink } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";

export async function generateMetadata() {
	const t = await getTranslations();

	return {
		title: t("organizations.settings.title"),
	};
}

export default async function OrganizationSettingsPage({
	params,
}: {
	params: Promise<{ organizationSlug: string }>;
}) {
	const { organizationSlug } = await params;
	const organization = await getActiveOrganization(organizationSlug);

	if (!organization) {
		redirect("/app");
	}

	return (
		<div className="space-y-6">
			{/* 组织首页链接 */}
			<div className="flex justify-center sm:justify-end">
				<LocaleLink
					href={
						organization.slug
							? `/orgs/${organization.slug}`
							: `/organizations/${organization.id}`
					}
					target="_blank"
					rel="noopener noreferrer"
				>
					<Button
						variant="outline"
						size="sm"
						className="flex items-center gap-2 w-full sm:w-auto"
					>
						<ExternalLink className="h-4 w-4" />
						查看组织首页
					</Button>
				</LocaleLink>
			</div>

			<SettingsList>
				<OrganizationLogoForm />
				<OrganizationCoverImageForm />
				<ChangeOrganizationNameForm />
				<OrganizationCommunityForm />
				<DeleteOrganizationForm />
			</SettingsList>
		</div>
	);
}
