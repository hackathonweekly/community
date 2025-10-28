"use client";

import { Card, CardContent } from "@/components/ui/card";
import { CalendarOffIcon, MapPinOffIcon, UsersIcon } from "lucide-react";

export function PainPointsSection() {
	const painPoints = [
		{
			icon: UsersIcon,
			title: "难找伙伴",
			description: "创造时孤军奋战，找不到能并肩作战的同行者",
		},
		{
			icon: CalendarOffIcon,
			title: "难以持续",
			description: "活动后曲终人散，缺少持续陪伴和反馈机制",
		},
		{
			icon: MapPinOffIcon,
			title: "难以落地",
			description: "起步时迷茫无措，找不到从零到一的可行路径",
		},
	];

	return (
		<section
			id="pain-points"
			className="py-20 md:py-28 bg-muted/30 relative overflow-hidden"
		>
			{/* Subtle background decoration */}
			<div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] lg:w-[900px] lg:h-[450px] rounded-full bg-gradient-to-r from-red-400/10 to-red-300/5 opacity-60 blur-[120px]" />

			<div className="container relative z-10 px-4 md:px-6">
				{/* Section Header */}
				<div className="text-center mb-16">
					<div className="mb-6 flex justify-center">
						<div className="inline-flex items-center rounded-full bg-red-100 px-5 py-2 border border-red-300">
							<span className="text-red-700 font-medium text-sm">
								为什么是现在
							</span>
						</div>
					</div>

					<h2 className="text-4xl md:text-6xl font-bold leading-tight mb-6">
						创造者面临的
						<span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500 block">
							三大困境
						</span>
					</h2>

					<p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
						在 AI 技术浪潮席卷而来的今天，灵感似乎无处不在
						<br />
						但将一个想法真正变为现实，却依然是一条充满挑战的道路
					</p>
				</div>

				{/* Pain Points Cards */}
				<div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
					{painPoints.map((point, index) => (
						<Card
							key={point.title}
							className="group border-2 border-red-200 bg-red-50/50 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
						>
							<CardContent className="p-8">
								{/* Icon and Title */}
								<div className="mb-4 flex flex-col items-start">
									<div className="p-4 rounded-2xl bg-red-100 border border-red-200 inline-flex items-center justify-center mb-3">
										<point.icon className="w-8 h-8 text-red-600" />
									</div>
									<h3 className="text-xl font-bold text-foreground">
										{point.title}
									</h3>
								</div>

								{/* Description */}
								<p className="text-muted-foreground leading-relaxed">
									{point.description}
								</p>
							</CardContent>
						</Card>
					))}
				</div>
			</div>
		</section>
	);
}
