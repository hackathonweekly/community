"use client";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "@shared/auth/hooks/use-session";
import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { eventKeys } from "./hooks/useEventQueries";
import { EventDetailsClient } from "./EventDetailsClient";

interface EventDetailsWrapperProps {
	initialEvent: any;
	locale?: string;
}

export function EventDetailsWrapper({
	initialEvent,
	locale,
}: EventDetailsWrapperProps) {
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
				// 如果API失败，返回初始数据
				console.warn(
					`Failed to fetch event details: ${response.status} ${response.statusText}`,
				);
				return initialEvent;
			}
			const data = await response.json();
			return data.data;
		},
		initialData: initialEvent,
		staleTime: 10 * 1000, // 缩短到10秒以获得更及时的数据
		refetchOnWindowFocus: true,
		refetchOnReconnect: true,
		refetchInterval: 60 * 1000, // 每分钟自动刷新一次
	});

	// 监听用户登录状态变化，当从未登录变为已登录时重新获取事件数据
	useEffect(() => {
		if (loaded) {
			const previousUser = previousUserRef.current;
			const currentUser = user;

			// 检测从未登录状态变为已登录状态
			if (!previousUser && currentUser) {
				// 用户刚刚登录，重新获取事件数据以更新注册状态等信息
				refetch();
			}

			// 更新引用
			previousUserRef.current = currentUser;
		}
	}, [user, loaded, refetch]);

	// 检查 URL 参数，如果来自登录页面的重定向，强制刷新会话和事件数据
	useEffect(() => {
		const fromLogin = searchParams.get("from_login");
		if (fromLogin === "true" && loaded) {
			// 来自登录页面的重定向，确保会话和事件数据都是最新的
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

	// 额外的页面焦点监听，确保从登录页面返回时能及时更新状态
	useEffect(() => {
		const handleVisibilityChange = () => {
			// 当页面重新变为可见时，如果用户之前未登录，现在可能已登录，强制检查会话状态
			if (!document.hidden && loaded && !user) {
				// 短暂延迟后重新获取事件数据，给登录后的会话更新一些时间
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

	return <EventDetailsClient event={event} locale={locale} />;
}
