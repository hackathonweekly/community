"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
	FormField,
	FormItem,
	FormLabel,
	FormControl,
	FormDescription,
	FormMessage,
} from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { useState } from "react";
import { Plus, X, Users, MessageCircle, Mail } from "lucide-react";

// 招募岗位标签选项
const RECRUITMENT_TAG_OPTIONS = [
	"#寻求联合创始人",
	"#招募技术合伙人",
	"#寻找运营伙伴",
	"#招募设计师",
	"#寻求投资人",
	"#招募前端开发",
	"#招募后端开发",
	"#招募产品经理",
	"#寻找营销专家",
	"#招募数据分析师",
	"#寻求技术顾问",
	"#招募UI/UX设计师",
];

interface TeamRecruitmentSectionProps {
	form: any;
}

export function TeamRecruitmentSection({ form }: TeamRecruitmentSectionProps) {
	const [customRecruitmentTag, setCustomRecruitmentTag] = useState("");

	const isRecruiting = form.watch("isRecruiting");
	const selectedRecruitmentTags = form.watch("recruitmentTags") || [];

	const handleToggleRecruitmentTag = (tag: string) => {
		const currentTags = selectedRecruitmentTags;
		if (currentTags.includes(tag)) {
			form.setValue(
				"recruitmentTags",
				currentTags.filter((t: string) => t !== tag),
			);
		} else {
			if (currentTags.length < 5) {
				// 最多5个招募标签
				form.setValue("recruitmentTags", [...currentTags, tag]);
			}
		}
	};

	const handleAddCustomRecruitmentTag = () => {
		const trimmedTag = customRecruitmentTag.trim();
		if (
			trimmedTag &&
			!selectedRecruitmentTags.includes(trimmedTag) &&
			selectedRecruitmentTags.length < 5
		) {
			const tagWithHash = trimmedTag.startsWith("#")
				? trimmedTag
				: `#${trimmedTag}`;
			form.setValue("recruitmentTags", [
				...selectedRecruitmentTags,
				tagWithHash,
			]);
			setCustomRecruitmentTag("");
		}
	};

	const handleRemoveRecruitmentTag = (tag: string) => {
		form.setValue(
			"recruitmentTags",
			selectedRecruitmentTags.filter((t: string) => t !== tag),
		);
	};

	return (
		<div className="space-y-6 bg-gradient-to-br from-blue-50 to-indigo-50 p-6 border border-blue-200 rounded-lg">
			<div className="flex items-center gap-3">
				<Users className="h-5 w-5 text-blue-600" />
				<div>
					<h3 className="text-lg font-medium text-blue-900">
						团队招募
					</h3>
					<p className="text-sm text-blue-700">
						开启招募模式，让其他开发者找到你的作品
					</p>
				</div>
			</div>

			{/* 招募开关 */}
			<FormField
				control={form.control}
				name="isRecruiting"
				render={({ field }) => (
					<FormItem className="flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50/50 p-4">
						<div className="space-y-0.5">
							<FormLabel className="text-blue-900 font-medium">
								开启团队招募
							</FormLabel>
							<FormDescription className="text-blue-700">
								作品将在"寻找团队"页面中展示，并显示招募徽章
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

			{/* 当开启招募时显示详细选项 */}
			{isRecruiting && (
				<div className="space-y-6">
					{/* 招募状态说明 */}
					<FormField
						control={form.control}
						name="recruitmentStatus"
						render={({ field }) => (
							<FormItem>
								<FormLabel>招募状态</FormLabel>
								<FormControl>
									<Input
										{...field}
										placeholder="如：急需前端开发，远程合作优先"
										className="bg-white"
									/>
								</FormControl>
								<FormDescription>
									简短说明当前招募状态和偏好
								</FormDescription>
								<FormMessage />
							</FormItem>
						)}
					/>

					{/* 招募岗位标签 */}
					<div className="space-y-4">
						<FormLabel>招募岗位标签（最多5个）</FormLabel>

						{/* 已选择的标签 */}
						{selectedRecruitmentTags.length > 0 && (
							<div className="space-y-2">
								<p className="text-sm text-muted-foreground">
									已选择 ({selectedRecruitmentTags.length}/5)
								</p>
								<div className="flex flex-wrap gap-2">
									{selectedRecruitmentTags.map(
										(tag: string) => (
											<Badge
												key={tag}
												variant="default"
												className="text-sm pr-1 bg-blue-600"
											>
												{tag}
												<button
													type="button"
													onClick={() =>
														handleRemoveRecruitmentTag(
															tag,
														)
													}
													className="ml-1 hover:bg-white/20 rounded-full p-0.5"
												>
													<X className="h-3 w-3" />
												</button>
											</Badge>
										),
									)}
								</div>
							</div>
						)}

						{/* 预设标签选择 */}
						<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
							{RECRUITMENT_TAG_OPTIONS.map((tag) => {
								const isSelected =
									selectedRecruitmentTags.includes(tag);
								const isDisabled =
									!isSelected &&
									selectedRecruitmentTags.length >= 5;

								return (
									<Button
										key={tag}
										type="button"
										variant={
											isSelected ? "default" : "outline"
										}
										size="sm"
										className="justify-start text-xs h-8"
										onClick={() =>
											handleToggleRecruitmentTag(tag)
										}
										disabled={isDisabled}
									>
										{tag}
										{isSelected ? (
											<X className="ml-1 h-3 w-3" />
										) : (
											<Plus className="ml-1 h-3 w-3" />
										)}
									</Button>
								);
							})}
						</div>

						{/* 自定义标签输入 */}
						<div className="flex gap-2">
							<Input
								placeholder="输入自定义招募标签..."
								value={customRecruitmentTag}
								onChange={(e) =>
									setCustomRecruitmentTag(e.target.value)
								}
								onKeyDown={(e) => {
									if (e.key === "Enter") {
										e.preventDefault();
										handleAddCustomRecruitmentTag();
									}
								}}
								disabled={selectedRecruitmentTags.length >= 5}
								className="flex-1 bg-white"
							/>
							<Button
								type="button"
								size="sm"
								onClick={handleAddCustomRecruitmentTag}
								disabled={
									!customRecruitmentTag.trim() ||
									selectedRecruitmentTags.includes(
										customRecruitmentTag.trim(),
									) ||
									selectedRecruitmentTags.length >= 5
								}
							>
								<Plus className="h-4 w-4" />
							</Button>
						</div>
					</div>

					{/* 详细描述 */}
					<FormField
						control={form.control}
						name="teamDescription"
						render={({ field }) => (
							<FormItem>
								<FormLabel className="flex items-center gap-2">
									<MessageCircle className="h-4 w-4" />
									团队需求描述
								</FormLabel>
								<FormControl>
									<Textarea
										{...field}
										placeholder="详细描述你在寻找什么样的团队成员，他们需要具备什么技能，将要负责什么工作..."
										className="min-h-[100px] bg-white"
									/>
								</FormControl>
								<FormDescription>
									详细说明你需要的团队成员类型、技能要求、工作内容等
								</FormDescription>
								<FormMessage />
							</FormItem>
						)}
					/>

					{/* 所需技能和团队规模 */}
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<FormField
							control={form.control}
							name="teamSkills"
							render={({ field }) => (
								<FormItem>
									<FormLabel>所需技能</FormLabel>
									<FormControl>
										<Input
											{...field}
											placeholder="React, Python, UI设计, 产品运营"
											className="bg-white"
										/>
									</FormControl>
									<FormDescription>
										用逗号分隔技能关键词
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="teamSize"
							render={({ field }) => (
								<FormItem>
									<FormLabel>期望团队规模</FormLabel>
									<FormControl>
										<Input
											{...field}
											type="number"
											min="1"
											max="20"
											placeholder="2"
											value={field.value || ""}
											onChange={(e) => {
												const value = e.target.value;
												field.onChange(
													value
														? Number.parseInt(
																value,
																10,
															)
														: null,
												);
											}}
											className="bg-white"
										/>
									</FormControl>
									<FormDescription>
										希望招募多少人？
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>
					</div>

					{/* 联系方式 */}
					<FormField
						control={form.control}
						name="contactInfo"
						render={({ field }) => (
							<FormItem>
								<FormLabel className="flex items-center gap-2">
									<Mail className="h-4 w-4" />
									联系方式
								</FormLabel>
								<FormControl>
									<Textarea
										{...field}
										placeholder="感兴趣的伙伴可以通过以下方式联系我：&#10;📧 Email: your@email.com&#10;💬 微信: your_wechat&#10;🐦 Twitter: @yourhandle"
										className="min-h-[80px] bg-white"
									/>
								</FormControl>
								<FormDescription>
									提供多种联系方式，方便其他人联系你
								</FormDescription>
								<FormMessage />
							</FormItem>
						)}
					/>
				</div>
			)}
		</div>
	);
}
