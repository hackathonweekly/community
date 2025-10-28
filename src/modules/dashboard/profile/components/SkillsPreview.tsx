"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
			<Card>
				<CardHeader>
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
							className="h-8 text-xs"
						>
							<Plus className="h-3 w-3 mr-1" />
							添加技能
						</Button>
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="flex items-center justify-center py-8 text-center">
						<div className="space-y-3">
							<div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
								<Star className="h-8 w-8 text-muted-foreground" />
							</div>
							<div className="space-y-1">
								<p className="text-sm font-medium text-muted-foreground">
									还没有添加技能
								</p>
								<p className="text-xs text-muted-foreground">
									添加您擅长的技能，让其他人更好地了解您
								</p>
							</div>
							<Button
								type="button"
								variant="outline"
								size="sm"
								onClick={onManageSkills}
								className="mt-3"
							>
								<Plus className="h-3 w-3 mr-1" />
								添加技能
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
						<Star className="h-4 w-4" />
						核心技能
						<span className="text-sm text-muted-foreground font-normal">
							({skills.length} 项)
						</span>
					</div>
					<Button
						type="button"
						variant="outline"
						size="sm"
						onClick={onManageSkills}
						className="h-8 text-xs"
					>
						<Edit className="h-3 w-3 mr-1" />
						管理技能
					</Button>
				</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="flex flex-wrap gap-2">
					{displaySkills.map((skill) => (
						<Badge
							key={skill}
							variant="secondary"
							className="text-xs px-2 py-1 bg-primary/10 text-primary border-primary/20 hover:bg-primary/20"
						>
							{skill}
						</Badge>
					))}
					{hiddenCount > 0 && (
						<Badge
							variant="outline"
							className="text-xs px-2 py-1 cursor-pointer hover:bg-muted"
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
					<div className="mt-3 pt-3 border-t">
						<Button
							type="button"
							variant="ghost"
							size="sm"
							onClick={onManageSkills}
							className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
						>
							查看和编辑所有技能 →
						</Button>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
