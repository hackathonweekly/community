import { config } from "@/config";
import { ConditionalFooter } from "@/modules/public/shared/components/ConditionalFooter";
import { NavBar } from "@/modules/public/shared/components/NavBar";
import { TabBar } from "@/modules/public/shared/components/TabBar";
import { SessionProvider } from "@dashboard/auth/components/SessionProvider";
import { getSession } from "@dashboard/auth/lib/server";
import { BetaBanner } from "@/components/shared/BetaBanner";
import { CustomerServiceWidget } from "@/components/shared/CustomerServiceWidget";
import { Providers } from "@/components/shared/Providers";
import { RootProvider as FumadocsRootProvider } from "fumadocs-ui/provider";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import type { PropsWithChildren } from "react";
import { DynamicLayoutWrapper } from "./DynamicLayoutWrapper";

const locales = Object.keys(config.i18n.locales);

export function generateStaticParams() {
	return locales.map((locale) => ({ locale }));
}

export default async function MarketingLayout({
	children,
	params,
}: PropsWithChildren<{ params: Promise<{ locale: string }> }>) {
	const { locale } = await params;

	setRequestLocale(locale);

	if (!locales.includes(locale as any)) {
		notFound();
	}

	const messages = await getMessages();

	// Get session for authenticated users in public pages
	const session = await getSession();

	return (
		<Providers>
			<FumadocsRootProvider
				// Avoid double theme provider; we wrap theme in Providers
				theme={{ enabled: false }}
				i18n={{
					locale: locale,
				}}
				search={{
					enabled: true,
					options: {
						api: "/api/docs-search",
					},
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
