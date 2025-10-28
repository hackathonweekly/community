"use client";

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LocaleLink } from "@i18n/routing";
import {
	Calendar,
	FileText,
	MessageSquare,
	BookOpen,
	Users,
	Video,
	Settings,
	DollarSign,
} from "lucide-react";

const tools = [
	{
		title: "议程生成器",
		description: "智能生成黑客马拉松项目议程，合理安排开发时间和里程碑",
		icon: Calendar,
		href: "/tools/agenda-generator",
		external: false,
		badge: "新",
		highlighted: true,
	},
	{
		title: "社区Logo素材",
		description: "获取社区各种格式的 Logo 和相关素材",
		icon: FileText,
		// logo.hackathonweely.com
		href: "https://hackathonweekly.feishu.cn/wiki/TCrTw7PSfiTm4lkRye1c6uV0nje",
		external: true,
		badge: null,
	},
	{
		title: "社区反馈收集",
		description: "如果您对社区有任何建议或问题，欢迎反馈",
		icon: MessageSquare,
		// feedback.hackathonweekly.com
		href: "https://hackathonweekly.feishu.cn/share/base/form/shrcnCtnekj4OJPgnV16G9ZqlCe",
		external: true,
		badge: null,
	},
	{
		title: "社区飞书文档",
		description: "查阅社区协作文档，包含各个分部信息，活动资料等",
		icon: BookOpen,
		// docs.hackathonweekly.com
		href: "https://hackathonweekly.feishu.cn/wiki/WQ7EwFC7BijePAkMkAHcajkNnae",
		external: true,
		badge: null,
	},
	{
		title: "加入社区群聊",
		description: "加入周周黑客松在各个城市的分部，与小伙伴们一起组队做 MVP",
		icon: Users,
		href: "https://join.hackathonweekly.com",
		external: true,
		badge: null,
	},
	{
		title: "社区可用场地汇总",
		description: "查看周周黑客松在各个城市的可用场地，预约会议和协作空间",
		icon: Video,
		href: "https://space.hackathonweekly.com",
		external: true,
		badge: null,
	},
	{
		title: "资源库",
		description: "开发工具、模板、代码片段等实用资源",
		icon: Settings,
		href: "https://tools.hackathonweekly.com",
		external: true,
		badge: null,
	},
	{
		title: "社区报销申请",
		description: "填写活动报销单，申请报销资金",
		icon: DollarSign,
		href: "https://hackathonweekly.feishu.cn/share/base/form/shrcnSg2UVWbBqh6qV4xwSHPi1c",
		external: false,
		badge: "会员",
	},
];

export function ToolsGrid() {
	return (
		<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
			{tools.map((tool, index) => {
				const Icon = tool.icon;
				const content = (
					<Card
						key={index}
						className={`group relative overflow-hidden transition-all duration-200 hover:shadow-lg hover:-translate-y-1 ${
							tool.highlighted
								? "border-2 border-blue-300 bg-blue-50/30 shadow-md"
								: ""
						}`}
					>
						<CardHeader className="pb-3">
							<div className="flex items-center justify-between">
								<div className="flex items-center space-x-3">
									<div
										className={`flex h-10 w-10 items-center justify-center rounded-lg ${
											tool.highlighted
												? "bg-blue-100"
												: "bg-primary/10"
										}`}
									>
										<Icon
											className={`h-5 w-5 ${
												tool.highlighted
													? "text-blue-600"
													: "text-primary"
											}`}
										/>
									</div>
									<div>
										<CardTitle
											className={`text-lg ${
												tool.highlighted
													? "text-blue-900 font-bold"
													: ""
											}`}
										>
											{tool.title}
										</CardTitle>
									</div>
								</div>
								{tool.badge && (
									<span
										className={`absolute top-4 right-4 rounded-full px-2 py-1 text-xs font-medium ${
											tool.highlighted
												? "bg-blue-100 text-blue-700"
												: "bg-primary/10 text-primary"
										}`}
									>
										{tool.badge}
									</span>
								)}
							</div>
						</CardHeader>
						<CardContent className="pt-0">
							<CardDescription className="mb-4 text-sm">
								{tool.description}
							</CardDescription>
							{tool.highlighted && (
								<div className="mb-3 p-2 bg-blue-100 rounded-lg text-xs text-blue-700 text-center">
									📄 支持直接下载PDF
								</div>
							)}
							<Button
								variant={
									tool.highlighted ? "default" : "outline"
								}
								className={`w-full ${
									tool.highlighted
										? "bg-blue-600 hover:bg-blue-700"
										: ""
								}`}
							>
								使用工具
							</Button>
						</CardContent>
					</Card>
				);

				return tool.external ? (
					<a
						key={tool.href}
						href={tool.href}
						target="_blank"
						rel="noopener noreferrer"
						className="block"
					>
						{content}
					</a>
				) : (
					<LocaleLink
						key={tool.href}
						href={tool.href}
						className="block"
					>
						{content}
					</LocaleLink>
				);
			})}
		</div>
	);
}
