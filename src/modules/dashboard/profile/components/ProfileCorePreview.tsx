"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Edit, Plus, User } from "lucide-react";
import { getLifeStatusLabel } from "@/lib/utils/life-status";

interface ProfileCorePreviewProps {
	bio?: string | null;
	userRoleString?: string | null;
	currentWorkOn?: string | null;
	lifeStatus?: string | null;
	onManageCore: () => void;
}

const truncateText = (text: string | null | undefined, maxLength: number) => {
	if (!text) return "";
	return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
};

const getLifeStatusDisplay = (status: string | null | undefined) => {
	if (!status) return "";

	const label = getLifeStatusLabel(status);
	if (!label) return { label: status, variant: "outline" as const };

	// Return with appropriate variant based on status
	return { label, variant: "default" as const };
};

export function ProfileCorePreview({
	bio,
	userRoleString,
	currentWorkOn,
	lifeStatus,
	onManageCore,
}: ProfileCorePreviewProps) {
	const hasBasicInfo = bio || userRoleString;
	const missingInfo = [];

	if (!bio) missingInfo.push("个人简介");
	if (!userRoleString) missingInfo.push("主要角色");

	const statusInfo = getLifeStatusDisplay(lifeStatus);

	if (!hasBasicInfo) {
		return (
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center justify-between text-base">
						<div className="flex items-center gap-2">
							<User className="h-4 w-4" />
							核心档案
						</div>
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={onManageCore}
							className="h-8 text-xs"
						>
							<Plus className="h-3 w-3 mr-1" />
							完善档案
						</Button>
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="flex items-center justify-center py-8 text-center">
						<div className="space-y-3">
							<div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
								<AlertCircle className="h-8 w-8 text-muted-foreground" />
							</div>
							<div className="space-y-1">
								<p className="text-sm font-medium text-muted-foreground">
									核心档案信息待完善
								</p>
								<p className="text-xs text-muted-foreground">
									缺少：{missingInfo.join("、")}
								</p>
							</div>
							<Button
								type="button"
								variant="outline"
								size="sm"
								onClick={onManageCore}
								className="mt-3"
							>
								<Plus className="h-3 w-3 mr-1" />
								完善档案
							</Button>
						</div>
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center justify-between text-base">
					<div className="flex items-center gap-2">
						<User className="h-4 w-4" />
						核心档案
						{missingInfo.length > 0 && (
							<Badge variant="outline" className="text-xs">
								待完善
							</Badge>
						)}
					</div>
					<Button
						type="button"
						variant="outline"
						size="sm"
						onClick={onManageCore}
						className="h-8 text-xs"
					>
						<Edit className="h-3 w-3 mr-1" />
						编辑档案
					</Button>
				</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="space-y-4">
					{bio && (
						<div>
							<label className="text-xs font-medium text-muted-foreground block mb-1">
								个人简介
							</label>
							<p className="text-sm leading-relaxed">
								{truncateText(bio, 80)}
							</p>
						</div>
					)}

					{/* 三个核心信息字段在同一行 */}
					{(userRoleString || currentWorkOn || lifeStatus) && (
						<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
							{userRoleString && (
								<div>
									<label className="text-xs font-medium text-muted-foreground block mb-1">
										主要角色
									</label>
									<p className="text-sm font-medium">
										{userRoleString}
									</p>
								</div>
							)}

							{currentWorkOn && (
								<div>
									<label className="text-xs font-medium text-muted-foreground block mb-1">
										当前在做
									</label>
									<p className="text-sm">
										{truncateText(currentWorkOn, 30)}
									</p>
								</div>
							)}

							{lifeStatus && (
								<div>
									<label className="text-xs font-medium text-muted-foreground block mb-1">
										当前状态
									</label>
									{statusInfo &&
										typeof statusInfo === "object" &&
										statusInfo.label && (
											<Badge
												variant={statusInfo.variant}
												className="text-xs"
											>
												{statusInfo.label}
											</Badge>
										)}
								</div>
							)}
						</div>
					)}

					{missingInfo.length > 0 && (
						<div className="mt-4 pt-3 border-t">
							<div className="flex items-center gap-2 text-xs text-amber-600">
								<AlertCircle className="h-3 w-3" />
								<span>还需完善：{missingInfo.join("、")}</span>
							</div>
						</div>
					)}

					<div className="mt-3 pt-3 border-t">
						<Button
							type="button"
							variant="ghost"
							size="sm"
							onClick={onManageCore}
							className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
						>
							查看和编辑完整档案 →
						</Button>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
