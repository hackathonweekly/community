"use client";

import { Toaster } from "@/components/ui/toast";
import { config } from "@/config";
import { AnalyticsScript } from "@analytics";
import { ConfirmationAlertProvider } from "@dashboard/shared/components/ConfirmationAlertProvider";
import { ApiClientProvider } from "@/components/shared/ApiClientProvider";
import { ConsentBanner } from "@/components/shared/ConsentBanner";
import { ConsentProvider } from "@/components/shared/ConsentProvider";
import { ClientErrorTracker } from "@/components/shared/ClientErrorTracker";
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
