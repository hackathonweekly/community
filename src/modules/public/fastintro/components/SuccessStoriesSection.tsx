"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StarIcon } from "lucide-react";
import Image from "next/image";

export function SuccessStoriesSection() {
	const caseStudies = [
		{
			name: "ShipAny",
			tag: "AI SaaS",
			description: "功能完善的 AI SaaS 开发框架",
			achievement: "首发 4 小时收入破万刀，300+ 客户购买",
			highlight: "首发破万刀",
			image: "/images/projects/shipany.jpg",
		},
		{
			name: "映壳",
			tag: "硬件创新",
			description: "墨水屏灵动副屏手机壳",
			achievement: "获得百万级融资，在社区活动中当场获得 100 个订单",
			highlight: "百万融资",
			image: "/images/projects/yingke.jpg",
		},
		{
			name: "社区官网",
			tag: "社区产品",
			description: "hackathonweekly.com",
			achievement: "社区成员用 AI 编程工具一个月从 0 到 1 完成开发并上线",
			highlight: "AI 编程",
			image: "/images/projects/hackweek.jpg",
		},
	];

	return (
		<section className="py-20 md:py-28 bg-gradient-to-b from-yellow-50/50 to-background relative overflow-hidden">
			{/* Subtle background decoration */}
			<div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] lg:w-[900px] lg:h-[450px] rounded-full bg-gradient-to-r from-yellow-400/10 to-orange-400/5 opacity-60 blur-[120px]" />

			<div className="container relative z-10 px-4 md:px-6">
				{/* Section Header */}
				<div className="text-center mb-16">
					<div className="mb-6 flex justify-center">
						<div className="inline-flex items-center rounded-full bg-yellow-100 px-5 py-2 border border-yellow-300">
							<StarIcon className="w-4 h-4 mr-2 text-yellow-700 fill-yellow-700" />
							<span className="text-yellow-700 font-medium text-sm">
								真实成果
							</span>
						</div>
					</div>

					<h2 className="text-4xl md:text-6xl font-bold leading-tight mb-6">
						<span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 to-orange-500">
							他们创造了什么
						</span>
					</h2>

					<p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
						100+ 个从 0 到 1 的项目在这里诞生
					</p>
				</div>

				{/* Case Studies - Compact Version for Fast Intro */}
				<div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
					{caseStudies.map((project) => (
						<Card
							key={project.name}
							className="group border-2 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 overflow-hidden"
						>
							<CardContent className="p-0">
								{/* Project Image */}
								<div className="relative h-40 overflow-hidden">
									<Image
										src={project.image}
										alt={project.name}
										fill
										className="object-cover group-hover:scale-105 transition-transform duration-300"
										sizes="(max-width: 768px) 100vw, 33vw"
									/>
									<div className="absolute top-3 right-3">
										<div className="text-xs font-bold text-purple-600 bg-purple-100 px-3 py-1 rounded-full">
											{project.highlight}
										</div>
									</div>
								</div>

								<div className="p-6">
									{/* Project Header */}
									<div className="mb-3">
										<h4 className="text-xl font-bold text-foreground mb-2 flex items-center gap-2">
											{project.name}
											<StarIcon className="w-4 h-4 text-yellow-500 fill-yellow-500" />
										</h4>
										<Badge
											variant="secondary"
											className="mb-2"
										>
											{project.tag}
										</Badge>
									</div>

									{/* Description */}
									<p className="text-sm text-muted-foreground mb-3">
										{project.description}
									</p>

									{/* Achievement */}
									<div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded">
										<p className="text-xs font-semibold text-foreground">
											✨ {project.achievement}
										</p>
									</div>
								</div>
							</CardContent>
						</Card>
					))}
				</div>

				{/* Bottom Message */}
				<div className="mt-16 text-center max-w-4xl mx-auto">
					<div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-2xl p-8">
						<p className="text-xl md:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 to-orange-500 mb-3">
							有商业成功的，有拿到融资的
						</p>
						<p className="text-base md:text-lg text-muted-foreground">
							也有纯粹为了创造快乐的
						</p>
					</div>
				</div>
			</div>
		</section>
	);
}
