"use client";

import { Card, CardContent } from "@/components/ui/card";
import {
	CheckCircle2Icon,
	HeartHandshakeIcon,
	RocketIcon,
	UsersIcon,
	RefreshCwIcon,
} from "lucide-react";

export function DifferentiationSection() {
	const differentiators = [
		{
			icon: HeartHandshakeIcon,
			title: "长期陪伴，不是一次性活动",
			description:
				"从想法到产品、从 MVP 到真实用户的持续陪伴，而不是 48 小时黑客松结束就散场。",
			color: "purple",
		},
		{
			icon: UsersIcon,
			title: "面向所有创造者",
			description:
				"无论技术背景和经验如何，只要愿意动手实践，都可以参与，不设门槛、不做筛选。",
			color: "blue",
		},
		{
			icon: RocketIcon,
			title: "专注从 0 到 1",
			description:
				"陪你把想法变成可验证的 MVP、找到前 100 个真实用户，这是最难也最容易被忽视的一步。",
			color: "green",
		},
		{
			icon: RefreshCwIcon,
			title: "可持续的共赢模式",
			description:
				"社区本身非营利（盈余再投入），但同时鼓励成员利用社区资源孵化商业项目，成功后反哺社区。",
			color: "orange",
		},
	];

	return (
		<section className="py-20 md:py-28 bg-muted/30 relative overflow-hidden">
			{/* Subtle background decoration */}
			<div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] lg:w-[900px] lg:h-[450px] rounded-full bg-gradient-to-r from-blue-400/10 to-blue-300/5 opacity-60 blur-[120px]" />

			<div className="container relative z-10 px-4 md:px-6">
				{/* Section Header */}
				<div className="text-center mb-16">
					<div className="mb-6 flex justify-center">
						<div className="inline-flex items-center rounded-full bg-blue-100 px-5 py-2 border border-blue-300">
							<CheckCircle2Icon className="w-4 h-4 mr-2 text-blue-700" />
							<span className="text-blue-700 font-medium text-sm">
								为什么选择我们
							</span>
						</div>
					</div>

					<h2 className="text-4xl md:text-6xl font-bold leading-tight mb-6">
						我们的
						<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-500 block">
							差异化优势
						</span>
					</h2>

					<p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
						不只是又一个黑客松，而是创造者真正需要的长期陪伴者
					</p>
				</div>

				{/* Differentiators Grid */}
				<div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
					{differentiators.map((item, index) => {
						const colorClasses = {
							purple: {
								bg: "bg-purple-100",
								border: "border-purple-200",
								text: "text-purple-600",
								iconBg: "bg-purple-100",
								iconBorder: "border-purple-300",
							},
							blue: {
								bg: "bg-blue-100",
								border: "border-blue-200",
								text: "text-blue-600",
								iconBg: "bg-blue-100",
								iconBorder: "border-blue-300",
							},
							green: {
								bg: "bg-green-100",
								border: "border-green-200",
								text: "text-green-600",
								iconBg: "bg-green-100",
								iconBorder: "border-green-300",
							},
							orange: {
								bg: "bg-orange-100",
								border: "border-orange-200",
								text: "text-orange-600",
								iconBg: "bg-orange-100",
								iconBorder: "border-orange-300",
							},
						};

						const colors =
							colorClasses[
								item.color as keyof typeof colorClasses
							];

						return (
							<Card
								key={item.title}
								className="group border-2 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
							>
								<CardContent className="p-8">
									{/* Number Badge */}
									<div className="flex items-start gap-4 mb-4">
										<div
											className={`flex-shrink-0 w-10 h-10 rounded-full ${colors.bg} ${colors.border} border-2 flex items-center justify-center font-bold ${colors.text}`}
										>
											{index + 1}
										</div>
										<div className="flex-1">
											{/* Icon */}
											<div
												className={`p-3 rounded-xl ${colors.iconBg} ${colors.iconBorder} border inline-block mb-3`}
											>
												<item.icon
													className={`w-6 h-6 ${colors.text}`}
												/>
											</div>

											{/* Title */}
											<h3 className="text-xl font-bold text-foreground mb-3">
												{item.title}
											</h3>

											{/* Description */}
											<p className="text-muted-foreground leading-relaxed">
												{item.description}
											</p>
										</div>
									</div>
								</CardContent>
							</Card>
						);
					})}
				</div>

				{/* Bottom Quote */}
				<div className="mt-20 text-center max-w-4xl mx-auto">
					<div className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-2xl p-8 md:p-12">
						<p className="text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-500 mb-4">
							&quot;在这里，普通人也可以把想法变成现实&quot;
						</p>
						<p className="text-base md:text-lg text-muted-foreground">
							不必是经验丰富的创业者，不必担心技能不足，不必害怕失败
							<br />
							因为总有人愿意分享经验、共同成长
						</p>
					</div>
				</div>
			</div>
		</section>
	);
}
