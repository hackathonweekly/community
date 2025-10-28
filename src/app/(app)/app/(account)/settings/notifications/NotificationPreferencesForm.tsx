"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { BellIcon, MailIcon } from "lucide-react";
import { useTranslations } from "next-intl";

interface NotificationPreference {
	id: string;
	userId: string;
	projectCommentEmail: boolean;
	projectCommentPush: boolean;
	projectLikeEmail: boolean;
	projectLikePush: boolean;
	organizationEmail: boolean;
	organizationPush: boolean;
	eventEmail: boolean;
	eventPush: boolean;
	eventReminderEmail: boolean;
	systemEmail: boolean;
	systemPush: boolean;
	socialEmail: boolean;
	socialPush: boolean;
}

interface NotificationPreferencesFormProps {
	preferences: NotificationPreference;
	category: "project" | "organization" | "event" | "system" | "social";
}

export function NotificationPreferencesForm({
	preferences,
	category,
}: NotificationPreferencesFormProps) {
	const t = useTranslations("app.notifications.settings.form");
	const [localPreferences, setLocalPreferences] = useState(preferences);
	const [isSaving, setIsSaving] = useState(false);

	const updatePreference = (
		field: keyof NotificationPreference,
		value: boolean,
	) => {
		setLocalPreferences((prev) => ({
			...prev,
			[field]: value,
		}));
	};

	const savePreferences = async () => {
		setIsSaving(true);

		try {
			const response = await fetch("/api/notifications/preferences", {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(localPreferences),
			});

			if (response.ok) {
				toast.success(t("saved"));
			} else {
				throw new Error("保存失败");
			}
		} catch (error) {
			console.error("Error saving preferences:", error);
			toast.error(t("saveFailed"));
		} finally {
			setIsSaving(false);
		}
	};

	const renderPreferenceGroup = (
		title: string,
		description: string,
		pushField: keyof NotificationPreference,
		emailField?: keyof NotificationPreference,
	) => (
		<div className="space-y-3 p-4 border rounded-lg">
			<div>
				<h4 className="font-medium">{title}</h4>
				<p className="text-sm text-muted-foreground">{description}</p>
			</div>

			<div className="space-y-3">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						<BellIcon className="h-4 w-4 text-muted-foreground" />
						<Label className="text-sm">
							{t("inAppNotifications")}
						</Label>
					</div>
					<Switch
						checked={localPreferences[pushField] as boolean}
						onCheckedChange={(checked) =>
							updatePreference(pushField, checked)
						}
					/>
				</div>

				{emailField && (
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-2">
							<MailIcon className="h-4 w-4 text-muted-foreground" />
							<Label className="text-sm">
								{t("emailNotifications")}
							</Label>
						</div>
						<Switch
							checked={localPreferences[emailField] as boolean}
							onCheckedChange={(checked) =>
								updatePreference(emailField, checked)
							}
						/>
					</div>
				)}
			</div>
		</div>
	);

	let content: JSX.Element | null;

	switch (category) {
		case "project":
			content = (
				<div className="space-y-4">
					{renderPreferenceGroup(
						t("items.projectComment.title"),
						t("items.projectComment.description"),
						"projectCommentPush",
						"projectCommentEmail",
					)}
					{renderPreferenceGroup(
						t("items.projectLike.title"),
						t("items.projectLike.description"),
						"projectLikePush",
						"projectLikeEmail",
					)}
				</div>
			);
			break;

		case "organization":
			content = (
				<div className="space-y-4">
					{renderPreferenceGroup(
						t("items.organizationActivity.title"),
						t("items.organizationActivity.description"),
						"organizationPush",
						"organizationEmail",
					)}
				</div>
			);
			break;

		case "event":
			content = (
				<div className="space-y-4">
					{renderPreferenceGroup(
						t("items.eventNotification.title"),
						t("items.eventNotification.description"),
						"eventPush",
						"eventEmail",
					)}
					<div className="space-y-3 p-4 border rounded-lg">
						<div>
							<h4 className="font-medium">
								{t("items.eventReminder.title")}
							</h4>
							<p className="text-sm text-muted-foreground">
								{t("items.eventReminder.description")}
							</p>
						</div>

						<div className="space-y-3">
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-2">
									<MailIcon className="h-4 w-4 text-muted-foreground" />
									<Label className="text-sm">
										{t("emailNotifications")}
									</Label>
								</div>
								<Switch
									checked={
										localPreferences.eventReminderEmail
									}
									onCheckedChange={(checked) =>
										updatePreference(
											"eventReminderEmail",
											checked,
										)
									}
								/>
							</div>
						</div>
					</div>
				</div>
			);
			break;

		case "system":
			content = (
				<div className="space-y-4">
					{renderPreferenceGroup(
						t("items.systemNotification.title"),
						t("items.systemNotification.description"),
						"systemPush",
						"systemEmail",
					)}
				</div>
			);
			break;

		case "social":
			content = (
				<div className="space-y-4">
					{renderPreferenceGroup(
						t("items.socialInteraction.title"),
						t("items.socialInteraction.description"),
						"socialPush",
						"socialEmail",
					)}
				</div>
			);
			break;

		default:
			content = null;
	}

	return (
		<div className="space-y-4">
			{content}

			<div className="pt-4 border-t">
				<Button onClick={savePreferences} disabled={isSaving}>
					{isSaving ? t("saving") : t("saveSettings")}
				</Button>
			</div>
		</div>
	);
}
