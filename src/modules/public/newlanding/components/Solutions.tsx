"use client";

import { Card, CardContent } from "@/components/ui/card";
import { CheckIcon, XIcon } from "lucide-react";
import Image from "next/image";

export function Solutions() {
	const solutions = [
		{
			painPoint: "找不到伙伴？",
			painDescription: "想做 AI 产品，但不懂设计也不会推广",
			solution: "跨界创造者聚集地，开发者、设计师、产品经理齐聚",
			scenario: "迷你黑客松现场组队，DemoShow 找到合伙人",
			icon: "👥",
		},
		{
			painPoint: "缺少陪伴？",
			painDescription: "黑客松拿奖后，项目就烂尾了",
			solution: "从 MVP → 首批用户 → 持续增长的长期陪伴",
			scenario: "周末共创日持续打磨，Build in Public 获得真实反馈",
			icon: "🤝",
		},
		{
			painPoint: "不知道怎么开始？",
			painDescription: "有想法不知道如何落地，缺少方法论",
			solution: "系统化支持：知识库 + 工作坊 + 导师辅导",
			scenario: "从0到1的完整路径，7天完成 MVP 不是梦",
			icon: "🗺️",
		},
		{
			painPoint: "担心投入没回报？",
			painDescription: "做了个 Demo 但没人用，不知道是否值得继续",
			solution: "早期项目友好，30% 完成度就能获得反馈",
			scenario: "客厅 Demo 局获得真实用户反馈，找到 PMF",
			icon: "💝",
		},
	];

	return (
		<section className="py-20 md:py-28 bg-muted/30 relative">
			{/* Background decoration */}
			<div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[200px] sm:w-[600px] sm:h-[300px] lg:w-[800px] lg:h-[400px] rounded-full bg-gradient-to-r from-purple-400/10 to-purple-300/5 opacity-60 blur-[120px]" />

			<div className="container px-4 md:px-6 relative z-10">
				{/* Header */}
				<div className="text-center mb-16 md:mb-20">
					<div className="mb-6 md:mb-8 flex justify-center">
						<div className="inline-flex items-center rounded-full bg-purple-100 px-3 py-1.5 md:px-5 md:py-2 border border-purple-300">
							<span className="text-purple-700 font-medium text-xs md:text-sm">
								✨ 我们的解决方案
							</span>
						</div>
					</div>

					<h2 className="text-4xl md:text-6xl font-bold leading-tight mb-6">
						完整的创造者支持体系
						<span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-blue-500 block mt-2">
							从灵感到产品的全程陪伴
						</span>
					</h2>

					<p className="text-base md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
						不是一次性的黑客松，而是可以随时回来的家
					</p>
				</div>

				{/* Main content - two columns layout */}
				<div className="grid lg:grid-cols-2 gap-12 md:gap-16 items-center mb-16 md:mb-20">
					{/* Left: Image */}
					<div className="order-2 lg:order-1">
						<div className="relative rounded-3xl overflow-hidden shadow-2xl">
							<div className="aspect-[4/3]">
								<Image
									src="/images/events/gdc00007.jpg"
									alt="社区活动现场"
									fill
									className="object-cover"
									sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 600px"
								/>
							</div>
						</div>
					</div>

					{/* Right: Solution cards */}
					<div className="order-1 lg:order-2 space-y-6">
						{solutions.map((solution, index) => (
							<Card
								key={index}
								className="border-0 shadow-lg hover:shadow-xl transition-all duration-300"
							>
								<CardContent className="p-6">
									<div className="flex items-start gap-4">
										<div className="text-4xl flex-shrink-0">
											{solution.icon}
										</div>
										<div className="flex-1 space-y-3">
											<h3 className="text-xl font-bold text-foreground">
												{solution.painPoint}
											</h3>

											{/* Pain point */}
											<div className="flex items-start gap-2">
												<XIcon className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
												<p className="text-sm text-muted-foreground">
													<span className="font-medium text-foreground">
														痛点：
													</span>
													{solution.painDescription}
												</p>
											</div>

											{/* Solution */}
											<div className="flex items-start gap-2">
												<CheckIcon className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
												<p className="text-sm text-foreground">
													<span className="font-medium">
														我们：
													</span>
													{solution.solution}
												</p>
											</div>

											{/* Scenario */}
											<div className="bg-purple-50 border border-purple-100 rounded-lg p-3">
												<p className="text-sm text-purple-900">
													<span className="font-medium">
														💡 场景：
													</span>
													{solution.scenario}
												</p>
											</div>
										</div>
									</div>
								</CardContent>
							</Card>
						))}
					</div>
				</div>

				{/* Bottom - Journey visualization */}
				<div className="max-w-4xl mx-auto">
					<div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
						<h3 className="text-xl md:text-2xl font-bold text-center mb-8">
							从想法到产品的完整路径
						</h3>

						<div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
							<div className="text-center">
								<div className="w-16 h-16 mx-auto bg-purple-100 rounded-full flex items-center justify-center mb-3">
									<span className="text-2xl">💡</span>
								</div>
								<h4 className="font-bold text-sm md:text-base mb-1">
									想法
								</h4>
								<p className="text-xs text-muted-foreground mb-2">
									灵感阶段
								</p>
								<div className="text-xs font-medium text-purple-600">
									↓ 黑客松
								</div>
								<p className="text-xs text-muted-foreground">
									(8-72h)
								</p>
							</div>

							<div className="text-center">
								<div className="w-16 h-16 mx-auto bg-purple-100 rounded-full flex items-center justify-center mb-3">
									<span className="text-2xl">🚀</span>
								</div>
								<h4 className="font-bold text-sm md:text-base mb-1">
									MVP
								</h4>
								<p className="text-xs text-muted-foreground mb-2">
									最小可行产品
								</p>
								<div className="text-xs font-medium text-purple-600">
									↓ Demo Show
								</div>
								<p className="text-xs text-muted-foreground">
									(月度)
								</p>
							</div>

							<div className="text-center">
								<div className="w-16 h-16 mx-auto bg-purple-100 rounded-full flex items-center justify-center mb-3">
									<span className="text-2xl">👥</span>
								</div>
								<h4 className="font-bold text-sm md:text-base mb-1">
									首批用户
								</h4>
								<p className="text-xs text-muted-foreground mb-2">
									验证需求
								</p>
								<div className="text-xs font-medium text-purple-600">
									↓ 共创日
								</div>
								<p className="text-xs text-muted-foreground">
									(每周末)
								</p>
							</div>

							<div className="text-center">
								<div className="w-16 h-16 mx-auto bg-purple-100 rounded-full flex items-center justify-center mb-3">
									<span className="text-2xl">📈</span>
								</div>
								<h4 className="font-bold text-sm md:text-base mb-1">
									持续增长
								</h4>
								<p className="text-xs text-muted-foreground mb-2">
									产品迭代
								</p>
								<div className="text-xs font-medium text-purple-600">
									↓ Build in Public
								</div>
								<p className="text-xs text-muted-foreground">
									(持续)
								</p>
							</div>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}
