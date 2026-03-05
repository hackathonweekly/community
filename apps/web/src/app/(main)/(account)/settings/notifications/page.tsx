import { db } from "@community/lib-server/database";
import { getSession } from "@shared/auth/lib/server";
import { SettingsList } from "@shared/components/SettingsList";
import { SettingsItem } from "@shared/components/SettingsItem";
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
			<SettingsItem
				title={t("app.notifications.settings.title")}
				description={t("app.notifications.settings.subtitle")}
				layout="stacked"
			>
				<div className="space-y-6">
					<div>
						<h4 className="font-brand text-sm font-bold mb-2 text-foreground">
							{t(
								"app.notifications.settings.categories.project.title",
							)}
						</h4>
						<p className="text-xs text-muted-foreground mb-3">
							{t(
								"app.notifications.settings.categories.project.description",
							)}
						</p>
						<NotificationPreferencesForm
							preferences={preferences}
							category="project"
						/>
					</div>

					<div>
						<h4 className="font-brand text-sm font-bold mb-2 text-foreground">
							{t(
								"app.notifications.settings.categories.organization.title",
							)}
						</h4>
						<p className="text-xs text-muted-foreground mb-3">
							{t(
								"app.notifications.settings.categories.organization.description",
							)}
						</p>
						<NotificationPreferencesForm
							preferences={preferences}
							category="organization"
						/>
					</div>

					<div>
						<h4 className="font-brand text-sm font-bold mb-2 text-foreground">
							{t(
								"app.notifications.settings.categories.event.title",
							)}
						</h4>
						<p className="text-xs text-muted-foreground mb-3">
							{t(
								"app.notifications.settings.categories.event.description",
							)}
						</p>
						<NotificationPreferencesForm
							preferences={preferences}
							category="event"
						/>
					</div>

					<div>
						<h4 className="font-brand text-sm font-bold mb-2 text-foreground">
							{t(
								"app.notifications.settings.categories.system.title",
							)}
						</h4>
						<p className="text-xs text-muted-foreground mb-3">
							{t(
								"app.notifications.settings.categories.system.description",
							)}
						</p>
						<NotificationPreferencesForm
							preferences={preferences}
							category="system"
						/>
					</div>

					<div>
						<h4 className="font-brand text-sm font-bold mb-2 text-foreground">
							{t(
								"app.notifications.settings.categories.social.title",
							)}
						</h4>
						<p className="text-xs text-muted-foreground mb-3">
							{t(
								"app.notifications.settings.categories.social.description",
							)}
						</p>
						<NotificationPreferencesForm
							preferences={preferences}
							category="social"
						/>
					</div>
				</div>
			</SettingsItem>
		</SettingsList>
	);
}
