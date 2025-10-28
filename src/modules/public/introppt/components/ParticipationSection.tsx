"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
	UsersIcon,
	MicIcon,
	UserCogIcon,
	HandshakeIcon,
	ArrowRightIcon,
	CameraIcon,
	ClipboardCheckIcon,
	MapPinIcon,
	CalendarIcon,
	PaletteIcon,
	NetworkIcon,
} from "lucide-react";

export function ParticipationSection() {
	const coCreatorRoles = [
		{
			icon: UsersIcon,
			title: "志愿者",
			subtitle: "支持活动顺利进行",
			description: "以志愿者身份参与活动，为社区提供基础支持",
			actions: [
				{ icon: CameraIcon, text: "记录摄影 - 捕捉社区精彩瞬间" },
				{
					icon: ClipboardCheckIcon,
					text: "签到引导 - 帮助参与者顺利入场",
				},
				{ icon: MapPinIcon, text: "场地协助 - 布置与维护活动场地" },
				{ icon: UsersIcon, text: "参与者服务 - 解答问题，提供帮助" },
			],
			cta: "成为志愿者",
			ctaLink: "#contact",
			color: "blue",
		},
		{
			icon: MicIcon,
			title: "分享者",
			subtitle: "传递知识与经验",
			description: "通过分享帮助社区成员成长，建立个人影响力",
			actions: [
				{
					icon: MicIcon,
					text: "主持活动 - 担任黑客松或 Demo Show 主持人",
				},
				{
					icon: MicIcon,
					text: "Lightning Talk - 5分钟快速分享你的想法",
				},
				{
					icon: PaletteIcon,
					text: "技能工作坊 - 教授设计、开发、运营等技能",
				},
				{ icon: UsersIcon, text: "项目分享 - Demo 你的创造过程与成果" },
			],
			cta: "申请分享",
			ctaLink: "#contact",
			color: "purple",
			highlight: true,
		},
		{
			icon: UserCogIcon,
			title: "负责人",
			subtitle: "推动社区长期发展",
			description: "深度参与社区建设，承担具体运营职责",
			actions: [
				{
					icon: CalendarIcon,
					text: "活动策划 - 策划并组织黑客松、Demo Show 等活动",
				},
				{
					icon: HandshakeIcon,
					text: "伙伴关系 - 拓展合作资源，对接赞助商",
				},
				{
					icon: PaletteIcon,
					text: "品牌设计 - 设计视觉物料，维护社区品牌",
				},
				{
					icon: NetworkIcon,
					text: "生态合作 - 建立生态伙伴关系，推动社区发展",
				},
			],
			cta: "申请成为负责人",
			ctaLink: "#contact",
			color: "orange",
		},
	];

	const partnershipTypes = [
		{
			title: "活动共创",
			description: "联合举办主题黑客松、Demo Show，共同打造优质内容",
		},
		{
			title: "资源赞助",
			description: "提供场地、工具、API Token 等资源支持",
		},
		{
			title: "资金支持",
			description: "赞助社区活动，支持社区长期发展",
		},
	];

	return (
		<section
			id="participation"
			className="py-20 md:py-28 bg-background relative overflow-hidden"
		>
			{/* Subtle background decoration */}
			<div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] lg:w-[900px] lg:h-[450px] rounded-full bg-gradient-to-r from-purple-400/10 to-purple-300/5 opacity-60 blur-[120px]" />

			<div className="container relative z-10 px-4 md:px-6">
				{/* Section Header */}
				<div className="text-center mb-16">
					<div className="mb-6 flex justify-center">
						<div className="inline-flex items-center rounded-full bg-purple-100 px-5 py-2 border border-purple-300">
							<UsersIcon className="w-4 h-4 mr-2 text-purple-700" />
							<span className="text-purple-700 font-medium text-sm">
								找到你的位置
							</span>
						</div>
					</div>

					<h2 className="text-4xl md:text-6xl font-bold leading-tight mb-6">
						参与
						<span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-blue-500 block">
							社区共创
						</span>
					</h2>

					<p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
						成为共创伙伴，一起打造有温度的创造者社区
					</p>
				</div>

				{/* Co-creator Roles */}
				<div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto mb-20">
					{coCreatorRoles.map((role) => {
						const colorClasses = {
							blue: {
								card: "border-blue-200 bg-blue-50/50",
								icon: "bg-blue-100 border-blue-300 text-blue-600",
							},
							purple: {
								card: "border-purple-200 bg-purple-50/50",
								icon: "bg-purple-100 border-purple-300 text-purple-600",
							},
							orange: {
								card: "border-orange-200 bg-orange-50/50",
								icon: "bg-orange-100 border-orange-300 text-orange-600",
							},
						};

						const colors =
							colorClasses[
								role.color as keyof typeof colorClasses
							];

						return (
							<Card
								key={role.title}
								className={`group border-2 ${colors.card} hover:shadow-xl transition-all duration-300 hover:-translate-y-1 ${
									role.highlight
										? "ring-2 ring-purple-400"
										: ""
								}`}
							>
								<CardContent className="p-8">
									{/* Header */}
									<div className="text-center mb-6">
										<div className="flex justify-center mb-3">
											<div
												className={`p-3 rounded-xl border ${colors.icon}`}
											>
												<role.icon className="w-6 h-6" />
											</div>
										</div>
										<h3 className="text-xl font-bold text-foreground mb-1">
											{role.title}
										</h3>
										<p className="text-sm text-muted-foreground">
											{role.subtitle}
										</p>
									</div>

									{/* Description */}
									<p className="text-sm text-muted-foreground mb-6 text-center">
										{role.description}
									</p>

									{/* Actions List */}
									<ul className="space-y-3 mb-6">
										{role.actions.map((action, index) => (
											<li
												key={index}
												className="flex items-start gap-2"
											>
												<action.icon className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
												<span className="text-sm text-muted-foreground">
													{action.text}
												</span>
											</li>
										))}
									</ul>

									{/* CTA Button */}
									<Button
										className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white"
										asChild
										size="sm"
									>
										<a href={role.ctaLink}>
											{role.cta}
											<ArrowRightIcon className="ml-2 w-4 h-4" />
										</a>
									</Button>
								</CardContent>
							</Card>
						);
					})}
				</div>

				{/* Partner Section */}
				<div className="max-w-5xl mx-auto">
					<div className="text-center mb-12">
						<div className="mb-6 flex justify-center">
							<div className="inline-flex items-center rounded-full bg-green-100 px-5 py-2 border border-green-300">
								<HandshakeIcon className="w-4 h-4 mr-2 text-green-700" />
								<span className="text-green-700 font-medium text-sm">
									合作伙伴
								</span>
							</div>
						</div>
						<h3 className="text-3xl md:text-4xl font-bold mb-4">
							品牌与机构合作
						</h3>
						<p className="text-lg text-muted-foreground">
							期待与认同社区使命的品牌和机构建立长期合作关系
						</p>
					</div>

					<div className="grid md:grid-cols-3 gap-6 mb-8">
						{partnershipTypes.map((type) => (
							<Card
								key={type.title}
								className="border-2 hover:shadow-lg transition-all duration-300"
							>
								<CardContent className="p-6 text-center">
									<h4 className="text-lg font-bold text-foreground mb-2">
										{type.title}
									</h4>
									<p className="text-sm text-muted-foreground">
										{type.description}
									</p>
								</CardContent>
							</Card>
						))}
					</div>

					<div className="text-center">
						<Button
							size="lg"
							variant="outline"
							className="border-green-300 hover:bg-green-50"
							asChild
						>
							<a href="#contact">
								联系我们洽谈合作
								<ArrowRightIcon className="ml-2 w-5 h-5" />
							</a>
						</Button>
					</div>
				</div>
			</div>
		</section>
	);
}
