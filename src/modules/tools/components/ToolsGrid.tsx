"use client";

import { LocaleLink } from "@i18n/routing";

type ToolItem = {
	title: string;
	description?: string;
	href: string;
	external?: boolean;
};

const tools: ToolItem[] = [
	{
		title: "议程生成器",
		description: "快速生成黑客松项目的日程安排",
		href: "/tools/agenda-generator",
		external: false,
	},
	{
		title: "社区 Logo 素材",
		description: "下载各类格式的社区 Logo 资源",
		// logo.hackathonweely.com
		href: "https://hackathonweekly.feishu.cn/wiki/TCrTw7PSfiTm4lkRye1c6uV0nje",
		external: true,
	},
	{
		title: "社区反馈表单",
		description: "提交建议、问题或活动反馈",
		// feedback.hackathonweekly.com
		href: "https://hackathonweekly.feishu.cn/share/base/form/shrcnCtnekj4OJPgnV16G9ZqlCe",
		external: true,
	},
	{
		title: "社区协作文档",
		description: "查看活动资料与各城市分部信息",
		// docs.hackathonweekly.com
		href: "https://hackathonweekly.feishu.cn/wiki/WQ7EwFC7BijePAkMkAHcajkNnae",
		external: true,
	},
	{
		title: "加入社区群聊",
		description: "加入周周黑客松群组一起做 MVP",
		href: "https://join.hackathonweekly.com",
		external: true,
	},
	{
		title: "社区可用场地",
		description: "预约各城市可用的协作空间",
		href: "https://space.hackathonweekly.com",
		external: true,
	},
	{
		title: "资源工具库",
		description: "集合开发工具、模板与代码片段",
		href: "https://tools.hackathonweekly.com",
		external: true,
	},
	{
		title: "社区报销申请",
		description: "填写活动报销与费用申请",
		href: "https://hackathonweekly.feishu.cn/share/base/form/shrcnSg2UVWbBqh6qV4xwSHPi1c",
		external: false,
	},
];

export function ToolsGrid() {
	return (
		<div className="space-y-3">
			{tools.map((tool) => {
				const linkContent = (
					<div className="flex flex-col rounded-lg border border-border bg-card px-4 py-3 transition-colors hover:bg-muted/60">
						<span className="text-base font-medium text-foreground">
							{tool.title}
						</span>
						{tool.description ? (
							<span className="mt-1 text-sm text-muted-foreground">
								{tool.description}
							</span>
						) : null}
					</div>
				);

				if (tool.external) {
					return (
						<a
							key={tool.href}
							href={tool.href}
							target="_blank"
							rel="noopener noreferrer"
							className="block"
						>
							{linkContent}
						</a>
					);
				}

				return (
					<LocaleLink
						key={tool.href}
						href={tool.href}
						className="block"
					>
						{linkContent}
					</LocaleLink>
				);
			})}
		</div>
	);
}
