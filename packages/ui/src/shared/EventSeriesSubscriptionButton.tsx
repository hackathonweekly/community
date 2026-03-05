"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import clsx from "clsx";

import { Button } from "@community/ui/ui/button";
import { useSession } from "@/modules/account/auth/hooks/use-session";

interface EventSeriesSubscriptionButtonProps {
	seriesId: string;
	seriesName: string;
	className?: string;
	variant?:
		| "default"
		| "outline"
		| "secondary"
		| "ghost"
		| "destructive"
		| "link";
	size?: "default" | "sm" | "lg" | "icon";
}

export function EventSeriesSubscriptionButton({
	seriesId,
	seriesName,
	className,
	variant = "outline",
	size = "default",
}: EventSeriesSubscriptionButtonProps) {
	const t = useTranslations("eventSeriesSubscription");
	const { user, loaded } = useSession();
	const isLoggedIn = Boolean(user);
	const router = useRouter();
	const pathname = usePathname();

	const [isSubscribed, setIsSubscribed] = useState(false);
	const [isLoading, setIsLoading] = useState(true);
	const [isMutating, setIsMutating] = useState(false);
	const [initialised, setInitialised] = useState(false);
	const [mounted, setMounted] = useState(false);

	const loginRedirect = useMemo(() => {
		const redirect = pathname
			? `?redirectTo=${encodeURIComponent(pathname)}`
			: "";
		return `/auth/login${redirect}`;
	}, [pathname]);

	useEffect(() => {
		setMounted(true);
	}, []);

	useEffect(() => {
		if (!mounted || !loaded) {
			return;
		}

		if (!isLoggedIn) {
			setIsSubscribed(false);
			setInitialised(true);
			setIsLoading(false);
			return;
		}

		let cancelled = false;

		const fetchStatus = async () => {
			setIsLoading(true);
			try {
				const response = await fetch(
					`/api/event-series/${seriesId}/subscription`,
					{ credentials: "include" },
				);
				if (!response.ok) {
					throw new Error(
						"Failed to fetch series subscription status",
					);
				}
				const data = await response.json();
				if (!cancelled) {
					setIsSubscribed(Boolean(data?.data?.subscribed));
				}
			} catch (error) {
				console.error(error);
				if (!cancelled) {
					toast.error(t("error"));
				}
			} finally {
				if (!cancelled) {
					setInitialised(true);
					setIsLoading(false);
				}
			}
		};

		fetchStatus();

		return () => {
			cancelled = true;
		};
	}, [isLoggedIn, loaded, mounted, seriesId, t]);

	const handleAuthRedirect = useCallback(() => {
		router.push(loginRedirect);
	}, [loginRedirect, router]);

	const toggleSubscription = useCallback(async () => {
		setIsMutating(true);
		try {
			const response = await fetch(
				`/api/event-series/${seriesId}/subscription`,
				{
					method: isSubscribed ? "DELETE" : "POST",
					headers: {
						"Content-Type": "application/json",
					},
					credentials: "include",
					body: isSubscribed
						? undefined
						: JSON.stringify({
								notifyEmail: true,
								notifyInApp: true,
							}),
				},
			);

			if (!response.ok) {
				throw new Error("Failed to update series subscription");
			}

			const nextSubscribed = !isSubscribed;
			setIsSubscribed(nextSubscribed);
			toast.success(
				nextSubscribed
					? t("successSubscribe", { seriesName })
					: t("successUnsubscribe", { seriesName }),
			);
		} catch (error) {
			console.error(error);
			toast.error(t("error"));
		} finally {
			setIsMutating(false);
		}
	}, [isSubscribed, seriesId, seriesName, t]);

	const showSpinner = !mounted || (!initialised && isLoading) || isMutating;

	return (
		<div className={clsx("flex w-full flex-col gap-2", className)}>
			<Button
				variant={variant}
				size={size}
				disabled={showSpinner || (isLoading && !initialised)}
				onClick={isLoggedIn ? toggleSubscription : handleAuthRedirect}
				className="flex w-full items-center justify-center gap-2"
			>
				{showSpinner ? (
					<Loader2 className="h-4 w-4 animate-spin" />
				) : null}
				<span>
					{!mounted
						? t("subscribe")
						: isLoggedIn
							? isSubscribed
								? t("unsubscribe")
								: t("subscribe")
							: t("login")}
				</span>
			</Button>
			{size !== "sm" ? (
				<p className="text-xs text-muted-foreground">
					{t("description", { seriesName })}
				</p>
			) : null}
		</div>
	);
}
