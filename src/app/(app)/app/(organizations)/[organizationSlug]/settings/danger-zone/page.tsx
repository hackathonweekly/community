import { DeleteOrganizationForm } from "@dashboard/organizations/components/DeleteOrganizationForm";
import { SettingsList } from "@dashboard/shared/components/SettingsList";
import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
	const t = await getTranslations();

	return {
		title: t("organizations.settings.dangerZone.title"),
	};
}

export default function OrganizationSettingsPage() {
	return (
		<SettingsList>
			<DeleteOrganizationForm />
		</SettingsList>
	);
}
