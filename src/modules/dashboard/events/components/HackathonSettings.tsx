"use client";
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
import { Code, Users, Trophy, FileText } from "lucide-react";
import type { Control, UseFormWatch, UseFormSetValue } from "react-hook-form";
import type { EventFormData } from "./types";
import { SubmissionFormConfigEditor } from "./SubmissionFormConfigEditor";
import type { SubmissionFormConfig } from "@/features/event-submissions/types";

interface HackathonSettingsProps {
	control: Control<EventFormData>;
	watch: UseFormWatch<EventFormData>;
	setValue: UseFormSetValue<EventFormData>;
}

export function HackathonSettings({
	control,
	watch,
	setValue,
}: HackathonSettingsProps) {
	const watchedType = watch("type");

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
					<div className="space-y-4">
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
							name="hackathonConfig.voting.enableJudgeVoting"
							render={({ field }) => (
								<FormItem className="flex items-center justify-between">
									<div className="space-y-0.5">
										<FormLabel>开启专家评审</FormLabel>
										<FormDescription>
											邀请专业评委对作品进行评分
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

					<div className="space-y-4">
						<FormField
							control={control}
							name="hackathonConfig.voting.judgeWeight"
							render={({ field }) => (
								<FormItem>
									<FormLabel>专家评审权重</FormLabel>
									<FormControl>
										<Input
											type="number"
											min="0"
											max="1"
											step="0.1"
											placeholder="0.7"
											value={field.value ?? 0.7}
											onChange={(e) =>
												field.onChange(
													Number.parseFloat(
														e.target.value,
													) || 0.7,
												)
											}
										/>
									</FormControl>
									<FormDescription>
										专家投票在最终评分中的权重比例 (0-1)
									</FormDescription>
									<FormMessage />
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
					</div>
				</div>
			</div>

			<Separator />

			{/* 作品提交表单配置 */}
			<div className="space-y-4">
				<div className="flex items-center gap-2">
					<FileText className="w-4 h-4 text-muted-foreground" />
					<h3 className="text-sm font-medium">作品提交表单配置</h3>
				</div>
				<p className="text-sm text-muted-foreground">
					配置参赛者提交作品时需要填写的额外字段，如智能体链接、演示视频等。
				</p>
				<SubmissionFormConfigEditor
					value={
						watch(
							"submissionFormConfig",
						) as SubmissionFormConfig | null
					}
					onChange={(config) =>
						setValue("submissionFormConfig", config)
					}
				/>
			</div>
		</div>
	);
}
