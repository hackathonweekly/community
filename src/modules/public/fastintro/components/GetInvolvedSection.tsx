"use client";

import { Card, CardContent } from "@/components/ui/card";
import { CalendarIcon, HeartIcon, SparklesIcon } from "lucide-react";

export function GetInvolvedSection() {
	const participationPaths = [
		{
			step: "1",
			title: "继续参与活动",
			description: "参加黑客松、Demo Show、周末共创日等各类活动",
			icon: CalendarIcon,
			color: "blue",
			expandedContent: {
				title: "你可以在这里",
				benefits: [
					"学习最新好玩的 AI 工具",
					"组队打黑客松，做项目",
					"认识跨界伙伴和志同道合的朋友",
					"获得产品开发和创业经验",
					"展示你的作品，获得反馈",
				],
			},
		},
		{
			step: "2",
			title: "贡献你的力量",
			description: "担任志愿者、分享者，或成为活动发起人",
			icon: HeartIcon,
			color: "purple",
			expandedContent: {
				title: "成为活动发起人",
				subtitle: "举办 AI + 你感兴趣领域的活动",
				examples: [
					"AI + 硬件",
					"AI + 医疗",
					"AI + 玩具",
					"AI + 教育",
					"AI + 设计",
				],
				support: [
					"免费场地",
					"宣传推广",
					"活动 SOP",
					"志愿者招募",
					"社区资源",
				],
			},
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
							<SparklesIcon className="w-4 h-4 mr-2 text-purple-700" />
							<span className="text-purple-700 font-medium text-sm">
								今天之后
							</span>
						</div>
					</div>

					<h2 className="text-4xl md:text-6xl font-bold leading-tight mb-6">
						<span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-blue-500">
							如何参与社区
						</span>
					</h2>

					<p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
						你已经迈出第一步了！继续参与，成为社区的一员
					</p>
				</div>

				{/* Participation Paths */}
				<div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
					{participationPaths.map((path) => {
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
									<h3 className="text-xl md:text-2xl font-bold text-foreground mb-3">
										{path.title}
									</h3>

									{/* Description */}
									<p className="text-base md:text-lg text-muted-foreground mb-4">
										{path.description}
									</p>

									{/* Expanded Content */}
									{path.expandedContent && (
										<div
											className={`mt-4 p-4 ${colors.bg}/50 rounded-lg border ${colors.border}`}
										>
											<p
												className={`text-base md:text-lg font-semibold ${colors.text} mb-3`}
											>
												{path.expandedContent.title}
											</p>

											{/* Benefits list for path 1 */}
											{path.expandedContent.benefits && (
												<ul className="space-y-2 text-left">
													{path.expandedContent.benefits.map(
														(benefit) => (
															<li
																key={benefit}
																className="flex items-start gap-2 text-sm md:text-base text-foreground"
															>
																<span
																	className={
																		colors.text
																	}
																>
																	✓
																</span>
																<span>
																	{benefit}
																</span>
															</li>
														),
													)}
												</ul>
											)}

											{/* Examples and support for path 2 */}
											{path.expandedContent.examples && (
												<>
													<p className="text-sm md:text-base text-muted-foreground mb-3">
														{
															path.expandedContent
																.subtitle
														}
													</p>
													<div className="flex flex-wrap gap-2 mb-3">
														{path.expandedContent.examples.map(
															(example) => (
																<span
																	key={
																		example
																	}
																	className={`text-sm bg-white px-2 py-1 rounded border ${colors.border}`}
																>
																	{example}
																</span>
															),
														)}
													</div>
													<div
														className={`pt-2 border-t ${colors.border}`}
													>
														<p
															className={`text-sm md:text-base font-medium ${colors.text} mb-2`}
														>
															社区提供：
														</p>
														<div className="flex flex-wrap gap-1">
															{path.expandedContent.support?.map(
																(item) => (
																	<span
																		key={
																			item
																		}
																		className={`text-sm ${colors.text}`}
																	>
																		✓ {item}
																	</span>
																),
															)}
														</div>
													</div>
												</>
											)}
										</div>
									)}
								</CardContent>
							</Card>
						);
					})}
				</div>
			</div>
		</section>
	);
}
