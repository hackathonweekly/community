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
} from "@community/ui/ui/dialog";
import { useState } from "react";
import { Star, Plus, X } from "lucide-react";

// 技能类别和选项（复用原有数据结构）
const SKILL_CATEGORIES = {
	technical: {
		label: "技术开发",
		skills: [
			"前端开发",
			"后端开发",
			"全栈开发",
			"移动开发",
			"桌面开发",
			"DevOps",
			"云计算",
			"数据库设计",
			"系统架构",
			"API设计",
			"微服务",
			"容器化",
			"CI/CD",
			"监控运维",
		],
	},
	ai: {
		label: "AI/数据",
		skills: [
			"机器学习",
			"深度学习",
			"自然语言处理",
			"计算机视觉",
			"数据分析",
			"数据科学",
			"算法优化",
			"模型训练",
			"AI应用开发",
			"大数据处理",
			"统计分析",
			"数据挖掘",
			"推荐系统",
			"智能对话",
		],
	},
	product: {
		label: "产品设计",
		skills: [
			"产品规划",
			"需求分析",
			"用户研究",
			"产品设计",
			"原型设计",
			"交互设计",
			"UI设计",
			"UX设计",
			"设计系统",
			"用户体验",
			"可用性测试",
			"设计工具",
			"品牌设计",
			"视觉设计",
		],
	},
	business: {
		label: "商务运营",
		skills: [
			"市场营销",
			"增长运营",
			"用户运营",
			"内容运营",
			"社区运营",
			"商务拓展",
			"销售管理",
			"客户关系",
			"渠道合作",
			"品牌推广",
			"活动策划",
			"SEO优化",
			"社交媒体",
			"数字营销",
		],
	},
	management: {
		label: "管理协调",
		skills: [
			"项目管理",
			"团队管理",
			"产品管理",
			"战略规划",
			"流程优化",
			"敏捷开发",
			"团队协作",
			"沟通协调",
			"资源配置",
			"风险管理",
			"质量管理",
			"时间管理",
			"目标设定",
			"绩效管理",
		],
	},
};

interface SkillsManagementDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	selectedSkills: string[];
	onSkillsChange: (skills: string[]) => void;
	onSave: () => Promise<boolean>;
	isLoading?: boolean;
}

