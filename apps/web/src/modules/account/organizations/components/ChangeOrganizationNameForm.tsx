"use client";
import { authClient } from "@community/lib-client/auth/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useActiveOrganization } from "@account/organizations/hooks/use-active-organization";
import { organizationListQueryKey } from "@account/organizations/lib/api";
import { SettingsItem } from "@shared/components/SettingsItem";
import { useRouter } from "@/hooks/router";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@community/ui/ui/button";
import { Input } from "@community/ui/ui/input";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const formSchema = z.object({
	name: z.string().min(3),
});

type FormSchema = z.infer<typeof formSchema>;

export function ChangeOrganizationNameForm() {
	const t = useTranslations();
	const router = useRouter();
	const queryClient = useQueryClient();
	const { activeOrganization } = useActiveOrganization();

	const form = useForm<FormSchema>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			name: activeOrganization?.name ?? "",
		},
	});

	const onSubmit = form.handleSubmit(async ({ name }) => {
		if (!activeOrganization) {
			return;
		}

		try {
			const { error } = await authClient.organization.update({
				organizationId: activeOrganization.id,
				data: {
					name,
				},
			});

			if (error) {
				throw error;
			}

			toast.success(
				t(
					"organizations.settings.notifications.organizationNameUpdated",
				),
			);

			queryClient.invalidateQueries({
				queryKey: organizationListQueryKey,
			});
			router.refresh();
		} catch {
			toast.error(
				t(
					"organizations.settings.notifications.organizationNameNotUpdated",
				),
			);
		}
	});

	return (
		<SettingsItem title={t("organizations.settings.changeName.title")}>
			<form onSubmit={onSubmit} className="w-full">
				<Input {...form.register("name")} className="w-full" />

				<div className="mt-4 flex justify-end">
					<Button
						type="submit"
						size="sm"
						className="w-full sm:w-auto"
						disabled={
							form.formState.isSubmitting ||
							!(
								form.formState.isValid &&
								form.formState.dirtyFields.name
							)
						}
					>
						{t("settings.save")}
					</Button>
				</div>
			</form>
		</SettingsItem>
	);
}
