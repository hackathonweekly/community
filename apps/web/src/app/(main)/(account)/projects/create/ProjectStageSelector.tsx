"use client";

import { Label } from "@community/ui/ui/label";
import { RadioGroup, RadioGroupItem } from "@community/ui/ui/radio-group";
import { ProjectStage } from "@community/lib-shared/prisma-enums";
import {
	Lightbulb,
	Users,
	Wrench,
	Code,
	Rocket,
	TrendingUp,
	Trophy,
} from "lucide-react";

const PROJECT_STAGE_OPTIONS = [
	{
		value: ProjectStage.IDEA_VALIDATION,
		label: "💡 想法验证",
		description: "概念构思、市场调研、可行性分析、团队组建、合伙人寻找",
		icon: Lightbulb,
		color: "text-yellow-600",
		bgColor: "bg-yellow-50",
		borderColor: "border-yellow-200",
	},
	{
		value: ProjectStage.DEVELOPMENT,
		label: "🔧 产品开发",
		description: "原型制作、MVP开发、产品迭代、技术架构搭建、核心功能实现",
		icon: Code,
		color: "text-blue-600",
		bgColor: "bg-blue-50",
		borderColor: "border-blue-200",
	},
	{
		value: ProjectStage.LAUNCH,
		label: "🚀 产品发布",
		description: "产品正式发布、初期用户获取、市场验证、用户反馈收集",
		icon: Rocket,
		color: "text-green-600",
		bgColor: "bg-green-50",
		borderColor: "border-green-200",
	},
	{
		value: ProjectStage.GROWTH,
		label: "📈 用户增长",
		description: "用户规模扩张、产品优化迭代、运营策略执行、市场推广",
		icon: TrendingUp,
		color: "text-emerald-600",
		bgColor: "bg-emerald-50",
		borderColor: "border-emerald-200",
	},
	{
		value: ProjectStage.MONETIZATION,
		label: "💰 商业变现",
		description: "盈利模式验证、收入增长、商业模式优化、付费用户转化",
		icon: Wrench,
		color: "text-purple-600",
		bgColor: "bg-purple-50",
		borderColor: "border-purple-200",
	},
	{
		value: ProjectStage.FUNDING,
		label: "💼 融资扩张",
		description: "寻求投资、融资谈判、团队扩张、业务规模化",
		icon: Users,
		color: "text-indigo-600",
		bgColor: "bg-indigo-50",
		borderColor: "border-indigo-200",
	},
	{
		value: ProjectStage.COMPLETED,
		label: "🎯 项目完结",
		description: "成功退出、被收购、转型、项目暂停、归档或失败总结",
		icon: Trophy,
		color: "text-amber-600",
		bgColor: "bg-amber-50",
		borderColor: "border-amber-200",
	},
];

interface ProjectStageSelectorProps {
	value: ProjectStage;
	onChange: (stage: ProjectStage) => void;
	showTitle?: boolean;
}

export function ProjectStageSelector({
	value,
	onChange,
	showTitle = true,
}: ProjectStageSelectorProps) {
	return (
		<div className="space-y-4">
			{showTitle && (
				<div>
					<h4 className="font-medium text-sm mb-1">项目阶段</h4>
					<p className="text-xs text-muted-foreground">
						选择项目当前所处的阶段
					</p>
				</div>
			)}

			<RadioGroup
				value={value}
				onValueChange={(newValue) => onChange(newValue as ProjectStage)}
				className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3"
			>
				{PROJECT_STAGE_OPTIONS.map((option) => {
					const IconComponent = option.icon;
					const isSelected = value === option.value;

					return (
						<div key={option.value} className="relative">
							<Label
								htmlFor={option.value}
								className={`flex items-center space-x-3 rounded-lg border-2 px-3 py-2 transition-all cursor-pointer hover:shadow-sm ${
									isSelected
										? `${option.borderColor} ${option.bgColor}`
										: "border-gray-200 bg-white hover:border-gray-300"
								}`}
							>
								<RadioGroupItem
									value={option.value}
									id={option.value}
								/>
								<IconComponent
									className={`h-4 w-4 ${isSelected ? option.color : "text-gray-400"}`}
								/>
								<span
									className={`font-medium text-sm ${
										isSelected
											? option.color
											: "text-gray-900"
									}`}
								>
									{option.label}
								</span>
							</Label>

							{/* Tooltip */}
							{isSelected && (
								<div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 z-10 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg whitespace-nowrap w-fit">
									{option.description}
									<div className="absolute bottom-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-gray-900" />
								</div>
							)}
						</div>
					);
				})}
			</RadioGroup>
		</div>
	);
}
