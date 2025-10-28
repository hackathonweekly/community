"use client";

import { authClient } from "@/lib/auth/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSession } from "@dashboard/auth/hooks/use-session";
import { SettingsItem } from "@dashboard/shared/components/SettingsItem";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const formSchema = z.object({
	email: z.string().trim().email(),
});

type FormSchema = z.infer<typeof formSchema>;

export function ChangeEmailForm() {
	const { user, reloadSession } = useSession();
	const t = useTranslations();

	const form = useForm<FormSchema>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			email: user?.email ?? "",
		},
	});

	const onSubmit = form.handleSubmit(async ({ email }) => {
		const { error } = await authClient.changeEmail({
			newEmail: email,
		});

		if (error) {
			// 根据具体错误类型显示不同的提示信息
			if (
				error.message?.includes("Email already exists") ||
				error.status === 400
			) {
				toast.error(
					t(
						"settings.account.changeEmail.notifications.emailAlreadyExists",
						{
							email,
						},
					),
				);
			} else if (
				error.message?.includes("Invalid email") ||
				error.status === 422
			) {
				toast.error(
					t(
						"settings.account.changeEmail.notifications.invalidEmail",
					),
				);
			} else {
				toast.error(
					t("settings.account.changeEmail.notifications.error"),
				);
			}
			return;
		}

		toast.success(
			t("settings.account.changeEmail.notifications.success", {
				email,
			}),
		);

		reloadSession();
	});

	return (
		<SettingsItem
			title={t("settings.account.changeEmail.title")}
			description={t("settings.account.changeEmail.description")}
		>
			<form
				onSubmit={(e) => {
					e.preventDefault();
					onSubmit();
				}}
			>
				<Input type="email" {...form.register("email")} />

				<div className="mt-4 flex justify-end">
					<Button
						type="submit"
						disabled={
							form.formState.isSubmitting ||
							!(
								form.formState.isValid &&
								form.formState.dirtyFields.email
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
