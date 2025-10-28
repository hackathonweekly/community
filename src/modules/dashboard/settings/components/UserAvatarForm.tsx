"use client";
import { SettingsItem } from "@dashboard/shared/components/SettingsItem";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { UserAvatarUpload } from "./UserAvatarUpload";

export function UserAvatarForm() {
	const t = useTranslations();

	return (
		<SettingsItem
			title={t("settings.account.avatar.title")}
			description={t("settings.account.avatar.description")}
		>
			<UserAvatarUpload
				onSuccess={() => {
					toast.success(
						t("settings.account.avatar.notifications.success"),
					);
				}}
				onError={(message) => {
					toast.error(
						message ??
							t("settings.account.avatar.notifications.error"),
					);
				}}
			/>
		</SettingsItem>
	);
}
