"use client";

import { eventKeys } from "@/app/(public)/[locale]/events/[eventId]/hooks/useEventQueries";
import { useSession } from "@dashboard/auth/hooks/use-session";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { NewEventPageClient } from "./NewEventPageClient";

interface EventPageWrapperProps {
	initialEvent: any;
	locale?: string;
}

export function EventPageWrapper({
	initialEvent,
	locale = "zh",
}: EventPageWrapperProps) {
	const { user, loaded, reloadSession } = useSession();
	const searchParams = useSearchParams();
	const previousUserRef = useRef(user);

	// 使用服务端数据作为初始数据，然后在客户端重新获取最新数据
	const { data: event, refetch } = useQuery({
		queryKey: eventKeys.detail(initialEvent.id),
		queryFn: async () => {
			const response = await fetch(`/api/events/${initialEvent.id}`, {
				credentials: "include",
			});
			if (!response.ok) {
				console.warn(
					`Failed to fetch event details: ${response.status} ${response.statusText}`,
				);
				return initialEvent;
			}
			const data = await response.json();
			return data.data;
		},
		initialData: initialEvent,
		staleTime: 10 * 1000,
		refetchOnWindowFocus: true,
		refetchOnReconnect: true,
		refetchInterval: 60 * 1000,
	});

	// 监听用户登录状态变化，当从未登录变为已登录时重新获取事件数据
	useEffect(() => {
		if (loaded) {
			const previousUser = previousUserRef.current;
			const currentUser = user;

			if (!previousUser && currentUser) {
				refetch();
			}

			previousUserRef.current = currentUser;
		}
	}, [user, loaded, refetch]);

	// 登录重定向后强制刷新
	useEffect(() => {
		const fromLogin = searchParams.get("from_login");
		if (fromLogin === "true" && loaded) {
			const handleLoginRedirect = async () => {
				try {
					await reloadSession();
					await refetch();
				} catch (error) {
					console.warn(
						"Failed to reload session or event data:",
						error,
					);
				}
			};
			handleLoginRedirect();
		}
	}, [searchParams, loaded, reloadSession, refetch]);

	useEffect(() => {
		const handleVisibilityChange = () => {
			if (!document.hidden && loaded && !user) {
				const timer = setTimeout(() => {
					refetch();
				}, 100);
				return () => clearTimeout(timer);
			}
		};

		document.addEventListener("visibilitychange", handleVisibilityChange);
		return () => {
			document.removeEventListener(
				"visibilitychange",
				handleVisibilityChange,
			);
		};
	}, [user, loaded, refetch]);

	return <NewEventPageClient event={event} locale={locale} />;
}
