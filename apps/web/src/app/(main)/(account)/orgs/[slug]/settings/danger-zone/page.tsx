import { DeleteOrganizationForm } from "@account/organizations/components/DeleteOrganizationForm";
import { SettingsList } from "@shared/components/SettingsList";
import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
	const t = await getTranslations();

	return {
		title: t("organizations.settings.dangerZone.title"),
	};
}

export default function OrganizationSettingsDangerZonePage() {
	return (
		<SettingsList>
			<DeleteOrganizationForm />
		</SettingsList>
	);
}
