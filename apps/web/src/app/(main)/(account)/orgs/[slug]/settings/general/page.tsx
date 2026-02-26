import { Button } from "@community/ui/ui/button";
import { getActiveOrganization } from "@shared/auth/lib/server";
import { ChangeOrganizationNameForm } from "@account/organizations/components/ChangeOrganizationNameForm";
import { DeleteOrganizationForm } from "@account/organizations/components/DeleteOrganizationForm";
import { OrganizationCommunityForm } from "@account/organizations/components/OrganizationCommunityForm";
import { OrganizationCoverImageForm } from "@account/organizations/components/OrganizationCoverImageForm";
import { OrganizationLogoForm } from "@account/organizations/components/OrganizationLogoForm";
import { SettingsList } from "@shared/components/SettingsList";
import { ExternalLink } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export async function generateMetadata() {
	const t = await getTranslations();

	return {
		title: t("organizations.settings.title"),
	};
}

export default async function OrganizationSettingsPage({
	params,
}: {
	params: Promise<{ slug: string }>;
}) {
	const { slug } = await params;
	const organization = await getActiveOrganization(slug);

	if (!organization) {
		redirect("/");
	}

	return (
		<div className="space-y-6">
			{/* 组织首页链接 */}
			<div className="flex justify-center sm:justify-end">
				<Link
					href={`/orgs/${organization.slug}`}
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
				</Link>
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
