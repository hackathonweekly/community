"use client";

import { Card, CardContent } from "@/components/ui/card";
import {
	CoffeeIcon,
	PresentationIcon,
	RocketIcon,
	TargetIcon,
	UsersIcon,
} from "lucide-react";
import Image from "next/image";

export function WhatWeDoSection() {
	const mainActivities = [
		{
			icon: RocketIcon,
			title: "迷你黑客松 / 共学工作坊",
			frequency: "每周一次",
			duration: "8-72 小时",
			goal: "想法 → MVP",
			description:
				"围绕 AI 应用主题快速共创，强调交付可演示、可体验的原型。每周由社区成员志愿发起！",
			themes: [
				"AI 编程",
				"Cursor",
				"手搓桌面机器人",
				"Sora2",
				"AI 创意周边",
				"AI 3D 打印",
				"小程序",
			],
			image: "/images/events/hack00003.jpg",
			color: "purple",
		},
		{
			icon: PresentationIcon,
			title: "Demo Show / 客厅 Demo 局",
			frequency: "每月一次",
			goal: "MVP → 用户反馈",
			description:
				"为 30% 完成度的早期项目提供展示舞台。像在客厅里聊天一样展示作品，无评判，只有鼓励与反馈",
			themes: ["硬件产品", "独立开发", "出海项目", "AI 应用"],
			image: "/images/events/demo00001.jpg",
			color: "blue",
		},
	];

	const moreActivities = [
		{
			icon: CoffeeIcon,
			title: "周末共创日",
			description: "带着项目线下聚集，一起办公，专注产出，促进跨界合作",
			tag: "持续陪伴",
		},
		{
			icon: UsersIcon,
			title: "AI 酒馆",
			description: "轻松氛围下的思想碰撞和社交活动",
			tag: "社区氛围",
		},
		{
			icon: TargetIcon,
			title: "社区不定期聚会活动",
			description: "增进成员之间的联系和信任",
			tag: "社区建设",
		},
	];

	return (
		<section className="py-16 md:py-20 bg-background relative overflow-hidden">
			{/* Subtle background decoration */}
			<div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] lg:w-[900px] lg:h-[450px] rounded-full bg-gradient-to-r from-green-400/10 to-blue-400/5 opacity-60 blur-[120px]" />

			<div className="container relative z-10 px-4 md:px-6">
				{/* Section Header */}
				<div className="text-center mb-12">
					<div className="mb-4 flex justify-center">
						<div className="inline-flex items-center rounded-full bg-green-100 px-5 py-2 border border-green-300">
							<span className="text-green-700 font-medium text-sm">
								我们做什么
							</span>
						</div>
					</div>

					<h2 className="text-3xl md:text-5xl font-bold leading-tight mb-4">
						<span className="text-transparent bg-clip-text bg-gradient-to-r from-green-500 to-blue-500">
							核心活动
						</span>
					</h2>

					<p className="text-base md:text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
						每周由社区成员志愿发起，从想法到产品，再到真实用户反馈的完整旅程
					</p>
				</div>

				{/* Main Activities - 一个屏幕一块信息 */}
				<div className="grid md:grid-cols-2 gap-6 max-w-6xl mx-auto mb-12">
					{mainActivities.map((activity) => {
						const colorClasses = {
							purple: {
								badge: "bg-purple-500",
								tag: "bg-purple-100 text-purple-600 border-purple-200",
								icon: "bg-purple-100 border-purple-200 text-purple-600",
							},
							blue: {
								badge: "bg-blue-500",
								tag: "bg-blue-100 text-blue-600 border-blue-200",
								icon: "bg-blue-100 border-blue-200 text-blue-600",
							},
						};

						const colors =
							colorClasses[
								activity.color as keyof typeof colorClasses
							];

						return (
							<Card
								key={activity.title}
								className="group overflow-hidden border-2 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
							>
								<CardContent className="p-0">
									{/* Activity Image */}
									<div className="relative h-36 overflow-hidden">
										<Image
											src={activity.image}
											alt={activity.title}
											fill
											className="object-cover group-hover:scale-105 transition-transform duration-300"
											sizes="(max-width: 768px) 100vw, 50vw"
										/>
										<div
											className={`absolute top-4 right-4 ${colors.badge} text-white px-3 py-1 rounded-full text-sm font-medium`}
										>
											{activity.frequency}
										</div>
									</div>

									{/* Activity Content */}
									<div className="p-5">
										<div className="flex items-center gap-3 mb-2">
											<div
												className={`p-2 rounded-lg border ${colors.icon}`}
											>
												<activity.icon className="w-5 h-5" />
											</div>
											<h4 className="text-base font-bold text-foreground">
												{activity.title}
											</h4>
										</div>

										<div className="mb-2">
											<span
												className={`inline-flex text-sm font-medium px-3 py-1 rounded-full border ${colors.tag}`}
											>
												{activity.goal}
											</span>
										</div>

										{activity.duration && (
											<p className="text-xs text-muted-foreground mb-2">
												⏱️ 时长：{activity.duration}
											</p>
										)}

										<p className="text-sm text-muted-foreground leading-relaxed mb-3">
											{activity.description}
										</p>

										{/* Themes */}
										<div className="flex flex-wrap gap-2">
											{activity.themes.map((theme) => (
												<span
													key={theme}
													className="text-xs bg-muted px-2 py-1 rounded"
												>
													{theme}
												</span>
											))}
										</div>
									</div>
								</CardContent>
							</Card>
						);
					})}
				</div>

				{/* More Activities - 独立一个屏幕 */}
				<div className="max-w-5xl mx-auto">
					<h3 className="text-xl md:text-3xl font-bold text-center mb-3">
						<span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-blue-500">
							更多活动形式
						</span>
					</h3>
					<p className="text-sm md:text-base text-muted-foreground text-center mb-8">
						丰富多样的活动，满足不同阶段的需求
					</p>
					<div className="grid md:grid-cols-3 gap-6">
						{moreActivities.map((activity) => (
							<Card
								key={activity.title}
								className="border-2 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
							>
								<CardContent className="p-5 text-center">
									<div className="flex justify-center mb-2">
										<div className="p-3 rounded-full bg-purple-100 border border-purple-200">
											<activity.icon className="w-6 h-6 text-purple-600" />
										</div>
									</div>
									<h4 className="text-base font-bold text-foreground mb-2">
										{activity.title}
									</h4>
									<span className="inline-block text-xs font-medium px-3 py-1 rounded-full bg-purple-100 text-purple-600 mb-2">
										{activity.tag}
									</span>
									<p className="text-sm text-muted-foreground">
										{activity.description}
									</p>
								</CardContent>
							</Card>
						))}
					</div>
				</div>

				{/* Stats Banner */}
				<div className="mt-12 text-center bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-200 rounded-2xl p-6 max-w-4xl mx-auto">
					<p className="text-xl md:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-500 to-blue-500">
						已累计举办 200+ 场活动
					</p>
					<p className="text-sm md:text-base text-muted-foreground mt-2">
						从想法到产品的完整陪伴体系
					</p>
				</div>
			</div>
		</section>
	);
}
