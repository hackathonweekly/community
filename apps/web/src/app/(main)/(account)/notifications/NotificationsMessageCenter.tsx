"use client";

import { useMemo, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
	BellIcon,
	CheckIcon,
	ChevronDownIcon,
	ChevronUpIcon,
	Clock3Icon,
	HeartIcon,
	MailIcon,
	MegaphoneIcon,
	MessageCircleIcon,
	MoreVerticalIcon,
	ShieldIcon,
	SlidersHorizontalIcon,
	StarIcon,
	TicketIcon,
	TrashIcon,
	UserPlusIcon,
	UsersIcon,
} from "lucide-react";
import { Button } from "@community/ui/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@community/ui/ui/dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@community/ui/ui/dropdown-menu";
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@community/ui/ui/tabs";
import { EmptyState } from "@/modules/public/shared/components/EmptyState";
import { NotificationActions } from "./NotificationActions";

interface NotificationUser {
	id: string;
	name: string;
	image: string | null;
	username: string | null;
}

interface NotificationItem {
	id: string;
	type: string;
	title: string;
	content: string;
	read: boolean;
	readAt: string | null;
	actionUrl: string | null;
	priority: string;
	createdAt: string;
	relatedUser: NotificationUser | null;
}

interface NotificationsMessageCenterProps {
	userId: string;
	notifications: NotificationItem[];
	unreadCount: number;
}

type NotificationTab = "notice" | "interaction" | "system";

const INTERACTION_TYPES = new Set<string>([
	"PROJECT_COMMENT",
	"PROJECT_LIKE",
	"USER_BOOKMARKED",
	"USER_FOLLOWED",
	"USER_LIKED",
	"PRIVATE_MESSAGE",
	"PROFILE_VIEW_MILESTONE",
]);

const SYSTEM_TYPES = new Set<string>([
	"ACCOUNT_SECURITY",
	"ACCOUNT_BANNED",
	"SYSTEM_ANNOUNCEMENT",
	"ACHIEVEMENT_UNLOCKED",
	"DAILY_REWARD",
	"ORGANIZATION_APPLICATION_RESULT",
	"EVENT_REGISTRATION_RESULT",
]);

const getTabByType = (type: string): NotificationTab => {
	if (INTERACTION_TYPES.has(type)) {
		return "interaction";
	}
	if (SYSTEM_TYPES.has(type)) {
		return "system";
	}
	return "notice";
};

const getPriorityTone = (priority: string) => {
	const colorMap: Record<string, string> = {
		LOW: "border-border bg-muted text-muted-foreground",
		NORMAL: "border-border bg-card text-foreground",
		HIGH: "border-border bg-muted text-foreground",
		URGENT: "border-destructive/30 bg-destructive/10 text-destructive",
	};
	return colorMap[priority] || colorMap.NORMAL;
};

const getPriorityLabel = (priority: string) => {
	const labelMap: Record<string, string> = {
		LOW: "低",
		NORMAL: "普通",
		HIGH: "高",
		URGENT: "紧急",
	};
	return labelMap[priority] || priority;
};

const getNotificationIcon = (type: string) => {
	const iconMap: Record<
		string,
		React.ComponentType<{ className?: string }>
	> = {
		PROJECT_COMMENT: MessageCircleIcon,
		PROJECT_LIKE: HeartIcon,
		ORGANIZATION_MEMBER_APPLICATION: UsersIcon,
		ORGANIZATION_APPLICATION_RESULT: CheckIcon,
		EVENT_REGISTRATION_RESULT: TicketIcon,
		EVENT_TIME_CHANGE: Clock3Icon,
		EVENT_REMINDER: BellIcon,
		ACCOUNT_SECURITY: ShieldIcon,
		SYSTEM_ANNOUNCEMENT: MegaphoneIcon,
		USER_BOOKMARKED: StarIcon,
		USER_FOLLOWED: UserPlusIcon,
		USER_LIKED: HeartIcon,
		PRIVATE_MESSAGE: MailIcon,
	};

	const Icon = iconMap[type] || BellIcon;
	return <Icon className="h-4 w-4" />;
};

