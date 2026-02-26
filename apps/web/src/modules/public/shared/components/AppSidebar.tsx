"use client";

import { clearCache } from "@/actions/clear-cache";
import { config } from "@community/config";
import { useUnreadNotificationsCountQuery } from "@community/lib-client/api/api-hooks";
import { authClient } from "@community/lib-client/auth/client";
import { isAdmin } from "@community/lib-shared/auth/permissions";
import { ColorModeToggle } from "@community/ui/shared/ColorModeToggle";
import { LocaleSwitch } from "@community/ui/shared/LocaleSwitch";
import { Logo } from "@community/ui/shared/Logo";
import { UserAvatar } from "@community/ui/shared/UserAvatar";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@community/ui/ui/dropdown-menu";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuBadge,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarRail,
} from "@community/ui/ui/sidebar";
import { updateLocale } from "@i18n/lib/update-locale";
import { useSession } from "@shared/auth/hooks/use-session";
import { useQuery } from "@tanstack/react-query";
import {
	BellIcon,
	BookOpenIcon,
	Building2Icon,
	CalendarDaysIcon,
	ClipboardListIcon,
	CompassIcon,
	FolderOpenIcon,
	LogOutIcon,
	MessageSquareIcon,
	MoreHorizontalIcon,
	SettingsIcon,
	ShieldCheckIcon,
	TrophyIcon,
	UserCircle2Icon,
	UsersIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import NextLink from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

interface NavItem {
	label: string;
	href: string;
	icon: React.ComponentType<{ className?: string }>;
	showBadge?: boolean;
}

interface NavGroupConfig {
	label: string;
	items: NavItem[];
}

export function AppSidebar() {
	const t = useTranslations();
	const { user } = useSession();
	const pathname = usePathname();

	const { data: userOrgsData } = useQuery({
		queryKey: ["user-organizations-sidebar"],
		queryFn: async () => {
			const response = await fetch("/api/user/organizations");
			if (!response.ok) throw new Error("Failed to fetch");
			return response.json();
		},
		enabled: !!user,
		staleTime: 1000 * 60 * 10,
	});

	const userOrgs = userOrgsData?.data?.organizations ?? [];

	const hasOrgs = userOrgs.length > 0;

	// Extract current org slug from URL if on an org page
	const orgSlugFromUrl = pathname.match(/^\/orgs\/([^/]+)/)?.[1] ?? null;

	// Determine preferred org: URL > localStorage > first org
	const [preferredOrgSlug, setPreferredOrgSlug] = useState<string | null>(
		() => {
			if (typeof window === "undefined") return null;
			return localStorage.getItem("preferred-org-slug");
		},
	);

	useEffect(() => {
		if (
			orgSlugFromUrl &&
			hasOrgs &&
			userOrgs.some((o: { slug: string }) => o.slug === orgSlugFromUrl)
		) {
			localStorage.setItem("preferred-org-slug", orgSlugFromUrl);
			setPreferredOrgSlug(orgSlugFromUrl);
		}
	}, [orgSlugFromUrl, hasOrgs, userOrgs]);

	const shouldHide =
		pathname.startsWith("/events/") ||
		pathname.startsWith("/projects/") ||
		pathname.startsWith("/docs");

	if (shouldHide) {
		return null;
	}

	const resolvedOrgSlug = hasOrgs
		? preferredOrgSlug &&
			userOrgs.some((o: { slug: string }) => o.slug === preferredOrgSlug)
			? preferredOrgSlug
			: userOrgs[0].slug
		: null;

	const communityGroup: NavGroupConfig = {
		label: t("tab_nav.groupCommunity"),
		items: [
			{
				label: t("tab_nav.events"),
				href: "/events",
				icon: CalendarDaysIcon,
			},
			{
				label: t("tab_nav.projects"),
				href: "/projects",
				icon: FolderOpenIcon,
			},
			{
				label: t("tab_nav.posts"),
				href: "/posts",
				icon: MessageSquareIcon,
			},
			...(user && hasOrgs
				? [
						{
							label: t("tab_nav.members"),
							href: `/orgs/${resolvedOrgSlug}/members`,
							icon: UsersIcon,
						},
					]
				: []),
			{
				label: t("tab_nav.tasks"),
				href: "/tasks",
				icon: ClipboardListIcon,
			},
			{
				label: t("tab_nav.leaderboard"),
				href: "/leaderboard",
				icon: TrophyIcon,
			},
		],
	};

	const resourcesGroup: NavGroupConfig = {
		label: t("tab_nav.groupResources"),
		items: [
			{ label: t("tab_nav.docs"), href: "/docs", icon: BookOpenIcon },
			...(!user
				? [
						{
							label: t("tab_nav.organizations"),
							href: "/orgs",
							icon: Building2Icon,
						},
					]
				: [
						{
							label: t("tab_nav.discoverOrgs"),
							href: "/orgs",
							icon: CompassIcon,
						},
					]),
		],
	};

	const adminGroup: NavGroupConfig | null =
		user && isAdmin(user)
			? {
					label: t("tab_nav.groupAdmin"),
					items: [
						{
							label: t("app.menu.superAdminCenter"),
							href: "/admin/dashboard",
							icon: ShieldCheckIcon,
						},
					],
				}
			: null;

	const personalGroup: NavGroupConfig | null = user
		? {
				label: t("tab_nav.groupPersonal"),
				items: [
					{
						label: t("tab_nav.notifications"),
						href: "/notifications",
						icon: BellIcon,
						showBadge: true,
					},
					{
						label: t("tab_nav.me"),
						href: "/me",
						icon: UserCircle2Icon,
					},
					{
						label: t("tab_nav.settings"),
						href: "/settings/general",
						icon: SettingsIcon,
					},
				],
			}
		: null;

	const navGroups = [communityGroup, resourcesGroup];
	if (personalGroup) {
		navGroups.push(personalGroup);
	}
	if (adminGroup) {
		navGroups.push(adminGroup);
	}

	const isActive = (href: string) => {
		if (href === "/") return pathname === "/";
		if (href.startsWith("/?tag=")) return false;
		// "成员" link: match any /orgs/*/members path
		if (href.includes("/orgs/") && href.endsWith("/members")) {
			return /^\/orgs\/[^/]+\/members/.test(pathname);
		}
		// "我的社区" link: match /orgs/{slug} but not /members subpath, and not /orgs list
		if (/^\/orgs\/[^/]+$/.test(href)) {
			return (
				/^\/orgs\/[^/]+/.test(pathname) &&
				!pathname.includes("/members") &&
				pathname !== "/orgs"
			);
		}
		// "发现组织" link: exact match /orgs
		if (href === "/orgs") return pathname === "/orgs";
		return pathname.startsWith(href);
	};

	return (
		<Sidebar collapsible="icon" className="hidden lg:flex">
			<SidebarHeader>
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton size="lg" asChild tooltip="Home">
							<NextLink href="/">
								<Logo className="[&_img]:h-8" />
							</NextLink>
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarHeader>

			<SidebarContent>
				{navGroups.map((group, index) => (
					<NavGroup
						key={group.label}
						label={group.label}
						items={group.items}
						isActive={isActive}
						user={user}
					/>
				))}
			</SidebarContent>

			<SidebarFooter>
				<SidebarMenu>
					<SidebarMenuItem>
						<div className="flex items-center gap-1 px-2 group-data-[collapsible=icon]:hidden">
							<ColorModeToggle />
							{config.i18n.enabled ? (
								<Suspense>
									<LocaleSwitch
										onLocaleChange={updateLocale}
									/>
								</Suspense>
							) : null}
						</div>
					</SidebarMenuItem>
				</SidebarMenu>
				{user ? (
					<UserMenu user={user} />
				) : (
					<SidebarMenu>
						<SidebarMenuItem>
							<SidebarMenuButton
								asChild
								tooltip={t("common.menu.login")}
							>
								<NextLink href="/auth/login">
									<UserCircle2Icon />
									<span>{t("common.menu.login")}</span>
								</NextLink>
							</SidebarMenuButton>
						</SidebarMenuItem>
					</SidebarMenu>
				)}
			</SidebarFooter>

			<SidebarRail />
		</Sidebar>
	);
}

function NavGroup({
	label,
	items,
	isActive,
	user,
}: {
	label: string;
	items: NavItem[];
	isActive: (href: string) => boolean;
	user: ReturnType<typeof useSession>["user"];
}) {
	return (
		<SidebarGroup>
			<SidebarGroupLabel>{label}</SidebarGroupLabel>
			<SidebarGroupContent>
				<SidebarMenu>
					{items.map((item) => (
						<SidebarMenuItem key={item.href}>
							<SidebarMenuButton
								asChild
								isActive={isActive(item.href)}
								tooltip={item.label}
							>
								<NextLink href={item.href}>
									<item.icon />
									<span>{item.label}</span>
								</NextLink>
							</SidebarMenuButton>
							{item.showBadge && user && <UnreadBadge />}
						</SidebarMenuItem>
					))}
				</SidebarMenu>
			</SidebarGroupContent>
		</SidebarGroup>
	);
}

function UnreadBadge() {
	const { data } = useUnreadNotificationsCountQuery({ enabled: true });
	const count = data?.count ?? 0;
	if (count === 0) return null;
	return (
		<SidebarMenuBadge className="bg-destructive text-destructive-foreground rounded-full text-[10px] min-w-4 h-4 px-1">
			{count > 99 ? "99+" : count}
		</SidebarMenuBadge>
	);
}

function UserMenu({
	user,
}: { user: NonNullable<ReturnType<typeof useSession>["user"]> }) {
	const t = useTranslations();

	const onLogout = () => {
		authClient.signOut({
			fetchOptions: {
				onSuccess: async () => {
					try {
						await clearCache();
					} catch (error) {
						console.error(
							"Failed to clear cache after logout",
							error,
						);
					}
					window.location.href = new URL(
						config.auth.redirectAfterLogout,
						window.location.origin,
					).toString();
				},
			},
		});
	};

	return (
		<SidebarMenu>
			<SidebarMenuItem>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<SidebarMenuButton
							size="lg"
							tooltip={user.name ?? ""}
							className="cursor-pointer"
						>
							<UserAvatar
								name={user.name ?? ""}
								avatarUrl={user.image}
								className="size-7"
							/>
							<div className="grid flex-1 text-left text-sm leading-tight">
								<span className="truncate font-semibold text-xs">
									{user.name}
								</span>
							</div>
							<MoreHorizontalIcon className="ml-auto size-4" />
						</SidebarMenuButton>
					</DropdownMenuTrigger>
					<DropdownMenuContent
						side="top"
						align="start"
						className="w-56"
					>
						<DropdownMenuItem
							onClick={onLogout}
							className="cursor-pointer text-destructive focus:text-destructive"
						>
							<LogOutIcon className="mr-2 size-4" />
							{t("app.userMenu.logout")}
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</SidebarMenuItem>
		</SidebarMenu>
	);
}
