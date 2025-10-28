"use client";

import { authClient } from "@/lib/auth/client";
import { useActiveOrganization } from "@dashboard/organizations/hooks/use-active-organization";
import { useOrganizationListQuery } from "@dashboard/organizations/lib/api";
import { useConfirmationAlert } from "@dashboard/shared/components/ConfirmationAlertProvider";
import { SettingsItem } from "@dashboard/shared/components/SettingsItem";
import { useRouter } from "@/hooks/router";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

export function DeleteOrganizationForm() {
	const t = useTranslations();
	const router = useRouter();
	const { confirm } = useConfirmationAlert();
	const { refetch: reloadOrganizations } = useOrganizationListQuery();
	const { activeOrganization, setActiveOrganization } =
		useActiveOrganization();

	if (!activeOrganization) {
		return null;
	}

	const handleDelete = async () => {
		confirm({
			title: t("organizations.settings.deleteOrganization.title"),
			message: t(
				"organizations.settings.deleteOrganization.confirmation",
			),
			destructive: true,
			onConfirm: async () => {
				const { data, error } = await authClient.organization.delete({
					organizationId: activeOrganization.id,
				});

				if (error) {
					toast.error(
						t(
							"organizations.settings.notifications.organizationNotDeleted",
						),
					);
					return;
				}

				toast.success(
					t(
						"organizations.settings.notifications.organizationDeleted",
					),
				);
				await setActiveOrganization(null);
				await reloadOrganizations();
				router.replace("/app");
			},
		});
	};

	return (
		<>
			<SettingsItem
				danger
				title={t("organizations.settings.deleteOrganization.title")}
				description={t(
					"organizations.settings.deleteOrganization.description",
				)}
			>
				<div className="mt-4 flex justify-end">
					<Button variant="destructive" onClick={handleDelete}>
						{t("organizations.settings.deleteOrganization.submit")}
					</Button>
				</div>
			</SettingsItem>
		</>
	);
}
