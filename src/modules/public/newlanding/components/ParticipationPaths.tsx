"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowRightIcon } from "lucide-react";
import Link from "next/link";

export function ParticipationPaths() {
	return (
		<section className="py-20 md:py-28 bg-background relative">
			{/* Background decoration */}
			<div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[200px] sm:w-[600px] sm:h-[300px] lg:w-[800px] lg:h-[400px] rounded-full bg-gradient-to-r from-purple-400/10 to-purple-300/5 opacity-60 blur-[120px]" />

			<div className="container px-4 md:px-6 relative z-10">
				{/* Header */}
				<div className="text-center mb-16">
					<div className="mb-6 md:mb-8 flex justify-center">
						<div className="inline-flex items-center rounded-full bg-purple-100 px-3 py-1.5 md:px-5 md:py-2 border border-purple-300">
							<span className="text-purple-700 font-medium text-xs md:text-sm">
								🚪 如何加入
							</span>
						</div>
					</div>

					<h2 className="text-4xl md:text-6xl font-bold leading-tight mb-6">
						找到适合你的
						<span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-blue-500 block mt-2">
							参与方式
						</span>
					</h2>

					<p className="text-base md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
						无论你是谁，都能在这里找到自己的位置
					</p>
				</div>

				{/* Tabs */}
				<Tabs defaultValue="creator" className="max-w-5xl mx-auto">
					<TabsList className="grid w-full grid-cols-3 mb-12">
						<TabsTrigger value="creator">我想做项目</TabsTrigger>
						<TabsTrigger value="contributor">
							我想贡献社区
						</TabsTrigger>
						<TabsTrigger value="observer">我想观望一下</TabsTrigger>
					</TabsList>

					{/* Creator path */}
					<TabsContent value="creator">
						<Card className="border-0 shadow-xl bg-white">
							<CardContent className="p-8">
								<div className="text-center mb-8">
									<div className="text-4xl mb-4">🚀</div>
									<h3 className="text-2xl font-bold mb-2">
										创造者路径
									</h3>
									<p className="text-muted-foreground">
										适合：有想法的人、正在做项目的人
									</p>
								</div>

								<div className="space-y-6 mb-8">
									{[
										{
											step: "1️⃣",
											title: "加入开放群，参加一次活动",
											desc: "体验氛围，了解社区文化",
										},
										{
											step: "2️⃣",
											title: "在黑客松找到伙伴，快速做出 MVP",
											desc: "8-72 小时从想法到原型",
										},
										{
											step: "3️⃣",
											title: "在 Demo Show 展示作品，获得反馈",
											desc: "真实用户反馈，找到产品方向",
										},
										{
											step: "4️⃣",
											title: "周末共创日持续打磨，找到 PMF",
											desc: "每周迭代，验证产品市场匹配度",
										},
										{
											step: "5️⃣",
											title: "Build in Public 获得早期用户",
											desc: "持续分享，建立个人品牌",
										},
									].map((item, index) => (
										<div
											key={index}
											className="flex items-start gap-4 p-4 bg-purple-50 rounded-lg"
										>
											<div className="text-2xl flex-shrink-0">
												{item.step}
											</div>
											<div className="flex-1">
												<h4 className="font-bold text-foreground mb-1">
													{item.title}
												</h4>
												<p className="text-sm text-muted-foreground">
													{item.desc}
												</p>
											</div>
										</div>
									))}
								</div>

								<div className="text-center">
									<Button
										size="lg"
										className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white"
										asChild
									>
										<Link href="/events">
											立即参加黑客松
											<ArrowRightIcon className="ml-2 w-5 h-5" />
										</Link>
									</Button>
								</div>
							</CardContent>
						</Card>
					</TabsContent>

					{/* Contributor path */}
					<TabsContent value="contributor">
						<Card className="border-0 shadow-xl bg-white">
							<CardContent className="p-8">
								<div className="text-center mb-8">
									<div className="text-4xl mb-4">🤝</div>
									<h3 className="text-2xl font-bold mb-2">
										贡献者路径
									</h3>
									<p className="text-muted-foreground">
										适合：想参与社区建设、有组织能力的人
									</p>
								</div>

								<div className="space-y-6 mb-8">
									{[
										{
											step: "1️⃣",
											title: "做一次活动志愿者",
											desc: "快速融入社区，了解运营流程",
										},
										{
											step: "2️⃣",
											title: "完成认证，成为共创伙伴",
											desc: "解锁更多权益和资源",
										},
										{
											step: "3️⃣",
											title: "参与活动组织，学习运营",
											desc: "从执行到策划的全方位成长",
										},
										{
											step: "4️⃣",
											title: "申请成为分部负责人",
											desc: "如果你的城市还没有分部",
										},
									].map((item, index) => (
										<div
											key={index}
											className="flex items-start gap-4 p-4 bg-green-50 rounded-lg"
										>
											<div className="text-2xl flex-shrink-0">
												{item.step}
											</div>
											<div className="flex-1">
												<h4 className="font-bold text-foreground mb-1">
													{item.title}
												</h4>
												<p className="text-sm text-muted-foreground">
													{item.desc}
												</p>
											</div>
										</div>
									))}
								</div>

								{/* Rewards */}
								<div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-6 mb-8">
									<h4 className="font-bold text-foreground mb-3">
										💝 你能获得什么回报？
									</h4>
									<ul className="space-y-2 text-sm text-muted-foreground">
										<li>
											✅ 成长机会：运营能力提升、人脉拓展
										</li>
										<li>✅ 资源对接：优先参与高价值活动</li>
										<li>
											✅ 商业分成：参与商业项目可获得分成
										</li>
										<li>
											✅
											专职机会：优秀志愿者可转为带薪岗位
										</li>
									</ul>
								</div>

								<div className="text-center">
									<Button
										size="lg"
										className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white"
										asChild
									>
										<Link href="/contact">
											申请成为志愿者
											<ArrowRightIcon className="ml-2 w-5 h-5" />
										</Link>
									</Button>
								</div>
							</CardContent>
						</Card>
					</TabsContent>

					{/* Observer path */}
					<TabsContent value="observer">
						<Card className="border-0 shadow-xl bg-white">
							<CardContent className="p-8">
								<div className="text-center mb-8">
									<div className="text-4xl mb-4">👀</div>
									<h3 className="text-2xl font-bold mb-2">
										体验者路径
									</h3>
									<p className="text-muted-foreground">
										适合：刚了解社区、想先观察的人
									</p>
								</div>

								<div className="space-y-6 mb-8">
									{[
										{
											step: "1️⃣",
											title: "关注公众号，了解最新活动",
											desc: "获取活动预告和社区动态",
										},
										{
											step: "2️⃣",
											title: "加入开放群，旁听讨论",
											desc: "不发言也OK，先感受氛围",
										},
										{
											step: "3️⃣",
											title: "报名一次活动，线下见面聊聊",
											desc: "面对面交流，判断是否适合",
										},
										{
											step: "4️⃣",
											title: "觉得合适再深度参与",
											desc: "按照自己的节奏融入社区",
										},
									].map((item, index) => (
										<div
											key={index}
											className="flex items-start gap-4 p-4 bg-blue-50 rounded-lg"
										>
											<div className="text-2xl flex-shrink-0">
												{item.step}
											</div>
											<div className="flex-1">
												<h4 className="font-bold text-foreground mb-1">
													{item.title}
												</h4>
												<p className="text-sm text-muted-foreground">
													{item.desc}
												</p>
											</div>
										</div>
									))}
								</div>

								<div className="text-center">
									<Button
										size="lg"
										className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white"
										asChild
									>
										<Link href="/contact">
											扫码关注公众号
											<ArrowRightIcon className="ml-2 w-5 h-5" />
										</Link>
									</Button>
								</div>
							</CardContent>
						</Card>
					</TabsContent>
				</Tabs>

				{/* FAQ boxes */}
				<div className="grid md:grid-cols-2 gap-6 mt-16 max-w-4xl mx-auto">
					<Card className="border-2 border-purple-200 bg-purple-50">
						<CardContent className="p-6">
							<h4 className="font-bold text-foreground mb-2">
								❓ 我不在这些城市怎么办？
							</h4>
							<p className="text-sm text-muted-foreground mb-3">
								可以参加线上活动，或者成为新城市的分部创始成员！
							</p>
							<Link
								href="/contact"
								className="text-sm text-purple-600 hover:text-purple-700 font-medium"
							>
								查看如何建立分部 →
							</Link>
						</CardContent>
					</Card>

					<Card className="border-2 border-purple-200 bg-purple-50">
						<CardContent className="p-6">
							<h4 className="font-bold text-foreground mb-2">
								❓ 我技术小白也能参与吗？
							</h4>
							<p className="text-sm text-muted-foreground mb-3">
								当然！我们需要设计师、产品经理、运营等各种角色
							</p>
							<Link
								href="/u"
								className="text-sm text-purple-600 hover:text-purple-700 font-medium"
							>
								查看成员构成 →
							</Link>
						</CardContent>
					</Card>
				</div>
			</div>
		</section>
	);
}
