"use client";

import { AlertCircle, Edit, Plus, User } from "lucide-react";
import { getLifeStatusLabel } from "@community/lib-shared/utils/life-status";
import { Badge } from "@community/ui/ui/badge";
import { Button } from "@community/ui/ui/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@community/ui/ui/card";

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
			<Card className="border-border bg-card shadow-sm dark:border-border dark:bg-card">
				<CardHeader className="border-b border-border pb-3 dark:border-border">
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
							className="h-8 rounded-full border-border bg-card px-3 text-xs font-bold text-foreground hover:bg-muted dark:border-border dark:bg-card dark:text-white dark:hover:bg-[#1A1A1A]"
						>
							<Plus className="mr-1 h-3 w-3" />
							完善档案
						</Button>
					</CardTitle>
				</CardHeader>
				<CardContent className="pt-4">
					<div className="rounded-md bg-muted p-6 text-center dark:bg-secondary">
						<div className="space-y-3">
							<div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-border bg-card dark:border-border dark:bg-card">
								<AlertCircle className="h-6 w-6 text-muted-foreground dark:text-muted-foreground" />
							</div>
							<div className="space-y-1">
								<p className="text-sm font-bold text-foreground">
									核心档案信息待完善
								</p>
								<p className="text-xs text-muted-foreground dark:text-muted-foreground">
									缺少：{missingInfo.join("、")}
								</p>
							</div>
							<Button
								type="button"
								size="sm"
								onClick={onManageCore}
								className="mt-2 h-8 rounded-full bg-black px-4 text-xs font-bold text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-muted"
							>
								<Plus className="mr-1 h-3 w-3" />
								完善档案
							</Button>
						</div>
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card className="border-border bg-card shadow-sm dark:border-border dark:bg-card">
			<CardHeader className="border-b border-border pb-3 dark:border-border">
				<CardTitle className="flex items-center justify-between text-base">
					<div className="flex items-center gap-2">
						<User className="h-4 w-4" />
						核心档案
						{missingInfo.length > 0 && (
							<Badge
								variant="outline"
								className="border-amber-200 bg-amber-50 text-[10px] font-bold uppercase tracking-wide text-amber-700 dark:border-amber-900/60 dark:bg-amber-900/20 dark:text-amber-300"
							>
								待完善
							</Badge>
						)}
					</div>
					<Button
						type="button"
						variant="outline"
						size="sm"
						onClick={onManageCore}
						className="h-8 rounded-full border-border bg-card px-3 text-xs font-bold text-foreground hover:bg-muted dark:border-border dark:bg-card dark:text-white dark:hover:bg-[#1A1A1A]"
					>
						<Edit className="mr-1 h-3 w-3" />
						编辑档案
					</Button>
				</CardTitle>
			</CardHeader>
			<CardContent className="pt-4">
				<div className="space-y-4">
					{bio && (
						<div>
							<label className="mb-1 block text-[11px] font-mono uppercase tracking-wide text-muted-foreground dark:text-muted-foreground">
								个人简介
							</label>
							<p className="text-sm leading-relaxed text-foreground">
								{truncateText(bio, 80)}
							</p>
						</div>
					)}

					{(userRoleString || currentWorkOn || lifeStatus) && (
						<div className="grid grid-cols-1 gap-3 md:grid-cols-3">
							{userRoleString && (
								<div className="rounded-md bg-muted p-3 dark:bg-secondary">
									<label className="mb-1 block text-[11px] font-mono uppercase tracking-wide text-muted-foreground dark:text-muted-foreground">
										主要角色
									</label>
									<p className="text-sm font-bold text-foreground">
										{userRoleString}
									</p>
								</div>
							)}

							{currentWorkOn && (
								<div className="rounded-md bg-muted p-3 dark:bg-secondary">
									<label className="mb-1 block text-[11px] font-mono uppercase tracking-wide text-muted-foreground dark:text-muted-foreground">
										当前在做
									</label>
									<p className="text-sm text-foreground">
										{truncateText(currentWorkOn, 30)}
									</p>
								</div>
							)}

							{lifeStatus && (
								<div className="rounded-md bg-muted p-3 dark:bg-secondary">
									<label className="mb-1 block text-[11px] font-mono uppercase tracking-wide text-muted-foreground dark:text-muted-foreground">
										当前状态
									</label>
									{statusInfo &&
										typeof statusInfo === "object" &&
										statusInfo.label && (
											<Badge
												variant={statusInfo.variant}
												className="rounded-md border-border bg-card px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground dark:border-border dark:bg-card dark:text-muted-foreground"
											>
												{statusInfo.label}
											</Badge>
										)}
								</div>
							)}
						</div>
					)}

					{missingInfo.length > 0 && (
						<div className="mt-4 border-t border-border pt-3 dark:border-border">
							<div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-300">
								<AlertCircle className="h-3 w-3" />
								<span>还需完善：{missingInfo.join("、")}</span>
							</div>
						</div>
					)}

					<div className="mt-3 border-t border-border pt-3 dark:border-border hidden md:block">
						<Button
							type="button"
							variant="ghost"
							size="sm"
							onClick={onManageCore}
							className="h-auto p-0 text-xs font-bold text-muted-foreground hover:bg-transparent hover:text-foreground dark:text-muted-foreground dark:hover:text-white"
						>
							查看和编辑完整档案 →
						</Button>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
