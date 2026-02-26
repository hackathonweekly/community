import {
	CATEGORY_COLORS,
	getMilestoneCategory,
	getMilestoneLabel,
} from "@community/config/milestones";

interface ProjectMilestonesProps {
	milestones: string[];
}

export function ProjectMilestones({ milestones }: ProjectMilestonesProps) {
	if (!milestones || milestones.length === 0) {
		return null;
	}

	return (
		<div>
			{/* Section Divider */}
			<div className="flex items-center gap-3 mb-4">
				<h3 className="font-brand text-sm font-bold uppercase tracking-wide text-gray-400">
					里程碑
				</h3>
				<div className="h-px bg-gray-100 flex-1" />
			</div>
			<div className="flex flex-wrap gap-2">
				{milestones.map((milestone, index) => {
					const category = getMilestoneCategory(milestone);
					const categoryColor =
						CATEGORY_COLORS[
							category as keyof typeof CATEGORY_COLORS
						] || CATEGORY_COLORS.自定义;

					return (
						<span
							key={index}
							className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${categoryColor}`}
						>
							{getMilestoneLabel(milestone)}
						</span>
					);
				})}
			</div>
		</div>
	);
}
