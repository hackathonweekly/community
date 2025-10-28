import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { db } from "@/lib/database";
import { getSession } from "@dashboard/auth/lib/server";
import { formatDistanceToNow } from "date-fns";
import { BellIcon, CheckIcon, MoreVerticalIcon, TrashIcon } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { NotificationActions } from "./NotificationActions";

export async function generateMetadata() {
	return {
		title: "通知中心",
		description: "查看和管理你的通知",
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

export default async function NotificationsPage() {
	const session = await getSession();

	if (!session) {
		return redirect("/auth/login");
	}

	// 获取用户的通知
	const notifications = await db.notification.findMany({
		where: {
			userId: session.user.id,
		},
		include: {
			relatedUser: {
				select: {
					id: true,
					name: true,
					image: true,
					username: true,
				},
			},
		},
		orderBy: {
			createdAt: "desc",
		},
		take: 50,
	});

	const unreadCount = await db.notification.count({
		where: {
			userId: session.user.id,
			read: false,
		},
	});

	return (
		<div className="container max-w-4xl py-8">
			<div className="flex items-center justify-between mb-6">
				<div>
					<h1 className="text-2xl font-bold">通知中心</h1>
					<p className="text-muted-foreground mt-1">
						{unreadCount > 0
							? `你有 ${unreadCount} 条未读通知`
							: "所有通知都已读完"}
					</p>
				</div>

				<div className="flex items-center gap-2">
					<Button variant="outline" size="sm" asChild>
						<Link href="/app/settings/notifications">通知设置</Link>
					</Button>
					{unreadCount > 0 && (
						<NotificationActions
							action="markAllRead"
							userId={session.user.id}
						>
							<Button size="sm">
								<CheckIcon className="h-4 w-4 mr-2" />
								全部标记已读
							</Button>
						</NotificationActions>
					)}
				</div>
			</div>

			{notifications.length === 0 ? (
				<Card>
					<CardContent className="flex flex-col items-center justify-center py-12">
						<BellIcon className="h-16 w-16 text-muted-foreground/20 mb-4" />
						<h3 className="text-lg font-semibold mb-2">暂无通知</h3>
						<p className="text-muted-foreground text-center">
							当有新的活动、评论或其他重要更新时，
							<br />
							你会在这里收到通知。
						</p>
					</CardContent>
				</Card>
			) : (
				<div className="space-y-4">
					{notifications.map((notification) => (
						<Card
							key={notification.id}
							className={`transition-colors hover:bg-muted/5 ${
								!notification.read
									? "border-l-4 border-l-blue-500 bg-blue-50/30"
									: ""
							}`}
						>
							<CardContent className="p-6">
								<div className="flex items-start gap-4">
									<div className="flex-shrink-0 pt-1">
										<span className="text-2xl">
											{getNotificationIcon(
												notification.type,
											)}
										</span>
									</div>

									<div className="flex-1 min-w-0">
										<div className="flex items-start justify-between gap-4 mb-2">
											<div className="flex-1">
												<div className="flex items-center gap-2 mb-1">
													<h3 className="font-semibold text-lg">
														{notification.title}
													</h3>
													{!notification.read && (
														<div className="w-2 h-2 bg-blue-500 rounded-full" />
													)}
													{notification.priority !==
														"NORMAL" && (
														<Badge
															variant="secondary"
															className={`text-xs ${getPriorityColor(
																notification.priority,
															)}`}
														>
															{
																notification.priority
															}
														</Badge>
													)}
												</div>
												<p className="text-muted-foreground mb-3">
													{notification.content}
												</p>
												<div className="flex items-center gap-4 text-sm text-muted-foreground">
													<span>
														{formatDistanceToNow(
															new Date(
																notification.createdAt,
															),
															{ addSuffix: true },
														)}
													</span>
													{notification.readAt && (
														<span>
															已读于{" "}
															{formatDistanceToNow(
																new Date(
																	notification.readAt,
																),
																{
																	addSuffix: true,
																},
															)}
														</span>
													)}
												</div>
											</div>

											{notification.relatedUser && (
												<div className="flex items-center gap-2">
													<Avatar className="h-10 w-10">
														<AvatarImage
															src={
																notification
																	.relatedUser
																	.image ||
																undefined
															}
															alt={
																notification
																	.relatedUser
																	.name
															}
														/>
														<AvatarFallback>
															{notification.relatedUser.name.charAt(
																0,
															)}
														</AvatarFallback>
													</Avatar>
													<div className="text-sm">
														<div className="font-medium">
															{
																notification
																	.relatedUser
																	.name
															}
														</div>
														{notification
															.relatedUser
															.username && (
															<div className="text-muted-foreground">
																@
																{
																	notification
																		.relatedUser
																		.username
																}
															</div>
														)}
													</div>
												</div>
											)}
										</div>

										<div className="flex items-center gap-2">
											{notification.actionUrl && (
												<Button
													variant="outline"
													size="sm"
													asChild
												>
													<Link
														href={
															notification.actionUrl
														}
													>
														查看详情
													</Link>
												</Button>
											)}

											{!notification.read && (
												<NotificationActions
													action="markRead"
													notificationId={
														notification.id
													}
												>
													<Button
														variant="ghost"
														size="sm"
													>
														<CheckIcon className="h-4 w-4 mr-2" />
														标记已读
													</Button>
												</NotificationActions>
											)}

											<DropdownMenu>
												<DropdownMenuTrigger asChild>
													<Button
														variant="ghost"
														size="sm"
													>
														<MoreVerticalIcon className="h-4 w-4" />
													</Button>
												</DropdownMenuTrigger>
												<DropdownMenuContent align="end">
													{!notification.read && (
														<DropdownMenuItem
															asChild
														>
															<NotificationActions
																action="markRead"
																notificationId={
																	notification.id
																}
															>
																<div className="flex items-center w-full cursor-pointer">
																	<CheckIcon className="h-4 w-4 mr-2" />
																	标记已读
																</div>
															</NotificationActions>
														</DropdownMenuItem>
													)}
													<DropdownMenuItem asChild>
														<NotificationActions
															action="delete"
															notificationId={
																notification.id
															}
														>
															<div className="flex items-center w-full cursor-pointer text-red-600">
																<TrashIcon className="h-4 w-4 mr-2" />
																删除
															</div>
														</NotificationActions>
													</DropdownMenuItem>
												</DropdownMenuContent>
											</DropdownMenu>
										</div>
									</div>
								</div>
							</CardContent>
						</Card>
					))}
				</div>
			)}
		</div>
	);
}
