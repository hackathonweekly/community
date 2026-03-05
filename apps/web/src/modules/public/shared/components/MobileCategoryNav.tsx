"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@community/lib-shared/utils";

const CATEGORY_ROUTES = [
	{ key: "events", href: "/events" },
	{ key: "projects", href: "/projects" },
	{ key: "orgs", href: "/orgs" },
	{ key: "tasks", href: "/tasks" },
	{ key: "posts", href: "/posts" },
	{ key: "members", href: "/members" },
] as const;

const LIST_PREFIXES = CATEGORY_ROUTES.map((r) => r.href);

const LOCALE_PREFIX_PATTERN = /^\/[a-z]{2}(?:-[A-Z]{2})?(?=\/|$)/;

export function MobileCategoryNav() {
	const pathname = usePathname();
	const t = useTranslations("tab_nav");

	const normalizedPathname = useMemo(() => {
		const withoutLocale = pathname.replace(LOCALE_PREFIX_PATTERN, "");
		return withoutLocale || "/";
	}, [pathname]);

	const isListPage = LIST_PREFIXES.some(
		(prefix) =>
			normalizedPathname === prefix ||
			normalizedPathname === `${prefix}/`,
	);

	const router = useRouter();
	const currentIndex = CATEGORY_ROUTES.findIndex((r) =>
		normalizedPathname.startsWith(r.href),
	);

	const touchRef = useRef<{
		startX: number;
		startY: number;
		lastX: number;
		locked: boolean | null;
	} | null>(null);
	const swipedRef = useRef(false);

	const handleSwipe = useCallback(
		(direction: "left" | "right") => {
			if (currentIndex === -1) return;
			const nextIndex =
				direction === "left" ? currentIndex + 1 : currentIndex - 1;
			if (nextIndex < 0 || nextIndex >= CATEGORY_ROUTES.length) return;
			router.push(CATEGORY_ROUTES[nextIndex].href);
		},
		[currentIndex, router],
	);

	useEffect(() => {
		if (!isListPage) return;

		const onTouchStart = (e: TouchEvent) => {
			const touch = e.touches[0];
			touchRef.current = {
				startX: touch.clientX,
				startY: touch.clientY,
				lastX: touch.clientX,
				locked: null,
			};
			swipedRef.current = false;
		};

		const onTouchMove = (e: TouchEvent) => {
			if (!touchRef.current || swipedRef.current) return;
			const touch = e.touches[0];
			const dx = touch.clientX - touchRef.current.startX;
			const dy = touch.clientY - touchRef.current.startY;

			// Determine swipe direction lock on first significant movement
			if (
				touchRef.current.locked === null &&
				(Math.abs(dx) > 10 || Math.abs(dy) > 10)
			) {
				touchRef.current.locked = Math.abs(dx) > Math.abs(dy);
			}

			touchRef.current.lastX = touch.clientX;
		};

		const onTouchEnd = () => {
			if (!touchRef.current || swipedRef.current) return;
			const dx = touchRef.current.lastX - touchRef.current.startX;
			const isHorizontalLock = touchRef.current.locked === true;
			touchRef.current = null;

			// Only trigger if we locked to horizontal direction and moved enough
			if (isHorizontalLock && Math.abs(dx) > 50) {
				swipedRef.current = true;
				handleSwipe(dx < 0 ? "left" : "right");
			}
		};

		document.addEventListener("touchstart", onTouchStart, {
			passive: true,
		});
		document.addEventListener("touchmove", onTouchMove, { passive: true });
		document.addEventListener("touchend", onTouchEnd, { passive: true });
		return () => {
			document.removeEventListener("touchstart", onTouchStart);
			document.removeEventListener("touchmove", onTouchMove);
			document.removeEventListener("touchend", onTouchEnd);
		};
	}, [isListPage, handleSwipe]);

	if (!isListPage) {
		return null;
	}

	const labelMap: Record<string, string> = {
		events: t("events"),
		projects: t("projects"),
		orgs: t("organizations"),
		tasks: t("tasks"),
		posts: t("posts"),
		members: t("members"),
	};

	return (
		<div className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border lg:hidden">
			<div className="flex overflow-x-auto scrollbar-hide px-4 gap-1">
				{CATEGORY_ROUTES.map(({ key, href }) => {
					const isActive = normalizedPathname.startsWith(href);
					return (
						<Link
							key={key}
							href={href}
							className={cn(
								"flex-shrink-0 px-3 py-2.5 text-sm font-medium transition-colors whitespace-nowrap",
								isActive
									? "text-foreground border-b-2 border-foreground font-semibold"
									: "text-muted-foreground hover:text-foreground",
							)}
						>
							{labelMap[key]}
						</Link>
					);
				})}
			</div>
		</div>
	);
}
