"use client";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { NotificationCenter } from "@/modules/dashboard/shared/components/NotificationCenter";
import { config } from "@/config";
import { cn } from "@/lib/utils";
import { LocaleLink, useLocalePathname } from "@i18n/routing";
import { useSession } from "@dashboard/auth/hooks/use-session";
import { ColorModeToggle } from "@/components/shared/ColorModeToggle";
import { LocaleSwitch } from "@/components/shared/LocaleSwitch";
import { Logo } from "@/components/shared/Logo";
import { useTranslations } from "next-intl";
import NextLink from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useDebounceCallback } from "usehooks-ts";
import { useBannerLayout } from "@/lib/hooks/use-banner-layout";

export function NavBar() {
	const t = useTranslations();
	const { user } = useSession();
	const { navbarTop } = useBannerLayout();
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
	const localePathname = useLocalePathname();
	const [isTop, setIsTop] = useState(true);

	const debouncedScrollHandler = useDebounceCallback(
		() => {
			setIsTop(window.scrollY <= 10);
		},
		150,
		{
			maxWait: 150,
		},
	);

	useEffect(() => {
		window.addEventListener("scroll", debouncedScrollHandler);
		debouncedScrollHandler();
		return () => {
			window.removeEventListener("scroll", debouncedScrollHandler);
		};
	}, [debouncedScrollHandler]);

	useEffect(() => {
		setMobileMenuOpen(false);
	}, [localePathname]);

	// Hide NavBar for immersive detail pages
	const shouldHideNavBar =
		localePathname.startsWith("/events/") ||
		localePathname.startsWith("/projects/") ||
		localePathname.startsWith("/u/");

	if (shouldHideNavBar) {
		return null;
	}

	const isDocsPage = localePathname.startsWith("/docs");
	const isHome1Page = localePathname.includes("/home1");

	const menuItems: {
		label: string;
		href: string;
		external?: boolean;
	}[] = [
		{
			label: t("tab_nav.events"),
			href: "/events",
		},
		{
			label: t("tab_nav.projects"),
			href: "/projects",
		},
		{
			label: t("tab_nav.organizations"),
			href: "/orgs",
		},
		{
			label: t("tab_nav.tools"),
			href: "/tools",
		},
		// {
		// 	label: t("tab_nav.blog"),
		// 	href: "/blog",
		// },
		// {
		// 	label: t("tab_nav.changelog"),
		// 	href: "/changelog",
		// },
		// {
		// 	label: t("tab_nav.weekly"),
		// 	href: "https://hackathonweekly.feishu.cn/wiki/Op4vwhAyOiic2NkJtqrc9bGQnCf",
		// 	external: true,
		// },
		// {
		// 	label: t("tab_nav.collab_docs"),
		// 	href: "https://docs.hackathonweekly.com",
		// 	external: true,
		// },
		{
			label: t("tab_nav.docs"),
			href: "/docs",
		},
	];

	const isMenuItemActive = (href: string) => localePathname.startsWith(href);

	return (
		<nav
			className={cn(
				"fixed left-0 z-50 w-full transition-all duration-200",
				navbarTop,
				!isTop || isDocsPage || isHome1Page
					? "bg-card/80 shadow-sm backdrop-blur-lg"
					: "shadow-none",
			)}
			data-test="navigation"
		>
			<div className="container">
				<div
					className={cn(
						"flex items-center justify-stretch gap-6 transition-[padding] duration-200",
						!isTop || isDocsPage || isHome1Page ? "py-4" : "py-6",
					)}
				>
					<div className="flex flex-1 justify-start">
						<LocaleLink
							href="/"
							className="block hover:no-underline active:no-underline"
						>
							<Logo />
						</LocaleLink>
					</div>

					<div className="hidden flex-1 items-center justify-center lg:flex">
						{menuItems.map((menuItem) =>
							menuItem.external ? (
								<a
									key={menuItem.href}
									href={menuItem.href}
									target="_blank"
									rel="noopener noreferrer"
									className={cn(
										"block px-3 py-2 font-medium text-foreground/90 text-base whitespace-nowrap rounded-md transition-all duration-200 hover:text-foreground hover:bg-accent/50",
									)}
								>
									{menuItem.label}
								</a>
							) : (
								<LocaleLink
									key={menuItem.href}
									href={menuItem.href}
									className={cn(
										"block px-3 py-2 font-medium text-foreground/90 text-sm whitespace-nowrap rounded-md transition-all duration-200 hover:text-foreground hover:bg-accent/50",
										isMenuItemActive(menuItem.href)
											? "font-semibold text-foreground bg-accent/30"
											: "",
									)}
								>
									{menuItem.label}
								</LocaleLink>
							),
						)}
					</div>

					<div className="flex flex-1 items-center justify-end gap-3">
						{user && <NotificationCenter />}
						<ColorModeToggle />
						{config.i18n.enabled && (
							<Suspense>
								<LocaleSwitch
									withLocaleInUrl={
										!isDocsPage && !isHome1Page
									}
								/>
							</Suspense>
						)}

						<Sheet
							open={mobileMenuOpen}
							onOpenChange={(open) => setMobileMenuOpen(open)}
						>
							{/*<SheetTrigger asChild>
								<Button
									className="lg:hidden"
									size="icon"
									variant="ghost"
									aria-label="Menu"
								>
									<MenuIcon className="size-4" />
								</Button>
							</SheetTrigger>*/}
							<SheetContent className="w-[280px]" side="right">
								<SheetTitle />
								<div className="flex flex-col items-start justify-center">
									{user && (
										<div className="flex items-center justify-center w-full mb-4 pb-4 border-b">
											<NotificationCenter />
										</div>
									)}
									{menuItems.map((menuItem) =>
										menuItem.external ? (
											<a
												key={menuItem.href}
												href={menuItem.href}
												target="_blank"
												rel="noopener noreferrer"
												className={cn(
													"block px-3 py-3 font-medium text-base text-foreground/90 rounded-md transition-all duration-200 hover:text-foreground hover:bg-accent/50",
												)}
											>
												{menuItem.label}
											</a>
										) : (
											<LocaleLink
												key={menuItem.href}
												href={menuItem.href}
												className={cn(
													"block px-3 py-3 font-medium text-base text-foreground/90 rounded-md transition-all duration-200 hover:text-foreground hover:bg-accent/50",
													isMenuItemActive(
														menuItem.href,
													)
														? "font-semibold text-foreground bg-accent/30"
														: "",
												)}
											>
												{menuItem.label}
											</LocaleLink>
										),
									)}

									<NextLink
										key={user ? "start" : "login"}
										href={user ? "/app" : "/auth/login"}
										className="block px-3 py-3 text-base font-medium text-foreground/90 rounded-md transition-all duration-200 hover:text-foreground hover:bg-accent/50"
										prefetch={!user}
									>
										{user
											? t("common.menu.dashboard")
											: t("common.menu.login")}
									</NextLink>
								</div>
							</SheetContent>
						</Sheet>

						{user ? (
							<Button
								key="dashboard"
								className="hidden lg:flex"
								asChild
								variant="secondary"
							>
								<NextLink href="/app">
									{t("common.menu.dashboard")}
								</NextLink>
							</Button>
						) : (
							<Button
								key="login"
								className="hidden lg:flex"
								asChild
								variant="secondary"
							>
								<NextLink href="/auth/login">
									{t("common.menu.login")}
								</NextLink>
							</Button>
						)}
					</div>
				</div>
			</div>
		</nav>
	);
}
