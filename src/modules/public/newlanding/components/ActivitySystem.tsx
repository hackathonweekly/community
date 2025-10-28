"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
	ArrowRightIcon,
	CalendarIcon,
	PresentationIcon,
	RocketIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export function ActivitySystem() {
	const activities = [
		{
			icon: RocketIcon,
			title: "想法变现实：8-72 小时冲刺",
			subtitle: "在这里找到伙伴，组队开发，当天就能看到成果",
			description:
				"你带想法来，我们帮你找设计师、开发者、产品经理。不是比赛，是共创。不追求完美，追求 MVP。已完成 50+ 场，100+ 个项目从这里起步",
			stats: "已完成 50+ 场",
			highlight: "【0→1】快速验证想法",
			href: "/events?type=hackathon",
			cta: "查看近期黑客松",
			image: "/images/events/hack00003.jpg",
		},
		{
			icon: PresentationIcon,
			title: "早期友好：30% 完成度就能分享",
			subtitle: "不怕产品还很糙，这里只有鼓励和建议",
			description:
				"和线下 DemoDay 不同，这里像在客厅聊天一样轻松。哪怕只有 PPT 或原型，也能获得真实用户的反馈。用鼓励的心态拥抱分享，在真诚中一起成长",
			stats: "每场 50+ 观众",
			highlight: "【30%→100%】获得反馈，找到用户",
			href: "/events?type=demo-inn",
			cta: "报名展示我的项目",
			image: "/images/events/demo00001.jpg",
		},
		{
			icon: CalendarIcon,
			title: "持续陪伴：每周见面的伙伴",
			subtitle: "不是一次性活动，而是长期的创造习惯",
			description:
				"每周末，带着自己的项目来线下聚集。在氛围中专注产出，在闲聊中碰撞火花。遇到困难随时交流，看到进展相互鼓励。时间久了，我们成了老朋友",
			stats: "平均 30+ 人参与",
			highlight: "【持续打磨】在氛围中提升效率",
			href: "/events?type=cowork",
			cta: "加入下次共创",
			image: "/images/events/meet00006.jpg",
		},
	];

	return (
		<section className="py-20 md:py-28 bg-background relative overflow-hidden">
			{/* Background decoration */}
			<div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[200px] sm:w-[600px] sm:h-[300px] lg:w-[800px] lg:h-[400px] rounded-full bg-gradient-to-r from-purple-400/10 to-purple-300/5 opacity-60 blur-[120px]" />

			<div className="container relative z-10 px-4 md:px-6">
				{/* Header */}
				<div className="text-center mb-16">
					<div className="mb-6 md:mb-8 flex justify-center">
						<div className="inline-flex items-center rounded-full bg-purple-100 px-3 py-1.5 md:px-5 md:py-2 border border-purple-300">
							<CalendarIcon className="w-4 h-4 mr-2 text-purple-700" />
							<span className="text-purple-700 font-medium text-xs md:text-sm">
								常规活动
							</span>
						</div>
					</div>

					<h2 className="text-4xl md:text-6xl font-bold leading-tight mb-6">
						不只是举办活动
						<span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-blue-500 block">
							而是构建完整支持体系
						</span>
					</h2>

					<p className="text-base md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
						从产品展示到技能学习，从主题黑客松到
						DemoShow，总有一款适合你
					</p>
				</div>

				{/* Activity cards */}
				<div className="grid lg:grid-cols-3 gap-8 md:gap-10 mb-16">
					{activities.map((activity) => (
						<Card
							key={activity.title}
							className="group overflow-hidden border-0 shadow-xl hover:shadow-2xl transition-all duration-300 h-full bg-card hover:-translate-y-1"
						>
							<CardContent className="p-0 h-full flex flex-col">
								{/* Activity Image */}
								<div className="relative h-48 w-full overflow-hidden">
									<Image
										src={activity.image}
										alt={activity.title}
										fill
										className="object-cover transition-transform duration-300 group-hover:scale-105"
									/>
									{/* Highlight badge */}
									<div className="absolute top-4 left-4">
										<div className="bg-purple-600 text-white text-xs font-medium px-3 py-1 rounded-full">
											{activity.highlight}
										</div>
									</div>
								</div>

								<div className="p-6 flex flex-col flex-1">
									{/* Icon and title */}
									<div className="flex items-start gap-4 mb-4">
										<div className="p-3 rounded-xl bg-purple-100 border border-purple-200 flex-shrink-0">
											<activity.icon className="w-6 h-6 text-purple-600" />
										</div>
										<div className="flex-1">
											<h3 className="text-lg font-bold text-foreground mb-1">
												{activity.title}
											</h3>
											<p className="text-sm text-purple-600 font-medium">
												{activity.subtitle}
											</p>
										</div>
									</div>

									{/* Description */}
									<p className="text-muted-foreground leading-relaxed mb-4 text-sm flex-1">
										{activity.description}
									</p>

									{/* Stats */}
									<div className="mb-4">
										<span className="text-xs font-medium text-muted-foreground bg-muted px-3 py-1 rounded-full">
											📊 {activity.stats}
										</span>
									</div>

									{/* CTA Button */}
									<Button
										className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white"
										asChild
										size="sm"
									>
										<Link href={activity.href}>
											{activity.cta}
										</Link>
									</Button>
								</div>
							</CardContent>
						</Card>
					))}
				</div>

				{/* Bottom info box */}
				<div className="max-w-4xl mx-auto">
					<div className="bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200 rounded-2xl p-6 md:p-8">
						<div className="text-center mb-6">
							<h3 className="text-xl md:text-2xl font-bold text-foreground mb-3">
								除了这些，我们还有...
							</h3>
							<p className="text-muted-foreground">
								完整的创造者支持体系，陪伴你从想法到产品
							</p>
						</div>

						<div className="grid sm:grid-cols-3 gap-4 text-center">
							<div className="bg-white rounded-lg p-4">
								<div className="text-2xl mb-2">📚</div>
								<h4 className="font-bold text-sm mb-1">
									知识库
								</h4>
								<p className="text-xs text-muted-foreground">
									从 0 到 1 的方法论
								</p>
							</div>
							<div className="bg-white rounded-lg p-4">
								<div className="text-2xl mb-2">🎓</div>
								<h4 className="font-bold text-sm mb-1">
									导师辅导
								</h4>
								<p className="text-xs text-muted-foreground">
									一对一解答疑惑
								</p>
							</div>
							<div className="bg-white rounded-lg p-4">
								<div className="text-2xl mb-2">🌐</div>
								<h4 className="font-bold text-sm mb-1">
									Build in Public
								</h4>
								<p className="text-xs text-muted-foreground">
									持续分享获得反馈
								</p>
							</div>
						</div>
					</div>
				</div>

				{/* Bottom CTA */}
				<div className="text-center mt-16">
					<div className="max-w-2xl mx-auto">
						<h3 className="text-2xl font-bold text-foreground mb-4">
							准备参与我们的活动吗？
						</h3>
						<p className="text-muted-foreground mb-8">
							关注我们的活动日历，第一时间获取活动信息
						</p>
						<Button
							size="lg"
							className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white"
							asChild
						>
							<Link href="/events">
								查看活动日历
								<ArrowRightIcon className="ml-2 w-5 h-5" />
							</Link>
						</Button>
					</div>
				</div>
			</div>
		</section>
	);
}
