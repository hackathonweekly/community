"use client";

import { Card, CardContent } from "@/components/ui/card";
import {
	CoinsIcon,
	RefreshCwIcon,
	EyeIcon,
	ShieldCheckIcon,
	TrendingUpIcon,
} from "lucide-react";

export function OperationModelSection() {
	const principles = [
		{
			icon: ShieldCheckIcon,
			title: "使命优先",
			description: "永远使命优先，而非利润优先",
		},
		{
			icon: CoinsIcon,
			title: "盈余再投入",
			description: "满足合理运营成本后，剩余盈余全部用于社区公共建设",
		},
		{
			icon: RefreshCwIcon,
			title: "商业生态反哺",
			description: "鼓励成员孵化营利性项目，成功后反哺社区",
		},
		{
			icon: EyeIcon,
			title: "财务透明",
			description: "每季度公示收支报告，由监督小组审核",
		},
	];

	const revenueBreakdown = [
		{ source: "赞助收入", percentage: "60%", color: "purple" },
		{ source: "企业服务收入", percentage: "30%", color: "blue" },
		{ source: "活动报名费", percentage: "10%", color: "green" },
	];

	const expenseBreakdown = [
		{ category: "活动成本", percentage: "40%", color: "orange" },
		{ category: "劳务分成", percentage: "30%", color: "red" },
		{ category: "基础设施", percentage: "20%", color: "purple" },
		{ category: "差旅与拓展", percentage: "10%", color: "blue" },
	];

	return (
		<section className="py-20 md:py-28 bg-muted/30 relative overflow-hidden">
			{/* Subtle background decoration */}
			<div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] lg:w-[900px] lg:h-[450px] rounded-full bg-gradient-to-r from-green-400/10 to-green-300/5 opacity-60 blur-[120px]" />

			<div className="container relative z-10 px-4 md:px-6">
				{/* Section Header */}
				<div className="text-center mb-16">
					<div className="mb-6 flex justify-center">
						<div className="inline-flex items-center rounded-full bg-green-100 px-5 py-2 border border-green-300">
							<TrendingUpIcon className="w-4 h-4 mr-2 text-green-700" />
							<span className="text-green-700 font-medium text-sm">
								可持续发展
							</span>
						</div>
					</div>

					<h2 className="text-4xl md:text-6xl font-bold leading-tight mb-6">
						运营模式
						<span className="text-transparent bg-clip-text bg-gradient-to-r from-green-500 to-blue-500 block">
							使命驱动的社会企业
						</span>
					</h2>

					<p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
						公益主体 +
						商业生态的模式，为爱发电不长久，成员获益才可持续
					</p>
				</div>

				{/* Core Principles */}
				<div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20 max-w-6xl mx-auto">
					{principles.map((principle) => (
						<Card
							key={principle.title}
							className="border-2 border-green-200 bg-green-50/50 hover:shadow-lg transition-all duration-300"
						>
							<CardContent className="p-6 text-center">
								<div className="flex justify-center mb-3">
									<div className="p-3 rounded-full bg-green-100 border border-green-300">
										<principle.icon className="w-6 h-6 text-green-600" />
									</div>
								</div>
								<h3 className="text-lg font-bold text-foreground mb-2">
									{principle.title}
								</h3>
								<p className="text-sm text-muted-foreground">
									{principle.description}
								</p>
							</CardContent>
						</Card>
					))}
				</div>

				{/* Financial Transparency */}
				<div className="grid md:grid-cols-2 gap-8 mb-20 max-w-6xl mx-auto">
					{/* Revenue */}
					<Card className="border-2">
						<CardContent className="p-8">
							<h3 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
								<CoinsIcon className="w-6 h-6 text-green-600" />
								资金来源（2024 年示例）
							</h3>
							<div className="space-y-4">
								{revenueBreakdown.map((item) => {
									const colorClasses = {
										purple: "bg-purple-500",
										blue: "bg-blue-500",
										green: "bg-green-500",
									};
									return (
										<div key={item.source}>
											<div className="flex justify-between items-center mb-2">
												<span className="text-sm font-medium text-foreground">
													{item.source}
												</span>
												<span className="text-sm font-bold text-purple-600">
													{item.percentage}
												</span>
											</div>
											<div className="h-2 bg-muted rounded-full overflow-hidden">
												<div
													className={`h-full ${
														colorClasses[
															item.color as keyof typeof colorClasses
														]
													}`}
													style={{
														width: item.percentage,
													}}
												/>
											</div>
										</div>
									);
								})}
							</div>
						</CardContent>
					</Card>

					{/* Expenses */}
					<Card className="border-2">
						<CardContent className="p-8">
							<h3 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
								<TrendingUpIcon className="w-6 h-6 text-orange-600" />
								主要支出（2024 年示例）
							</h3>
							<div className="space-y-4">
								{expenseBreakdown.map((item) => {
									const colorClasses = {
										orange: "bg-orange-500",
										red: "bg-red-500",
										purple: "bg-purple-500",
										blue: "bg-blue-500",
									};
									return (
										<div key={item.category}>
											<div className="flex justify-between items-center mb-2">
												<span className="text-sm font-medium text-foreground">
													{item.category}
												</span>
												<span className="text-sm font-bold text-orange-600">
													{item.percentage}
												</span>
											</div>
											<div className="h-2 bg-muted rounded-full overflow-hidden">
												<div
													className={`h-full ${
														colorClasses[
															item.color as keyof typeof colorClasses
														]
													}`}
													style={{
														width: item.percentage,
													}}
												/>
											</div>
										</div>
									);
								})}
							</div>
							<p className="text-xs text-muted-foreground mt-4 bg-muted p-3 rounded">
								说明：社区大部分活动由志愿者组织和支持。劳务分成主要用于商业化服务项目的执行团队。
							</p>
						</CardContent>
					</Card>
				</div>

				{/* Commercial Ecosystem */}
				<div className="max-w-5xl mx-auto">
					<div className="text-center mb-10">
						<h3 className="text-2xl md:text-3xl font-bold mb-4">
							商业生态
						</h3>
						<p className="text-lg text-muted-foreground max-w-3xl mx-auto">
							通过社区资源支持成员孵化创新项目，成功案例回馈社区，形成可持续增长的良性循环。
						</p>
					</div>

					<div className="grid md:grid-cols-2 gap-6">
						<Card className="border-2 border-purple-200 bg-white hover:shadow-lg transition-shadow">
							<CardContent className="p-6">
								<h4 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
									<span className="w-8 h-8 rounded-full bg-purple-500 text-white flex items-center justify-center text-sm font-bold">
										1
									</span>
									创作者增长
								</h4>
								<p className="text-sm text-muted-foreground leading-relaxed">
									内容创作者提供专业知识，通过社区导流实现成果共享；活动平台运营者在真实场景中验证产品，获得早期用户反馈。
								</p>
							</CardContent>
						</Card>
						<Card className="border-2 border-purple-200 bg-white hover:shadow-lg transition-shadow">
							<CardContent className="p-6">
								<h4 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
									<span className="w-8 h-8 rounded-full bg-purple-500 text-white flex items-center justify-center text-sm font-bold">
										2
									</span>
									机构协同
								</h4>
								<p className="text-sm text-muted-foreground leading-relaxed">
									孵化机构高效识别优质项目；技术服务商在社区场景中迭代产品，获取真实用户洞察。
								</p>
							</CardContent>
						</Card>
					</div>

					<div className="mt-6 text-center">
						<div className="inline-block bg-purple-50/80 border border-purple-200 rounded-lg px-6 py-3">
							<p className="text-xs text-muted-foreground">
								<span className="font-semibold text-foreground">
									商业生态构成：
								</span>
								盈利性项目以独立子项目或子公司形式运营，保持财务独立性的同时与社区形成战略协同
							</p>
						</div>
					</div>
				</div>

				{/* Legal Entity Notice */}
				<div className="mt-16 text-center max-w-3xl mx-auto">
					<div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
						<p className="text-sm text-muted-foreground mb-3">
							<span className="font-semibold text-foreground">
								法律主体：
							</span>
							周周创造（深圳）科技有限公司
						</p>
						<p className="text-sm text-muted-foreground leading-relaxed">
							采用公司法律形式，但坚持社会企业运营理念。商业生态由盈利性子项目与子公司组成，在保持财务独立的同时支持社区使命。未来将探索更符合社会价值导向的法律形式（如基金会或
							B Corp 认证）。
						</p>
					</div>
				</div>
			</div>
		</section>
	);
}
