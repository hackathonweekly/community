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
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
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
		<Card>
			<CardHeader>
				<div className="flex items-center justify-between">
					<div>
						<CardTitle>
							{t("profile.tabs.socialAccounts")}
						</CardTitle>
						<CardDescription>
							{t("profile.socialAccounts.description")}
						</CardDescription>
					</div>
					{!isEditing && (
						<Button
							variant="outline"
							size="sm"
							onClick={() => setIsEditing(true)}
						>
							<PencilIcon className="h-4 w-4 mr-2" />
							编辑
						</Button>
					)}
				</div>
			</CardHeader>
			<CardContent className="space-y-4">
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
										<div className="flex items-center gap-3">
											<Github className="h-4 w-4 text-muted-foreground" />
											<div>
												<div className="text-sm font-medium text-muted-foreground">
													{t(
														"profile.social.githubUsername",
													)}
												</div>
												<div className="text-base">
													{extractedValue ? (
														<span className="text-blue-600">
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
										<div className="flex items-center gap-3">
											<Twitter className="h-4 w-4 text-muted-foreground" />
											<div>
												<div className="text-sm font-medium text-muted-foreground">
													{t(
														"profile.social.twitterUsername",
													)}
												</div>
												<div className="text-base">
													{extractedValue ? (
														<span className="text-blue-600">
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
									<div className="flex items-center gap-3">
										<Globe className="h-4 w-4 text-muted-foreground" />
										<div>
											<div className="text-sm font-medium text-muted-foreground">
												{t("profile.social.website")}
											</div>
											<div className="text-base">
												{field.value ? (
													<span className="text-blue-600">
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
									<div className="flex items-center gap-3">
										<MessageCircle className="h-4 w-4 text-muted-foreground" />
										<div>
											<div className="text-sm font-medium text-muted-foreground">
												{t("profile.social.wechat")}
											</div>
											<div className="text-base">
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
											<FormLabel>
												{t(
													"profile.social.githubUsername",
												)}
											</FormLabel>
											<FormControl>
												<div className="relative">
													<span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm pointer-events-none">
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
														className="pl-24"
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
											<FormLabel>
												{t(
													"profile.social.twitterUsername",
												)}
											</FormLabel>
											<FormControl>
												<div className="relative">
													<span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm pointer-events-none">
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
														className="pl-16"
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
									<FormLabel>
										{t("profile.social.website")}
									</FormLabel>
									<FormControl>
										<Input
											{...field}
											placeholder="https://yourwebsite.com"
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
									<FormLabel>
										{t("profile.social.wechat")}
									</FormLabel>
									<FormControl>
										<Input
											{...field}
											placeholder={t(
												"profile.social.wechatPlaceholder",
											)}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						{/* 操作按钮 */}
						<div className="flex justify-end gap-3 pt-4 border-t">
							<Button
								type="button"
								variant="outline"
								onClick={handleCancel}
								disabled={isLoading}
							>
								取消
							</Button>
							<Button
								type="button"
								onClick={handleSave}
								disabled={isLoading}
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
