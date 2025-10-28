import { db } from "@/lib/database";
import { getSession } from "@dashboard/auth/lib/server";
import { PrivacySettingsForm } from "@dashboard/settings/components/PrivacySettingsForm";
import { SettingsList } from "@dashboard/shared/components/SettingsList";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";

export async function generateMetadata() {
	const t = await getTranslations();
	return {
		title: t("settings.privacy.title"),
		description: t("settings.privacy.description"),
	};
}

export default async function PrivacySettingsPage() {
	const session = await getSession();

	if (!session) {
		return redirect("/auth/login");
	}

	const user = await db.user.findUnique({
		where: {
			id: session.user.id,
		},
		select: {
			profilePublic: true,
			showEmail: true,
			showWechat: true,
		},
	});

	if (!user) {
		throw new Error("User not found");
	}

	return (
		<SettingsList>
			<PrivacySettingsForm user={user} />
		</SettingsList>
	);
}
