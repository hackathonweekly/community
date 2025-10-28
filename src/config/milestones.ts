// 作品里程碑配置 - 共享配置文件
export const MILESTONE_OPTIONS = [
	// 启动阶段
	{
		id: "idea_validated",
		label: "想法验证",
		description: "通过调研验证了作品想法的可行性",
		category: "启动",
	},
	{
		id: "team_formed",
		label: "团队组建",
		description: "找到了合适的合伙人或团队成员",
		category: "启动",
	},
	{
		id: "domain_registered",
		label: "域名注册",
		description: "注册了作品的专属域名",
		category: "启动",
	},

	// 开发阶段
	{
		id: "mvp_completed",
		label: "MVP完成",
		description: "最小可行产品已完成并可演示",
		category: "开发",
	},
	{
		id: "github_repo",
		label: "代码开源",
		description: "作品代码托管到GitHub等平台",
		category: "开发",
	},
	{
		id: "logo_designed",
		label: "品牌设计",
		description: "完成了Logo和基础视觉设计",
		category: "开发",
	},

	// 用户获取
	{
		id: "first_user",
		label: "首位用户",
		description: "获得第一个真实用户",
		category: "用户",
	},
	{
		id: "user_100",
		label: "100用户",
		description: "达到100个活跃用户",
		category: "用户",
	},
	{
		id: "user_5000",
		label: "5000用户",
		description: "达到5,000个活跃用户",
		category: "用户",
	},
	// 收入里程碑
	{
		id: "revenue_first",
		label: "首笔收入",
		description: "获得第一笔付费收入",
		category: "收入",
	},
	{
		id: "revenue_1w",
		label: "营收10000元",
		description: "营收达到10000元",
		category: "收入",
	},
	{
		id: "revenue_5w",
		label: "营收50000元",
		description: "营收达到50000元",
		category: "收入",
	},

	// 产品里程碑
	{
		id: "product_launch",
		label: "正式发布",
		description: "产品正式发布上线",
		category: "产品",
	},
	{
		id: "app_store",
		label: "应用商店上架",
		description: "产品成功上架应用商店",
		category: "产品",
	},
	{
		id: "version_2",
		label: "2.0版本发布",
		description: "发布了重大功能更新版本",
		category: "产品",
	},

	// 认可里程碑
	{
		id: "media_coverage",
		label: "媒体报道",
		description: "获得主流媒体或博客报道",
		category: "认可",
	},
	{
		id: "award_recognition",
		label: "获得奖项",
		description: "获得行业奖项或认可",
		category: "认可",
	},
	{
		id: "influencer_mention",
		label: "KOL推荐",
		description: "被知名KOL或意见领袖推荐",
		category: "认可",
	},

	// 商业里程碑
	{
		id: "funding_seed",
		label: "种子轮融资",
		description: "完成种子轮或天使轮融资",
		category: "融资",
	},
	{
		id: "funding_a",
		label: "A轮融资",
		description: "完成A轮融资",
		category: "融资",
	},
];

export const CATEGORY_COLORS = {
	启动: "bg-blue-100 text-blue-800 border-blue-200",
	开发: "bg-purple-100 text-purple-800 border-purple-200",
	用户: "bg-green-100 text-green-800 border-green-200",
	收入: "bg-yellow-100 text-yellow-800 border-yellow-200",
	产品: "bg-indigo-100 text-indigo-800 border-indigo-200",
	认可: "bg-pink-100 text-pink-800 border-pink-200",
	融资: "bg-red-100 text-red-800 border-red-200",
	商业: "bg-gray-100 text-gray-800 border-gray-200",
	自定义: "bg-orange-100 text-orange-800 border-orange-200",
};

// 获取里程碑标签的工具函数
export function getMilestoneLabel(milestoneId: string): string {
	// 处理自定义里程碑
	if (milestoneId.startsWith("custom_")) {
		return milestoneId.replace("custom_", "");
	}

	// 查找预定义里程碑
	const milestone = MILESTONE_OPTIONS.find((m) => m.id === milestoneId);
	return milestone ? milestone.label : milestoneId;
}

// 获取里程碑描述的工具函数
export function getMilestoneDescription(milestoneId: string): string {
	if (milestoneId.startsWith("custom_")) {
		return "自定义里程碑";
	}

	const milestone = MILESTONE_OPTIONS.find((m) => m.id === milestoneId);
	return milestone ? milestone.description : "";
}

// 获取里程碑分类的工具函数
export function getMilestoneCategory(milestoneId: string): string {
	if (milestoneId.startsWith("custom_")) {
		return "自定义";
	}

	const milestone = MILESTONE_OPTIONS.find((m) => m.id === milestoneId);
	return milestone ? milestone.category : "";
}
