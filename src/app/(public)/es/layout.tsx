import { BetaBanner } from "@/components/shared/BetaBanner";
import { CustomerServiceWidget } from "@/components/shared/CustomerServiceWidget";
import { Providers } from "@/components/shared/Providers";
import { config } from "@/config";
import { ConditionalFooter } from "@/modules/public/shared/components/ConditionalFooter";
import { NavBar } from "@/modules/public/shared/components/NavBar";
import { TabBar } from "@/modules/public/shared/components/TabBar";
import { SessionProvider } from "@dashboard/auth/components/SessionProvider";
import { getSession } from "@dashboard/auth/lib/server";
import { RootProvider as FumadocsRootProvider } from "fumadocs-ui/provider";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import type { PropsWithChildren } from "react";
import { DynamicLayoutWrapper } from "../[locale]/DynamicLayoutWrapper";

const defaultLocale = config.i18n.defaultLocale ?? "zh";

export default async function EsLayout({
	children,
}: PropsWithChildren<Record<string, unknown>>) {
	// 固定使用中文文案，以便复用现有组件
	const locale = defaultLocale;
	setRequestLocale(locale);

	const messages = await getMessages({ locale });
	const session = await getSession();

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
					<SessionProvider initialSession={session}>
						<BetaBanner locale={locale} />
						<NavBar />
						<DynamicLayoutWrapper>{children}</DynamicLayoutWrapper>
						<ConditionalFooter locale={locale} />
						<TabBar />
						<CustomerServiceWidget />
					</SessionProvider>
				</NextIntlClientProvider>
			</FumadocsRootProvider>
		</Providers>
	);
}