export function SkillsManagementDialog({
	open,
	onOpenChange,
	selectedSkills = [],
	onSkillsChange,
	onSave,
	isLoading = false,
}: SkillsManagementDialogProps) {
	const [activeCategory, setActiveCategory] = useState<string>("technical");
	const [customSkill, setCustomSkill] = useState("");
	const [localSkills, setLocalSkills] = useState<string[]>(selectedSkills);

	// 当弹窗打开时，同步本地状态
	useState(() => {
		if (open) {
			setLocalSkills(selectedSkills);
		}
	});

	const handleSkillToggle = (skill: string) => {
		const newSkills = localSkills.includes(skill)
			? localSkills.filter((s) => s !== skill)
			: [...localSkills, skill];
		setLocalSkills(newSkills);
	};

	const handleAddCustomSkill = () => {
		if (customSkill.trim() && !localSkills.includes(customSkill.trim())) {
			setLocalSkills([...localSkills, customSkill.trim()]);
			setCustomSkill("");
		}
	};

	const handleRemoveSkill = (skill: string) => {
		setLocalSkills(localSkills.filter((s) => s !== skill));
	};

	const handleSave = async () => {
		// 更新父组件状态
		onSkillsChange(localSkills);

		// 调用保存函数
		const success = await onSave();
		if (success) {
			onOpenChange(false);
		}
	};

	const handleCancel = () => {
		// 恢复到原始状态
		setLocalSkills(selectedSkills);
		setCustomSkill("");
		onOpenChange(false);
	};

	// 判断技能是否属于预定义类别
	const isCustomSkill = (skill: string) => {
		return !Object.values(SKILL_CATEGORIES).some((category) =>
			category.skills.includes(skill),
		);
	};

	const hasChanges =
		JSON.stringify(localSkills.sort()) !==
		JSON.stringify(selectedSkills.sort());

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<Star className="h-5 w-5" />
						技能管理
					</DialogTitle>
					<DialogDescription>
						选择您擅长的技能领域，这将帮助其他人了解您的专业能力
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-6">
					{/* 已选择的技能 */}
					{localSkills.length > 0 && (
						<div className="space-y-3">
							<h4 className="font-medium text-sm">
								已选择的技能 ({localSkills.length})
							</h4>
							<div className="flex flex-wrap gap-2 p-3 bg-muted/30 rounded-lg min-h-[60px]">
								{localSkills.map((skill) => (
									<Badge
										key={skill}
										variant="default"
										className="text-sm pr-1 bg-primary/90 hover:bg-primary"
									>
										{skill}
										<button
											type="button"
											onClick={() =>
												handleRemoveSkill(skill)
											}
											className="ml-1 hover:bg-white/20 rounded-full p-0.5"
										>
											<X className="h-3 w-3" />
										</button>
									</Badge>
								))}
							</div>
						</div>
					)}

					{/* 技能类别选择 */}
					<div className="space-y-3">
						<h4 className="font-medium text-sm">选择技能类别</h4>
						<div className="flex flex-wrap gap-2">
							{Object.entries(SKILL_CATEGORIES).map(
								([key, category]) => (
									<Button
										key={key}
										type="button"
										variant={
											activeCategory === key
												? "default"
												: "outline"
										}
										size="sm"
										onClick={() => setActiveCategory(key)}
										className="text-sm"
									>
										{category.label}
									</Button>
								),
							)}
						</div>
					</div>

					{/* 当前类别的技能 */}
					<div className="space-y-3">
						<h4 className="font-medium text-sm">
							{
								SKILL_CATEGORIES[
									activeCategory as keyof typeof SKILL_CATEGORIES
								]?.label
							}{" "}
							技能
						</h4>
						<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-[200px] overflow-y-auto p-2 border rounded-lg">
							{SKILL_CATEGORIES[
								activeCategory as keyof typeof SKILL_CATEGORIES
							]?.skills.map((skill) => {
								const isSelected = localSkills.includes(skill);
								return (
									<Button
										key={skill}
										type="button"
										variant={
											isSelected ? "default" : "outline"
										}
										size="sm"
										className="justify-start text-xs h-8 transition-colors"
										onClick={() => handleSkillToggle(skill)}
									>
										{skill}
										{isSelected ? (
											<X className="ml-auto h-3 w-3" />
										) : (
											<Plus className="ml-auto h-3 w-3" />
										)}
									</Button>
								);
							})}
						</div>
					</div>

					{/* 自定义技能输入 */}
					<div className="space-y-3">
						<h4 className="font-medium text-sm">添加自定义技能</h4>
						<div className="flex gap-2">
							<input
								type="text"
								placeholder="输入其他技能..."
								value={customSkill}
								onChange={(e) => setCustomSkill(e.target.value)}
								onKeyPress={(e) => {
									if (e.key === "Enter") {
										e.preventDefault();
										handleAddCustomSkill();
									}
								}}
								className="flex-1 px-3 py-2 text-sm border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
							/>
							<Button
								type="button"
								size="sm"
								onClick={handleAddCustomSkill}
								disabled={
									!customSkill.trim() ||
									localSkills.includes(customSkill.trim())
								}
							>
								<Plus className="h-4 w-4" />
							</Button>
						</div>
					</div>
				</div>

				<DialogFooter className="gap-2">
					<Button
						type="button"
						variant="outline"
						onClick={handleCancel}
						disabled={isLoading}
					>
						取消
					</Button>
					<Button
						type="button"
						onClick={handleSave}
						disabled={isLoading || !hasChanges}
					>
						{isLoading ? "保存中..." : "保存技能"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
