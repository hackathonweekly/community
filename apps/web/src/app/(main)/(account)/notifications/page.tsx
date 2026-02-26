import { db } from "@community/lib-server/database";
import { getSession } from "@shared/auth/lib/server";
import { redirect } from "next/navigation";
import { NotificationsMessageCenter } from "./NotificationsMessageCenter";

export async function generateMetadata() {
	return {
		title: "消息中心",
		description: "查看和管理你的社区消息",
	};
}

export default async function NotificationsPage() {
	const session = await getSession();

	if (!session) {
		return redirect("/auth/login");
	}

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

	const unreadCount = notifications.filter(
		(notification) => !notification.read,
	).length;

	return (
		<div className="pb-20 md:pb-8">
			{/* <MobilePageHeader title="消息中心" /> */}
			<div className="max-w-3xl mx-auto px-4 py-5 lg:px-8 lg:py-6">
				<div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-5 gap-2">
					<div>
						<h1 className="font-brand text-2xl lg:text-3xl font-bold tracking-tight leading-none text-foreground">
							消息中心
						</h1>
						<p className="mt-1 text-xs text-muted-foreground font-mono">
							{unreadCount > 0
								? `${unreadCount} 未读`
								: "全部已读"}
						</p>
					</div>
				</div>

				<NotificationsMessageCenter
					userId={session.user.id}
					unreadCount={unreadCount}
					notifications={notifications.map((notification) => ({
						id: notification.id,
						type: notification.type,
						title: notification.title,
						content: notification.content,
						read: notification.read,
						readAt: notification.readAt?.toISOString() ?? null,
						actionUrl: notification.actionUrl,
						priority: notification.priority,
						createdAt: notification.createdAt.toISOString(),
						relatedUser: notification.relatedUser
							? {
									id: notification.relatedUser.id,
									name: notification.relatedUser.name,
									image: notification.relatedUser.image,
									username: notification.relatedUser.username,
								}
							: null,
					}))}
				/>
			</div>
		</div>
	);
}
