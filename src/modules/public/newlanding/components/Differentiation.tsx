"use client";

import { Card, CardContent } from "@/components/ui/card";
import { CheckIcon, XIcon } from "lucide-react";

export function Differentiation() {
	const differences = [
		{
			title: "长期陪伴 vs 一次性活动",
			painIcon: "❌",
			painTitle: "其他黑客松",
			painDesc: "48 小时冲刺后各自散去，项目多半烂尾",
			solutionIcon: "✅",
			solutionTitle: "我们",
			solutionDesc: "每周见面的伙伴，从 MVP 到用户增长的全程陪伴",
			stat: "70% 的项目在社区持续迭代超过 3 个月",
		},
		{
			title: "面向所有人 vs 精英筛选",
			painIcon: "❌",
			painTitle: "其他社区",
			painDesc: "需要简历筛选、技术背景、参赛经验",
			solutionIcon: "✅",
			solutionTitle: "我们",
			solutionDesc: "零门槛，无论技术背景和经验，愿意动手就能参与",
			stat: "40% 成员是非技术背景（设计、产品、运营等）",
		},
		{
			title: "专注 0→1 vs 追求完美",
			painIcon: "❌",
			painTitle: "其他比赛",
			painDesc: "追求完美 Demo、PPT、商业计划书",
			solutionIcon: "✅",
			solutionTitle: "我们",
			solutionDesc: "陪你完成最难的第一步：MVP + 前 100 个真实用户",
			stat: "平均 7 天从想法到可用 MVP，30 天获得首批用户",
		},
		{
			title: "使命驱动 vs 商业导向",
			painIcon: "❌",
			painTitle: "商业活动",
			painDesc: "以盈利为目标，获客为目的",
			solutionIcon: "✅",
			solutionTitle: "我们",
			solutionDesc: "使命优先的社会企业，盈余 100% 再投入社区",
			stat: "财务季度公开，每年 80%+ 盈余用于社区建设",
		},
	];

	return (
		<section className="py-20 md:py-28 bg-background relative">
			{/* Background decoration */}
			<div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[200px] sm:w-[600px] sm:h-[300px] lg:w-[800px] lg:h-[400px] rounded-full bg-gradient-to-r from-purple-400/10 to-purple-300/5 opacity-60 blur-[120px]" />

			<div className="container px-4 md:px-6 relative z-10">
				{/* Header */}
				<div className="text-center mb-16 md:mb-20">
					<div className="mb-6 md:mb-8 flex justify-center">
						<div className="inline-flex items-center rounded-full bg-purple-100 px-3 py-1.5 md:px-5 md:py-2 border border-purple-300">
							<span className="text-purple-700 font-medium text-xs md:text-sm">
								💎 差异化优势
							</span>
						</div>
					</div>

					<h2 className="text-4xl md:text-6xl font-bold leading-tight mb-6">
						为什么选择
						<span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-blue-500 block mt-2">
							周周黑客松？
						</span>
					</h2>

					<p className="text-base md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
						我们和其他社区/黑客松有什么不同？
					</p>
				</div>

				{/* Comparison cards */}
				<div className="grid md:grid-cols-2 gap-8 mb-12">
					{differences.map((diff, index) => (
						<Card
							key={index}
							className="border-0 shadow-xl hover:shadow-2xl transition-all duration-300 bg-white"
						>
							<CardContent className="p-6">
								<h3 className="text-xl font-bold text-foreground mb-6 text-center">
									{diff.title}
								</h3>

								<div className="space-y-4 mb-6">
									{/* Pain point */}
									<div className="flex items-start gap-3 p-4 bg-red-50 border border-red-100 rounded-lg">
										<XIcon className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
										<div className="flex-1">
											<div className="font-bold text-sm text-red-900 mb-1">
												{diff.painTitle}
											</div>
											<p className="text-sm text-red-700">
												{diff.painDesc}
											</p>
										</div>
									</div>

									{/* Solution */}
									<div className="flex items-start gap-3 p-4 bg-green-50 border border-green-100 rounded-lg">
										<CheckIcon className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
										<div className="flex-1">
											<div className="font-bold text-sm text-green-900 mb-1">
												{diff.solutionTitle}
											</div>
											<p className="text-sm text-green-700">
												{diff.solutionDesc}
											</p>
										</div>
									</div>
								</div>

								{/* Stat */}
								<div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-center">
									<p className="text-sm text-purple-900">
										<span className="font-medium">
											📊 数据：
										</span>
										{diff.stat}
									</p>
								</div>
							</CardContent>
						</Card>
					))}
				</div>

				{/* Quote */}
				<div className="max-w-3xl mx-auto">
					<Card className="border-2 border-purple-200 shadow-xl bg-gradient-to-br from-purple-50 to-blue-50">
						<CardContent className="p-8 text-center">
							<div className="text-5xl mb-4">"</div>
							<p className="text-xl md:text-2xl font-medium text-foreground mb-4 leading-relaxed">
								创造，不应该是一场孤独的冒险
								<br />
								而应该是伙伴们彼此成就的接力赛
							</p>
							<div className="text-sm text-muted-foreground">
								— 周周黑客松社区理念
							</div>
						</CardContent>
					</Card>
				</div>
			</div>
		</section>
	);
}
