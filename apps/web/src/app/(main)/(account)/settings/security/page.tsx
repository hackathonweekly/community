import { config } from "@community/config";
import { getServerQueryClient } from "@community/lib-server/server";
import { userAccountQueryKey, userPasskeyQueryKey } from "@shared/auth/lib/api";
import {
	getSession,
	getUserAccounts,
	getUserPasskeys,
} from "@shared/auth/lib/server";
import { ActiveSessionsBlock } from "@account/settings/components/ActiveSessionsBlock";
import { ChangePasswordForm } from "@account/settings/components/ChangePassword";
import { ConnectedAccountsBlock } from "@account/settings/components/ConnectedAccountsBlock";
import { PasskeysBlock } from "@account/settings/components/PasskeysBlock";
import { EventsTokenBlock } from "@account/settings/components/EventsTokenBlock";
import { PhoneNumberBindingBlock } from "@account/settings/components/PhoneNumberBindingBlock";
import { SetPasswordForm } from "@account/settings/components/SetPassword";
import { TwoFactorBlock } from "@account/settings/components/TwoFactorBlock";
import { SettingsList } from "@shared/components/SettingsList";
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
		(account: { provider?: string }) => account.provider === "credential",
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
