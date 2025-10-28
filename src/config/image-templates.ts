// 图片模板库配置
// 存储不同类型活动的默认封面图片

export interface ImageTemplate {
	id: string;
	name: string;
	url: string;
	category: string;
	description?: string;
}

export const IMAGE_TEMPLATES: ImageTemplate[] = [
	// Tech Category - 科技类
	{
		id: "tech-1",
		name: "抽象网络",
		url: "https://hackweek-public-1303088253.cos.ap-guangzhou.myqcloud.com/public/event-templates/tech-3-technology.jpeg",
		category: "tech",
		description: "抽象网络连接图案",
	},
	{
		id: "tech-2",
		name: "数字艺术",
		url: "https://hackweek-public-1303088253.cos.ap-guangzhou.myqcloud.com/public/event-templates/tech-4-technology.jpeg",
		category: "tech",
		description: "数字化抽象艺术",
	},
	{
		id: "tech-3",
		name: "代码矩阵",
		url: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&h=800&fit=crop&crop=center",
		category: "tech",
		description: "代码背景设计",
	},

	// Gradient Category - 渐变色类
	{
		id: "gradient-1",
		name: "科技渐变",
		url: "https://hackweek-public-1303088253.cos.ap-guangzhou.myqcloud.com/public/event-templates/tech-1-technology.jpeg",
		category: "gradient",
		description: "蓝紫渐变科技背景",
	},
	{
		id: "gradient-2",
		name: "商务渐变",
		url: "https://hackweek-public-1303088253.cos.ap-guangzhou.myqcloud.com/public/event-templates/business-1-business.jpeg",
		category: "gradient",
		description: "专业蓝色渐变背景",
	},
	{
		id: "gradient-3",
		name: "社交渐变",
		url: "https://hackweek-public-1303088253.cos.ap-guangzhou.myqcloud.com/public/event-templates/social-1-social.jpeg",
		category: "gradient",
		description: "温暖橙色渐变背景",
	},
	{
		id: "gradient-4",
		name: "社区渐变",
		url: "https://hackweek-public-1303088253.cos.ap-guangzhou.myqcloud.com/public/event-templates/social-4-social.jpeg",
		category: "gradient",
		description: "社区友好渐变",
	},
	{
		id: "gradient-6",
		name: "几何科技",
		url: "https://hackweek-public-1303088253.cos.ap-guangzhou.myqcloud.com/public/event-templates/tech-2-technology.jpeg",
		category: "gradient",
		description: "几何图形科技风格",
	},
	{
		id: "gradient-7",
		name: "抽象线条",
		url: "https://hackweek-public-1303088253.cos.ap-guangzhou.myqcloud.com/public/event-templates/business-3-business.jpeg",
		category: "gradient",
		description: "抽象线条设计",
	},
];

// 活动类型到模板类别的映射
export const EVENT_TYPE_TO_TEMPLATE_CATEGORY: Record<string, string> = {
	meetup: "gradient",
	hackathon: "gradient",
	building_public: "tech",
};

// 根据活动类型获取推荐的模板
export function getRecommendedTemplates(eventType?: string): ImageTemplate[] {
	if (!eventType) {
		return IMAGE_TEMPLATES;
	}

	const category = EVENT_TYPE_TO_TEMPLATE_CATEGORY[eventType] || "gradient";
	const categoryTemplates = IMAGE_TEMPLATES.filter(
		(template) => template.category === category,
	);

	// 如果该类别没有模板，返回渐变模板
	if (categoryTemplates.length === 0) {
		return IMAGE_TEMPLATES.filter(
			(template) => template.category === "gradient",
		);
	}

	return categoryTemplates;
}

// 随机选择一个模板
export function getRandomTemplate(eventType?: string): ImageTemplate {
	const templates = getRecommendedTemplates(eventType);
	const randomIndex = Math.floor(Math.random() * templates.length);
	return templates[randomIndex];
}

// 获取所有模板类别
export function getTemplateCategories(): string[] {
	return Array.from(
		new Set(IMAGE_TEMPLATES.map((template) => template.category)),
	);
}

// 根据类别获取模板
export function getTemplatesByCategory(category: string): ImageTemplate[] {
	return IMAGE_TEMPLATES.filter((template) => template.category === category);
}
