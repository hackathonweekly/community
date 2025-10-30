"use client";

import { Card, CardContent } from "@/components/ui/card";
import {
	BuildingIcon,
	UsersIcon,
	CalendarIcon,
	RocketIcon,
} from "lucide-react";
import Image from "next/image";

export function WhoWeAreSection() {
	const stats = [
		{
			icon: BuildingIcon,
			number: "5+",
			label: "覆盖城市",
			description: "深圳、杭州、北京、上海、广州",
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
			description: "累计举办场次",
		},
		{
			icon: RocketIcon,
			number: "100+",
			label: "陪伴项目",
			description: "从想法到原型",
		},
	];

	return (
		<section className="py-20 md:py-28 bg-muted/30 relative overflow-hidden">
			{/* Subtle background decoration */}
			<div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] lg:w-[900px] lg:h-[450px] rounded-full bg-gradient-to-r from-purple-400/10 to-purple-300/5 opacity-60 blur-[120px]" />

			<div className="container relative z-10 px-4 md:px-6">
				{/* Section Header */}
				<div className="text-center mb-16">
					<div className="mb-6 flex justify-center">
						<div className="inline-flex items-center rounded-full bg-purple-100 px-5 py-2 border border-purple-300">
							<span className="text-purple-700 font-medium text-sm">
								我们是谁
							</span>
						</div>
					</div>

					<h2 className="text-4xl md:text-6xl font-bold leading-tight mb-6">
						<span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-blue-500">
							AI 产品创造者社区
						</span>
					</h2>

					<p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed mb-4">
						用 AI 帮助千万创造者
						<br />
						打造有价值、有意义、有趣的产品
					</p>

					{/* Core Values - Simple version */}
					<div className="flex justify-center items-center gap-3 mt-8">
						<div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-100 border border-red-300">
							<span className="text-red-600 font-semibold">
								❤️ 爱
							</span>
						</div>
						<div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 border border-blue-300">
							<span className="text-blue-600 font-semibold">
								✨ 自由
							</span>
						</div>
						<div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-100 border border-purple-300">
							<span className="text-purple-600 font-semibold">
								🔧 创造
							</span>
						</div>
					</div>
				</div>

				{/* Stats Grid */}
				<div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-6xl mx-auto mb-12">
					{stats.map((stat) => (
						<Card
							key={stat.label}
							className="border-2 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-background/50"
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

				{/* Community Photos */}
				<div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
					<Card className="overflow-hidden border-2 hover:shadow-lg transition-all duration-300">
						<CardContent className="p-0">
							<div className="relative h-64">
								<Image
									src="/images/events/gdc00007.jpg"
									alt="社区集体照"
									fill
									className="object-cover"
									sizes="(max-width: 768px) 100vw, 50vw"
								/>
							</div>
							<div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50">
								<p className="text-sm text-center font-medium text-muted-foreground">
									创造者齐聚一堂
								</p>
							</div>
						</CardContent>
					</Card>
					<Card className="overflow-hidden border-2 hover:shadow-lg transition-all duration-300">
						<CardContent className="p-0">
							<div className="relative h-64">
								<Image
									src="/images/events/meet00006.jpg"
									fill
									className="object-cover"
									sizes="(max-width: 768px) 100vw, 50vw"
								/>
							</div>
							<div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50">
								<p className="text-sm text-center font-medium text-muted-foreground">
									轻松愉快的线下氛围
								</p>
							</div>
						</CardContent>
					</Card>
				</div>
			</div>
		</section>
	);
}
