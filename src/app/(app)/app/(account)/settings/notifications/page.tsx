import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/lib/database";
import { getSession } from "@dashboard/auth/lib/server";
import { SettingsList } from "@dashboard/shared/components/SettingsList";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { NotificationPreferencesForm } from "./NotificationPreferencesForm";

export async function generateMetadata() {
	const t = await getTranslations();
	return {
		title: t("app.notifications.settings.title"),
		description: t("app.notifications.settings.description"),
	};
}

export default async function NotificationSettingsPage() {
	const t = await getTranslations();
	const session = await getSession();

	if (!session) {
		return redirect("/auth/login");
	}

	// 获取用户的通知偏好设置
	let preferences = await db.notificationPreference.findUnique({
		where: {
			userId: session.user.id,
		},
	});

	// 如果用户没有偏好设置，创建默认设置
	if (!preferences) {
		preferences = await db.notificationPreference.create({
			data: {
				userId: session.user.id,
			},
		});
	}

	return (
		<SettingsList>
			<Card>
				<CardHeader>
					<CardTitle>
						{t("app.notifications.settings.title")}
					</CardTitle>
					<p className="text-muted-foreground">
						{t("app.notifications.settings.subtitle")}
					</p>
				</CardHeader>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>
						{t(
							"app.notifications.settings.categories.project.title",
						)}
					</CardTitle>
					<p className="text-sm text-muted-foreground">
						{t(
							"app.notifications.settings.categories.project.description",
						)}
					</p>
				</CardHeader>
				<CardContent>
					<NotificationPreferencesForm
						preferences={preferences}
						category="project"
					/>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>
						{t(
							"app.notifications.settings.categories.organization.title",
						)}
					</CardTitle>
					<p className="text-sm text-muted-foreground">
						{t(
							"app.notifications.settings.categories.organization.description",
						)}
					</p>
				</CardHeader>
				<CardContent>
					<NotificationPreferencesForm
						preferences={preferences}
						category="organization"
					/>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>
						{t("app.notifications.settings.categories.event.title")}
					</CardTitle>
					<p className="text-sm text-muted-foreground">
						{t(
							"app.notifications.settings.categories.event.description",
						)}
					</p>
				</CardHeader>
				<CardContent>
					<NotificationPreferencesForm
						preferences={preferences}
						category="event"
					/>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>
						{t(
							"app.notifications.settings.categories.system.title",
						)}
					</CardTitle>
					<p className="text-sm text-muted-foreground">
						{t(
							"app.notifications.settings.categories.system.description",
						)}
					</p>
				</CardHeader>
				<CardContent>
					<NotificationPreferencesForm
						preferences={preferences}
						category="system"
					/>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>
						{t(
							"app.notifications.settings.categories.social.title",
						)}
					</CardTitle>
					<p className="text-sm text-muted-foreground">
						{t(
							"app.notifications.settings.categories.social.description",
						)}
					</p>
				</CardHeader>
				<CardContent>
					<NotificationPreferencesForm
						preferences={preferences}
						category="social"
					/>
				</CardContent>
			</Card>
		</SettingsList>
	);
}
