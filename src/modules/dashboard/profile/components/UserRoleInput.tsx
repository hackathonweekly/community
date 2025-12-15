"use client";

import {
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import type { Control } from "react-hook-form";
import { PROFILE_LIMITS } from "@/lib/utils/profile-limits";

interface UserRoleInputProps {
	control: Control<any>;
	name: string;
	required?: boolean;
}

// 推荐的常见角色
const RECOMMENDED_ROLES = [
	"全栈开发",
	"前端开发",
	"后端开发",
	"产品经理",
	"UI设计师",
	"UX设计师",
	"数据分析",
	"AI工程师",
	"增长运营",
	"商务拓展",
	"内容创作",
	"社区运营",
	"投资人",
	"创业者",
	"技术顾问",
	"产品设计师",
];

export function UserRoleInput({
	control,
	name,
	required = false,
}: UserRoleInputProps) {
	const [showRecommendations, setShowRecommendations] = useState(false);

	return (
		<FormField
			control={control}
			name={name}
			render={({ field }) => (
				<FormItem>
					<FormLabel>
						用户主要角色
						{required && (
							<span className="text-destructive ml-1">*</span>
						)}
					</FormLabel>
					<FormControl>
						<div className="space-y-3">
							<Input
								{...field}
								placeholder="请输入您的主要角色，如：前端开发、产品经理..."
								maxLength={PROFILE_LIMITS.userRoleStringMax}
								onFocus={() => setShowRecommendations(true)}
							/>

							{showRecommendations && (
								<div className="space-y-2">
									<div className="flex items-center justify-between">
										<span className="text-sm text-muted-foreground">
											常见角色推荐（点击快速填写）：
										</span>
										<Button
											type="button"
											variant="ghost"
											size="sm"
											onClick={() =>
												setShowRecommendations(false)
											}
											className="text-xs"
										>
											收起
										</Button>
									</div>
									<div className="flex flex-wrap gap-2">
										{RECOMMENDED_ROLES.map((role) => (
											<Badge
												key={role}
												variant="outline"
												className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
												onClick={() => {
													field.onChange(role);
													setShowRecommendations(
														false,
													);
												}}
											>
												{role}
											</Badge>
										))}
									</div>
								</div>
							)}

							{!showRecommendations && field.value && (
								<Button
									type="button"
									variant="ghost"
									size="sm"
									onClick={() => setShowRecommendations(true)}
									className="text-sm text-muted-foreground"
								>
									查看推荐角色
								</Button>
							)}
						</div>
					</FormControl>
					<FormMessage />
				</FormItem>
			)}
		/>
	);
}
