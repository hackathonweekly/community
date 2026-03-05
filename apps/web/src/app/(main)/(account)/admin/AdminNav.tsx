"use client";

import { cn } from "@community/lib-shared/utils";
import { usePathname } from "next/navigation";
import NextLink from "next/link";
import {
	LayoutDashboardIcon,
	UsersIcon,
	CalendarDaysIcon,
	FolderOpenIcon,
	Building2Icon,
	ClipboardListIcon,
	MessageSquareIcon,
	MailIcon,
	SettingsIcon,
	BadgeCheckIcon,
	AwardIcon,
	FileTextIcon,
	BugIcon,
	HeadphonesIcon,
	UserCogIcon,
	StarIcon,
} from "lucide-react";

interface AdminNavItem {
	label: string;
	href: string;
	icon: React.ComponentType<{ className?: string }>;
}

interface AdminNavGroup {
	label: string;
	items: AdminNavItem[];
}

export function AdminNav() {
	const pathname = usePathname();

	const groups: AdminNavGroup[] = [
		{
			label: "概览",
			items: [
				{
					label: "仪表盘",
					href: "/admin/dashboard",
					icon: LayoutDashboardIcon,
				},
			],
		},
		{
			label: "内容管理",
			items: [
				{
					label: "活动",
					href: "/admin/events",
					icon: CalendarDaysIcon,
				},
				{
					label: "作品",
					href: "/admin/projects",
					icon: FolderOpenIcon,
				},
				{
					label: "组织",
					href: "/admin/organizations",
					icon: Building2Icon,
				},
				{
					label: "任务",
					href: "/admin/tasks",
					icon: ClipboardListIcon,
				},
				{
					label: "评论",
					href: "/admin/comments",
					icon: MessageSquareIcon,
				},
			],
		},
		{
			label: "用户管理",
			items: [
				{ label: "用户", href: "/admin/users", icon: UsersIcon },
				{ label: "徽章", href: "/admin/badges", icon: BadgeCheckIcon },
				{ label: "证书", href: "/admin/certificates", icon: AwardIcon },
				{ label: "贡献", href: "/admin/contributions", icon: StarIcon },
				{
					label: "职能角色",
					href: "/admin/functional-roles",
					icon: UserCogIcon,
				},
				{
					label: "志愿者角色",
					href: "/admin/volunteer-roles",
					icon: UsersIcon,
				},
				{
					label: "等级申请",
					href: "/admin/level-applications",
					icon: FileTextIcon,
				},
			],
		},
		{
			label: "系统",
			items: [
				{ label: "邮件", href: "/admin/emails", icon: MailIcon },
				{ label: "模板", href: "/admin/templates", icon: FileTextIcon },
				{
					label: "客服",
					href: "/admin/customer-service",
					icon: HeadphonesIcon,
				},
				{ label: "配置", href: "/admin/config", icon: SettingsIcon },
				{ label: "调试", href: "/admin/debug", icon: BugIcon },
			],
		},
	];

	const isActive = (href: string) =>
		pathname === href || pathname.startsWith(`${href}/`);

	return (
		<nav className="space-y-5">
			{groups.map((group) => (
				<div key={group.label}>
					<div className="flex items-center gap-3 mb-2 px-2">
						<h3 className="font-brand text-xs font-bold uppercase tracking-wide text-gray-400 dark:text-muted-foreground">
							{group.label}
						</h3>
					</div>
					<div className="space-y-0.5">
						{group.items.map((item) => (
							<NextLink
								key={item.href}
								href={item.href}
								className={cn(
									"flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
									isActive(item.href)
										? "bg-black text-white dark:bg-white dark:text-black"
										: "text-gray-600 hover:bg-gray-50 hover:text-black dark:text-muted-foreground dark:hover:bg-[#1A1A1A] dark:hover:text-white",
								)}
							>
								<item.icon className="w-5 h-5 shrink-0" />
								{item.label}
							</NextLink>
						))}
					</div>
				</div>
			))}
		</nav>
	);
}

export function AdminMobileNav() {
	const pathname = usePathname();

	const navItems: AdminNavItem[] = [
		{
			href: "/admin/dashboard",
			label: "仪表盘",
			icon: LayoutDashboardIcon,
		},
		{
			href: "/admin/users",
			label: "用户",
			icon: UsersIcon,
		},
		{
			href: "/admin/contributions",
			label: "审核",
			icon: StarIcon,
		},
		{
			href: "/admin/events",
			label: "活动",
			icon: CalendarDaysIcon,
		},
		{
			href: "/admin/organizations",
			label: "组织",
			icon: Building2Icon,
		},
	];

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
