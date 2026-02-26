"use client";
import { authClient } from "@community/lib-client/auth/client";
import { useSession } from "@account/auth/hooks/use-session";
import { SettingsItem } from "@shared/components/SettingsItem";
import { Button } from "@community/ui/ui/button";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function SetPasswordForm() {
	const t = useTranslations();
	const { user } = useSession();
	const [submitting, setSubmitting] = useState(false);
	const router = useRouter();

	// 检查用户是否有已验证的邮箱
	const hasVerifiedEmail =
		user?.emailVerified &&
		user?.email &&
		!user.email.endsWith("@wechat.app");

	const onSubmit = async () => {
		if (!user) {
			return;
		}

		// 如果没有已验证的邮箱，导航到邮箱设置页面
		if (!hasVerifiedEmail) {
			toast.error(
				t(
					"settings.account.security.setPassword.notifications.needVerifiedEmail",
				),
			);
			// 导航到账户设置的邮箱部分
			router.push("/settings/general?tab=email");
			return;
		}

		setSubmitting(true);

		await authClient.forgetPassword(
			{
				email: user.email,
				redirectTo: `${window.location.origin}/auth/reset-password`,
			},
			{
				onSuccess: () => {
					toast.success(
						t(
							"settings.account.security.setPassword.notifications.success",
						),
					);
				},
				onError: () => {
					toast.error(
						t(
							"settings.account.security.setPassword.notifications.error",
						),
					);
				},
				onResponse: () => {
					setSubmitting(false);
				},
			},
		);
	};

	// 如果没有已验证的邮箱，显示不同的描述和按钮文本
	const description = hasVerifiedEmail
		? t("settings.account.security.setPassword.description")
		: t("settings.account.security.setPassword.descriptionNeedEmail");

	const buttonText = hasVerifiedEmail
		? t("settings.account.security.setPassword.submit")
		: t("settings.account.security.setPassword.submitNeedEmail");

	return (
		<SettingsItem
			title={t("settings.account.security.setPassword.title")}
			description={description}
		>
			<div className="flex justify-end">
				<Button type="submit" disabled={submitting} onClick={onSubmit}>
					{buttonText}
				</Button>
			</div>
		</SettingsItem>
	);
}
