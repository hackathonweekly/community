"use client";

import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle } from "lucide-react";
import { useState } from "react";

const MILESTONE_OPTIONS = [
	{
		id: "mvp_completed",
		label: "MVP完成",
		description: "最小可行产品已完成并可演示",
	},
	{
		id: "first_user",
		label: "首位用户",
		description: "获得第一个真实用户",
	},
	{
		id: "user_100",
		label: "100用户",
		description: "达到100个活跃用户",
	},
	{
		id: "user_1000",
		label: "1000用户",
		description: "达到1000个活跃用户",
	},
	{
		id: "user_10000",
		label: "1万用户",
		description: "达到10,000个活跃用户",
	},
	{
		id: "revenue_first",
		label: "首笔收入",
		description: "获得第一笔付费收入",
	},
	{
		id: "revenue_1k",
		label: "月收入1千",
		description: "月度收入达到1,000元",
	},
	{
		id: "revenue_1w",
		label: "月收入1万",
		description: "月度收入达到10,000元",
	},
	{
		id: "revenue_10w",
		label: "月收入10万",
		description: "月度收入达到100,000元",
	},
	{
		id: "funding_seed",
		label: "种子轮融资",
		description: "完成种子轮或天使轮融资",
	},
	{
		id: "funding_a",
		label: "A轮融资",
		description: "完成A轮融资",
	},
	{
		id: "team_10",
		label: "团队10人",
		description: "团队规模达到10人",
	},
	{
		id: "team_50",
		label: "团队50人",
		description: "团队规模达到50人",
	},
	{
		id: "product_launch",
		label: "正式发布",
		description: "产品正式发布上线",
	},
	{
		id: "media_coverage",
		label: "媒体报道",
		description: "获得主流媒体报道",
	},
	{
		id: "award_recognition",
		label: "获得奖项",
		description: "获得行业奖项或认可",
	},
];

interface ProjectMilestoneSelectorProps {
	completedMilestones: string[];
	onMilestonesChange: (milestones: string[]) => void;
	showTitle?: boolean;
}

export function ProjectMilestoneSelector({
	completedMilestones,
	onMilestonesChange,
	showTitle = true,
}: ProjectMilestoneSelectorProps) {
	const [hoveredMilestone, setHoveredMilestone] = useState<string | null>(
		null,
	);

	const toggleMilestone = (milestoneId: string) => {
		if (completedMilestones.includes(milestoneId)) {
			onMilestonesChange(
				completedMilestones.filter((id) => id !== milestoneId),
			);
		} else {
			onMilestonesChange([...completedMilestones, milestoneId]);
		}
	};

	return (
		<div className="space-y-4">
			{showTitle && (
				<div>
					<h4 className="font-medium text-sm mb-1">项目里程碑</h4>
					<p className="text-xs text-muted-foreground">
						选择你已经完成的里程碑
					</p>
				</div>
			)}

			<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
				{MILESTONE_OPTIONS.map((milestone) => {
					const isCompleted = completedMilestones.includes(
						milestone.id,
					);
					const isHovered = hoveredMilestone === milestone.id;

					return (
						<div
							key={milestone.id}
							className="relative"
							onMouseEnter={() =>
								setHoveredMilestone(milestone.id)
							}
							onMouseLeave={() => setHoveredMilestone(null)}
						>
							<button
								type="button"
								className={`flex items-center gap-2 px-2 py-1.5 rounded border transition-all duration-200 hover:shadow-sm w-full text-left ${
									isCompleted
										? "bg-green-50 border-green-300 text-green-800"
										: "bg-white border-gray-300 hover:border-gray-400"
								}`}
								onClick={() => toggleMilestone(milestone.id)}
								aria-pressed={isCompleted}
							>
								{isCompleted ? (
									<CheckCircle2 className="h-3.5 w-3.5 text-green-600 flex-shrink-0" />
								) : (
									<Circle className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
								)}
								<span
									className={`text-xs font-medium truncate ${
										isCompleted
											? "text-green-800"
											: "text-gray-900"
									}`}
								>
									{milestone.label}
								</span>
							</button>

							{/* Tooltip */}
							{isHovered && (
								<div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 z-10 px-2 py-1 bg-gray-900 text-white text-xs rounded shadow-lg whitespace-nowrap">
									{milestone.description}
									<div className="absolute bottom-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-b-2 border-transparent border-b-gray-900" />
								</div>
							)}
						</div>
					);
				})}
			</div>

			{completedMilestones.length > 0 && (
				<div className="mt-4">
					<p className="text-sm text-muted-foreground mb-2">
						已完成的里程碑 ({completedMilestones.length})：
					</p>
					<div className="flex flex-wrap gap-2">
						{completedMilestones.map((milestoneId) => {
							const milestone = MILESTONE_OPTIONS.find(
								(m) => m.id === milestoneId,
							);
							if (!milestone) {
								return null;
							}

							return (
								<Badge
									key={milestoneId}
									variant="secondary"
									className="bg-green-100 text-green-800"
								>
									{milestone.label}
								</Badge>
							);
						})}
					</div>
				</div>
			)}
		</div>
	);
}
