"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
	ArrowRightIcon,
	CalendarIcon,
	PresentationIcon,
	RocketIcon,
	WrenchIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export function SolutionsSection() {
	const activities = [
		{
			icon: RocketIcon,
			title: "迷你黑客松",
			frequency: "每月一次",
			description:
				"围绕 AI 应用主题开展 8-72 小时的快速共创，强调交付可演示、可体验的 MVP。这是将想法变为现实的第一步。",
			image: "/images/events/hack00003.jpg",
			highlight: "想法 → MVP",
		},
		{
			icon: PresentationIcon,
			title: "客厅 Demo 局",
			frequency: "每月一次",
			description:
				"为完成度仅有 30% 的早期项目提供展示舞台。像在客厅里聊天一样展示作品，在这里没有评判，只有鼓励与深度反馈。",
			image: "/images/events/demo00001.jpg",
			highlight: "MVP → 用户反馈",
		},
		{
			icon: CalendarIcon,
			title: "周末共创日",
			frequency: "不定期",
			description:
				"创造者们带着自己的项目线下聚集。在轻松的氛围中专注产出，也在不经意的交流中碰撞出新的火花，促进跨界合作。",
			image: "/images/events/meet00006.jpg",
			highlight: "持续陪伴",
		},
		{
			icon: WrenchIcon,
			title: "主题工作坊",
			frequency: "不定期",
			description:
				"与生态伙伴共创不同主题，补足设计、增长、AI 工具等关键能力，让项目更快进入实战节奏。",
			image: "/images/events/demo00003.jpg",
			highlight: "能力提升",
		},
	];

	const supportMechanisms = [
		{
			title: "Build in Public",
			status: "运行中",
			description:
				"鼓励成员在线上持续分享产品构建过程，吸引同好、收集反馈、建立个人品牌。",
		},
		{
			title: "数字基础设施",
			status: "建设中",
			description:
				"官网、知识库、活跃项目数据库、资源图谱正在不断完善，帮助成员快速找到「人、事、工具」。",
		},
		{
			title: "黑客松周刊",
			status: "建设中",
			description:
				"定期发布社区内外的黑客松活动信息、优质创造故事和技术分享，沉淀知识，连接更广泛的生态。",
		},
	];

	return (
		<section className="py-20 md:py-28 bg-background relative overflow-hidden">
			{/* Subtle background decoration */}
			<div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] lg:w-[900px] lg:h-[450px] rounded-full bg-gradient-to-r from-green-400/10 to-green-300/5 opacity-60 blur-[120px]" />

			<div className="container relative z-10 px-4 md:px-6">
				{/* Section Header */}
				<div className="text-center mb-16">
					<div className="mb-6 flex justify-center">
						<div className="inline-flex items-center rounded-full bg-green-100 px-5 py-2 border border-green-300">
							<span className="text-green-700 font-medium text-sm">
								我们的解决方案
							</span>
						</div>
					</div>

					<h2 className="text-4xl md:text-6xl font-bold leading-tight mb-6">
						完整支持体系
						<span className="text-transparent bg-clip-text bg-gradient-to-r from-green-500 to-blue-500 block">
							从想法到产品的全程陪伴
						</span>
					</h2>

					<p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
						我们不只是举办活动，而是构建了一套贯穿「灵感 → MVP →
						首批用户 → 持续增长」全过程的、可复制的创造者支持体系
					</p>
				</div>

				{/* Activity Cards */}
				<div className="mb-16">
					<h3 className="text-2xl md:text-3xl font-bold text-center mb-10">
						4 大活动类型{" "}
						<span className="text-muted-foreground text-xl">
							（已累计 200+ 场）
						</span>
					</h3>
					<div className="grid md:grid-cols-2 gap-6 max-w-6xl mx-auto">
						{activities.map((activity) => (
							<Card
								key={activity.title}
								className="group overflow-hidden border-2 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
							>
								<CardContent className="p-0">
									{/* Activity Image */}
									<div className="relative h-48 overflow-hidden">
										<Image
											src={activity.image}
											alt={activity.title}
											fill
											className="object-cover group-hover:scale-105 transition-transform duration-300"
											sizes="(max-width: 768px) 100vw, 50vw"
										/>
										<div className="absolute top-4 right-4 bg-purple-500 text-white px-3 py-1 rounded-full text-sm font-medium">
											{activity.frequency}
										</div>
									</div>

									{/* Activity Content */}
									<div className="p-6">
										<div className="flex items-center gap-3 mb-3">
											<div className="p-2 rounded-lg bg-purple-100 border border-purple-200">
												<activity.icon className="w-5 h-5 text-purple-600" />
											</div>
											<h4 className="text-xl font-bold text-foreground">
												{activity.title}
											</h4>
											<span className="ml-auto text-sm font-medium text-purple-600 bg-purple-100 px-2 py-1 rounded">
												{activity.highlight}
											</span>
										</div>
										<p className="text-muted-foreground leading-relaxed">
											{activity.description}
										</p>
									</div>
								</CardContent>
							</Card>
						))}
					</div>
				</div>

				{/* Support Mechanisms */}
				<div className="mt-20">
					<h3 className="text-2xl md:text-3xl font-bold text-center mb-10">
						常态化陪伴机制
					</h3>
					<div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
						{supportMechanisms.map((mechanism) => (
							<Card
								key={mechanism.title}
								className="border-2 hover:shadow-lg transition-all duration-300"
							>
								<CardContent className="p-6">
									<div className="flex items-center justify-between mb-3">
										<h4 className="text-lg font-bold text-foreground">
											{mechanism.title}
										</h4>
										<span
											className={`text-xs font-medium px-2 py-1 rounded ${
												mechanism.status === "运行中"
													? "bg-green-100 text-green-700"
													: "bg-blue-100 text-blue-700"
											}`}
										>
											{mechanism.status}
										</span>
									</div>
									<p className="text-sm text-muted-foreground leading-relaxed">
										{mechanism.description}
									</p>
								</CardContent>
							</Card>
						))}
					</div>
				</div>

				{/* Bottom CTA */}
				<div className="text-center mt-16">
					<Button
						size="lg"
						className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white"
						asChild
					>
						<Link href="/events">
							查看即将举办的活动
							<ArrowRightIcon className="ml-2 w-5 h-5" />
						</Link>
					</Button>
				</div>
			</div>
		</section>
	);
}
