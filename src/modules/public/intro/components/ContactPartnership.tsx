import { Button } from "@/components/ui/button";
import {
	Mail,
	Phone,
	FileText,
	CheckCircle,
	ArrowRight,
	Handshake,
	MessageCircle,
} from "lucide-react";
import Link from "next/link";
import { LocaleLink } from "@i18n/routing";

export function ContactPartnership() {
	const contactSteps = [
		{
			step: "01",
			title: "初步接触",
			description: "发送合作意向邮件，我们将在尽快回复您",
			icon: Mail,
		},
		{
			step: "02",
			title: "深入沟通",
			description: "安排线上或线下会议，详细讨论合作方案",
			icon: Phone,
		},
		{
			step: "03",
			title: "方案制定",
			description: "基于双方需求制定具体的合作实施方案",
			icon: FileText,
		},
		{
			step: "04",
			title: "正式合作",
			description: "签署合作协议，开启互利共赢的合作之旅",
			icon: CheckCircle,
		},
	];

	const requiredInfo = [
		"您的组织背景与资源优势",
		"期望的合作方式与支持形式",
		"对合作价值回报的期待",
		"联系人信息与沟通方式",
	];

	return (
		<section className="py-16 lg:py-24 bg-muted/30">
			<div className="container">
				<div className="mx-auto mb-12 max-w-3xl text-center">
					<div className="mb-4 inline-block rounded-full bg-primary/10 px-4 py-1 text-sm text-primary">
						联系合作
					</div>
					<h2 className="font-bold text-4xl lg:text-5xl mb-4">
						开启合作之旅
					</h2>
					<p className="text-lg text-muted-foreground">
						让我们一起，为AI时代的创造者点亮前进的明灯，共同构建更美好的创新未来
					</p>
				</div>

				<div className="grid lg:grid-cols-2 gap-12 items-start">
					{/* 合作流程 */}
					<div>
						<h3 className="text-2xl font-bold mb-8">合作流程</h3>
						<div className="space-y-6">
							{contactSteps.map((step, index) => (
								<div
									key={index}
									className="flex items-start space-x-4"
								>
									<div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold flex-shrink-0">
										{step.step}
									</div>
									<div className="flex-1">
										<div className="flex items-center space-x-3 mb-2">
											<step.icon className="w-5 h-5 text-primary" />
											<h4 className="font-semibold">
												{step.title}
											</h4>
										</div>
										<p className="text-muted-foreground text-sm">
											{step.description}
										</p>
									</div>
								</div>
							))}
						</div>

						{/* 联系方式卡片 */}
						<div className="mt-8 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/50 dark:to-blue-900/30 rounded-xl p-6 border border-blue-200/50 dark:border-blue-800/50">
							<h4 className="font-semibold mb-4 flex items-center">
								<MessageCircle className="w-5 h-5 mr-2 text-blue-600" />
								联系方式
							</h4>
							<div className="space-y-3">
								<div className="flex justify-between items-center text-sm">
									<span className="text-muted-foreground">
										合作邮箱:
									</span>
									<Link
										href="mailto:contact@hackathonweekly.com?subject=合作伙伴咨询"
										className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
									>
										Summer92123@gmail.com
									</Link>
								</div>
								<div className="flex justify-between items-center text-sm">
									<span className="text-muted-foreground">
										微信咨询:
									</span>
									<span className="font-medium">
										Vivian7days
									</span>
								</div>
							</div>
						</div>
					</div>

					{/* 合作申请区域 */}
					<div>
						<div className="bg-background/60 backdrop-blur-sm rounded-xl border border-border/50 p-6">
							<h3 className="text-xl font-semibold mb-4">
								合作洽谈信息
							</h3>
							<p className="text-muted-foreground mb-6 text-sm">
								为了更好地为您提供合作方案，请在邮件中包含以下信息：
							</p>

							<div className="space-y-3 mb-6">
								{requiredInfo.map((info, index) => (
									<div
										key={index}
										className="flex items-start space-x-3"
									>
										<CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
										<span className="text-sm">{info}</span>
									</div>
								))}
							</div>

							<div className="space-y-4">
								<Button
									className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
									size="lg"
									asChild
								>
									<Link href="mailto:contact@hackathonweekly.com?subject=合作伙伴申请&body=您好！我们对与周周黑客松社区的合作非常感兴趣。以下是我们的基本信息：%0A%0A1. 组织背景：%0A2. 资源优势：%0A3. 期望合作方式：%0A4. 价值期待：%0A5. 联系方式：%0A%0A期待您的回复！">
										发送合作邮件
										<ArrowRight className="ml-2 size-4" />
									</Link>
								</Button>
								<Button
									variant="outline"
									className="w-full"
									asChild
								>
									<LocaleLink href="/docs">
										了解更多社区信息
									</LocaleLink>
								</Button>
							</div>
						</div>
					</div>
				</div>

				{/* 最终行动号召 */}
				<div className="text-center mt-16 pt-12 border-t border-border">
					<Handshake className="w-16 h-16 text-primary mx-auto mb-6" />
					<h3 className="text-2xl md:text-3xl font-bold mb-4">
						共同构建温暖而充满创造力的未来
					</h3>
					<p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
						让创造变得更简单，让创新变得更有温度。与我们携手，为AI时代的创造者生态贡献您的力量。
					</p>
					<div className="flex flex-col sm:flex-row gap-4 justify-center">
						<Button
							size="lg"
							className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
							asChild
						>
							<Link href="mailto:Summer92123@gmail.com">
								立即开始合作
								<ArrowRight className="ml-2 size-4" />
							</Link>
						</Button>
						<Button variant="outline" size="lg" asChild>
							<LocaleLink href="/docs">了解社区详情</LocaleLink>
						</Button>
					</div>
				</div>
			</div>
		</section>
	);
}
