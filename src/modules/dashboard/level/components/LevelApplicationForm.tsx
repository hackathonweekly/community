"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
	getNextLevel,
	getLevelInfo,
	getLevelTypeName,
} from "@/lib/level-utils";
import { zodResolver } from "@hookform/resolvers/zod";
import type {
	LevelType,
	MembershipLevel,
	CreatorLevel,
	MentorLevel,
	ContributorLevel,
} from "@prisma/client";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { LevelBadge } from "./LevelBadge";

const levelApplicationSchema = z.object({
	levelType: z.enum(["MEMBERSHIP", "CREATOR", "MENTOR", "CONTRIBUTOR"]),
	targetLevel: z.string().min(1, "请选择目标等级"),
	reason: z.string().min(10, "申请理由至少需要10个字符"),
	evidence: z.string().optional(),
});

type FormData = z.infer<typeof levelApplicationSchema>;

interface LevelApplicationFormProps {
	currentLevels: {
		membershipLevel?: MembershipLevel | null;
		creatorLevel?: CreatorLevel | null;
		mentorLevel?: MentorLevel | null;
		contributorLevel?: ContributorLevel | null;
	};
	onSuccess?: () => void;
}

export function LevelApplicationForm({
	currentLevels,
	onSuccess,
}: LevelApplicationFormProps) {
	const { toast } = useToast();
	const [isSubmitting, setIsSubmitting] = useState(false);

	const form = useForm<FormData>({
		resolver: zodResolver(levelApplicationSchema),
		defaultValues: {
			levelType: "MEMBERSHIP",
			targetLevel: "",
			reason: "",
			evidence: "",
		},
	});

	const watchedLevelType = form.watch("levelType");

	// 获取当前选中轨道的当前等级和可升级等级
	const getCurrentAndNextLevel = (levelType: LevelType) => {
		const levelTypeKey = levelType.toLowerCase() as
			| "membership"
			| "creator"
			| "mentor"
			| "contributor";
		let currentLevel: string | null = null;

		switch (levelType) {
			case "MEMBERSHIP":
				currentLevel = currentLevels.membershipLevel ?? null;
				break;
			case "CREATOR":
				currentLevel = currentLevels.creatorLevel ?? null;
				break;
			case "MENTOR":
				currentLevel = currentLevels.mentorLevel ?? null;
				break;
			case "CONTRIBUTOR":
				currentLevel = currentLevels.contributorLevel ?? null;
				break;
		}

		const nextLevel = getNextLevel(currentLevel, levelTypeKey);
		return { currentLevel, nextLevel };
	};

	const { currentLevel, nextLevel } =
		getCurrentAndNextLevel(watchedLevelType);

	// 获取可申请的等级选项
	const getAvailableLevels = (levelType: LevelType) => {
		const { nextLevel } = getCurrentAndNextLevel(levelType);
		if (!nextLevel) {
			return [];
		}

		return [nextLevel];
	};

	const availableLevels = getAvailableLevels(watchedLevelType);

	const onSubmit = async (data: FormData) => {
		try {
			setIsSubmitting(true);

			const response = await fetch("/api/level/apply", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					...data,
					action: "UPGRADE", // 目前只支持升级申请
				}),
			});

			const result = await response.json();

			if (!response.ok) {
				throw new Error(result.error || "申请提交失败");
			}

			toast({
				title: "申请提交成功",
				description: "您的等级申请已提交，请等待管理员审核",
			});

			form.reset();
			onSuccess?.();
		} catch (error) {
			console.error("等级申请失败:", error);
			toast({
				title: "申请提交失败",
				description:
					error instanceof Error ? error.message : "请稍后重试",
				variant: "destructive",
			});
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<CheckCircle2 className="h-5 w-5 text-green-600" />
					等级申请
				</CardTitle>
			</CardHeader>
			<CardContent>
				<Form {...form}>
					<form
						onSubmit={form.handleSubmit(onSubmit)}
						className="space-y-6"
					>
						{/* 当前等级展示 */}
						<div className="p-4 bg-muted/50 rounded-lg">
							<h4 className="font-medium mb-3">当前等级</h4>
							<div className="flex flex-wrap gap-2">
								{currentLevels.membershipLevel && (
									<LevelBadge
										levelType="membership"
										level={currentLevels.membershipLevel}
										showTooltip={false}
									/>
								)}
								{currentLevels.creatorLevel && (
									<LevelBadge
										levelType="creator"
										level={currentLevels.creatorLevel}
										showTooltip={false}
									/>
								)}
								{currentLevels.mentorLevel && (
									<LevelBadge
										levelType="mentor"
										level={currentLevels.mentorLevel}
										showTooltip={false}
									/>
								)}
								{currentLevels.contributorLevel && (
									<LevelBadge
										levelType="contributor"
										level={currentLevels.contributorLevel}
										showTooltip={false}
									/>
								)}
								{!currentLevels.membershipLevel &&
									!currentLevels.creatorLevel &&
									!currentLevels.mentorLevel &&
									!currentLevels.contributorLevel && (
										<span className="text-sm text-muted-foreground">
											新朋友（无等级）
										</span>
									)}
							</div>
						</div>

						{/* 申请轨道选择 */}
						<FormField
							control={form.control}
							name="levelType"
							render={({ field }) => (
								<FormItem>
									<FormLabel>申请轨道</FormLabel>
									<Select
										onValueChange={field.onChange}
										defaultValue={field.value}
									>
										<FormControl>
											<SelectTrigger>
												<SelectValue placeholder="选择要申请的等级轨道" />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											<SelectItem value="MEMBERSHIP">
												基础成员等级
											</SelectItem>
											<SelectItem value="CREATOR">
												创造者轨道
											</SelectItem>
											<SelectItem value="MENTOR">
												导师轨道
											</SelectItem>
											<SelectItem value="CONTRIBUTOR">
												贡献者轨道
											</SelectItem>
										</SelectContent>
									</Select>
									<FormDescription>
										选择您想要申请的等级轨道类型
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>

						{/* 目标等级选择 */}
						<FormField
							control={form.control}
							name="targetLevel"
							render={({ field }) => (
								<FormItem>
									<FormLabel>目标等级</FormLabel>
									<Select
										onValueChange={field.onChange}
										value={field.value}
										disabled={availableLevels.length === 0}
									>
										<FormControl>
											<SelectTrigger>
												<SelectValue placeholder="选择目标等级" />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											{availableLevels.map((level) => {
												const levelInfo = getLevelInfo(
													watchedLevelType.toLowerCase() as
														| "membership"
														| "creator"
														| "mentor"
														| "contributor",
													level,
												);
												return (
													<SelectItem
														key={level}
														value={level}
													>
														{levelInfo?.label ||
															level}{" "}
														({level})
													</SelectItem>
												);
											})}
										</SelectContent>
									</Select>
									{availableLevels.length === 0 ? (
										<FormDescription className="flex items-center gap-1 text-orange-600">
											<AlertCircle className="h-4 w-4" />
											当前
											{getLevelTypeName(watchedLevelType)}
											已达最高等级或暂无可升级等级
										</FormDescription>
									) : (
										<FormDescription>
											选择您要申请的目标等级
										</FormDescription>
									)}
									<FormMessage />
								</FormItem>
							)}
						/>

						{/* 目标等级信息预览 */}
						{form.watch("targetLevel") && (
							<div className="p-4 border rounded-lg bg-blue-50/50">
								<h4 className="font-medium mb-2">
									目标等级信息
								</h4>
								<LevelBadge
									levelType={
										watchedLevelType.toLowerCase() as
											| "membership"
											| "creator"
											| "mentor"
											| "contributor"
									}
									level={form.watch("targetLevel")}
									size="lg"
								/>
							</div>
						)}

						{/* 申请理由 */}
						<FormField
							control={form.control}
							name="reason"
							render={({ field }) => (
								<FormItem>
									<FormLabel>申请理由</FormLabel>
									<FormControl>
										<Textarea
											{...field}
											placeholder="请详细说明您申请此等级的理由，包括您已完成的相关工作、贡献或成就..."
											rows={4}
										/>
									</FormControl>
									<FormDescription>
										请详细说明您符合目标等级要求的理由（至少10个字符）
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>

						{/* 证明材料 */}
						<FormField
							control={form.control}
							name="evidence"
							render={({ field }) => (
								<FormItem>
									<FormLabel>证明材料（可选）</FormLabel>
									<FormControl>
										<Textarea
											{...field}
											placeholder="提供相关证明材料的链接或详细描述，如项目链接、活动记录、贡献证明等..."
											rows={3}
										/>
									</FormControl>
									<FormDescription>
										提供支持您申请的证明材料，如链接、截图说明等
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>

						<Button
							type="submit"
							disabled={
								isSubmitting || availableLevels.length === 0
							}
							className="w-full"
						>
							{isSubmitting ? "提交中..." : "提交申请"}
						</Button>
					</form>
				</Form>
			</CardContent>
		</Card>
	);
}
