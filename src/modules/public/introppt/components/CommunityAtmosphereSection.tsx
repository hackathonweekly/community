"use client";

import { Card, CardContent } from "@/components/ui/card";
import { HeartIcon, SparklesIcon, WrenchIcon } from "lucide-react";

export function CommunityAtmosphereSection() {
	const values = [
		{
			icon: HeartIcon,
			title: "爱",
			subtitle: "Love",
			description: "构建充满人文关怀的创造者社区",
			details:
				"通过互助、陪伴和归属感连接彼此。在这里，每个人都能感受到温暖与支持，创造不再孤单。",
			color: "red",
		},
		{
			icon: SparklesIcon,
			title: "自由",
			subtitle: "Freedom",
			description: "营造开放包容的创新环境",
			details:
				"打破传统层级和壁垒，让每个人都能自由探索和成长。无论背景如何，只要愿意创造，这里就是你的舞台。",
			color: "blue",
		},
		{
			icon: WrenchIcon,
			title: "创造",
			subtitle: "Creation",
			description: "崇尚务实的动手实践精神",
			details: `相信 "Show, Don't Just Tell"，帮助成员将想法转化为现实。从 0 到 1，从想法到产品，我们一起见证创造的力量。`,
			color: "purple",
		},
	];

	return (
		<section className="py-20 md:py-28 bg-gradient-to-b from-muted/30 to-background relative overflow-hidden">
			{/* Subtle background decoration */}
			<div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] lg:w-[900px] lg:h-[450px] rounded-full bg-gradient-to-r from-purple-400/10 to-blue-400/5 opacity-60 blur-[120px]" />

			<div className="container relative z-10 px-4 md:px-6">
				{/* Section Header */}
				<div className="text-center mb-16">
					<div className="mb-6 flex justify-center">
						<div className="inline-flex items-center rounded-full bg-purple-100 px-5 py-2 border border-purple-300">
							<HeartIcon className="w-4 h-4 mr-2 text-purple-700" />
							<span className="text-purple-700 font-medium text-sm">
								我们的价值观
							</span>
						</div>
					</div>

					<h2 className="text-4xl md:text-6xl font-bold leading-tight mb-6">
						社区氛围
						<span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-blue-500 to-purple-500 block">
							爱 · 自由 · 创造
						</span>
					</h2>

					<p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
						打造一个包容性的、有温度的创造者社区
					</p>
				</div>

				{/* Our Original Intention */}
				<div className="mb-20 text-center max-w-4xl mx-auto">
					<div className="bg-purple-50 border-2 border-purple-300 rounded-2xl p-8 md:p-12">
						<h3 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
							我们的初心
						</h3>
						<div className="space-y-5 text-left text-muted-foreground text-lg md:text-xl leading-relaxed">
							<p>
								我们相信,创造的真正动力不来自外部压力,而是内心对「亲手做出新东西」的纯粹热爱。这份快乐不应该被孤独、迷茫或短暂的协作磨灭。
							</p>
							<p>
								我们希望成为所有"白发少年"的乐园。无论你18岁还是80岁,只要心中仍保有对创造的炽热,这里就永远为你留有一席之地。
								我们相聚于此,是为了在未来的每一个周末,都能有机会为了一件"好玩"的事而全心投入,享受将想法变为现实的纯粹快乐。
							</p>
						</div>
						<p className="mt-6 text-xl md:text-2xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-blue-500">
							在这里,创造本身就是最大的奖励。
						</p>
					</div>
				</div>

				{/* Values Cards */}
				<div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
					{values.map((value) => {
						const colorClasses = {
							red: {
								card: "border-red-200 bg-red-50/50",
								icon: "bg-red-100 border-red-300 text-red-500",
								iconFill: "fill-red-500",
								gradient: "from-red-500 to-pink-500",
							},
							blue: {
								card: "border-blue-200 bg-blue-50/50",
								icon: "bg-blue-100 border-blue-300 text-blue-500",
								iconFill: "",
								gradient: "from-blue-500 to-cyan-500",
							},
							purple: {
								card: "border-purple-200 bg-purple-50/50",
								icon: "bg-purple-100 border-purple-300 text-purple-500",
								iconFill: "",
								gradient: "from-purple-500 to-indigo-500",
							},
						};

						const colors =
							colorClasses[
								value.color as keyof typeof colorClasses
							];

						return (
							<Card
								key={value.title}
								className={`group border-2 ${colors.card} hover:shadow-xl transition-all duration-300 hover:-translate-y-1`}
							>
								<CardContent className="p-8">
									{/* Icon */}
									<div className="flex justify-center mb-6">
										<div
											className={`p-4 rounded-full border-2 ${colors.icon} ${colors.iconFill}`}
										>
											<value.icon className="w-8 h-8" />
										</div>
									</div>

									{/* Title */}
									<div className="text-center mb-4">
										<h3
											className={`text-3xl font-bold mb-1 text-transparent bg-clip-text bg-gradient-to-r ${colors.gradient}`}
										>
											{value.title}
										</h3>
										<p className="text-sm text-muted-foreground uppercase tracking-wider">
											{value.subtitle}
										</p>
									</div>

									{/* Description */}
									<p className="text-center text-base font-semibold text-foreground mb-4">
										{value.description}
									</p>

									{/* Details */}
									<p className="text-sm text-muted-foreground text-center leading-relaxed">
										{value.details}
									</p>
								</CardContent>
							</Card>
						);
					})}
				</div>

				{/* Bottom Quote */}
				<div className="mt-20 text-center max-w-4xl mx-auto">
					<div className="bg-gradient-to-r from-red-50 via-blue-50 to-purple-50 border-2 border-purple-200 rounded-2xl p-8 md:p-12">
						<p className="text-xl md:text-2xl font-bold text-foreground mb-4">
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
