"use client";

import { Badge } from "@community/ui/ui/badge";
import { Button } from "@community/ui/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@community/ui/ui/dialog";
import { CheckCircle2, Circle, Plus } from "lucide-react";
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

interface ProjectMilestoneSelectorModalProps {
	completedMilestones: string[];
	onMilestonesChange: (milestones: string[]) => void;
	showTitle?: boolean;
}

export function ProjectMilestoneSelectorModal({
	completedMilestones,
	onMilestonesChange,
	showTitle = true,
}: ProjectMilestoneSelectorModalProps) {
	const [open, setOpen] = useState(false);
	const [tempSelected, setTempSelected] = useState<string[]>([]);
	const [activeMilestone, setActiveMilestone] = useState<string | null>(null);

	const handleOpenDialog = () => {
		setTempSelected([...completedMilestones]);
		setOpen(true);
	};

	const toggleMilestone = (milestoneId: string) => {
		if (tempSelected.includes(milestoneId)) {
			setTempSelected(tempSelected.filter((id) => id !== milestoneId));
			setActiveMilestone(null);
		} else {
			setTempSelected([...tempSelected, milestoneId]);
			setActiveMilestone(milestoneId);
		}
	};

	const handleConfirm = () => {
		onMilestonesChange(tempSelected);
		setOpen(false);
	};

	const handleCancel = () => {
		setTempSelected([...completedMilestones]);
		setOpen(false);
	};

	const selectedMilestones = MILESTONE_OPTIONS.filter((m) =>
		completedMilestones.includes(m.id),
	);

	return (
		<div className="space-y-4">
			{showTitle && (
				<div>
					<h4 className="font-medium text-sm mb-1">作品里程碑</h4>
					<p className="text-xs text-muted-foreground">
						选择你已经完成的里程碑
					</p>
				</div>
			)}

			<Dialog open={open} onOpenChange={setOpen}>
				<DialogTrigger asChild>
					<Button
						type="button"
						variant="outline"
						className="w-full justify-start"
						onClick={handleOpenDialog}
					>
						<Plus className="h-4 w-4 mr-2" />
						{completedMilestones.length > 0
							? `已选择 ${completedMilestones.length} 个里程碑`
							: "选择作品里程碑"}
					</Button>
				</DialogTrigger>

				<DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle>选择作品里程碑</DialogTitle>
						<DialogDescription>
							选择你已经完成的作品里程碑，这将帮助其他用户了解你的作品进展
						</DialogDescription>
					</DialogHeader>

					<div className="mt-4">
						<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
							{MILESTONE_OPTIONS.map((milestone) => {
								const isSelected = tempSelected.includes(
									milestone.id,
								);

								return (
									<div
										key={milestone.id}
										className="relative"
									>
										<button
											type="button"
											className={`flex items-center gap-2 px-3 py-2 rounded border transition-all duration-200 hover:shadow-sm w-full text-left ${
												isSelected
													? "bg-green-50 border-green-300 text-green-800"
													: "bg-white border-gray-300 hover:border-gray-400"
											}`}
											onClick={() =>
												toggleMilestone(milestone.id)
											}
										>
											{isSelected ? (
												<CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
											) : (
												<Circle className="h-4 w-4 text-gray-400 flex-shrink-0" />
											)}
											<span
												className={`text-sm font-medium truncate ${
													isSelected
														? "text-green-800"
														: "text-gray-900"
												}`}
											>
												{milestone.label}
											</span>
										</button>

										{/* Tooltip */}
										{activeMilestone === milestone.id && (
											<div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 z-50 px-2 py-1 bg-gray-900 text-white text-xs rounded shadow-lg whitespace-nowrap max-w-xs">
												{milestone.description}
												<div className="absolute bottom-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-b-2 border-transparent border-b-gray-900" />
											</div>
										)}
									</div>
								);
							})}
						</div>
					</div>

					{tempSelected.length > 0 && (
						<div className="mt-4 p-4 bg-gray-50 rounded-lg">
							<p className="text-sm font-medium text-gray-700 mb-2">
								已选择的里程碑 ({tempSelected.length})：
							</p>
							<div className="flex flex-wrap gap-2">
								{tempSelected.map((milestoneId) => {
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

					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={handleCancel}
						>
							取消
						</Button>
						<Button type="button" onClick={handleConfirm}>
							确认选择
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* 显示已选择的里程碑 */}
			{completedMilestones.length > 0 && (
				<div className="mt-4">
					<p className="text-sm text-muted-foreground mb-2">
						已完成的里程碑 ({completedMilestones.length})：
					</p>
					<div className="flex flex-wrap gap-2">
						{selectedMilestones.map((milestone) => (
							<Badge
								key={milestone.id}
								variant="secondary"
								className="bg-green-100 text-green-800"
							>
								{milestone.label}
							</Badge>
						))}
					</div>
				</div>
			)}
		</div>
	);
}
