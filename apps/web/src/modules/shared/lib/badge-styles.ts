import type { ProjectStage } from "@community/lib-shared/prisma-enums";

/**
 * 活动报名状态的 badge 样式
 */
export const registrationStatusStyles: Record<string, string> = {
	APPROVED: "text-green-700 bg-green-50 border-green-100",
	PENDING: "text-orange-600 bg-orange-50 border-orange-100",
	WAITLISTED: "text-blue-600 bg-blue-50 border-blue-100",
	REJECTED: "text-red-700 bg-red-50 border-red-100",
	CANCELLED: "text-muted-foreground bg-muted border-border",
};

/**
 * 项目阶段的 badge 样式
 */
export function getStageBadgeStyle(stage: ProjectStage): string {
	const styles: Partial<Record<ProjectStage, string>> = {
		IDEA_VALIDATION: "text-blue-600 bg-blue-50 border-blue-100",
		DEVELOPMENT: "text-orange-600 bg-orange-50 border-orange-100",
		LAUNCH: "text-green-600 bg-green-50 border-green-100",
		GROWTH: "text-purple-600 bg-purple-50 border-purple-100",
		MONETIZATION: "text-orange-600 bg-orange-50 border-orange-100",
		FUNDING: "text-purple-600 bg-purple-50 border-purple-100",
		COMPLETED: "text-muted-foreground bg-muted border-border",
	};
	return styles[stage] ?? "text-muted-foreground bg-muted border-border";
}
