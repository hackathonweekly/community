"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRightIcon, ExternalLinkIcon } from "lucide-react";
import Link from "next/link";

export function RealResults() {
	const stats = [
		{
			number: "5+",
			label: "座城市",
			description: "北上广深杭，每个周末都有活动",
		},
		{
			number: "6000+",
			label: "名成员",
			description: "真实活跃创造者，不是僵尸粉",
		},
		{
			number: "200+",
			label: "场活动",
			description: "平均每周 3-4 场，从未间断",
		},
		{
			number: "100+",
			label: "个项目",
			description: "从想法走向可用产品，部分已获融资",
		},
	];

	const timeline = [
		{ date: "2024.05", event: "社区成立" },
		{ date: "2024.06", event: "首批 50+ 创造者加入" },
		{ date: "2024.08", event: "ShipAny 首发 4 小时破万刀" },
		{ date: "2024.10", event: "映壳获得百万级融资" },
		{ date: "2024.12", event: "Mighty AI 获奇绩创坛投资" },
		{ date: "2025.01", event: "扩展到 5+ 城市" },
		{ date: "2025.03", event: "社区官网上线（也是 AI 共创作品）" },
	];

	const projects = [
		{
			name: "ShipAny",
			description: "AI SaaS 开发框架",
			founder: "Idoubi（2024年第二期成员）",
			story: [
				"📅 2024.06：在黑客松认识现在的合伙人",
				"🎤 2024.07-12：在 5 次 DemoShow 持续分享，根据反馈迭代",
				"🚀 2024.08：Product Hunt 首发，4小时破万刀",
				"💝 现在：作为常驻嘉宾，帮助新成员避坑",
			],
			data: "300+ 客户购买，其中 50+ 来自社区推荐",
			link: "https://shipany.com",
		},
		{
			name: "映壳",
			description: "墨水屏手机壳",
			founder: "文龙（2024年第五期成员，社区早期共创者）",
			story: [
				"📅 2024.07：在 Demo Show 展示原型，当场获得日本友人 100 个订单",
				"🤝 2024.08：社区帮助对接日本销售渠道",
				"💰 2024.10：获得百万级融资",
				"🌍 现在：已在多个国家上市，持续回馈社区",
			],
			data: "社区价值：从技术到商业模式的全程陪伴",
			link: "#",
		},
		{
			name: "Mighty AI",
			description: "Agent 驱动的 IoT 生态",
			founder: "Jojo（2024年第八期成员，社区早期共创者）",
			story: [
				"📅 2024.09：在黑客松完成早期原型",
				"🎤 2024.10：通过工坊在深圳发掘和孵化新型智能硬件",
				"🚀 2024.12：被 Cursor 团队点赞，获得奇绩创坛投资",
				"💝 现在：已连结十余家新兴硬件厂商",
			],
			data: "为智能硬件提供记忆共享、思考统一、协同行动和自主进化能力",
			link: "#",
		},
	];

	return (
		<section
			id="results"
			className="py-20 md:py-28 bg-muted/30 relative scroll-mt-20"
		>
			{/* Background decoration */}
			<div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[200px] sm:w-[600px] sm:h-[300px] lg:w-[800px] lg:h-[400px] rounded-full bg-gradient-to-r from-purple-400/10 to-purple-300/5 opacity-60 blur-[120px]" />

			<div className="container px-4 md:px-6 relative z-10">
				{/* Header */}
				<div className="text-center mb-16 md:mb-20">
					<div className="mb-6 md:mb-8 flex justify-center">
						<div className="inline-flex items-center rounded-full bg-purple-100 px-3 py-1.5 md:px-5 md:py-2 border border-purple-300">
							<span className="text-purple-700 font-medium text-xs md:text-sm">
								📊 用数据说话
							</span>
						</div>
					</div>

					<h2 className="text-4xl md:text-6xl font-bold leading-tight mb-6">
						不只是纸上谈兵
						<span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-blue-500 block mt-2">
							他们在这里完成了从 0 到 1
						</span>
					</h2>
				</div>

				{/* Stats */}
				<div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16 md:mb-20">
					{stats.map((stat, index) => (
						<Card
							key={index}
							className="border-0 shadow-xl bg-white text-center"
						>
							<CardContent className="p-6">
								<div className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-blue-500 mb-2">
									{stat.number}
								</div>
								<div className="text-lg md:text-xl font-bold text-foreground mb-2">
									{stat.label}
								</div>
								<p className="text-sm text-muted-foreground">
									{stat.description}
								</p>
							</CardContent>
						</Card>
					))}
				</div>

				{/* Timeline */}
				<div className="mb-16 md:mb-20">
					<h3 className="text-2xl md:text-3xl font-bold text-center mb-8">
						成果时间轴
					</h3>
					<div className="relative">
						{/* Timeline line */}
						<div className="absolute left-1/2 transform -translate-x-1/2 h-full w-1 bg-gradient-to-b from-purple-500 to-blue-500 hidden md:block" />

						<div className="space-y-8">
							{timeline.map((item, index) => (
								<div
									key={index}
									className={`flex items-center gap-4 ${
										index % 2 === 0
											? "md:flex-row"
											: "md:flex-row-reverse"
									}`}
								>
									<div
										className={`flex-1 ${
											index % 2 === 0
												? "md:text-right"
												: "md:text-left"
										}`}
									>
										<Card className="inline-block border-0 shadow-lg bg-white">
											<CardContent className="p-4">
												<div className="font-bold text-purple-600 mb-1">
													{item.date}
												</div>
												<div className="text-sm text-foreground">
													{item.event}
												</div>
											</CardContent>
										</Card>
									</div>
									<div className="w-4 h-4 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex-shrink-0 z-10 hidden md:block" />
									<div className="flex-1 hidden md:block" />
								</div>
							))}
						</div>
					</div>
				</div>

				{/* Featured projects */}
				<div>
					<h3 className="text-2xl md:text-3xl font-bold text-center mb-8">
						明星项目：社区陪伴故事
					</h3>
					<div className="grid lg:grid-cols-3 gap-8">
						{projects.map((project, index) => (
							<Card
								key={index}
								className="border-0 shadow-xl hover:shadow-2xl transition-all duration-300 bg-white"
							>
								<CardContent className="p-6">
									<div className="mb-4">
										<h4 className="text-xl font-bold text-foreground mb-1">
											{project.name}
										</h4>
										<p className="text-sm text-muted-foreground mb-2">
											{project.description}
										</p>
										<p className="text-xs text-muted-foreground">
											{project.founder}
										</p>
									</div>

									<div className="mb-4">
										<h5 className="text-sm font-bold text-foreground mb-2">
											社区陪伴故事：
										</h5>
										<ul className="space-y-2">
											{project.story.map((step, idx) => (
												<li
													key={idx}
													className="text-xs text-foreground"
												>
													{step}
												</li>
											))}
										</ul>
									</div>

									<div className="bg-purple-50 border border-purple-100 rounded-lg p-3 mb-4">
										<p className="text-xs text-purple-900">
											<span className="font-medium">
												📊 数据：
											</span>
											{project.data}
										</p>
									</div>

									{project.link !== "#" && (
										<Button
											variant="outline"
											size="sm"
											className="w-full"
											asChild
										>
											<Link
												href={project.link}
												target="_blank"
												rel="noopener noreferrer"
											>
												访问项目
												<ExternalLinkIcon className="ml-2 w-4 h-4" />
											</Link>
										</Button>
									)}
								</CardContent>
							</Card>
						))}
					</div>
				</div>

				{/* Bottom CTA */}
				<div className="text-center mt-16">
					<Button
						size="lg"
						className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white"
						asChild
					>
						<Link href="/projects">
							查看更多项目案例
							<ArrowRightIcon className="ml-2 w-5 h-5" />
						</Link>
					</Button>
				</div>
			</div>
		</section>
	);
}
