import type { Metadata, Viewport } from "next";
import type { PropsWithChildren } from "react";
import "./globals.css";
import "cropperjs/dist/cropper.css";
import { config } from "@/config";
import { GeistSans } from "geist/font/sans";
import { cn } from "@/lib/utils";
import { VersionLogger } from "@/components/version-logger";

export const metadata: Metadata = {
	title: {
		absolute: config.appName,
		default: config.appName,
		template: `%s | ${config.appName}`,
	},
};

export const viewport: Viewport = {
	width: "device-width",
	initialScale: 1,
	maximumScale: 1,
	userScalable: false,
};

export default function RootLayout({ children }: PropsWithChildren) {
	return (
		<html lang="zh" suppressHydrationWarning className={GeistSans.variable}>
			<body
				className={cn(
					"min-h-screen bg-background text-foreground antialiased",
				)}
				suppressHydrationWarning
			>
				<VersionLogger />
				{children}
			</body>
		</html>
	);
}
