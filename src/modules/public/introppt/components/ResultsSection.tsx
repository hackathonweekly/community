"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
	TrendingUpIcon,
	UsersIcon,
	CalendarIcon,
	RocketIcon,
	BuildingIcon,
	StarIcon,
} from "lucide-react";
import Image from "next/image";

export function ResultsSection() {
	const stats = [
		{
			icon: BuildingIcon,
			number: "5+",
			label: "覆盖城市",
			description: "深圳、杭州、北京、上海、广州等",
		},
		{
			icon: UsersIcon,
			number: "6000+",
			label: "社群成员",
			description: "数万活动参与人次",
		},
		{
			icon: CalendarIcon,
			number: "200+",
			label: "线下活动",
			description: "黑客松、Demo Show 和工作坊",
		},
		{
			icon: RocketIcon,
			number: "100+",
			label: "孵化项目",
			description: "从想法走向可体验的原型",
		},
	];

	const caseStudies = [
		{
			name: "ShipAny",
			tag: "AI SaaS",
			description: "功能完善的 AI SaaS 开发框架",
			achievement: "首发 4 小时收入破万刀，300+ 客户购买",
			founder: "Idoubi - 2024 年第二期活动成员",
			role: "DemoDay 常驻嘉宾持续在社区分享并获得反馈支持",
			highlight: "首发破万刀",
			image: "/images/projects/shipany.jpg",
		},
		{
			name: "映壳",
			tag: "硬件创新",
			description: "基于墨水屏及 NFC 取电技术的灵动副屏手机壳",
			achievement: "获得百万级融资，现已在多个国家和地区上市",
			founder: "文龙 - 2024 年第五期活动成员、社区早期共创者",
			role: "项目在社区活动中当场获得日本友人 100 个订单并建立日本销售渠道",
			highlight: "百万融资",
			image: "/images/projects/yingke.jpg",
		},
		{
			name: "Mighty AI",
			tag: "IoT 生态",
			description: "Agent 驱动的 IoT 生态",
			achievement: "被 Cursor 团队点赞，获得奇绩创坛投资",
			founder: "Jojo - 2024 年第八期活动成员、社区早期共创者",
			role: "通过工坊在深圳发掘和孵化新型智能硬件，已连结十余家新兴硬件厂商",
			highlight: "奇绩投资",
			image: "/images/projects/mighty.jpg",
		},
		{
			name: "社区官网",
			tag: "社区产品",
			description: "hackathonweekly.com",
			achievement:
				"社区成员通过 AI 编程工具，在一个月内从 0 到 1 完成开发并上线",
			founder: "社区共创",
			role: "集成活动管理、项目展示、成员档案等核心功能，是社区「用 AI 快速创造」理念的真实实践",
			highlight: "AI 编程",
			image: "/images/projects/hackweek.jpg",
		},
	];

	return (
		<section className="py-20 md:py-28 bg-gradient-to-b from-purple-50/50 to-background relative overflow-hidden">
			{/* Subtle background decoration */}
			<div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] lg:w-[900px] lg:h-[450px] rounded-full bg-gradient-to-r from-yellow-400/10 to-yellow-300/5 opacity-60 blur-[120px]" />

			<div className="container relative z-10 px-4 md:px-6">
				{/* Section Header */}
				<div className="text-center mb-16">
					<div className="mb-6 flex justify-center">
						<div className="inline-flex items-center rounded-full bg-yellow-100 px-5 py-2 border border-yellow-300">
							<TrendingUpIcon className="w-4 h-4 mr-2 text-yellow-700" />
							<span className="text-yellow-700 font-medium text-sm">
								用数据和案例说话
							</span>
						</div>
					</div>

					<h2 className="text-4xl md:text-6xl font-bold leading-tight mb-6">
						真实成果
						<span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 to-orange-500 block">
							看看他们创造了什么
						</span>
					</h2>
				</div>

				{/* Stats Grid */}
				<div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-20 max-w-6xl mx-auto">
					{stats.map((stat) => (
						<Card
							key={stat.label}
							className="border-2 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
						>
							<CardContent className="p-6 text-center">
								<div className="flex justify-center mb-3">
									<div className="p-3 rounded-full bg-purple-100 border border-purple-200">
										<stat.icon className="w-6 h-6 text-purple-600" />
									</div>
								</div>
								<div className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-blue-500 mb-2">
									{stat.number}
								</div>
								<div className="text-sm font-semibold text-foreground mb-1">
									{stat.label}
								</div>
								<div className="text-xs text-muted-foreground">
									{stat.description}
								</div>
							</CardContent>
						</Card>
					))}
				</div>

				{/* Case Studies */}
				<div className="mb-16">
					<h3 className="text-2xl md:text-3xl font-bold text-center mb-10">
						明星项目案例
					</h3>
					<div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
						{caseStudies.map((project) => (
							<Card
								key={project.name}
								className="group border-2 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 overflow-hidden"
							>
								<CardContent className="p-0">
									{/* Project Image */}
									<div className="relative h-48 overflow-hidden">
										<Image
											src={project.image}
											alt={project.name}
											fill
											className="object-cover group-hover:scale-105 transition-transform duration-300"
											sizes="(max-width: 768px) 100vw, 50vw"
										/>
									</div>

									<div className="p-8">
										{/* Project Header */}
										<div className="flex items-start justify-between mb-4">
											<div>
												<h4 className="text-2xl font-bold text-foreground mb-2 flex items-center gap-2">
													{project.name}
													<StarIcon className="w-5 h-5 text-yellow-500 fill-yellow-500" />
												</h4>
												<Badge
													variant="secondary"
													className="mb-2"
												>
													{project.tag}
												</Badge>
											</div>
											<div className="text-right">
												<div className="text-sm font-bold text-purple-600 bg-purple-100 px-3 py-1 rounded-full">
													{project.highlight}
												</div>
											</div>
										</div>

										{/* Description */}
										<p className="text-muted-foreground mb-4">
											{project.description}
										</p>

										{/* Achievement */}
										<div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4 rounded">
											<p className="text-sm font-semibold text-foreground">
												✨ {project.achievement}
											</p>
										</div>

										{/* Founder */}
										<div className="text-sm text-muted-foreground mb-2">
											<span className="font-semibold text-foreground">
												创始人：
											</span>
											{project.founder}
										</div>

										{/* Role in community */}
										<div className="text-sm text-muted-foreground">
											<span className="font-semibold text-foreground">
												社区支持：
											</span>
											{project.role}
										</div>
									</div>
								</CardContent>
							</Card>
						))}
					</div>
				</div>

				{/* Ecosystem Partners */}
				<div className="text-center bg-purple-50 border-2 border-purple-200 rounded-2xl p-8 max-w-4xl mx-auto">
					<h3 className="text-xl md:text-2xl font-bold text-foreground mb-4">
						生态合作伙伴
					</h3>
					<p className="text-muted-foreground">
						与字节 TRAE、腾讯云 Agent 及 20+ AI
						创业公司、创新孵化器、政府单位建立合作关系
					</p>
				</div>
			</div>
		</section>
	);
}
