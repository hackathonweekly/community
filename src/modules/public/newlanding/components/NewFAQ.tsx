"use client";

import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent } from "@/components/ui/card";

export function NewFAQ() {
	const faqs = [
		{
			question: "什么是黑客松？我适合参加吗？",
			answer: "黑客松是在限定时间内（通常1-3天）集中创造数字产品的活动，参与者组成团队快速将想法变为现实。现在还有很多 Vibe Coding（氛围编程）形式的黑客松，通过 AI 编程工具（如 Cursor、GitHub Copilot）降低技术门槛，让非专业程序员也能参与。无论你是开发者、设计师、产品经理还是完全的新手，都可以参与！",
		},
		{
			question: "我没有技术背景，可以加入吗？",
			answer: "当然可以！我们需要设计师、产品经理、运营、市场等各种背景的成员。很多成功的产品都是由跨领域团队创造的。社区专门有引导活动帮助新人找到合作伙伴。实际上，我们社区 40% 的成员都是非技术背景。",
		},
		{
			question: "社区靠什么运营？会不会突然关闭？",
			answer: "我们是使命驱动的社会企业（不是纯公益也不是纯商业）。社区主体：盈余 100% 再投入，财务季度公开透明。商业生态：鼓励成员孵化营利项目，成功后反哺社区。多元收入：赞助、企业服务、付费活动等。这种模式既能保持使命感，又能可持续发展。",
		},
		{
			question: "社区是免费的吗？",
			answer: "社区本身是免费加入的！基础的活动参与、作品分享、找合作伙伴都是完全免费的。我们是使命驱动的社会企业，所有盈余100%再投入社区公共建设。我们同时孵化独立的营利性项目，通过利润反哺等方式为社区发展贡献力量，形成健康的商业生态。",
		},
		{
			question: "我可以在社区找到合作伙伴吗？",
			answer: "这是社区的核心价值之一！我们鼓励多跨领域协作组合，很多成员通过社区找到了技术伙伴、设计师或产品经理。通过黑客松现场组队、Demo Show 展示、周末共创日交流，你很容易遇到志同道合的伙伴。",
		},
		{
			question: "志愿者有什么回报？",
			answer: '我们相信"为爱发电"不可持续，所以设计了多种回报机制：成长回报（运营能力提升、人脉拓展、简历加分）、资源回报（优先参与高价值活动、对接导师资源）、经济回报（商业项目分成，如企业定制活动）、职业回报（优秀志愿者可转为带薪专职岗位）。',
		},
	];

	return (
		<section className="py-20 md:py-28 bg-muted/30 relative">
			{/* Background decoration */}
			<div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[200px] sm:w-[600px] sm:h-[300px] lg:w-[800px] lg:h-[400px] rounded-full bg-gradient-to-r from-purple-400/10 to-purple-300/5 opacity-60 blur-[120px]" />

			<div className="container px-4 md:px-6 relative z-10">
				{/* Header */}
				<div className="text-center mb-16">
					<div className="mb-6 md:mb-8 flex justify-center">
						<div className="inline-flex items-center rounded-full bg-purple-100 px-3 py-1.5 md:px-5 md:py-2 border border-purple-300">
							<span className="text-purple-700 font-medium text-xs md:text-sm">
								❓ 常见问题
							</span>
						</div>
					</div>

					<h2 className="text-4xl md:text-6xl font-bold leading-tight mb-6">
						加入前你可能想了解的
						<span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-blue-500 block mt-2">
							几个问题
						</span>
					</h2>

					<p className="text-base md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
						我们整理了最常被问到的问题，帮助你更好地了解社区
					</p>
				</div>

				{/* FAQ Accordion */}
				<div className="max-w-3xl mx-auto">
					<Card className="border-0 shadow-xl bg-white">
						<CardContent className="p-6 md:p-8">
							<Accordion
								type="single"
								collapsible
								className="w-full"
							>
								{faqs.map((faq, index) => (
									<AccordionItem
										key={index}
										value={`item-${index}`}
									>
										<AccordionTrigger className="text-left">
											<span className="font-bold text-foreground">
												{faq.question}
											</span>
										</AccordionTrigger>
										<AccordionContent>
											<p className="text-muted-foreground leading-relaxed">
												{faq.answer}
											</p>
										</AccordionContent>
									</AccordionItem>
								))}
							</Accordion>
						</CardContent>
					</Card>
				</div>
			</div>
		</section>
	);
}
