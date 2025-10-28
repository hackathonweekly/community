"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSession } from "@dashboard/auth/hooks/use-session";
import {
	useNotificationsQuery,
	useUnreadNotificationsCountQuery,
	useMarkNotificationAsReadMutation,
	useMarkAllNotificationsAsReadMutation,
	useDeleteNotificationMutation,
} from "@/lib/api/api-hooks";
import { formatDistanceToNow } from "date-fns";
import { enUS, zhCN } from "date-fns/locale";
import {
	BellIcon,
	CheckIcon,
	FileTextIcon,
	TrashIcon,
	XIcon,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

interface Notification {
	id: string;
	type: string;
	title: string;
	content: string;
	read: boolean;
	readAt: Date | null;
	actionUrl?: string;
	priority: "LOW" | "NORMAL" | "HIGH" | "URGENT";
	createdAt: Date;
	relatedUser?: {
		id: string;
		name: string;
		image?: string;
		username?: string;
	};
}

interface NotificationsResponse {
	success: boolean;
	data: {
		notifications: Notification[];
		pagination: {
			page: number;
			limit: number;
			total: number;
			totalPages: number;
		};
	};
}

const getNotificationIcon = (type: string) => {
	const iconMap: Record<string, string> = {
		PROJECT_COMMENT: "💬",
		PROJECT_LIKE: "👍",
		ORGANIZATION_MEMBER_APPLICATION: "👥",
		ORGANIZATION_APPLICATION_RESULT: "✅",
		EVENT_REGISTRATION_RESULT: "🎫",
		EVENT_TIME_CHANGE: "⏰",
		EVENT_REMINDER: "🔔",
		ACCOUNT_SECURITY: "🔒",
		SYSTEM_ANNOUNCEMENT: "📢",
		USER_BOOKMARKED: "⭐",
	};
	return iconMap[type] || "🔔";
};

const getPriorityColor = (priority: string) => {
	const colorMap: Record<string, string> = {
		LOW: "bg-gray-100 text-gray-600",
		NORMAL: "bg-blue-100 text-blue-600",
		HIGH: "bg-orange-100 text-orange-600",
		URGENT: "bg-red-100 text-red-600",
	};
	return colorMap[priority] || colorMap.NORMAL;
};

export function NotificationCenter() {
	const { user } = useSession();
	const locale = useLocale();
	const [page, setPage] = useState(1);
	const [open, setOpen] = useState(false);
	const t = useTranslations("app.notifications");

	const dateLocale = locale === "zh" ? zhCN : enUS;

	// 使用优化的 hooks - 只有在用户登录时才发起请求
	const {
		data: notificationsData,
		isLoading,
		error,
	} = useNotificationsQuery(page, 20, { enabled: !!user });

	const { data: unreadCount = 0 } = useUnreadNotificationsCountQuery({
		enabled: !!user,
	});

	// Mutations
	const markAsReadMutation = useMarkNotificationAsReadMutation();
	const markAllAsReadMutation = useMarkAllNotificationsAsReadMutation();
	const deleteNotificationMutation = useDeleteNotificationMutation();

	const notifications = notificationsData?.data?.notifications || [];
	const hasMore = notificationsData?.data?.pagination
		? page < notificationsData.data.pagination.totalPages
		: false;

	const markAsRead = async (notificationId: string) => {
		try {
			await markAsReadMutation.mutateAsync(notificationId);
		} catch (error) {
			console.error("Error marking notification as read:", error);
		}
	};

	const markAllAsRead = async () => {
		try {
			await markAllAsReadMutation.mutateAsync();
			toast.success(
				t("markAllReadSuccess") || "All notifications marked as read",
			);
		} catch (error) {
			console.error("Error marking all notifications as read:", error);
			toast.error(t("operationError"));
		}
	};

	const deleteNotification = async (notificationId: string) => {
		try {
			await deleteNotificationMutation.mutateAsync(notificationId);
			toast.success(t("deleteSuccess"));
		} catch (error) {
			console.error("Error deleting notification:", error);
			toast.error(t("deleteError"));
		}
	};

	const loadMore = () => {
		if (hasMore && !isLoading) {
			setPage((prev) => prev + 1);
		}
	};

	if (!user) {
		return null;
	}

	if (error) {
		console.error("Error loading notifications:", error);
	}

	return (
		<DropdownMenu open={open} onOpenChange={setOpen}>
			<DropdownMenuTrigger asChild>
				<Button variant="ghost" size="icon" className="relative">
					<BellIcon className="h-5 w-5" />
					{unreadCount > 0 && (
						<Badge
							variant="destructive"
							className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
						>
							{unreadCount > 99 ? "99+" : unreadCount}
						</Badge>
					)}
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent
				align="center"
				className="w-[90vw] md:w-[400px] p-0"
				side="bottom"
				sideOffset={4}
			>
				<Card className="border-0 shadow-none">
					<CardHeader className="pb-2">
						<div className="flex items-center justify-between">
							<CardTitle className="text-base">
								{t("title")}
							</CardTitle>
							<div className="flex items-center gap-2">
								{unreadCount > 0 && (
									<Button
										variant="ghost"
										size="sm"
										onClick={markAllAsRead}
										className="h-8 px-2 text-xs"
									>
										<CheckIcon className="h-3 w-3 mr-1" />
										{t("markAllRead")}
									</Button>
								)}
								{/*<Button
									variant="ghost"
									size="icon"
									className="h-8 w-8"
									asChild
								>
									<Link href="/app/settings/notifications">
										<SettingsIcon className="h-4 w-4" />
									</Link>
								</Button>*/}
								<Button
									variant="ghost"
									size="icon"
									className="h-8 w-8"
									onClick={() => setOpen(false)}
								>
									<XIcon className="h-4 w-4" />
								</Button>
							</div>
						</div>
					</CardHeader>
					<CardContent className="p-0">
						<ScrollArea className="h-[400px]">
							{notifications.length === 0 ? (
								<div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
									<BellIcon className="h-12 w-12 opacity-20 mb-4" />
									<p>{t("noNotifications")}</p>
								</div>
							) : (
								<div className="space-y-1">
									{notifications.map(
										(notification: Notification) => (
											<div
												key={notification.id}
												className={`flex items-start gap-3 p-3 hover:bg-muted/50 cursor-pointer border-b last:border-b-0 ${
													!notification.read
														? "bg-blue-50"
														: ""
												}`}
												onClick={() => {
													if (!notification.read) {
														markAsRead(
															notification.id,
														);
													}
													if (
														notification.actionUrl
													) {
														window.location.href =
															notification.actionUrl;
													}
												}}
											>
												<div className="flex-shrink-0 pt-1">
													<span className="text-lg">
														{getNotificationIcon(
															notification.type,
														)}
													</span>
												</div>

												<div className="flex-1 min-w-0">
													<div className="flex items-start justify-between gap-2">
														<div className="flex-1">
															<div className="flex items-center gap-2 mb-1">
																<h4 className="font-medium text-sm truncate">
																	{
																		notification.title
																	}
																</h4>
																{!notification.read && (
																	<div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
																)}
															</div>
															<p className="text-xs text-muted-foreground line-clamp-2">
																{
																	notification.content
																}
															</p>
															<div className="flex items-center gap-2 mt-2">
																<span className="text-xs text-muted-foreground">
																	{formatDistanceToNow(
																		new Date(
																			notification.createdAt,
																		),
																		{
																			addSuffix: true,
																			locale: dateLocale,
																		},
																	)}
																</span>
																{notification.priority !==
																	"NORMAL" && (
																	<Badge
																		variant="secondary"
																		className={`text-xs h-5 ${getPriorityColor(
																			notification.priority,
																		)}`}
																	>
																		{
																			notification.priority
																		}
																	</Badge>
																)}
															</div>
														</div>

														{notification.relatedUser && (
															<Avatar className="h-8 w-8 flex-shrink-0">
																<AvatarImage
																	src={
																		notification
																			.relatedUser
																			.image
																	}
																	alt={
																		notification
																			.relatedUser
																			.name
																	}
																/>
																<AvatarFallback className="text-xs">
																	{notification.relatedUser.name.charAt(
																		0,
																	)}
																</AvatarFallback>
															</Avatar>
														)}
													</div>
												</div>

												<div className="flex-shrink-0">
													<DropdownMenu>
														<DropdownMenuTrigger
															asChild
														>
															<Button
																variant="ghost"
																size="icon"
																className="h-8 w-8"
																onClick={(
																	e,
																) => {
																	e.stopPropagation();
																}}
															>
																<FileTextIcon className="h-4 w-4" />
															</Button>
														</DropdownMenuTrigger>
														<DropdownMenuContent align="end">
															{!notification.read && (
																<DropdownMenuItem
																	onClick={(
																		e,
																	) => {
																		e.stopPropagation();
																		markAsRead(
																			notification.id,
																		);
																	}}
																>
																	<CheckIcon className="h-4 w-4 mr-2" />
																	{t(
																		"markAsRead",
																	)}
																</DropdownMenuItem>
															)}
															<DropdownMenuItem
																onClick={(
																	e,
																) => {
																	e.stopPropagation();
																	deleteNotification(
																		notification.id,
																	);
																}}
																className="text-red-600"
															>
																<TrashIcon className="h-4 w-4 mr-2" />
																{t("delete")}
															</DropdownMenuItem>
														</DropdownMenuContent>
													</DropdownMenu>
												</div>
											</div>
										),
									)}

									{hasMore && (
										<div className="p-3 text-center">
											<Button
												variant="ghost"
												size="sm"
												onClick={loadMore}
												disabled={isLoading}
												className="text-xs"
											>
												{isLoading
													? t("loading")
													: t("loadMore")}
											</Button>
										</div>
									)}
								</div>
							)}
						</ScrollArea>

						{notifications.length > 0 && (
							<>
								<DropdownMenuSeparator />
								<div className="p-3">
									<Button
										asChild
										variant="ghost"
										className="w-full text-sm"
									>
										<Link href="/app/notifications">
											{t("viewAll")}
										</Link>
									</Button>
								</div>
							</>
						)}
					</CardContent>
				</Card>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