export function NotificationsMessageCenter({
	userId,
	notifications,
	unreadCount,
}: NotificationsMessageCenterProps) {
	const groupedNotifications = useMemo(
		() =>
			notifications.reduce<Record<NotificationTab, NotificationItem[]>>(
				(acc, notification) => {
					const tab = getTabByType(notification.type);
					acc[tab].push(notification);
					return acc;
				},
				{ notice: [], interaction: [], system: [] },
			),
		[notifications],
	);

	const unreadByTab = useMemo(
		() => ({
			notice: groupedNotifications.notice.filter((n) => !n.read).length,
			interaction: groupedNotifications.interaction.filter((n) => !n.read)
				.length,
			system: groupedNotifications.system.filter((n) => !n.read).length,
		}),
		[groupedNotifications],
	);

	return (
		<Tabs defaultValue="notice" className="w-full">
			<div className="flex items-center justify-between gap-3 mb-4">
				<div className="flex gap-1 overflow-x-auto no-scrollbar text-sm bg-gray-100/50 dark:bg-[#1F1F1F] p-1 rounded-lg">
					<TabsList className="bg-transparent p-0 h-auto gap-1">
						<TabsTrigger
							value="notice"
							className="px-4 py-2 md:px-3 md:py-1 rounded-md font-bold text-sm md:text-xs data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-gray-200 data-[state=inactive]:text-gray-500 dark:data-[state=active]:bg-[#141414] dark:data-[state=active]:text-white dark:data-[state=active]:border-[#262626] touch-manipulation"
						>
							通知
							{unreadByTab.notice > 0 ? (
								<span className="ml-1 text-[10px] text-gray-400">
									{unreadByTab.notice}
								</span>
							) : null}
						</TabsTrigger>
						<TabsTrigger
							value="interaction"
							className="px-4 py-2 md:px-3 md:py-1 rounded-md font-bold text-sm md:text-xs data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-gray-200 data-[state=inactive]:text-gray-500 dark:data-[state=active]:bg-[#141414] dark:data-[state=active]:text-white dark:data-[state=active]:border-[#262626] touch-manipulation"
						>
							互动
							{unreadByTab.interaction > 0 ? (
								<span className="ml-1 text-[10px] text-gray-400">
									{unreadByTab.interaction}
								</span>
							) : null}
						</TabsTrigger>
						<TabsTrigger
							value="system"
							className="px-4 py-2 md:px-3 md:py-1 rounded-md font-bold text-sm md:text-xs data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-gray-200 data-[state=inactive]:text-gray-500 dark:data-[state=active]:bg-[#141414] dark:data-[state=active]:text-white dark:data-[state=active]:border-[#262626] touch-manipulation"
						>
							系统
							{unreadByTab.system > 0 ? (
								<span className="ml-1 text-[10px] text-gray-400">
									{unreadByTab.system}
								</span>
							) : null}
						</TabsTrigger>
					</TabsList>
				</div>

				<div className="flex items-center gap-1.5">
					<Button
						variant="outline"
						size="sm"
						className="h-7 w-7 rounded-full p-0"
						asChild
						title="通知设置"
					>
						<Link href="/settings/notifications">
							<SlidersHorizontalIcon className="h-3.5 w-3.5" />
						</Link>
					</Button>
					{unreadCount > 0 ? (
						<NotificationActions
							action="markAllRead"
							userId={userId}
						>
							<Button
								size="sm"
								variant="pill"
								className="h-7 px-2.5 text-xs"
							>
								<CheckIcon className="mr-1 h-3 w-3" />
								全部已读
							</Button>
						</NotificationActions>
					) : null}
				</div>
			</div>

			<TabsContent value="notice" className="mt-0">
				<NotificationList
					notifications={groupedNotifications.notice}
					emptyTitle="暂无通知"
					emptyDescription="活动提醒、组织动态等消息会显示在这里。"
				/>
			</TabsContent>
			<TabsContent value="interaction" className="mt-0">
				<NotificationList
					notifications={groupedNotifications.interaction}
					emptyTitle="暂无互动"
					emptyDescription="点赞、评论、关注等互动消息会显示在这里。"
				/>
			</TabsContent>
			<TabsContent value="system" className="mt-0">
				<NotificationList
					notifications={groupedNotifications.system}
					emptyTitle="暂无系统消息"
					emptyDescription="系统公告与审核结果会显示在这里。"
				/>
			</TabsContent>
		</Tabs>
	);
}

