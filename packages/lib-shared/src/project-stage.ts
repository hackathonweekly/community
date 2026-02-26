import { ProjectStage } from "./prisma-enums";

// For non-i18n contexts, keep the emoji version as fallback
export const projectStageLabels: Record<ProjectStage, string> = {
	[ProjectStage.IDEA_VALIDATION]: "💡 想法验证",
	[ProjectStage.DEVELOPMENT]: "🔧 产品开发",
	[ProjectStage.LAUNCH]: "🚀 产品发布",
	[ProjectStage.GROWTH]: "📈 用户增长",
	[ProjectStage.MONETIZATION]: "💰 商业变现",
	[ProjectStage.FUNDING]: "💼 融资扩张",
	[ProjectStage.COMPLETED]: "🎯 作品完成",
};

// Internationalized stage labels function (without emojis for flexibility)
export function getProjectStageLabel(stage: ProjectStage, t: any): string {
	return t(`dashboard.projectStages.${stage}`);
}

// Translation keys for reference
export const projectStageTranslationKeys: Record<ProjectStage, string> = {
	[ProjectStage.IDEA_VALIDATION]: "dashboard.projectStages.IDEA_VALIDATION",
	[ProjectStage.DEVELOPMENT]: "dashboard.projectStages.DEVELOPMENT",
	[ProjectStage.LAUNCH]: "dashboard.projectStages.LAUNCH",
	[ProjectStage.GROWTH]: "dashboard.projectStages.GROWTH",
	[ProjectStage.MONETIZATION]: "dashboard.projectStages.MONETIZATION",
	[ProjectStage.FUNDING]: "dashboard.projectStages.FUNDING",
	[ProjectStage.COMPLETED]: "dashboard.projectStages.COMPLETED",
};

export const projectStageColors: Record<ProjectStage, string> = {
	[ProjectStage.IDEA_VALIDATION]:
		"bg-yellow-100 text-yellow-800 border-yellow-200",
	[ProjectStage.DEVELOPMENT]: "bg-blue-100 text-blue-800 border-blue-200",
	[ProjectStage.LAUNCH]: "bg-green-100 text-green-800 border-green-200",
	[ProjectStage.GROWTH]: "bg-emerald-100 text-emerald-800 border-emerald-200",
	[ProjectStage.MONETIZATION]:
		"bg-purple-100 text-purple-800 border-purple-200",
	[ProjectStage.FUNDING]: "bg-indigo-100 text-indigo-800 border-indigo-200",
	[ProjectStage.COMPLETED]: "bg-amber-100 text-amber-800 border-amber-200",
};

export const projectStageDescriptions: Record<ProjectStage, string> = {
	[ProjectStage.IDEA_VALIDATION]:
		"概念构思、市场调研、可行性分析、团队组建、合伙人寻找",
	[ProjectStage.DEVELOPMENT]:
		"原型制作、MVP开发、产品迭代、技术架构搭建、核心功能实现",
	[ProjectStage.LAUNCH]: "产品正式发布、初期用户获取、市场验证、用户反馈收集",
	[ProjectStage.GROWTH]: "用户规模扩张、产品优化迭代、运营策略执行、市场推广",
	[ProjectStage.MONETIZATION]:
		"盈利模式验证、收入增长、商业模式优化、付费用户转化",
	[ProjectStage.FUNDING]: "寻求投资、融资谈判、团队扩张、业务规模化",
	[ProjectStage.COMPLETED]:
		"成功退出、被收购、转型、项目暂停、归档或失败总结",
};
