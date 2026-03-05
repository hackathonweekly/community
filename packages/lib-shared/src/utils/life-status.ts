// 生活状态工具函数

export interface LifeStatusOption {
	value: string;
	label: string;
	description?: string;
	icon?: any;
	color?: string;
}

// 统一的生活状态选项定义
export const LIFE_STATUS_OPTIONS: LifeStatusOption[] = [
	{
		value: "EMPLOYED",
		label: "上班中",
		description: "目前有稳定全职工作",
	},
	{
		value: "JOB_SEEKING",
		label: "求职中",
		description: "正在寻找工作机会",
	},
	{
		value: "STUDENT",
		label: "在读",
		description: "学生身份，在校学习",
	},
	{
		value: "FREELANCE",
		label: "自由职业",
		description: "自由工作者，包括独立开发、咨询等",
	},
	{
		value: "STARTUP",
		label: "创业中",
		description: "创业或参与初创项目",
	},
	{
		value: "EXPLORING",
		label: "探索中",
		description: "间隔期，探索新方向",
	},
] as const;

// 获取生活状态显示标签
export function getLifeStatusLabel(
	lifeStatus: string | null | undefined,
): string | null {
	if (!lifeStatus) return null;

	// 优先匹配新的状态值
	const option = LIFE_STATUS_OPTIONS.find((opt) => opt.value === lifeStatus);
	if (option) return option.label;

	// 向后兼容旧的状态值
	const legacyStatusMap: Record<string, string> = {
		REMOTE_WORK: "远程中",
		INDIE_DEV: "独立开发",
		working: "在职",
		"job-seeking": "求职中",
		studying: "在读",
		freelancing: "自由职业",
		entrepreneurship: "创业中",
		break: "间隙年",
	};

	return legacyStatusMap[lifeStatus] || lifeStatus;
}

// 获取生活状态选项
export function getLifeStatusOption(value: string): LifeStatusOption | null {
	return LIFE_STATUS_OPTIONS.find((opt) => opt.value === value) || null;
}

// 验证生活状态值是否有效
export function isValidLifeStatus(value: string): boolean {
	return LIFE_STATUS_OPTIONS.some((opt) => opt.value === value);
}

// 获取所有状态值
export function getAllLifeStatusValues(): string[] {
	return LIFE_STATUS_OPTIONS.map((opt) => opt.value);
}

// 生活状态类型
export type LifeStatusValue = (typeof LIFE_STATUS_OPTIONS)[number]["value"];
