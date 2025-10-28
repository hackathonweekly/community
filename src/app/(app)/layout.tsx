import { Providers } from "@/components/shared/Providers";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import type { PropsWithChildren } from "react";
import { DynamicAppWrapper } from "./DynamicAppWrapper";

export default async function LocaleLayout({ children }: PropsWithChildren) {
	const locale = await getLocale();
	const messages = await getMessages();

	return (
		<Providers>
			<NextIntlClientProvider messages={messages}>
				<DynamicAppWrapper>{children}</DynamicAppWrapper>
			</NextIntlClientProvider>
		</Providers>
	);
}
