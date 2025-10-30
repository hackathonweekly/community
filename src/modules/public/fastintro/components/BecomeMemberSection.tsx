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

export function BecomeMemberSection() {
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
			title: "项目陪伴",
			description: "获得资源支持和商业合作机会",
		},
		{
			icon: "🌐",
			title: "跨城网络",
			description: "连接全国各城市创造者资源",
		},
	];

	return (
		<section className="py-20 md:py-28 bg-muted/30 relative overflow-hidden">
			{/* Subtle background decoration */}
			<div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] lg:w-[900px] lg:h-[450px] rounded-full bg-gradient-to-r from-blue-400/10 to-purple-400/5 opacity-60 blur-[120px]" />

			<div className="container relative z-10 px-4 md:px-6">
				{/* Section Header */}
				<div className="text-center mb-16">
					<h2 className="text-4xl md:text-6xl font-bold leading-tight mb-6">
						<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-500">
							成为社区成员
						</span>
					</h2>

					<p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
						深度参与社区，获得更多资源和机会
					</p>
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
								<Link href="/zh/events">
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
						<p className="text-lg md:text-xl text-muted-foreground">
							周周黑客松 - 每周末，一起创造有意思的作品！
						</p>
					</div>
				</div>
			</div>
		</section>
	);
}
