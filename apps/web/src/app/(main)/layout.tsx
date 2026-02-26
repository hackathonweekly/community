import { config } from "@community/config";
import { SessionProvider } from "@shared/auth/components/SessionProvider";
import { sessionQueryKey } from "@shared/auth/lib/api";
import { getOrganizationList, getSession } from "@shared/auth/lib/server";
import { ActiveOrganizationProvider } from "@shared/organizations/components/ActiveOrganizationProvider";
import { organizationListQueryKey } from "@shared/organizations/lib/api";
import { ConfirmationAlertProvider } from "@shared/components/ConfirmationAlertProvider";
import { PhoneBindingPrompt } from "@community/ui/shared/PhoneBindingPrompt";
import { Providers } from "@community/ui/shared/Providers";
import { getServerQueryClient } from "@community/lib-server/server";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { RootProvider as FumadocsRootProvider } from "fumadocs-ui/provider/next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages, setRequestLocale } from "next-intl/server";
import type { PropsWithChildren } from "react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function MainLayout({ children }: PropsWithChildren) {
	const locale = await getLocale();
	setRequestLocale(locale);
	const messages = await getMessages();
	const session = await getSession();

	const queryClient = getServerQueryClient();

	await queryClient.prefetchQuery({
		queryKey: sessionQueryKey,
		queryFn: () => session,
	});

	if (config.organizations.enable) {
		await queryClient.prefetchQuery({
			queryKey: organizationListQueryKey,
			queryFn: getOrganizationList,
		});
	}

	return (
		<Providers>
			<FumadocsRootProvider
				theme={{ enabled: false }}
				i18n={{ locale }}
				search={{
					enabled: true,
					options: { api: "/api/docs-search" },
				}}
			>
				<NextIntlClientProvider locale={locale} messages={messages}>
					<HydrationBoundary state={dehydrate(queryClient)}>
						<SessionProvider initialSession={session}>
							<ActiveOrganizationProvider>
								<ConfirmationAlertProvider>
									<PhoneBindingPrompt />
									{children}
								</ConfirmationAlertProvider>
							</ActiveOrganizationProvider>
						</SessionProvider>
					</HydrationBoundary>
				</NextIntlClientProvider>
			</FumadocsRootProvider>
		</Providers>
	);
}
