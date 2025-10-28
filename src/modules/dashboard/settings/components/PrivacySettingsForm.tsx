"use client";

import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
} from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const privacySettingsSchema = z.object({
	profilePublic: z.boolean(),
	showEmail: z.boolean(),
	showWechat: z.boolean(),
});

type PrivacySettingsFormData = z.infer<typeof privacySettingsSchema>;

interface PrivacySettingsFormProps {
	user: {
		profilePublic: boolean | null;
		showEmail: boolean | null;
		showWechat: boolean | null;
	};
}

export function PrivacySettingsForm({ user }: PrivacySettingsFormProps) {
	const t = useTranslations();
	const { toast } = useToast();
	const [isLoading, setIsLoading] = useState(false);

	const form = useForm<PrivacySettingsFormData>({
		resolver: zodResolver(privacySettingsSchema),
		defaultValues: {
			profilePublic: user.profilePublic ?? true,
			showEmail: user.showEmail ?? true,
			showWechat: user.showWechat ?? false,
		},
	});

	const onSubmit = async (data: PrivacySettingsFormData) => {
		setIsLoading(true);
		try {
			const response = await fetch("/api/user/privacy-settings", {
				method: "PATCH",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(data),
			});

			if (!response.ok) {
				throw new Error("Failed to update privacy settings");
			}

			toast({
				title: t("settings.privacy.saveSuccess"),
				description: t("settings.privacy.saveSuccessDescription"),
			});
		} catch (error) {
			toast({
				title: t("settings.privacy.saveError"),
				description: t("settings.privacy.saveErrorDescription"),
				variant: "destructive",
			});
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle>{t("privacySettings.title")}</CardTitle>
				<CardDescription>
					{t("privacySettings.description")}
				</CardDescription>
			</CardHeader>
			<CardContent>
				<Form {...form}>
					<form
						onSubmit={form.handleSubmit(onSubmit)}
						className="space-y-6"
					>
						<FormField
							control={form.control}
							name="profilePublic"
							render={({ field }) => (
								<FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
									<div className="space-y-0.5">
										<FormLabel className="text-base">
											{t("profile.privacy.publicProfile")}
										</FormLabel>
										<FormDescription>
											{t(
												"profile.privacy.publicProfileDescription",
											)}
										</FormDescription>
									</div>
									<FormControl>
										<Switch
											checked={field.value}
											onCheckedChange={field.onChange}
										/>
									</FormControl>
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="showEmail"
							render={({ field }) => (
								<FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
									<div className="space-y-0.5">
										<FormLabel className="text-base">
											{t("profile.privacy.showEmail")}
											<span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
												默认: 公开
											</span>
										</FormLabel>
										<FormDescription>
											{t(
												"profile.privacy.showEmailDescription",
											)}
										</FormDescription>
									</div>
									<FormControl>
										<Switch
											checked={field.value}
											onCheckedChange={field.onChange}
										/>
									</FormControl>
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="showWechat"
							render={({ field }) => (
								<FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
									<div className="space-y-0.5">
										<FormLabel className="text-base">
											{t("profile.privacy.showWechat")}
											<span className="ml-2 text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">
												默认: 私密
											</span>
										</FormLabel>
										<FormDescription>
											{t(
												"profile.privacy.showWechatDescription",
											)}
										</FormDescription>
									</div>
									<FormControl>
										<Switch
											checked={field.value}
											onCheckedChange={field.onChange}
										/>
									</FormControl>
								</FormItem>
							)}
						/>

						<div className="pt-4 border-t">
							<Button
								type="submit"
								disabled={isLoading}
								className="w-full"
							>
								{isLoading
									? t("settings.privacy.saving")
									: t("settings.privacy.save")}
							</Button>
						</div>
					</form>
				</Form>
			</CardContent>
		</Card>
	);
}
