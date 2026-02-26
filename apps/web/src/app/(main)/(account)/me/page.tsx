"use client";

import { clearCache } from "@/actions/clear-cache";
import { config } from "@community/config";
import {
	useEventBookmarksQuery,
	useProfileQuery,
	useProjectBookmarksQuery,
	useProjectsQuery,
	useUserEventsQuery,
	useUserFollowingExcludingMutualQuery,
	useUserRegistrationsQuery,
} from "@community/lib-client/api/api-hooks";
import { authClient } from "@community/lib-client/auth/client";
import {
	calculateLevelProgress,
	getNextLevelInfo,
} from "@community/lib-shared/level-utils";
import { ColorModeToggle } from "@community/ui/shared/ColorModeToggle";
import { LocaleSwitch } from "@community/ui/shared/LocaleSwitch";
import { UserAvatar } from "@community/ui/shared/UserAvatar";
import { Button } from "@community/ui/ui/button";
import { Card, CardContent } from "@community/ui/ui/card";
import { Skeleton } from "@community/ui/ui/skeleton";
import {
	BookOpenIcon,
	BookmarkIcon,
	BriefcaseIcon,
	CalendarDaysIcon,
	ChevronRightIcon,
	Cog6ToothIcon,
	DocumentTextIcon,
	RectangleStackIcon,
	SparklesIcon,
	UsersIcon,
} from "@heroicons/react/24/outline";
import { updateLocale } from "@i18n/lib/update-locale";
import { useSession } from "@shared/auth/hooks/use-session";
import { UserLevelBadges } from "@shared/level/components/LevelBadge";
import { OrganizationLogo } from "@shared/organizations/components/OrganizationLogo";
import { useOrganizationsByRoleQuery } from "@shared/organizations/lib/api";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useMemo, useState } from "react";

interface ListItem {
	title: string;
	href: string;
	count?: number;
	icon: React.ComponentType<{ className?: string }>;
}

interface UserOrganization {
	id: string;
	name: string;
	slug: string | null;
	logo: string | null;
	memberRole?: string | null;
}

