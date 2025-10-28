import { Button } from "@/components/ui/button";
import { config } from "@/config";
import { getSession } from "@dashboard/auth/lib/server";
import { ChangeEmailForm } from "@dashboard/settings/components/ChangeEmailForm";
import { UserLanguageForm } from "@dashboard/settings/components/UserLanguageForm";
import { SettingsList } from "@dashboard/shared/components/SettingsList";
import { SettingsItem } from "@dashboard/shared/components/SettingsItem";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { redirect } from "next/navigation";

export async function generateMetadata() {
	const t = await getTranslations();

	return {
		title: t("settings.account.title"),
	};
}

export default async function AccountSettingsPage() {
	const session = await getSession();

	if (!session) {
		return redirect("/auth/login");
	}

	const t = await getTranslations();

	return (
		<SettingsList>
			{/* Profile Settings Redirect Notice */}
			<SettingsItem
				title={t("settings.profileSettings.title", {
					default: "Profile Settings",
				})}
				description={t("settings.profileSettings.description", {
					default:
						"Manage your profile information, role, and collaboration preferences",
				})}
			>
				<Button asChild variant="outline">
					<Link href="/app/profile">
						{t("settings.profileSettings.goToProfile", {
							default: "Go to Profile Settings",
						})}
					</Link>
				</Button>
			</SettingsItem>

			{config.i18n.enabled && <UserLanguageForm />}
			<ChangeEmailForm />
		</SettingsList>
	);
}
