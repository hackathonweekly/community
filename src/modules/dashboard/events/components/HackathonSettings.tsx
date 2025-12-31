"use client";
import { useTranslations } from "next-intl";
import {
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Code, Users, Trophy } from "lucide-react";
import type { Control, UseFormWatch } from "react-hook-form";
import type { EventFormData } from "./types";

interface HackathonSettingsProps {
	control: Control<EventFormData>;
	watch: UseFormWatch<EventFormData>;
}

export function HackathonSettings({ control, watch }: HackathonSettingsProps) {
	const t = useTranslations("events.hackathon");
	const watchedType = watch("type");
	const publicVotingMode =
		watch("hackathonConfig.voting.publicVotingMode") ?? "FIXED_QUOTA";

	// Only show for hackathon events
	if (watchedType !== "HACKATHON") {
		return null;
	}

	return (
		<div className="space-y-6">
			<div className="flex items-center gap-2">
				<Code className="w-5 h-5" />
				<p className="font-semibold">黑客松设置</p>
				<Badge
					variant="secondary"
					className="bg-purple-100 text-purple-800 text-xs"
				>
					Beta功能
				</Badge>
			</div>
			<p className="text-sm text-muted-foreground">
				配置黑客松活动的特殊设置，包括团队规模、投票规则等
			</p>

			{/* 团队设置 */}
			<div className="space-y-4">
				<div className="flex items-center gap-2">
					<Users className="w-4 h-4 text-muted-foreground" />
					<h3 className="text-sm font-medium">团队设置</h3>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<FormField
						control={control}
						name="hackathonConfig.settings.maxTeamSize"
						render={({ field }) => (
							<FormItem>
								<FormLabel>最大团队规模</FormLabel>
								<FormControl>
									<Input
										type="number"
										min="1"
										max="20"
										placeholder="5"
										value={field.value || 5}
										onChange={(e) =>
											field.onChange(
												Number.parseInt(
													e.target.value,
												) || 5,
											)
										}
									/>
								</FormControl>
								<FormDescription>
									每个团队最多允许的成员数量
								</FormDescription>
								<FormMessage />
							</FormItem>
						)}
					/>

					<div className="space-y-4">
						<FormField
							control={control}
							name="hackathonConfig.settings.allowSolo"
							render={({ field }) => (
								<FormItem className="flex items-center justify-between">
									<div className="space-y-0.5">
										<FormLabel>允许个人参赛</FormLabel>
										<FormDescription>
											参赛者可以不组队，独自参与比赛
										</FormDescription>
									</div>
									<FormControl>
										<Switch
											checked={field.value ?? true}
											onCheckedChange={field.onChange}
										/>
									</FormControl>
								</FormItem>
							)}
						/>
					</div>
				</div>
			</div>

			<Separator />

			{/* 投票设置 */}
			<div className="space-y-4">
				<div className="flex items-center gap-2">
					<Trophy className="w-4 h-4 text-muted-foreground" />
					<h3 className="text-sm font-medium">投票与评审设置</h3>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<FormField
						control={control}
						name="hackathonConfig.voting.allowPublicVoting"
						render={({ field }) => (
							<FormItem className="flex items-center justify-between">
								<div className="space-y-0.5">
									<FormLabel>开启公众投票</FormLabel>
									<FormDescription>
										允许观众为参赛作品投票
									</FormDescription>
								</div>
								<FormControl>
									<Switch
										checked={field.value ?? true}
										onCheckedChange={field.onChange}
									/>
								</FormControl>
							</FormItem>
						)}
					/>

					<FormField
						control={control}
						name="hackathonConfig.voting.publicVotingScope"
						render={({ field }) => (
							<FormItem>
								<FormLabel>公众投票范围</FormLabel>
								<Select
									onValueChange={field.onChange}
									value={field.value ?? "PARTICIPANTS"}
								>
									<FormControl>
										<SelectTrigger>
											<SelectValue placeholder="选择投票范围" />
										</SelectTrigger>
									</FormControl>
									<SelectContent>
										<SelectItem value="ALL">
											所有用户
										</SelectItem>
										<SelectItem value="REGISTERED">
											已注册用户
										</SelectItem>
										<SelectItem value="PARTICIPANTS">
											参赛者
										</SelectItem>
									</SelectContent>
								</Select>
								<FormDescription>
									哪些用户可以参与公众投票
								</FormDescription>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={control}
						name="hackathonConfig.voting.publicVotingMode"
						render={({ field }) => (
							<FormItem>
								<FormLabel>
									{t("voting.modeLabels.title")}
								</FormLabel>
								<Select
									onValueChange={field.onChange}
									value={field.value ?? "FIXED_QUOTA"}
								>
									<FormControl>
										<SelectTrigger>
											<SelectValue
												placeholder={t(
													"voting.modeLabels.title",
												)}
											/>
										</SelectTrigger>
									</FormControl>
									<SelectContent>
										<SelectItem value="FIXED_QUOTA">
											{t("voting.modes.fixedQuota")}
										</SelectItem>
										<SelectItem value="PER_PROJECT_LIKE">
											{t("voting.modes.perProjectLike")}
										</SelectItem>
									</SelectContent>
								</Select>
								<FormDescription>
									{t("voting.modeLabels.description")}
								</FormDescription>
								<FormMessage />
							</FormItem>
						)}
					/>

					{publicVotingMode === "FIXED_QUOTA" ? (
						<FormField
							control={control}
							name="hackathonConfig.voting.publicVoteQuota"
							render={({ field }) => (
								<FormItem>
									<FormLabel>
										{t("voting.quotaLabel")}
									</FormLabel>
									<FormControl>
										<Input
											type="number"
											min="1"
											max="100"
											placeholder="3"
											value={field.value || 3}
											onChange={(e) =>
												field.onChange(
													Number.parseInt(
														e.target.value,
													) || 3,
												)
											}
										/>
									</FormControl>
									<FormDescription>
										{t("voting.quotaDescription")}
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>
					) : null}
				</div>
			</div>
		</div>
	);
}
