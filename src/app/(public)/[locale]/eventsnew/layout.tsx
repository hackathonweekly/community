import { Providers } from "@/components/shared/Providers";
import { config } from "@/config";
import { ConditionalFooter } from "@/modules/public/shared/components/ConditionalFooter";
import { SessionProvider } from "@dashboard/auth/components/SessionProvider";
import { getSession } from "@dashboard/auth/lib/server";
import { RootProvider as FumadocsRootProvider } from "fumadocs-ui/provider";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import type { PropsWithChildren } from "react";
import { DynamicLayoutWrapper } from "../DynamicLayoutWrapper";

const locales = Object.keys(config.i18n.locales);

export function generateStaticParams() {
	return locales.map((locale) => ({ locale }));
}

export default async function EventsNewLayout({
	children,
	params,
}: PropsWithChildren<{ params: Promise<{ locale: string }> }>) {
	const { locale } = await params;

	setRequestLocale(locale);

	if (!locales.includes(locale as any)) {
		throw new Error("Locale not supported");
	}

	const messages = await getMessages({ locale });
	const session = await getSession();

	return (
		<Providers>
			<FumadocsRootProvider
				theme={{ enabled: false }}
				i18n={{ locale }}
				search={{
					enabled: true,
					options: {
						api: "/api/docs-search",
					},
				}}
			>
				<NextIntlClientProvider locale={locale} messages={messages}>
					<SessionProvider initialSession={session}>
						{/* 无 Header/TabBar/BetaBanner，保持沉浸式 */}
						<DynamicLayoutWrapper>{children}</DynamicLayoutWrapper>
						<ConditionalFooter locale={locale} />
					</SessionProvider>
				</NextIntlClientProvider>
			</FumadocsRootProvider>
		</Providers>
	);
}
