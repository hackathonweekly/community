import { config } from "@/config";
import { getServerQueryClient } from "@/lib/server";
import {
	userAccountQueryKey,
	userPasskeyQueryKey,
} from "@dashboard/auth/lib/api";
import {
	getSession,
	getUserAccounts,
	getUserPasskeys,
} from "@dashboard/auth/lib/server";
import { ActiveSessionsBlock } from "@dashboard/settings/components/ActiveSessionsBlock";
import { ChangePasswordForm } from "@dashboard/settings/components/ChangePassword";
import { ConnectedAccountsBlock } from "@dashboard/settings/components/ConnectedAccountsBlock";
import { PasskeysBlock } from "@dashboard/settings/components/PasskeysBlock";
import { EventsTokenBlock } from "@dashboard/settings/components/EventsTokenBlock";
import { PhoneNumberBindingBlock } from "@dashboard/settings/components/PhoneNumberBindingBlock";
import { SetPasswordForm } from "@dashboard/settings/components/SetPassword";
import { TwoFactorBlock } from "@dashboard/settings/components/TwoFactorBlock";
import { SettingsList } from "@dashboard/shared/components/SettingsList";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";

export async function generateMetadata() {
	const t = await getTranslations();

	return {
		title: t("settings.account.security.title"),
	};
}

export default async function AccountSettingsPage() {
	const session = await getSession();

	if (!session) {
		return redirect("/auth/login");
	}

	const userAccounts = await getUserAccounts();

	const userHasPassword = userAccounts?.some(
		(account) => account.provider === "credential",
	);

	const queryClient = getServerQueryClient();

	await queryClient.prefetchQuery({
		queryKey: userAccountQueryKey,
		queryFn: () => getUserAccounts(),
	});

	if (config.auth.enablePasskeys) {
		await queryClient.prefetchQuery({
			queryKey: userPasskeyQueryKey,
			queryFn: () => getUserPasskeys(),
		});
	}

	return (
		<SettingsList>
			{config.auth.enablePasswordLogin &&
				(userHasPassword ? (
					<ChangePasswordForm />
				) : (
					<SetPasswordForm />
				))}
			<PhoneNumberBindingBlock />
			{config.auth.enableSocialLogin && <ConnectedAccountsBlock />}
			{config.auth.enablePasskeys && <PasskeysBlock />}
			{config.auth.enableTwoFactor && <TwoFactorBlock />}
			<EventsTokenBlock />
			<ActiveSessionsBlock />
		</SettingsList>
	);
}
