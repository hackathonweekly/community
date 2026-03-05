"use client";

import { Toaster } from "@community/ui/ui/toast";
import { config } from "@community/config";
import { AnalyticsScript } from "@analytics";
import { ConfirmationAlertProvider } from "@shared/components/ConfirmationAlertProvider";
import { ApiClientProvider } from "@community/ui/shared/ApiClientProvider";
import { ConsentBanner } from "@community/ui/shared/ConsentBanner";
import { ConsentProvider } from "@community/ui/shared/ConsentProvider";
import { ClientErrorTracker } from "@community/ui/shared/ClientErrorTracker";
import NextTopLoader from "nextjs-toploader";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import type { PropsWithChildren } from "react";
import { Provider as JotaiProvider } from "jotai";
import { ThemeProvider } from "next-themes";
import { NextProvider } from "fumadocs-core/framework/next";

export function Providers({ children }: PropsWithChildren) {
	return (
		<NextProvider>
			<NuqsAdapter>
				<ConsentProvider initialConsent={true}>
					<NextTopLoader color="var(--color-primary)" />
					<ThemeProvider
						attribute="class"
						disableTransitionOnChange
						enableSystem
						defaultTheme={config.ui.defaultTheme}
						themes={config.ui.enabledThemes}
					>
						<ApiClientProvider>
							<JotaiProvider>
								<ConfirmationAlertProvider>
									<ClientErrorTracker />
									{children}
								</ConfirmationAlertProvider>
							</JotaiProvider>
						</ApiClientProvider>
					</ThemeProvider>
					<Toaster position="top-right" />
					<ConsentBanner />
					<AnalyticsScript />
				</ConsentProvider>
			</NuqsAdapter>
		</NextProvider>
	);
}
