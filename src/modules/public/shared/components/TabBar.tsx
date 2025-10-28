"use client";

import { cn } from "@/lib/utils";
import { isWeChatBrowser } from "@/lib/utils/browser-detect";
import { useEffect, useState } from "react";
import {
	CalendarDaysIcon,
	HomeIcon,
	UserCircleIcon,
	BuildingOffice2Icon,
	Squares2X2Icon,
} from "@heroicons/react/24/solid";
import { LocaleLink, useLocalePathname } from "@i18n/routing";
import { useSession } from "@dashboard/auth/hooks/use-session";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { useKeyboardDetection } from "@/lib/hooks/use-keyboard-detection";

interface Tab {
	name: string;
	href: string;
	icon: React.ComponentType<{ className?: string }>;
	isExternal?: boolean;
}

export function TabBar() {
	const pathname = useLocalePathname();
	const t = useTranslations("tab_nav");
	const params = useParams();
	const locale = (params.locale as string) || "zh";
	const { user } = useSession();

	// 检测是否在微信浏览器中
	const [isWeChat, setIsWeChat] = useState(false);
	// 使用自定义 hook 检测键盘是否弹出
	const isKeyboardVisible = useKeyboardDetection();

	useEffect(() => {
		setIsWeChat(isWeChatBrowser());
	}, []);

	// 如果是用户个人主页，隐藏 TabBar
	const isUserProfilePage = pathname.startsWith("/u/");
	// 如果是活动详情页面，隐藏 TabBar 以提供沉浸式体验
	const isEventDetailPage =
		pathname.startsWith("/events/") && pathname !== "/events";
	if (isUserProfilePage || isEventDetailPage) {
		return null;
	}

	const tabs: Tab[] = [
		{
			name: t("home"),
			href: "/",
			icon: HomeIcon,
		},
		{
			name: t("events"),
			href: "/events",
			icon: CalendarDaysIcon,
		},
		{
			name: t("projects"),
			href: "/projects",
			icon: Squares2X2Icon,
		},
		{
			name: t("organizations"),
			href: "/orgs",
			icon: BuildingOffice2Icon,
		},
		{
			name: t("me"),
			href: user ? "/app" : "/auth/login",
			icon: UserCircleIcon,
			isExternal: true,
		},
	];

	const isTabActive = (href: string) => {
		if (href === "/") {
			return pathname === "/";
		}
		return pathname.startsWith(href);
	};

	return (
		<nav
			className={cn(
				"fixed bottom-0 left-0 z-50 w-full border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden transition-transform duration-300",
				// 微信浏览器中增加额外的底部内边距
				isWeChat ? "pb-4" : "pb-[env(safe-area-inset-bottom,0.5rem)]",
				// 键盘弹出时隐藏底部导航栏
				isKeyboardVisible ? "translate-y-full" : "translate-y-0",
			)}
		>
			<div className="mx-auto flex h-16 max-w-md items-center justify-around px-4">
				{tabs.map((tab) => {
					const isActive = isTabActive(tab.href);
					const LinkComponent = tab.isExternal ? "a" : LocaleLink;
					return (
						<LinkComponent
							key={tab.name}
							href={tab.href}
							className="flex flex-col items-center gap-1 text-muted-foreground transition-colors hover:text-primary"
						>
							<tab.icon
								className={cn(
									"h-6 w-6",
									isActive ? "text-primary" : "",
								)}
							/>
							<span
								className={cn(
									"text-xs font-medium",
									isActive ? "text-primary" : "",
								)}
							>
								{tab.name}
							</span>
						</LinkComponent>
					);
				})}
			</div>
		</nav>
	);
}
