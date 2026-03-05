import type { Metadata, Viewport } from "next";
import type { PropsWithChildren } from "react";
import { Inter, JetBrains_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";
import "cropperjs/dist/cropper.css";
import { config } from "@community/config";
import { cn } from "@community/lib-shared/utils";
import { VersionLogger } from "@community/ui/version-logger";

const inter = Inter({
	subsets: ["latin"],
	display: "swap",
	variable: "--font-inter",
});

const spaceGrotesk = Space_Grotesk({
	subsets: ["latin"],
	display: "swap",
	variable: "--font-space-grotesk",
});

const jetBrainsMono = JetBrains_Mono({
	subsets: ["latin"],
	display: "swap",
	variable: "--font-jetbrains-mono",
});

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
		<html
			lang="zh"
			suppressHydrationWarning
			className={cn(
				inter.variable,
				spaceGrotesk.variable,
				jetBrainsMono.variable,
				"antialiased font-sans",
			)}
		>
			<body
				className={cn("min-h-screen bg-background text-foreground")}
				suppressHydrationWarning
			>
				<VersionLogger />
				{children}
			</body>
		</html>
	);
}
