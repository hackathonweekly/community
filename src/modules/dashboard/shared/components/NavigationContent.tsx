"use client";

import { cn } from "@/lib/utils";
import { config } from "@/config";
import { Logo } from "@/components/shared/Logo";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { ContactModal } from "@/modules/public/intro/components/ContactModal";
import { OrganzationSelect } from "@dashboard/organizations/components/OrganizationSelect";
import { UserMenuActions } from "@dashboard/shared/components/UserMenuActions";
import {
	UnifiedNavMenu,
	type MenuItem,
} from "@dashboard/shared/components/UnifiedNavMenu";
import type { ThemeOption } from "@dashboard/shared/hooks/use-navigation-data";
import {
	HomeIcon,
	BookIcon,
	MessageCircleIcon,
	HardDriveIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import type { Session, ActiveOrganization } from "@/lib/auth";
import { useEffect, useState } from "react";

type NavigationContentProps = {
	user: Session["user"] | null;
	menuItems: MenuItem[];
	themeOptions: ThemeOption[];
	currentThemeOption?: ThemeOption;
	cycleTheme: () => void;
	canManageOrganization: boolean;
	activeOrganization: ActiveOrganization | null;
	onNavigate?: () => void;
	variant?: "desktop" | "mobile";
};

export function NavigationContent({
	user,
	menuItems,
	currentThemeOption,
	cycleTheme,
	canManageOrganization,
	activeOrganization,
	onNavigate,
	variant = "desktop",
}: NavigationContentProps) {
	const t = useTranslations();
	// Defer theme-dependent UI to client to avoid SSR/CSR hydration mismatch
	const [mounted, setMounted] = useState(false);
	useEffect(() => setMounted(true), []);

	const isMobile = variant === "mobile";
	const navItemClasses = cn(
		"flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-colors",
		"text-foreground/70 hover:bg-accent hover:text-foreground",
		"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1",
	);
	const iconClasses = "size-4 shrink-0";
	const labelClasses = "flex-1 text-left";

	return (
		<>
			{/* Logo Section */}
			<div className={isMobile ? "p-6 pb-4" : "p-6 pb-4"}>
				<Link href="/" onClick={onNavigate}>
					<Logo />
				</Link>
			</div>

			{/* Organization Select */}
			{config.organizations.enable &&
				!config.organizations.hideOrganization && (
					<div className="px-4 pb-4">
						<OrganzationSelect />
					</div>
				)}

			{/* Navigation Menu */}
			<nav className="flex-1 overflow-y-auto px-2">
				{/* Main Menu Items with UnifiedNavMenu */}
				<UnifiedNavMenu items={menuItems} onNavigate={onNavigate} />

				{/* Divider */}
				<div className={isMobile ? "my-4 border-t" : "my-3 border-t"} />

				{/* Additional Menu Items */}
				<ul className={isMobile ? "space-y-1" : "space-y-0.5"}>
					{/* Home */}
					<li>
						<Link
							href="/"
							onClick={onNavigate}
							className={navItemClasses}
						>
							<HomeIcon className={iconClasses} />
							<span className={labelClasses}>
								{t("app.userMenu.home")}
							</span>
						</Link>
					</li>

					{/* Documentation */}
					<li>
						<a
							href="https://HackathonWeekly.com/docs/nextjs"
							target="_blank"
							rel="noopener noreferrer"
							onClick={onNavigate}
							className={navItemClasses}
						>
							<BookIcon className={iconClasses} />
							<span className={labelClasses}>
								{t("app.userMenu.documentation")}
							</span>
						</a>
					</li>

					{/* Theme Toggle */}
					<li>
						<button
							type="button"
							onClick={cycleTheme}
							className={navItemClasses}
						>
							{/* Render a stable icon/label on the server, then swap after mount */}
							{mounted && currentThemeOption ? (
								<currentThemeOption.icon
									className={iconClasses}
								/>
							) : (
								<HardDriveIcon className={iconClasses} />
							)}
							<span
								className={labelClasses}
								suppressHydrationWarning
							>
								{mounted && currentThemeOption
									? currentThemeOption.label
									: t("app.userMenu.themeSystem")}
							</span>
						</button>
					</li>

					{/* Contact Us */}
					<li>
						<ContactModal>
							<button type="button" className={navItemClasses}>
								<MessageCircleIcon className={iconClasses} />
								<span className={labelClasses}>联系我们</span>
							</button>
						</ContactModal>
					</li>
				</ul>
			</nav>

			{/* User Info at bottom with menu */}
			{user && (
				<div className="border-t p-4">
					<div
						className={
							isMobile
								? "flex items-center gap-3 px-2 py-2 mb-2"
								: "flex items-center gap-3 px-2 py-2"
						}
					>
						<UserAvatar
							name={user.name ?? ""}
							avatarUrl={user.image}
							className="size-10"
						/>
						<div className="flex-1 min-w-0">
							<div className="font-medium text-sm truncate">
								{user.name}
							</div>
							<div className="text-xs text-muted-foreground truncate">
								{user.email}
							</div>
						</div>
						{!isMobile && (
							<UserMenuActions
								variant="dropdown"
								canManageOrganization={canManageOrganization}
								activeOrganization={activeOrganization}
							/>
						)}
					</div>
					{isMobile && (
						<UserMenuActions
							variant="inline"
							canManageOrganization={canManageOrganization}
							activeOrganization={activeOrganization}
							onActionComplete={onNavigate}
						/>
					)}
				</div>
			)}
		</>
	);
}
