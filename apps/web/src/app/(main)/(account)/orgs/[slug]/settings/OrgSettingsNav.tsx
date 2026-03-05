"use client";

import { cn } from "@community/lib-shared/utils";
import { usePathname } from "next/navigation";
import NextLink from "next/link";
import {
	SettingsIcon,
	UsersIcon,
	CalendarDaysIcon,
	FolderOpenIcon,
	BarChart3Icon,
	MailIcon,
	AlertTriangleIcon,
} from "lucide-react";

interface OrgSettingsNavItem {
	label: string;
	href: string;
	icon: React.ComponentType<{ className?: string }>;
	danger?: boolean;
}

function getNavItems(slug: string): OrgSettingsNavItem[] {
	return [
		{
			label: "常规",
			href: `/orgs/${slug}/settings/general`,
			icon: SettingsIcon,
		},
		{
			label: "成员管理",
			href: `/orgs/${slug}/settings/members`,
			icon: UsersIcon,
		},
		{
			label: "活动管理",
			href: `/orgs/${slug}/settings/events`,
			icon: CalendarDaysIcon,
		},
		{
			label: "贡献管理",
			href: `/orgs/${slug}/settings/contributions`,
			icon: FolderOpenIcon,
		},
		{
			label: "数据分析",
			href: `/orgs/${slug}/settings/analytics`,
			icon: BarChart3Icon,
		},
		{
			label: "邮件",
			href: `/orgs/${slug}/settings/emails/dashboard`,
			icon: MailIcon,
		},
		{
			label: "危险操作",
			href: `/orgs/${slug}/settings/danger-zone`,
			icon: AlertTriangleIcon,
			danger: true,
		},
	];
}

export function OrgSettingsNav({ slug }: { slug: string }) {
	const pathname = usePathname();
	const navItems = getNavItems(slug);

	const isActive = (href: string) =>
		pathname === href || pathname.startsWith(`${href}/`);

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

export function OrgSettingsMobileNav({ slug }: { slug: string }) {
	const pathname = usePathname();
	const navItems = getNavItems(slug);

	const isActive = (href: string) =>
		pathname === href || pathname.startsWith(`${href}/`);

	return (
		<div className="flex gap-1 overflow-x-auto no-scrollbar pb-1 text-sm bg-gray-100/50 dark:bg-[#1F1F1F] p-1 rounded-lg mb-4">
			{navItems.map((item) => (
				<NextLink
					key={item.href}
					href={item.href}
					className={cn(
						"flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium text-xs whitespace-nowrap transition-colors",
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
