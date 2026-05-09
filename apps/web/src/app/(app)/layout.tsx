import { Providers } from "@community/ui/shared/Providers";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages, setRequestLocale } from "next-intl/server";
import type { PropsWithChildren } from "react";

export default async function LocaleLayout({ children }: PropsWithChildren) {
	const locale = await getLocale();
	const messages = await getMessages();
	setRequestLocale(locale);

	return (
		<Providers>
			<NextIntlClientProvider locale={locale} messages={messages}>
				{children}
			</NextIntlClientProvider>
		</Providers>
	);
}
