import { config } from "@community/config";
import { Footer } from "@shared/components/Footer";
import { ColorModeToggle } from "@community/ui/shared/ColorModeToggle";
import { LocaleSwitch } from "@community/ui/shared/LocaleSwitch";
import { Logo } from "@community/ui/shared/Logo";
import { cn } from "@community/lib-shared/utils";
import { updateLocale } from "@i18n/lib/update-locale";
import Link from "next/link";
import { type PropsWithChildren, Suspense } from "react";

export function AuthWrapper({
	children,
	contentClass,
}: PropsWithChildren<{ contentClass?: string }>) {
	return (
		<div className="flex min-h-screen w-full py-6 bg-background">
			<div className="flex w-full flex-col items-center justify-between gap-8">
				<div className="container">
					<div className="flex items-center justify-between">
						<Link href="/" className="block">
							<Logo />
						</Link>

						<div className="flex items-center justify-end gap-2">
							{config.i18n.enabled && (
								<Suspense>
									<LocaleSwitch
										onLocaleChange={updateLocale}
									/>
								</Suspense>
							)}
							<ColorModeToggle />
						</div>
					</div>
				</div>

				<div className="container flex justify-center">
					<main
						className={cn(
							"w-full max-w-md rounded-xl bg-card p-6 border border-border shadow-sm lg:p-8",
							contentClass,
						)}
					>
						{children}
					</main>
				</div>

				<Footer variant="minimal" />
			</div>
		</div>
	);
}
