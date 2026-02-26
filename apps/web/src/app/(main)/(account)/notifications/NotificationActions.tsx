"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

interface NotificationActionsProps {
	action: "markRead" | "markAllRead" | "delete";
	notificationId?: string;
	userId?: string;
	children: React.ReactNode;
}

export function NotificationActions({
	action,
	notificationId,
	userId,
	children,
}: NotificationActionsProps) {
	const [isLoading, setIsLoading] = useState(false);
	const router = useRouter();
	const t = useTranslations("app.notifications");

	const handleAction = async () => {
		setIsLoading(true);

		try {
			let response: Response;

			switch (action) {
				case "markRead":
					if (!notificationId) {
						return;
					}
					response = await fetch(
						`/api/notifications/${notificationId}/read`,
						{
							method: "POST",
						},
					);
					break;

				case "markAllRead":
					response = await fetch("/api/notifications/read-all", {
						method: "PUT",
					});
					break;

				case "delete":
					if (!notificationId) {
						return;
					}
					response = await fetch(
						`/api/notifications/${notificationId}`,
						{
							method: "DELETE",
						},
					);
					break;

				default:
					return;
			}

			if (response.ok) {
				switch (action) {
					case "markRead":
						toast.success(t("markReadSuccess"));
						break;
					case "markAllRead":
						toast.success(t("markAllReadSuccess"));
						break;
					case "delete":
						toast.success(t("deleteSuccess"));
						break;
				}

				// 刷新页面来更新状态
				router.refresh();
			} else {
				throw new Error(t("operationError"));
			}
		} catch (error) {
			console.error(`Error performing ${action}:`, error);
			toast.error(t("operationError"));
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div
			onClick={handleAction}
			onKeyDown={(e) => {
				if (e.key === "Enter" || e.key === " ") {
					e.preventDefault();
					handleAction();
				}
			}}
			className="inline-block"
		>
			{children}
		</div>
	);
}