function NotificationList({
	notifications,
	emptyTitle,
	emptyDescription,
}: {
	notifications: NotificationItem[];
	emptyTitle: string;
	emptyDescription: string;
}) {
	const [selectedNotification, setSelectedNotification] =
		useState<NotificationItem | null>(null);
	const [isHistoryExpanded, setIsHistoryExpanded] = useState(false);
	const router = useRouter();
	const unreadNotifications = notifications.filter(
		(notification) => !notification.read,
	);
	const readNotifications = notifications.filter(
		(notification) => notification.read,
	);

	const handleNotificationSelect = async (notification: NotificationItem) => {
		if (!notification.actionUrl) {
			setSelectedNotification(notification);
			return;
		}

		if (!notification.read) {
			try {
				await fetch(`/api/notifications/${notification.id}/read`, {
					method: "POST",
				});
			} catch (error) {
				console.error("Failed to mark notification as read:", error);
			}
		}

		const isExternalUrl = /^https?:\/\//.test(notification.actionUrl);
		if (isExternalUrl) {
			window.open(
				notification.actionUrl,
				"_blank",
				"noopener,noreferrer",
			);
			return;
		}

		router.push(notification.actionUrl);
	};

	if (notifications.length === 0) {
		return (
			<EmptyState
				icon={<BellIcon className="h-8 w-8" />}
				title={emptyTitle}
				description={emptyDescription}
			/>
		);
	}

	return (
		<>
			<div className="rounded-lg border border-border bg-card overflow-hidden divide-y divide-gray-100 dark:divide-[#262626]">
				{unreadNotifications.length > 0 ? (
					unreadNotifications.map((notification) => (
						<NotificationRow
							key={notification.id}
							notification={notification}
							onSelect={handleNotificationSelect}
						/>
					))
				) : (
					<div className="px-4 py-6 text-center">
						<p className="text-sm font-bold text-foreground">
							暂无未读消息
						</p>
						<p className="mt-1 text-xs text-muted-foreground">
							已读消息默认收起，可展开查看历史记录。
						</p>
					</div>
				)}
			</div>
			{readNotifications.length > 0 ? (
				<div className="mt-2">
					<button
						type="button"
						onClick={() => setIsHistoryExpanded((prev) => !prev)}
						className="w-full flex items-center justify-between px-3 py-2 rounded-lg border border-border bg-gray-50/70 dark:bg-secondary hover:bg-gray-100 dark:hover:bg-[#212121] transition-colors"
					>
						<span className="text-xs font-medium text-gray-600 dark:text-[#CFCFCF]">
							{isHistoryExpanded
								? "收起历史消息"
								: `查看历史消息（${readNotifications.length}）`}
						</span>
						{isHistoryExpanded ? (
							<ChevronUpIcon className="h-3.5 w-3.5 text-gray-400 dark:text-muted-foreground" />
						) : (
							<ChevronDownIcon className="h-3.5 w-3.5 text-gray-400 dark:text-muted-foreground" />
						)}
					</button>
					{isHistoryExpanded ? (
						<div className="mt-2 rounded-lg border border-border bg-card overflow-hidden divide-y divide-gray-100 dark:divide-[#262626]">
							{readNotifications.map((notification) => (
								<NotificationRow
									key={notification.id}
									notification={notification}
									onSelect={handleNotificationSelect}
								/>
							))}
						</div>
					) : null}
				</div>
			) : null}

			<Dialog
				open={!!selectedNotification}
				onOpenChange={(open) => !open && setSelectedNotification(null)}
			>
				<DialogContent className="max-w-lg">
					{selectedNotification ? (
						<>
							<DialogHeader>
								<div className="flex items-start gap-3 mb-2">
									<div
										className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md ${
											selectedNotification.read
												? "bg-gray-100 text-gray-400 dark:bg-[#1F1F1F] dark:text-muted-foreground"
												: "bg-black text-white dark:bg-white dark:text-black"
										}`}
									>
										{getNotificationIcon(
											selectedNotification.type,
										)}
									</div>
									<div className="flex-1 min-w-0">
										<DialogTitle className="text-base mb-1">
											{selectedNotification.title}
										</DialogTitle>
										<div className="flex items-center gap-2 flex-wrap">
											<span className="text-xs text-muted-foreground">
												{formatDistanceToNow(
													new Date(
														selectedNotification.createdAt,
													),
													{
														addSuffix: true,
														locale: zhCN,
													},
												)}
											</span>
											{selectedNotification.priority !==
											"NORMAL" ? (
												<span
													className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${getPriorityTone(selectedNotification.priority)}`}
												>
													{getPriorityLabel(
														selectedNotification.priority,
													)}
												</span>
											) : null}
										</div>
									</div>
								</div>
							</DialogHeader>

							<DialogDescription className="text-sm text-foreground whitespace-pre-wrap">
								{selectedNotification.content}
								{selectedNotification.relatedUser ? (
									<div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
										<span className="text-xs text-muted-foreground">
											来自：
										</span>
										<span className="ml-1 font-medium text-gray-700 dark:text-gray-300">
											{
												selectedNotification.relatedUser
													.name
											}
										</span>
									</div>
								) : null}
							</DialogDescription>

							<DialogFooter>
								{/* {selectedNotification.actionUrl ? (
									<Button asChild className="w-full sm:w-auto">
										<Link
											href={selectedNotification.actionUrl}
											target="_blank"
											rel="noopener noreferrer"
										>
											<ExternalLinkIcon className="mr-2 h-4 w-4" />
											查看详情
										</Link>
									</Button>
								) : null} */}
								<Button
									variant="outline"
									onClick={() =>
										setSelectedNotification(null)
									}
									className="w-full sm:w-auto"
								>
									关闭
								</Button>
							</DialogFooter>
						</>
					) : null}
				</DialogContent>
			</Dialog>
		</>
	);
}

