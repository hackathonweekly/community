"use client";

import { useKeyboardDetection } from "@community/lib-client/hooks/use-keyboard-detection";
import { cn } from "@community/lib-shared/utils";
import { isWeChatBrowser } from "@community/lib-shared/utils/browser-detect";
import { Drawer, DrawerContent } from "@community/ui/ui/drawer";
import {
	BellIcon,
	BuildingOffice2Icon,
	CalendarDaysIcon,
	ChatBubbleLeftRightIcon,
	ClipboardDocumentListIcon,
	DocumentTextIcon,
	HomeIcon,
	PlusIcon,
	UserCircleIcon,
} from "@heroicons/react/24/solid";
import { useSession } from "@shared/auth/hooks/use-session";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

interface Tab {
	name: string;
	href: string;
	icon: React.ComponentType<{ className?: string }>;
	isAction?: boolean;
}

const LOCALE_PREFIX_PATTERN = /^\/[a-z]{2}(?:-[A-Z]{2})?(?=\/|$)/;

export function TabBar() {
	const pathname = usePathname();
	const router = useRouter();
	const t = useTranslations();
	const { user } = useSession();

	const [isWeChat, setIsWeChat] = useState(false);
	const isKeyboardVisible = useKeyboardDetection();
	const [isCreateOpen, setIsCreateOpen] = useState(false);
	const [viewportBottomOffset, setViewportBottomOffset] = useState(0);
	const normalizedPathname = useMemo(() => {
		const withoutLocalePrefix = pathname.replace(LOCALE_PREFIX_PATTERN, "");
		return withoutLocalePrefix || "/";
	}, [pathname]);

	useEffect(() => {
		setIsWeChat(isWeChatBrowser());
	}, []);

	useEffect(() => {
		if (typeof window === "undefined" || !window.visualViewport) {
			return;
		}

		const viewport = window.visualViewport;
		let frameId: number | null = null;

		const updateBottomOffset = () => {
			const offset = Math.max(
				0,
				window.innerHeight - viewport.height - viewport.offsetTop,
			);
			const roundedOffset = Math.round(offset);
			// Chrome reports a small visualViewport offset when browser chrome
			// animates. Ignore small values so the tab bar does not float up.
			const minKeyboardOffset = Math.max(80, viewport.height * 0.18);
			const nextOffset =
				roundedOffset >= minKeyboardOffset ? roundedOffset : 0;

			setViewportBottomOffset((prev) =>
				prev === nextOffset ? prev : nextOffset,
			);
		};

		const queueUpdate = () => {
			if (frameId !== null) {
				cancelAnimationFrame(frameId);
			}

			frameId = requestAnimationFrame(updateBottomOffset);
		};

		queueUpdate();
		viewport.addEventListener("resize", queueUpdate);
		viewport.addEventListener("scroll", queueUpdate);
		window.addEventListener("resize", queueUpdate);

		return () => {
			if (frameId !== null) {
				cancelAnimationFrame(frameId);
			}
			viewport.removeEventListener("resize", queueUpdate);
			viewport.removeEventListener("scroll", queueUpdate);
			window.removeEventListener("resize", queueUpdate);
		};
	}, []);

	const isUserProfilePage = normalizedPathname.startsWith("/u/");
	const isEventDetailPage = /^\/events\/[^/]+(?:\/|$)/.test(
		normalizedPathname,
	);
	const isProjectDetailPage = /^\/projects\/[^/]+\/?$/.test(
		normalizedPathname,
	);
	const isOrganizationDetailPage = /^\/orgs\/[^/]+\/?$/.test(
		normalizedPathname,
	);
	const isCreatePage =
		normalizedPathname === "/projects/create" ||
		normalizedPathname === "/tasks/create" ||
		normalizedPathname === "/events/create";

	const createActions = useMemo(
		() => [
			{
				href: "/events/create",
				icon: CalendarDaysIcon,
				title: t("eventManagement.createEvent"),
				description: t("events.pageDescription"),
			},
			{
				href: "/projects/create",
				icon: DocumentTextIcon,
				title: t("projects.addProject"),
				description: t("projects.description"),
			},
			{
				href: "/tasks/create",
				icon: ClipboardDocumentListIcon,
				title: t("tasks.createTask"),
				description: t("tasks.description"),
			},
			{
				href: "/posts?create=true",
				icon: ChatBubbleLeftRightIcon,
				title: t("posts.createPost"),
				description: t("posts.description"),
			},
		],
		[t],
	);

	if (
		isUserProfilePage ||
		isEventDetailPage ||
		isProjectDetailPage ||
		isOrganizationDetailPage ||
		isCreatePage
	) {
		return null;
	}

	const tabs: Tab[] = user
		? [
				{ name: t("tab_nav.home"), href: "/events", icon: HomeIcon },
				{
					name: t("tab_nav.docs"),
					href: "/docs",
					icon: DocumentTextIcon,
				},
				{
					name: t("tab_nav.create"),
					href: "#create",
					icon: PlusIcon,
					isAction: true,
				},
				{
					name: t("tab_nav.notifications"),
					href: "/notifications",
					icon: BellIcon,
				},
				{ name: t("tab_nav.me"), href: "/me", icon: UserCircleIcon },
			]
		: [
				{ name: t("tab_nav.home"), href: "/", icon: HomeIcon },
				{
					name: t("tab_nav.docs"),
					href: "/docs",
					icon: DocumentTextIcon,
				},
				{
					name: t("tab_nav.organizations"),
					href: "/orgs",
					icon: BuildingOffice2Icon,
				},
				{
					name: t("tab_nav.notifications"),
					href: "/notifications",
					icon: BellIcon,
				},
				{
					name: t("tab_nav.login"),
					href: "/auth/login",
					icon: UserCircleIcon,
				},
			];

	const CATEGORY_PREFIXES = [
		"/events",
		"/projects",
		"/orgs",
		"/tasks",
		"/posts",
		"/members",
	];

	const isTabActive = (href: string) => {
		if (href === "/events") {
			return CATEGORY_PREFIXES.some((p) =>
				normalizedPathname.startsWith(p),
			);
		}
		if (href === "/") {
			return normalizedPathname === "/";
		}
		return normalizedPathname.startsWith(href);
	};

	return (
		<>
			<nav
				className={cn(
					"fixed bottom-0 left-0 z-50 w-full border-t border-border bg-background/95 backdrop-blur lg:hidden transition-transform duration-300",
					isKeyboardVisible ? "translate-y-full" : "translate-y-0",
				)}
				style={{
					bottom: isKeyboardVisible
						? `${viewportBottomOffset}px`
						: "0px",
					paddingBottom: isWeChat
						? "1rem"
						: "max(0.75rem, env(safe-area-inset-bottom, 0px))",
				}}
			>
				<div className="mx-auto flex h-16 max-w-md items-center justify-around px-1">
					{tabs.map((tab) => {
						const isActive = tab.isAction
							? isCreateOpen
							: isTabActive(tab.href);

						if (tab.isAction) {
							return (
								<button
									key={tab.name}
									type="button"
									onClick={() => {
										if (!user) {
											router.push("/auth/login");
											return;
										}
										setIsCreateOpen(true);
									}}
									className="flex min-h-[56px] min-w-[56px] flex-col items-center justify-center gap-1"
								>
									<div
										className={cn(
											"flex h-10 w-10 items-center justify-center rounded-full shadow-sm transition-transform duration-150 active:scale-95",
											isActive
												? "bg-foreground text-background"
												: "bg-foreground text-background",
										)}
									>
										<tab.icon className="h-5 w-5" />
									</div>
									<span className="text-[10px] font-semibold text-foreground">
										{tab.name}
									</span>
								</button>
							);
						}

						return (
							<Link
								key={tab.name}
								href={tab.href}
								className="relative flex min-h-[56px] min-w-[56px] flex-col items-center justify-center gap-1"
							>
								{isActive && (
									<span className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-8 rounded-full bg-foreground" />
								)}
								<tab.icon
									className={cn(
										"h-6 w-6 transition-colors",
										isActive
											? "text-foreground"
											: "text-muted-foreground",
									)}
								/>
								<span
									className={cn(
										"text-[10px] transition-colors",
										isActive
											? "font-semibold text-foreground"
											: "font-medium text-muted-foreground",
									)}
								>
									{tab.name}
								</span>
							</Link>
						);
					})}
				</div>
			</nav>

			<Drawer open={isCreateOpen} onOpenChange={setIsCreateOpen}>
				<DrawerContent className="rounded-t-lg border-t border-border px-3 pb-4 pt-3">
					<div className="mx-auto mb-2 h-1.5 w-10 rounded-full bg-muted" />
					{/* <DrawerTitle className="mb-3 text-center text-xs font-bold uppercase tracking-wider text-muted-foreground">
						{t("tab_nav.create")}
					</DrawerTitle> */}
					<div className="space-y-2">
						{createActions.map((action) => (
							<Link
								key={action.href}
								href={action.href}
								onClick={() => setIsCreateOpen(false)}
								className="flex items-start gap-2.5 rounded-lg border border-border bg-card px-3 py-2.5 transition-colors hover:bg-muted/60"
							>
								<div className="flex h-7 w-7 items-center justify-center rounded-md bg-muted text-foreground">
									<action.icon className="h-4 w-4" />
								</div>
								<div className="flex-1">
									<div className="text-sm font-semibold text-foreground">
										{action.title}
									</div>
									<div className="text-xs text-muted-foreground line-clamp-2">
										{action.description}
									</div>
								</div>
							</Link>
						))}
					</div>
				</DrawerContent>
			</Drawer>
		</>
	);
}
