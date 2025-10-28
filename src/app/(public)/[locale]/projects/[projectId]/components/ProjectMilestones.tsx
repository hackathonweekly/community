import { Badge } from "@/components/ui/badge";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	CATEGORY_COLORS,
	getMilestoneCategory,
	getMilestoneLabel,
} from "@/config/milestones";

interface ProjectMilestonesProps {
	milestones: string[];
}

export function ProjectMilestones({ milestones }: ProjectMilestonesProps) {
	if (!milestones || milestones.length === 0) {
		return null;
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>作品里程碑</CardTitle>
				<CardDescription>已完成的重要节点</CardDescription>
			</CardHeader>
			<CardContent>
				<div className="flex flex-wrap gap-2">
					{milestones.map((milestone, index) => {
						const category = getMilestoneCategory(milestone);
						const categoryColor =
							CATEGORY_COLORS[
								category as keyof typeof CATEGORY_COLORS
							] || CATEGORY_COLORS.自定义;

						return (
							<Badge
								key={index}
								variant="outline"
								className={`${categoryColor} font-medium`}
							>
								{getMilestoneLabel(milestone)}
							</Badge>
						);
					})}
				</div>
			</CardContent>
		</Card>
	);
}