function NotificationRow({
	notification,
	onSelect,
}: {
	notification: NotificationItem;
	onSelect: (notification: NotificationItem) => void | Promise<void>;
}) {
	return (
		<div
			className={`flex items-start gap-3 px-3 py-3 transition-colors hover:bg-muted group cursor-pointer ${
				!notification.read ? "bg-gray-50/60 dark:bg-secondary/60" : ""
			}`}
			onClick={() => onSelect(notification)}
		>
			<div
				className={`mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md ${
					notification.read
						? "bg-gray-100 text-gray-400 dark:bg-[#1F1F1F] dark:text-muted-foreground"
						: "bg-black text-white dark:bg-white dark:text-black"
				}`}
			>
				{getNotificationIcon(notification.type)}
			</div>

			<div className="min-w-0 flex-1">
				<div className="flex items-start gap-1.5 mb-1">
					<div className="flex items-center gap-1.5 flex-1 min-w-0">
						{!notification.read ? (
							<div className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-500 mt-1.5" />
						) : null}
						<h3 className="line-clamp-1 text-sm font-bold leading-tight text-foreground">
							{notification.title}
						</h3>
						{notification.priority !== "NORMAL" ? (
							<span
								className={`flex-shrink-0 px-1.5 py-0.5 rounded-md text-[10px] font-bold border ${getPriorityTone(notification.priority)}`}
							>
								{getPriorityLabel(notification.priority)}
							</span>
						) : null}
					</div>
					<div
						className="flex items-center gap-1 flex-shrink-0"
						onClick={(e) => e.stopPropagation()}
					>
						{!notification.read ? (
							<NotificationActions
								action="markRead"
								notificationId={notification.id}
							>
								<Button
									variant="ghost"
									size="sm"
									className="h-6 w-6 p-0 hover:bg-gray-200 dark:hover:bg-gray-700"
									title="标记为已读"
								>
									<CheckIcon className="h-3.5 w-3.5" />
								</Button>
							</NotificationActions>
						) : null}
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button
									variant="ghost"
									size="sm"
									className="h-6 w-6 p-0 hover:bg-gray-200 dark:hover:bg-gray-700"
									title="更多操作"
								>
									<MoreVerticalIcon className="h-3.5 w-3.5" />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent
								align="end"
								className="rounded-lg"
							>
								<NotificationActions
									action="delete"
									notificationId={notification.id}
								>
									<DropdownMenuItem className="text-xs text-destructive cursor-pointer">
										<TrashIcon className="mr-2 h-3.5 w-3.5" />
										删除
									</DropdownMenuItem>
								</NotificationActions>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
				</div>

				<p className="line-clamp-2 text-xs text-muted-foreground mb-1">
					{notification.content}
					{notification.relatedUser ? (
						<span className="ml-1.5 font-medium text-gray-600 dark:text-gray-300">
							— {notification.relatedUser.name}
						</span>
					) : null}
				</p>

				<span className="text-[11px] font-mono text-gray-400 dark:text-muted-foreground">
					{formatDistanceToNow(new Date(notification.createdAt), {
						addSuffix: true,
						locale: zhCN,
					})}
				</span>
			</div>
		</div>
	);
}