export default function MePage() {
	const t = useTranslations();
	const { user, loaded } = useSession();
	const [isLoggingOut, setIsLoggingOut] = useState(false);
	const { data: userProfile, isLoading: profileLoading } = useProfileQuery();
	const { data: registrations = [], isLoading: registrationsLoading } =
		useUserRegistrationsQuery();
	const { data: organizedEvents = [], isLoading: organizedLoading } =
		useUserEventsQuery();
	const { data: projects = [], isLoading: projectsLoading } =
		useProjectsQuery(user?.id);
	const { data: eventBookmarks = [], isLoading: eventBookmarksLoading } =
		useEventBookmarksQuery();
	const { data: projectBookmarks = [], isLoading: projectBookmarksLoading } =
		useProjectBookmarksQuery();
	const { data: following = [], isLoading: followingLoading } =
		useUserFollowingExcludingMutualQuery();
	const { data: organizationsData, isLoading: organizationsLoading } =
		useOrganizationsByRoleQuery();

	const { data: tasksData, isLoading: tasksLoading } = useQuery({
		queryKey: ["tasks", "mine", "stats"],
		queryFn: async () => {
			const response = await fetch("/api/tasks/mine");
			if (!response.ok) return null;
			return response.json();
		},
		enabled: !!user,
	});

	const bookmarksCount = useMemo(
		() => eventBookmarks.length + projectBookmarks.length,
		[eventBookmarks.length, projectBookmarks.length],
	);

	const tasksCount = useMemo(() => {
		if (!tasksData) return 0;
		if (tasksData.stats) {
			return (
				(tasksData.stats.published || 0) +
				(tasksData.stats.assigned || 0)
			);
		}
		if (tasksData.tasks?.published && tasksData.tasks?.assigned) {
			return (
				tasksData.tasks.published.length +
				tasksData.tasks.assigned.length
			);
		}
		return Array.isArray(tasksData.tasks) ? tasksData.tasks.length : 0;
	}, [tasksData]);

	const isLoading =
		!loaded ||
		profileLoading ||
		registrationsLoading ||
		organizedLoading ||
		projectsLoading ||
		eventBookmarksLoading ||
		projectBookmarksLoading ||
		followingLoading ||
		organizationsLoading ||
		tasksLoading;

	const contentItems: ListItem[] = [
		{
			title: t("tab_nav.projects"),
			href: "/projects?tab=my",
			count: projects.length,
			icon: BriefcaseIcon,
		},
		{
			title: t("eventManagement.registeredEvents"),
			href: "/events?tab=my",
			count: registrations.length,
			icon: CalendarDaysIcon,
		},
		{
			title: t("eventManagement.organizedEvents"),
			href: "/events?tab=manage",
			count: organizedEvents.length,
			icon: CalendarDaysIcon,
		},
		{
			title: t("tab_nav.tasks"),
			href: "/tasks?tab=my",
			count: tasksCount,
			icon: DocumentTextIcon,
		},
		{
			title: t("tab_nav.contributions"),
			href: "/me/contributions",
			count: userProfile?.totalContributions ?? 0,
			icon: SparklesIcon,
		},
	];

	const favoriteItems: ListItem[] = [
		{
			title: t("bookmarks.title"),
			href: "/me/bookmarks",
			count: bookmarksCount,
			icon: BookmarkIcon,
		},
		{
			title: t("app.menu.following"),
			href: "/me/following",
			count: following.length,
			icon: UsersIcon,
		},
		{
			title: t("mePage.messages"),
			href: "/notifications",
			icon: RectangleStackIcon,
		},
	];

	const joinedOrganizations: UserOrganization[] =
		organizationsData?.organizations ?? [];

	const profileLink =
		userProfile?.username && userProfile.profilePublic
			? `/u/${userProfile.username}`
			: null;

	const getRoleLabel = (role?: string | null) => {
		switch ((role || "").toUpperCase()) {
			case "OWNER":
				return t("mePage.organizationRole.owner");
			case "ADMIN":
				return t("mePage.organizationRole.admin");
			case "MEMBER":
				return t("mePage.organizationRole.member");
			default:
				return t("mePage.organizationRole.unknown");
		}
	};

	const handleLogout = () => {
		setIsLoggingOut(true);
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
				onError: () => {
					setIsLoggingOut(false);
				},
			},
		});
	};

	return (
		<div className="container max-w-3xl px-4 pb-24 pt-4 md:px-6">
			<Card className="border border-border bg-card shadow-subtle">
				<CardContent className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between">
					<div className="flex items-center gap-4">
						<UserAvatar
							className="h-14 w-14"
							name={userProfile?.name || user?.name || ""}
							avatarUrl={userProfile?.image || user?.image}
						/>
						<div className="space-y-1">
							<div className="font-brand text-lg font-semibold text-foreground">
								{userProfile?.name || user?.name || "--"}
							</div>
							{userProfile?.bio && (
								<div className="text-sm text-muted-foreground line-clamp-2">
									{userProfile.bio}
								</div>
							)}
							<div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
								<UserLevelBadges
									user={{
										membershipLevel:
											userProfile?.membershipLevel ??
											null,
										createdAt: user?.createdAt,
									}}
									size="sm"
									showTooltip={false}
								/>
								<span className="rounded-full bg-muted px-2 py-0.5">
									积分 {userProfile?.cpValue ?? 0}
								</span>
							</div>
						</div>
					</div>
					<div className="flex flex-wrap gap-2">
						<Button asChild size="sm" variant="pill">
							<Link href="/me/edit">
								{t("userProfile.editProfile")}
							</Link>
						</Button>
						<Button
							asChild
							size="sm"
							variant="outline"
							disabled={!profileLink}
						>
							{profileLink ? (
								<Link href={profileLink}>
									{t("profile.basicInfo.viewProfile")}
								</Link>
							) : (
								<span>
									{t("profile.basicInfo.viewProfile")}
								</span>
							)}
						</Button>
					</div>
				</CardContent>
			</Card>

			{userProfile &&
				(() => {
					const currentLevel = (userProfile.membershipLevel ||
						"VISITOR") as string;
					const nextLevelInfo = getNextLevelInfo(currentLevel);
					const progress = calculateLevelProgress(
						userProfile.cpValue ?? 0,
						currentLevel,
					);

					return nextLevelInfo ? (
						<Link href="/docs/points-and-levels">
							<div className="mt-3 rounded-lg border border-gray-200 bg-white p-3 transition-colors hover:bg-gray-50 dark:border-border dark:bg-card dark:hover:bg-[#1A1A1A]">
								<div className="mb-2 flex items-center justify-between text-xs">
									<span className="font-mono text-muted-foreground">
										升级进度
									</span>
									<span className="font-bold text-foreground">
										{progress}%
									</span>
								</div>
								<div className="mb-1.5 h-1.5 w-full overflow-hidden rounded-full bg-accent">
									<div
										className="h-full bg-black transition-all dark:bg-white"
										style={{ width: `${progress}%` }}
									/>
								</div>
								<p className="text-[10px] font-medium text-muted-foreground">
									距离「{nextLevelInfo.label}」还需{" "}
									{nextLevelInfo.threshold -
										(userProfile.cpValue ?? 0)}{" "}
									积分
								</p>
							</div>
						</Link>
					) : null;
				})()}

			<Section title={t("mePage.myContent")}>
				{contentItems.map((item) => (
					<ListRow
						key={item.href}
						item={item}
						isLoading={isLoading}
					/>
				))}
			</Section>

			<Section title={t("mePage.myOrganizations")}>
				{organizationsLoading ? (
					<div className="space-y-3">
						<Skeleton className="h-12 w-full rounded-lg" />
						<Skeleton className="h-12 w-full rounded-lg" />
					</div>
				) : joinedOrganizations.length > 0 ? (
					<div className="space-y-2">
						{joinedOrganizations.map((organization) => (
							<Link
								key={organization.id}
								href={`/orgs/${organization.slug ?? organization.id}`}
								className="flex min-h-[44px] items-center justify-between rounded-lg border bg-card px-3 py-2 transition-colors hover:bg-muted active:scale-[0.99]"
							>
								<div className="flex min-w-0 items-center gap-3">
									<OrganizationLogo
										name={organization.name}
										logoUrl={organization.logo}
										className="h-8 w-8 rounded-md"
									/>
									<div className="min-w-0">
										<div className="truncate text-sm font-medium">
											{organization.name}
										</div>
										<div className="text-xs text-muted-foreground">
											{getRoleLabel(
												organization.memberRole,
											)}
										</div>
									</div>
								</div>
								<ChevronRightIcon className="h-4 w-4 text-muted-foreground" />
							</Link>
						))}
					</div>
				) : (
					<div className="rounded-lg border border-dashed border-border px-3 py-4 text-center text-sm text-muted-foreground">
						{t("mePage.noOrganizations")}
					</div>
				)}
				<Link
					href="/orgs"
					className="mt-2 flex min-h-[44px] items-center justify-between rounded-lg border bg-card px-3 py-2 text-sm font-medium transition-colors hover:bg-muted active:scale-[0.99]"
				>
					<span>{t("mePage.discoverOrganizations")}</span>
					<ChevronRightIcon className="h-4 w-4 text-muted-foreground" />
				</Link>
			</Section>

			<Section title={t("mePage.myFavorites")}>
				{favoriteItems.map((item) => (
					<ListRow
						key={item.href}
						item={item}
						isLoading={isLoading}
						showCount={item.count !== undefined}
					/>
				))}
			</Section>

			<Section title={t("mePage.settingsAndHelp")}>
				<ListRow
					item={{
						title: t("tab_nav.docs"),
						href: "/docs",
						icon: BookOpenIcon,
					}}
					isLoading={false}
					showCount={false}
				/>
				<ListRow
					item={{
						title: t("settings.menu.account.general"),
						href: "/settings/general",
						icon: Cog6ToothIcon,
					}}
					isLoading={false}
					showCount={false}
				/>
				<SettingsRow label={t("mePage.darkMode")}>
					<ColorModeToggle />
				</SettingsRow>
				<SettingsRow label={t("mePage.language")}>
					{config.i18n.enabled ? (
						<LocaleSwitch onLocaleChange={updateLocale} />
					) : null}
				</SettingsRow>
			</Section>

			<Button
				type="button"
				variant="outline"
				className="mt-4 h-10 w-full border-destructive/30 text-destructive hover:border-destructive/40 hover:bg-destructive/5 sm:w-auto"
				disabled={isLoggingOut}
				onClick={handleLogout}
			>
				{t("mePage.logout")}
			</Button>
		</div>
	);
}

