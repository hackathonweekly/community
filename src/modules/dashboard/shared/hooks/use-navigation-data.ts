"use client";

import { config } from "@/config";
import { isAdmin } from "@/lib/auth/permissions";
import { useSession } from "@dashboard/auth/hooks/use-session";
import { useActiveOrganization } from "@dashboard/organizations/hooks/use-active-organization";
import type { MenuItem } from "@dashboard/shared/components/UnifiedNavMenu";
import {
	CalendarIcon,
	CoinsIcon,
	FolderIcon,
	HomeIcon,
	ListTodoIcon,
	SettingsIcon,
	ShieldCheckIcon,
	UserCog2Icon,
	UserIcon,
	UserPlusIcon,
	UsersIcon,
	SunIcon,
	MoonIcon,
	HardDriveIcon,
	BellIcon,
	LockKeyholeIcon,
	ShieldIcon,
	TriangleAlertIcon,
	LayoutDashboardIcon,
	ClipboardCheckIcon,
	AwardIcon,
	TrophyIcon,
	Building2Icon,
	MailIcon,
	FileTextIcon,
	Settings2Icon,
	Users2Icon,
	Calendar,
	Mail,
	Megaphone,
	PieChart,
	BarChart3,
	Gift,
	MessageCircleIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { useMemo, useCallback } from "react";

export type ThemeOption = {
	value: string;
	label: string;
	icon: React.ComponentType<{ className?: string }>;
};

export function useNavigationData() {
	const t = useTranslations();
	const { user } = useSession();
	const { activeOrganization, isOrganizationAdmin } = useActiveOrganization();
	const { setTheme, theme: currentTheme } = useTheme();

	// 直接使用来自 useActiveOrganization 的 isOrganizationAdmin
	// 它已经在 ActiveOrganizationProvider 中正确计算了所有权限
	const canManageOrganization = isOrganizationAdmin;

	const basePath = activeOrganization
		? `/app/${activeOrganization.slug}`
		: "/app";

	// 构建菜单项（使用 UnifiedNavMenu 的数据结构）
	const menuItems: MenuItem[] = useMemo(() => {
		return activeOrganization
			? [
					{
						label: t("app.menu.start"),
						href: basePath,
						icon: HomeIcon,
					},
					{
						label: t("app.menu.organizationMembers"),
						href: `${basePath}/members`,
						icon: UsersIcon,
					},
					...(canManageOrganization
						? [
								{
									label: t("app.menu.organizationSettings"),
									icon: SettingsIcon,
									children: [
										{
											label: t(
												"settings.menu.organization.general",
											),
											href: `${basePath}/settings/general`,
											icon: Settings2Icon,
										},
										{
											label: "成员管理",
											href: `${basePath}/settings/members`,
											icon: Users2Icon,
										},
										{
											label: "活动管理",
											href: `${basePath}/settings/events`,
											icon: Calendar,
										},
										{
											label: "邮件发送",
											href: `${basePath}/settings/emails/dashboard`,
											icon: Mail,
										},
										{
											label: "邮件分析",
											href: `${basePath}/settings/emails/analytics`,
											icon: PieChart,
										},
										{
											label: "邮件活动",
											href: `${basePath}/settings/emails/campaigns`,
											icon: Megaphone,
										},
										{
											label: "数据统计",
											href: `${basePath}/settings/analytics`,
											icon: BarChart3,
										},
										{
											label: "贡献管理",
											href: `${basePath}/settings/contributions`,
											icon: Gift,
										},
										{
											label: t(
												"settings.menu.organization.dangerZone",
											),
											href: `${basePath}/settings/danger-zone`,
											icon: TriangleAlertIcon,
											badge: "!",
										},
									] as MenuItem[],
								} as MenuItem,
							]
						: []),
				]
			: [
					{
						label: t("app.menu.start"),
						href: basePath,
						icon: HomeIcon,
					},
					{
						label: t("app.menu.profile"),
						href: "/app/profile",
						icon: UserIcon,
					},
					{
						label: t("app.menu.projects"),
						href: "/app/projects",
						icon: FolderIcon,
					},
					{
						label: t("app.menu.following"),
						href: "/app/following",
						icon: UserPlusIcon,
					},
					{
						label: t("app.menu.eventManagement"),
						href: "/app/events",
						icon: CalendarIcon,
					},
					{
						label: t("app.menu.taskManagement"),
						href: "/app/tasks",
						icon: ListTodoIcon,
					},
					{
						label: t("app.menu.contributionManagement"),
						href: "/app/contributions",
						icon: CoinsIcon,
					},
					// 账号设置（带子菜单）
					{
						label: t("app.menu.accountSettings"),
						icon: UserCog2Icon,
						children: [
							{
								label: t("settings.menu.account.general"),
								href: "/app/settings/general",
								icon: SettingsIcon,
							},
							{
								label: t("settings.menu.account.security"),
								href: "/app/settings/security",
								icon: LockKeyholeIcon,
							},
							{
								label: t("settings.menu.account.privacy"),
								href: "/app/settings/privacy",
								icon: ShieldIcon,
							},
							{
								label: t("settings.menu.account.notifications"),
								href: "/app/settings/notifications",
								icon: BellIcon,
							},
							{
								label: t("settings.menu.account.dangerZone"),
								href: "/app/settings/danger-zone",
								icon: TriangleAlertIcon,
								badge: "!",
							},
						] as MenuItem[],
					},
					// 超级管理员中心（带子菜单）
					...(user && isAdmin(user)
						? [
								{
									label: t("app.menu.superAdminCenter"),
									icon: ShieldCheckIcon,
									children: [
										{
											label: "仪表板",
											href: "/app/admin/dashboard",
											icon: LayoutDashboardIcon,
										},
										{
											label: "用户管理",
											href: "/app/admin/users",
											icon: UsersIcon,
										},
										{
											label: "贡献审核",
											href: "/app/admin/contributions",
											icon: ClipboardCheckIcon,
										},
										{
											label: "等级管理",
											href: "/app/admin/level-applications",
											icon: AwardIcon,
										},
										{
											label: "勋章管理",
											href: "/app/admin/badges",
											icon: TrophyIcon,
										},
										{
											label: "活动管理",
											href: "/app/admin/events",
											icon: CalendarIcon,
										},
										{
											label: "作品管理",
											href: "/app/admin/projects",
											icon: FolderIcon,
										},
										{
											label: "志愿者角色",
											href: "/app/admin/volunteer-roles",
											icon: UsersIcon,
										},
										{
											label: "职能角色管理",
											href: "/app/admin/functional-roles",
											icon: ShieldCheckIcon,
										},
										{
											label: "获奖证书管理",
											href: "/app/admin/certificates",
											icon: AwardIcon,
										},
										{
											label: "评论管理",
											href: "/app/admin/comments",
											icon: MessageCircleIcon,
										},
										{
											label: "模板管理",
											href: "/app/admin/templates",
											icon: FileTextIcon,
										},
										{
											label: "邮件管理",
											href: "/app/admin/emails/dashboard",
											icon: MailIcon,
										},
										...(config.organizations.enable
											? [
													{
														label: "组织管理",
														href: "/app/admin/organizations",
														icon: Building2Icon,
													} as MenuItem,
												]
											: []),
										{
											label: "系统配置",
											href: "/app/admin/config",
											icon: SettingsIcon,
										},
									] as MenuItem[],
								} as MenuItem,
							]
						: []),
				];
	}, [activeOrganization, basePath, canManageOrganization, t, user]);

	const themeOptions: ThemeOption[] = useMemo(
		() => [
			{
				value: "system",
				label: t("app.userMenu.themeSystem"),
				icon: HardDriveIcon,
			},
			{
				value: "light",
				label: t("app.userMenu.themeLight"),
				icon: SunIcon,
			},
			{
				value: "dark",
				label: t("app.userMenu.themeDark"),
				icon: MoonIcon,
			},
		],
		[t],
	);

	const cycleTheme = useCallback(() => {
		const themes = ["system", "light", "dark"];
		const currentIndex = themes.indexOf(currentTheme ?? "system");
		const nextIndex = (currentIndex + 1) % themes.length;
		setTheme(themes[nextIndex]);
	}, [currentTheme, setTheme]);

	const currentThemeOption = useMemo(
		() =>
			themeOptions.find(
				(opt) => opt.value === (currentTheme ?? "system"),
			),
		[themeOptions, currentTheme],
	);

	return {
		user,
		menuItems,
		themeOptions,
		currentThemeOption,
		cycleTheme,
		activeOrganization,
		canManageOrganization,
	};
}
