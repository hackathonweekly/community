"use client";

import { cn } from "@community/lib-shared/utils";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import NextLink from "next/link";
import {
	SettingsIcon,
	BellIcon,
	ShieldIcon,
	LockIcon,
	AlertTriangleIcon,
} from "lucide-react";

interface SettingsNavItem {
	label: string;
	href: string;
	icon: React.ComponentType<{ className?: string }>;
	danger?: boolean;
}

export function SettingsNav() {
	const t = useTranslations();
	const pathname = usePathname();

	const navItems: SettingsNavItem[] = [
		{
			label: t("settings.menu.account.general"),
			href: "/settings/general",
			icon: SettingsIcon,
		},
		{
			label: t("settings.menu.account.security"),
			href: "/settings/security",
			icon: LockIcon,
		},
		{
			label: t("settings.menu.account.privacy"),
			href: "/settings/privacy",
			icon: ShieldIcon,
		},
		{
			label: t("settings.menu.account.notifications"),
			href: "/settings/notifications",
			icon: BellIcon,
		},
		{
			label: t("settings.menu.account.dangerZone"),
			href: "/settings/danger-zone",
			icon: AlertTriangleIcon,
			danger: true,
		},
	];

	const isActive = (href: string) => pathname === href;

	return (
		<nav className="space-y-1">
			{navItems.map((item) => (
				<NextLink
					key={item.href}
					href={item.href}
					className={cn(
						"flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
						isActive(item.href)
							? "bg-black text-white dark:bg-white dark:text-black"
							: item.danger
								? "text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950/50"
								: "text-gray-600 hover:bg-gray-50 hover:text-black dark:text-muted-foreground dark:hover:bg-[#1A1A1A] dark:hover:text-white",
					)}
				>
					<item.icon className="w-5 h-5 shrink-0 text-center" />
					{item.label}
				</NextLink>
			))}
		</nav>
	);
}

export function SettingsMobileNav() {
	const t = useTranslations();
	const pathname = usePathname();

	const navItems: SettingsNavItem[] = [
		{
			label: t("settings.menu.account.general", { default: "常规" }),
			href: "/settings/general",
			icon: SettingsIcon,
		},
		{
			label: t("settings.menu.account.security", { default: "安全" }),
			href: "/settings/security",
			icon: LockIcon,
		},
		{
			label: t("settings.menu.account.privacy", { default: "隐私" }),
			href: "/settings/privacy",
			icon: ShieldIcon,
		},
		{
			label: t("settings.menu.account.notifications", {
				default: "通知",
			}),
			href: "/settings/notifications",
			icon: BellIcon,
		},
		{
			label: t("settings.menu.account.dangerZone", {
				default: "危险",
			}),
			href: "/settings/danger-zone",
			icon: AlertTriangleIcon,
			danger: true,
		},
	];

	const isActive = (href: string) => pathname === href;

	return (
		<div className="flex gap-1 overflow-x-auto no-scrollbar pb-1 text-sm bg-gray-100/50 dark:bg-[#1F1F1F] p-1 rounded-lg mb-4 w-full touch-manipulation">
			{navItems.map((item) => (
				<NextLink
					key={item.href}
					href={item.href}
					className={cn(
						"flex items-center gap-1.5 px-3 py-2 rounded-md font-medium text-xs whitespace-nowrap transition-colors",
						isActive(item.href)
							? "bg-card text-foreground shadow-sm border border-border"
							: item.danger
								? "text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
								: "text-muted-foreground hover:bg-gray-200/50 dark:hover:bg-[#262626] hover:text-black dark:hover:text-white",
					)}
				>
					<item.icon className="w-4 h-4" />
					<span>{item.label}</span>
				</NextLink>
			))}
		</div>
	);
}
