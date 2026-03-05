"use client";

import { Badge } from "@community/ui/ui/badge";
import { Button } from "@community/ui/ui/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@community/ui/ui/card";
import { Star, Edit, Plus } from "lucide-react";

interface SkillsPreviewProps {
	skills: string[];
	onManageSkills: () => void;
	maxDisplay?: number;
}

export function SkillsPreview({
	skills = [],
	onManageSkills,
	maxDisplay = 6,
}: SkillsPreviewProps) {
	const displaySkills = skills.slice(0, maxDisplay);
	const hiddenCount = skills.length - maxDisplay;

	if (skills.length === 0) {
		return (
			<Card className="border-border bg-card shadow-sm dark:border-border dark:bg-card">
				<CardHeader className="border-b border-border pb-3 dark:border-border">
					<CardTitle className="flex items-center justify-between text-base">
						<div className="flex items-center gap-2">
							<Star className="h-4 w-4" />
							核心技能
						</div>
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={onManageSkills}
							className="h-8 rounded-full border-border bg-card px-3 text-xs font-bold text-foreground hover:bg-muted dark:border-border dark:bg-card dark:text-white dark:hover:bg-[#1A1A1A]"
						>
							<Plus className="mr-1 h-3 w-3" />
							添加技能
						</Button>
					</CardTitle>
				</CardHeader>
				<CardContent className="pt-4">
					<div className="rounded-md bg-muted p-6 text-center dark:bg-secondary">
						<div className="space-y-3">
							<div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-border bg-card dark:border-border dark:bg-card">
								<Star className="h-6 w-6 text-muted-foreground dark:text-muted-foreground" />
							</div>
							<div className="space-y-1">
								<p className="text-sm font-bold text-foreground">
									还没有添加技能
								</p>
								<p className="text-xs text-muted-foreground dark:text-muted-foreground">
									添加您擅长的技能，让其他人更好地了解您
								</p>
							</div>
							<Button
								type="button"
								size="sm"
								onClick={onManageSkills}
								className="mt-2 h-8 rounded-full bg-black px-4 text-xs font-bold text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-muted"
							>
								<Plus className="mr-1 h-3 w-3" />
								添加技能
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
						<Star className="h-4 w-4" />
						核心技能
						<span className="text-xs font-mono text-muted-foreground dark:text-muted-foreground">
							({skills.length} 项)
						</span>
					</div>
					<Button
						type="button"
						variant="outline"
						size="sm"
						onClick={onManageSkills}
						className="h-8 rounded-full border-border bg-card px-3 text-xs font-bold text-foreground hover:bg-muted dark:border-border dark:bg-card dark:text-white dark:hover:bg-[#1A1A1A]"
					>
						<Edit className="mr-1 h-3 w-3" />
						管理技能
					</Button>
				</CardTitle>
			</CardHeader>
			<CardContent className="pt-4">
				<div className="flex flex-wrap gap-2">
					{displaySkills.map((skill) => (
						<Badge
							key={skill}
							variant="secondary"
							className="rounded-md border border-border bg-muted px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-muted-foreground hover:bg-muted dark:border-border dark:bg-secondary dark:text-muted-foreground dark:hover:bg-[#222222]"
						>
							{skill}
						</Badge>
					))}
					{hiddenCount > 0 && (
						<Badge
							variant="outline"
							className="cursor-pointer rounded-md border border-border bg-card px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-muted-foreground hover:bg-muted dark:border-border dark:bg-card dark:text-muted-foreground dark:hover:bg-[#1A1A1A]"
							onClick={(e) => {
								e.preventDefault();
								onManageSkills();
							}}
						>
							+{hiddenCount} 更多
						</Badge>
					)}
				</div>

				{skills.length > 0 && (
					<div className="mt-3 border-t border-border pt-3 dark:border-border">
						<Button
							type="button"
							variant="ghost"
							size="sm"
							onClick={onManageSkills}
							className="h-auto p-0 text-xs font-bold text-muted-foreground hover:bg-transparent hover:text-foreground dark:text-muted-foreground dark:hover:text-white"
						>
							查看和编辑所有技能 →
						</Button>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
