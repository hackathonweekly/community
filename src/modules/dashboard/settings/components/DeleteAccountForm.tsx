"use client";

import { authClient } from "@/lib/auth/client";
import { useSession } from "@dashboard/auth/hooks/use-session";
import { useConfirmationAlert } from "@dashboard/shared/components/ConfirmationAlertProvider";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function DeleteAccountForm() {
	const t = useTranslations();
	const { reloadSession } = useSession();
	const { confirm } = useConfirmationAlert();
	const router = useRouter();

	const deleteUserMutation = useMutation({
		mutationFn: async () => {
			const { error } = await authClient.deleteUser({});

			if (error) {
				throw error;
			}
		},
		onSuccess: async () => {
			toast.success(
				t("settings.account.deleteAccount.notifications.success"),
			);
			// 使用 Better Auth 的 signOut 方法确保完全登出
			await authClient.signOut();
			router.push("/auth/login");
		},
		onError: () => {
			toast.error(
				t("settings.account.deleteAccount.notifications.error"),
			);
		},
	});

	const confirmDelete = () => {
		confirm({
			title: t("settings.account.deleteAccount.title"),
			message: t("settings.account.deleteAccount.confirmation"),
			onConfirm: async () => {
				await deleteUserMutation.mutateAsync();
			},
		});
	};

	return (
		<Card className="border-destructive/50">
			<CardHeader>
				<CardTitle className="text-destructive">
					{t("settings.account.deleteAccount.title")}
				</CardTitle>
				<CardDescription>
					{t("settings.account.deleteAccount.description")}
				</CardDescription>
			</CardHeader>
			<CardContent className="flex justify-end">
				<Button variant="destructive" onClick={() => confirmDelete()}>
					{t("settings.account.deleteAccount.submit")}
				</Button>
			</CardContent>
		</Card>
	);
}
