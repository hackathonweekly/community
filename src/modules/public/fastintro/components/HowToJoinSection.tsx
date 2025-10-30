"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
	ArrowRightIcon,
	CalendarIcon,
	CheckCircle2Icon,
	GiftIcon,
	HeartIcon,
	UsersIcon,
} from "lucide-react";
import Link from "next/link";

export function HowToJoinSection() {
	const participationPath = [
		{
			step: "1",
			title: "继续参与活动",
			description: "参加我们的黑客松、Demo Show、周末共创日",
			icon: CalendarIcon,
			color: "blue",
		},
		{
			step: "2",
			title: "贡献你的力量",
			description: "担任志愿者或分享者，帮助社区成长",
			icon: HeartIcon,
			color: "purple",
		},
		{
			step: "3",
			title: "成为正式成员",
			description: "获得推荐，解锁更多资源和机会",
			icon: UsersIcon,
			color: "green",
		},
	];

	const memberRequirements = [
		{
			icon: CalendarIcon,
			text: "参与 2 次活动 + 担任志愿者/分享者",
		},
		{
			icon: UsersIcon,
			text: "获得 1 名社区成员推荐",
		},
		{
			icon: HeartIcon,
			text: "认同「爱·自由·创造」价值观",
		},
	];

	const memberBenefits = [
		{
			icon: "📚",
			title: "知识库基础版",
			description: "免费访问核心 AI 产品开发知识",
		},
		{
			icon: "💻",
			title: "社区网站代码",
			description: "获得非商用使用权限",
		},
		{
			icon: "🎯",
			title: "优先参与",
			description: "高价值活动、深度课程、导师辅导",
		},
		{
			icon: "🤝",
			title: "项目孵化",
			description: "获得资源支持和商业合作机会",
		},
		{
			icon: "🌐",
			title: "跨城网络",
			description: "连接全国各城市创造者资源",
		},
	];

	return (
		<section className="py-20 md:py-28 bg-gradient-to-b from-background to-purple-50/30 relative overflow-hidden">
			{/* Subtle background decoration */}
			<div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] lg:w-[900px] lg:h-[450px] rounded-full bg-gradient-to-r from-purple-400/10 to-blue-400/5 opacity-60 blur-[120px]" />

			<div className="container relative z-10 px-4 md:px-6">
				{/* Section Header */}
				<div className="text-center mb-16">
					<div className="mb-6 flex justify-center">
						<div className="inline-flex items-center rounded-full bg-purple-100 px-5 py-2 border border-purple-300">
							<ArrowRightIcon className="w-4 h-4 mr-2 text-purple-700" />
							<span className="text-purple-700 font-medium text-sm">
								今天之后
							</span>
						</div>
					</div>

					<h2 className="text-4xl md:text-6xl font-bold leading-tight mb-6">
						<span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-blue-500">
							如何加入我们
						</span>
					</h2>

					<p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
						你已经迈出第一步了！继续参与，成为社区的一员
					</p>
				</div>

				{/* Participation Path */}
				<div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto mb-20">
					{participationPath.map((path) => {
						const colorClasses = {
							blue: {
								bg: "bg-blue-100",
								border: "border-blue-300",
								text: "text-blue-600",
								step: "bg-blue-500",
							},
							purple: {
								bg: "bg-purple-100",
								border: "border-purple-300",
								text: "text-purple-600",
								step: "bg-purple-500",
							},
							green: {
								bg: "bg-green-100",
								border: "border-green-300",
								text: "text-green-600",
								step: "bg-green-500",
							},
						};

						const colors =
							colorClasses[
								path.color as keyof typeof colorClasses
							];

						return (
							<Card
								key={path.step}
								className="border-2 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
							>
								<CardContent className="p-6 text-center">
									{/* Step Number */}
									<div className="flex justify-center mb-4">
										<div
											className={`w-12 h-12 rounded-full ${colors.step} text-white flex items-center justify-center text-xl font-bold`}
										>
											{path.step}
										</div>
									</div>

									{/* Icon */}
									<div className="flex justify-center mb-3">
										<div
											className={`p-3 rounded-xl ${colors.bg} ${colors.border} border`}
										>
											<path.icon
												className={`w-6 h-6 ${colors.text}`}
											/>
										</div>
									</div>

									{/* Title */}
									<h3 className="text-lg font-bold text-foreground mb-2">
										{path.title}
									</h3>

									{/* Description */}
									<p className="text-sm text-muted-foreground">
										{path.description}
									</p>
								</CardContent>
							</Card>
						);
					})}
				</div>

				{/* Membership Requirements & Benefits */}
				<div className="max-w-6xl mx-auto">
					<div className="grid md:grid-cols-2 gap-8 mb-12">
						{/* Requirements */}
						<Card className="border-2 border-purple-200 bg-purple-50/50">
							<CardContent className="p-8">
								<div className="flex items-center gap-2 mb-6">
									<CheckCircle2Icon className="w-6 h-6 text-purple-600" />
									<h3 className="text-2xl font-bold text-foreground">
										加入门槛
									</h3>
								</div>
								<ul className="space-y-4">
									{memberRequirements.map((req, index) => (
										<li
											key={index}
											className="flex items-start gap-3"
										>
											<div className="p-2 rounded-lg bg-purple-100 border border-purple-300">
												<req.icon className="w-5 h-5 text-purple-600" />
											</div>
											<span className="text-base text-foreground pt-1">
												{req.text}
											</span>
										</li>
									))}
								</ul>
							</CardContent>
						</Card>

						{/* Benefits */}
						<Card className="border-2 border-blue-200 bg-blue-50/50">
							<CardContent className="p-8">
								<div className="flex items-center gap-2 mb-6">
									<GiftIcon className="w-6 h-6 text-blue-600" />
									<h3 className="text-2xl font-bold text-foreground">
										成员福利
									</h3>
								</div>
								<ul className="space-y-3">
									{memberBenefits.map((benefit, index) => (
										<li
											key={index}
											className="flex items-start gap-3"
										>
											<span className="text-xl flex-shrink-0">
												{benefit.icon}
											</span>
											<div>
												<span className="font-semibold text-foreground block">
													{benefit.title}
												</span>
												<span className="text-sm text-muted-foreground">
													{benefit.description}
												</span>
											</div>
										</li>
									))}
								</ul>
							</CardContent>
						</Card>
					</div>
				</div>

				{/* CTA Section */}
				<div className="text-center mt-16 max-w-4xl mx-auto">
					<div className="bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200 rounded-2xl p-8 md:p-12">
						<h3 className="text-2xl md:text-3xl font-bold mb-4">
							立即行动
						</h3>
						<p className="text-lg text-muted-foreground mb-6">
							查看下一场活动，或直接联系我们了解更多
						</p>
						<div className="flex flex-col sm:flex-row gap-4 justify-center">
							<Button
								size="lg"
								className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white"
								asChild
							>
								<Link href="/events">
									查看活动日历
									<CalendarIcon className="ml-2 w-5 h-5" />
								</Link>
							</Button>
							<Button
								size="lg"
								variant="outline"
								className="border-purple-300 hover:bg-purple-50"
								asChild
							>
								<a href="mailto:contact@hackathonweekly.com">
									联系我们
									<ArrowRightIcon className="ml-2 w-5 h-5" />
								</a>
							</Button>
						</div>
					</div>
				</div>

				{/* Final Message */}
				<div className="mt-16 text-center max-w-4xl mx-auto">
					<div className="bg-gradient-to-r from-purple-100 to-blue-100 rounded-2xl p-8">
						<p className="text-2xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-blue-500 mb-4">
							在这里，创造本身就是最大的奖励
						</p>
						<p className="text-lg md:text-xl text-muted-foreground">
							周周黑客松 - 每周末，一起创造有意思的作品！
						</p>
					</div>
				</div>
			</div>
		</section>
	);
}