function Section({
	title,
	children,
}: {
	title: string;
	children: React.ReactNode;
}) {
	return (
		<section className="mt-5 space-y-2">
			<h2 className="px-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
				{title}
			</h2>
			{children}
		</section>
	);
}

function ListRow({
	item,
	isLoading,
	showCount = true,
}: {
	item: ListItem;
	isLoading: boolean;
	showCount?: boolean;
}) {
	return (
		<Link
			href={item.href}
			className="flex min-h-[44px] items-center justify-between rounded-lg border bg-card px-3 py-2 transition-colors hover:bg-muted active:scale-[0.99]"
		>
			<div className="flex items-center gap-3">
				<item.icon className="h-4 w-4 text-muted-foreground" />
				<span className="text-sm font-medium text-foreground">
					{item.title}
				</span>
			</div>
			<div className="flex items-center gap-2 text-sm text-muted-foreground">
				{showCount &&
					(isLoading ? (
						<Skeleton className="h-4 w-6" />
					) : (
						<span>{item.count ?? 0}</span>
					))}
				<ChevronRightIcon className="h-4 w-4" />
			</div>
		</Link>
	);
}

function SettingsRow({
	label,
	children,
}: {
	label: string;
	children: React.ReactNode;
}) {
	return (
		<div className="flex min-h-[44px] items-center justify-between rounded-lg border bg-card px-3 py-2">
			<span className="text-sm font-medium text-foreground">{label}</span>
			<div className="flex items-center">{children}</div>
		</div>
	);
}
