"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { adminOrganizationsQueryKey } from "@account/admin/lib/api";
import { getAdminPath } from "@account/admin/lib/links";
import { InviteMemberForm } from "@account/organizations/components/InviteMemberForm";
import { OrganizationMembersBlock } from "@account/organizations/components/OrganizationMembersBlock";
import {
	fullOrganizationQueryKey,
	useCreateOrganizationMutation,
	useFullOrganizationQuery,
	useUpdateOrganizationMutation,
} from "@account/organizations/lib/api";
import { useRouter } from "@/hooks/router";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@community/ui/ui/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@community/ui/ui/card";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@community/ui/ui/form";
import { Input } from "@community/ui/ui/input";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const organizationFormSchema = z.object({
	name: z.string().min(1),
});

type OrganizationFormValues = z.infer<typeof organizationFormSchema>;

export function OrganizationForm({
	organizationId,
}: {
	organizationId: string;
}) {
	const t = useTranslations();
	const router = useRouter();

	const { data: organization } = useFullOrganizationQuery(organizationId);

	const updateOrganizationMutation = useUpdateOrganizationMutation();
	const createOrganizationMutation = useCreateOrganizationMutation();
	const queryClient = useQueryClient();

	const form = useForm<OrganizationFormValues>({
		resolver: zodResolver(organizationFormSchema),
		defaultValues: {
			name: organization?.name ?? "",
		},
	});

	const onSubmit = form.handleSubmit(async ({ name }) => {
		try {
			const newOrganization = organization
				? await updateOrganizationMutation.mutateAsync({
						id: organization.id,
						name,
						updateSlug: organization.name !== name,
					})
				: await createOrganizationMutation.mutateAsync({
						name,
					});

			if (!newOrganization) {
				throw new Error("Could not save organization");
			}

			queryClient.setQueryData(
				fullOrganizationQueryKey(organizationId),
				newOrganization,
			);

			queryClient.invalidateQueries({
				queryKey: adminOrganizationsQueryKey,
			});

			toast.success(t("admin.organizations.form.notifications.success"));

			if (!organization) {
				router.replace(
					getAdminPath(`/organizations/${newOrganization.id}`),
				);
			}
		} catch (error) {
			toast.error(t("admin.organizations.form.notifications.error"));
		}
	});

	return (
		<div className="grid grid-cols-1 gap-4">
			<Card>
				<CardHeader>
					<CardTitle>
						{organization
							? t("admin.organizations.form.updateTitle")
							: t("admin.organizations.form.createTitle")}
					</CardTitle>
				</CardHeader>
				<CardContent>
					<Form {...form}>
						<form
							onSubmit={onSubmit}
							className="grid grid-cols-1 gap-4"
						>
							<FormField
								control={form.control}
								name="name"
								render={({ field }) => (
									<FormItem>
										<FormLabel>
											{t("admin.organizations.form.name")}
										</FormLabel>
										<FormControl>
											<Input {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<div className="flex justify-end">
								<Button
									type="submit"
									disabled={
										updateOrganizationMutation.isPending ||
										createOrganizationMutation.isPending
									}
								>
									{t("admin.organizations.form.save")}
								</Button>
							</div>
						</form>
					</Form>
				</CardContent>
			</Card>

			{organization && (
				<>
					<OrganizationMembersBlock
						organizationId={organization.id}
					/>
					<InviteMemberForm
						organizationId={organization.id}
						organizationSlug={organization.slug}
					/>
				</>
			)}
		</div>
	);
}
