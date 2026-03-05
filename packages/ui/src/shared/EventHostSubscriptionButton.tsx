"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { Button } from "@community/ui/ui/button";
import { useSession } from "@/modules/account/auth/hooks/use-session";
import clsx from "clsx";

interface EventHostSubscriptionButtonProps {
	organizationId?: string;
	hostUserId?: string;
	hostName: string;
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

export function EventHostSubscriptionButton({
	organizationId,
	hostUserId,
	hostName,
	className,
	variant = "outline",
	size = "default",
}: EventHostSubscriptionButtonProps) {
	const targetKey = useMemo(() => {
		const hasOrganization = !!organizationId;
		const hasHost = !!hostUserId;

		if (hasOrganization === hasHost) {
			throw new Error(
				"EventHostSubscriptionButton requires exactly one of organizationId or hostUserId.",
			);
		}

		return hasOrganization
			? { key: "organizationId", value: organizationId! }
			: { key: "hostUserId", value: hostUserId! };
	}, [organizationId, hostUserId]);

	const t = useTranslations("eventHostSubscription");
	const { user, loaded } = useSession();
	const isLoggedIn = !!user;
	const router = useRouter();
	const pathname = usePathname();

	const [isSubscribed, setIsSubscribed] = useState(false);
	const [isLoading, setIsLoading] = useState(true); // Start with loading true to avoid hydration mismatch
	const [isMutating, setIsMutating] = useState(false);
	const [initialised, setInitialised] = useState(false);
	const [mounted, setMounted] = useState(false); // Track if component is mounted

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
		if (!mounted || !loaded) return;
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
				const params = new URLSearchParams({
					[targetKey.key]: targetKey.value,
				});
				const response = await fetch(
					`/api/event-host-subscriptions/status?${params.toString()}`,
					{
						credentials: "include",
					},
				);
				if (!response.ok) {
					throw new Error("Failed to fetch subscription status");
				}
				const data = await response.json();
				if (!cancelled) {
					setIsSubscribed(!!data.subscribed);
				}
			} catch (error) {
				console.error(error);
				if (!cancelled) {
					toast.error(t("error"));
				}
			} finally {
				if (!cancelled) {
					setIsLoading(false);
					setInitialised(true);
				}
			}
		};

		fetchStatus();
		return () => {
			cancelled = true;
		};
	}, [isLoggedIn, loaded, targetKey, t, mounted]);

	const handleAuthRedirect = useCallback(() => {
		router.push(loginRedirect);
	}, [loginRedirect, router]);

	const toggleSubscription = useCallback(async () => {
		setIsMutating(true);
		try {
			const response = await fetch("/api/event-host-subscriptions", {
				method: isSubscribed ? "DELETE" : "POST",
				headers: {
					"Content-Type": "application/json",
				},
				credentials: "include",
				body: JSON.stringify({ [targetKey.key]: targetKey.value }),
			});

			if (!response.ok) {
				throw new Error("Subscription request failed");
			}

			const data = await response.json();
			const nextSubscribed = isSubscribed ? false : !!data.subscribed;
			setIsSubscribed(nextSubscribed);
			toast.success(
				nextSubscribed
					? t("successSubscribe", { hostName })
					: t("successUnsubscribe", { hostName }),
			);
		} catch (error) {
			console.error(error);
			toast.error(t("error"));
		} finally {
			setIsMutating(false);
		}
	}, [isSubscribed, targetKey, hostName, t]);

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
						? t("subscribe") // Default text during SSR
						: isLoggedIn
							? isSubscribed
								? t("unsubscribe")
								: t("subscribe")
							: t("login")}
				</span>
			</Button>
			{/* Hide description on smaller sizes for mobile */}
			{size !== "sm" && (
				<p className="text-xs text-muted-foreground">
					{t("description", { hostName })}
				</p>
			)}
		</div>
	);
}
