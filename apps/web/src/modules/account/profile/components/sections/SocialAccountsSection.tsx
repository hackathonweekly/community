"use client";

import { Button } from "@community/ui/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@community/ui/ui/card";
import {
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@community/ui/ui/form";
import { Input } from "@community/ui/ui/input";
import {
	PencilIcon,
	Globe,
	Github,
	Twitter,
	MessageCircle,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type { Control } from "react-hook-form";

interface SocialAccountsSectionProps {
	control: Control<any>;
	onSave?: () => Promise<boolean>;
	isLoading?: boolean;
}

export function SocialAccountsSection({
	control,
	onSave,
	isLoading,
}: SocialAccountsSectionProps) {
	const t = useTranslations();
	const [isEditing, setIsEditing] = useState(false);

	const handleSave = async () => {
		if (onSave) {
			const success = await onSave();
			if (success) {
				setIsEditing(false);
			}
		}
	};

	const handleCancel = () => {
		setIsEditing(false);
	};

	return (
		<Card className="border-border bg-card shadow-sm dark:border-border dark:bg-card">
			<CardHeader className="border-b border-border pb-3 dark:border-border">
				<div className="flex items-center justify-between">
					<div>
						<CardTitle className="text-base font-bold">
							{t("profile.tabs.socialAccounts")}
						</CardTitle>
						<CardDescription className="mt-1 text-sm text-muted-foreground dark:text-muted-foreground">
							{t("profile.socialAccounts.description")}
						</CardDescription>
					</div>
					{!isEditing && (
						<Button
							variant="outline"
							size="sm"
							onClick={() => setIsEditing(true)}
							className="h-8 rounded-full border-border bg-card px-3 text-xs font-bold text-foreground hover:bg-muted dark:border-border dark:bg-card dark:text-white dark:hover:bg-[#1A1A1A]"
						>
							<PencilIcon className="mr-1 h-3 w-3" />
							编辑
						</Button>
					)}
				</div>
			</CardHeader>
			<CardContent className="space-y-4 pt-4">
				{!isEditing ? (
					// 查看模式
					<div className="space-y-4">
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<FormField
								control={control}
								name="githubUrl"
								render={({ field }) => {
									const extractedValue = field.value
										? field.value.includes("github.com")
											? field.value.replace(
													/https?:\/\/(www\.)?github\.com\//,
													"",
												)
											: field.value
										: "";
									return (
										<div className="flex items-start gap-3 rounded-md border border-border bg-muted p-3 dark:border-border dark:bg-secondary">
											<Github className="mt-0.5 h-4 w-4 text-muted-foreground dark:text-muted-foreground" />
											<div>
												<div className="text-[11px] font-mono uppercase tracking-wide text-muted-foreground dark:text-muted-foreground">
													{t(
														"profile.social.githubUsername",
													)}
												</div>
												<div className="text-sm font-medium text-foreground">
													{extractedValue ? (
														<span className="text-foreground">
															github.com/
															{extractedValue}
														</span>
													) : (
														"未填写"
													)}
												</div>
											</div>
										</div>
									);
								}}
							/>

							<FormField
								control={control}
								name="twitterUrl"
								render={({ field }) => {
									const extractedValue = field.value
										? field.value.includes("twitter.com") ||
											field.value.includes("x.com")
											? field.value.replace(
													/https?:\/\/(www\.)?(twitter\.com|x\.com)\//,
													"",
												)
											: field.value
										: "";
									return (
										<div className="flex items-start gap-3 rounded-md border border-border bg-muted p-3 dark:border-border dark:bg-secondary">
											<Twitter className="mt-0.5 h-4 w-4 text-muted-foreground dark:text-muted-foreground" />
											<div>
												<div className="text-[11px] font-mono uppercase tracking-wide text-muted-foreground dark:text-muted-foreground">
													{t(
														"profile.social.twitterUsername",
													)}
												</div>
												<div className="text-sm font-medium text-foreground">
													{extractedValue ? (
														<span className="text-foreground">
															x.com/
															{extractedValue}
														</span>
													) : (
														"未填写"
													)}
												</div>
											</div>
										</div>
									);
								}}
							/>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<FormField
								control={control}
								name="websiteUrl"
								render={({ field }) => (
									<div className="flex items-start gap-3 rounded-md border border-border bg-muted p-3 dark:border-border dark:bg-secondary">
										<Globe className="mt-0.5 h-4 w-4 text-muted-foreground dark:text-muted-foreground" />
										<div>
											<div className="text-[11px] font-mono uppercase tracking-wide text-muted-foreground dark:text-muted-foreground">
												{t("profile.social.website")}
											</div>
											<div className="text-sm font-medium text-foreground">
												{field.value ? (
													<span className="text-foreground">
														{field.value}
													</span>
												) : (
													"未填写"
												)}
											</div>
										</div>
									</div>
								)}
							/>

							<FormField
								control={control}
								name="wechatId"
								render={({ field }) => (
									<div className="flex items-start gap-3 rounded-md border border-border bg-muted p-3 dark:border-border dark:bg-secondary">
										<MessageCircle className="mt-0.5 h-4 w-4 text-muted-foreground dark:text-muted-foreground" />
										<div>
											<div className="text-[11px] font-mono uppercase tracking-wide text-muted-foreground dark:text-muted-foreground">
												{t("profile.social.wechat")}
											</div>
											<div className="text-sm font-medium text-foreground">
												{field.value || "未填写"}
											</div>
										</div>
									</div>
								)}
							/>
						</div>
					</div>
				) : (
					// 编辑模式
					<div className="space-y-4">
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<FormField
								control={control}
								name="githubUrl"
								render={({ field }) => {
									// Extract username from URL or use as-is if it's already a username
									const extractedValue = field.value
										? field.value.includes("github.com")
											? field.value.replace(
													/https?:\/\/(www\.)?github\.com\//,
													"",
												)
											: field.value
										: "";

									return (
										<FormItem>
											<FormLabel className="text-[11px] font-mono uppercase tracking-wide text-muted-foreground dark:text-muted-foreground">
												{t(
													"profile.social.githubUsername",
												)}
											</FormLabel>
											<FormControl>
												<div className="relative">
													<span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground dark:text-muted-foreground">
														github.com/
													</span>
													<Input
														value={extractedValue}
														onChange={(e) => {
															const username =
																e.target.value;
															// Store as full URL
															field.onChange(
																username
																	? `https://github.com/${username}`
																	: "",
															);
														}}
														placeholder="username"
														className="h-9 rounded-md border-border bg-card pl-24 text-sm text-black dark:border-border dark:bg-card dark:text-white"
													/>
												</div>
											</FormControl>
											<FormMessage />
										</FormItem>
									);
								}}
							/>

							<FormField
								control={control}
								name="twitterUrl"
								render={({ field }) => {
									// Extract username from URL or use as-is if it's already a username
									const extractedValue = field.value
										? field.value.includes("twitter.com") ||
											field.value.includes("x.com")
											? field.value.replace(
													/https?:\/\/(www\.)?(twitter\.com|x\.com)\//,
													"",
												)
											: field.value
										: "";

									return (
										<FormItem>
											<FormLabel className="text-[11px] font-mono uppercase tracking-wide text-muted-foreground dark:text-muted-foreground">
												{t(
													"profile.social.twitterUsername",
												)}
											</FormLabel>
											<FormControl>
												<div className="relative">
													<span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground dark:text-muted-foreground">
														x.com/
													</span>
													<Input
														value={extractedValue}
														onChange={(e) => {
															const username =
																e.target.value;
															// Store as full URL
															field.onChange(
																username
																	? `https://x.com/${username}`
																	: "",
															);
														}}
														placeholder="username"
														className="h-9 rounded-md border-border bg-card pl-16 text-sm text-black dark:border-border dark:bg-card dark:text-white"
													/>
												</div>
											</FormControl>
											<FormMessage />
										</FormItem>
									);
								}}
							/>
						</div>

						<FormField
							control={control}
							name="websiteUrl"
							render={({ field }) => (
								<FormItem>
									<FormLabel className="text-[11px] font-mono uppercase tracking-wide text-muted-foreground dark:text-muted-foreground">
										{t("profile.social.website")}
									</FormLabel>
									<FormControl>
										<Input
											{...field}
											placeholder="https://yourwebsite.com"
											className="h-9 rounded-md border-border bg-card text-sm text-black dark:border-border dark:bg-card dark:text-white"
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={control}
							name="wechatId"
							render={({ field }) => (
								<FormItem>
									<FormLabel className="text-[11px] font-mono uppercase tracking-wide text-muted-foreground dark:text-muted-foreground">
										{t("profile.social.wechat")}
									</FormLabel>
									<FormControl>
										<Input
											{...field}
											placeholder={t(
												"profile.social.wechatPlaceholder",
											)}
											className="h-9 rounded-md border-border bg-card text-sm text-black dark:border-border dark:bg-card dark:text-white"
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						{/* 操作按钮 */}
						<div className="flex justify-end gap-3 border-t border-border pt-4 dark:border-border">
							<Button
								type="button"
								variant="outline"
								onClick={handleCancel}
								disabled={isLoading}
								className="h-8 rounded-full border-border bg-card px-4 text-xs font-bold text-foreground hover:bg-muted dark:border-border dark:bg-card dark:text-white dark:hover:bg-[#1A1A1A]"
							>
								取消
							</Button>
							<Button
								type="button"
								onClick={handleSave}
								disabled={isLoading}
								className="h-8 rounded-full bg-black px-4 text-xs font-bold text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-muted"
							>
								{isLoading
									? t("profile.social.saving")
									: t("profile.social.saveSocialAccounts")}
							</Button>
						</div>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
