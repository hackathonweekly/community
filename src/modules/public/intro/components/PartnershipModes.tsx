"use client";

import {
	Building2,
	DollarSign,
	GraduationCap,
	ChevronLeft,
	ChevronRight,
	MapPin,
	Server,
	Users,
	HandHeart,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function PartnershipModes() {
	const [currentIndex, setCurrentIndex] = useState(0);

	const partnershipModes = [
		{
			type: "政府机构",
			icon: Building2,
			title: "政策支持与场地资源",
			description: "提供政策指导、场地支持，共建创新生态典型案例",
			gradient:
				"from-blue-50 to-blue-100 dark:from-blue-950/50 dark:to-blue-900/30",
			iconColor: "text-blue-600 dark:text-blue-400",
			borderColor: "border-blue-200/50 dark:border-blue-800/50",
			collaborationWays: [
				{
					icon: MapPin,
					title: "场地支持",
					description: "提供共创空间、会议室、展示区域",
					examples: ["联合办公场地", "活动举办场所", "项目展示空间"],
				},
				{
					icon: Users,
					title: "政策指导",
					description: "创业政策解读、资质申报协助",
					examples: ["政策宣讲活动", "资质申报指导", "法规合规咨询"],
				},
				{
					icon: HandHeart,
					title: "品牌合作",
					description: "联合举办创新活动，打造区域名片",
					examples: ["创新大赛冠名", "政府背景背书", "媒体联合宣传"],
				},
			],
			benefits: [
				"创新生态建设",
				"人才聚集效应",
				"政策落地典型",
				"区域品牌提升",
			],
			successCase: {
				title: "深圳科技园区合作",
				description:
					"提供2000㎡创新空间，孵化15个AI项目，成为政府创新政策落地标杆",
			},
		},
		{
			type: "投资孵化器",
			icon: DollarSign,
			title: "资金支持与专业服务",
			description: "种子资金投入，专业孵化指导，共享投资回报",
			gradient:
				"from-green-50 to-green-100 dark:from-green-950/50 dark:to-green-900/30",
			iconColor: "text-green-600 dark:text-green-400",
			borderColor: "border-green-200/50 dark:border-green-800/50",
			collaborationWays: [
				{
					icon: DollarSign,
					title: "资金投入",
					description: "种子轮、天使轮资金支持",
					examples: ["项目种子资金", "活动赞助费用", "基础设施投入"],
				},
				{
					icon: Users,
					title: "孵化指导",
					description: "专业导师团队，全程项目指导",
					examples: ["商业模式梳理", "技术路线规划", "市场推广策略"],
				},
				{
					icon: Server,
					title: "资源对接",
					description: "产业资源、渠道资源全面对接",
					examples: [
						"上下游企业对接",
						"销售渠道引荐",
						"技术合作伙伴",
					],
				},
			],
			benefits: [
				"优质项目发现",
				"早期投资机会",
				"生态圈扩展",
				"投资回报丰厚",
			],
			successCase: {
				title: "知名孵化器投资",
				description:
					"投入100万种子资金，3个项目获A轮融资，投资回报率达300%",
			},
		},
		{
			type: "企业单位",
			icon: Building2,
			title: "资源支持与人才合作",
			description: "技术资源赞助，人才交流培养，品牌联合推广",
			gradient:
				"from-purple-50 to-purple-100 dark:from-purple-950/50 dark:to-purple-900/30",
			iconColor: "text-purple-600 dark:text-purple-400",
			borderColor: "border-purple-200/50 dark:border-purple-800/50",
			collaborationWays: [
				{
					icon: Server,
					title: "技术资源",
					description: "云服务、开发工具、技术支持",
					examples: ["云服务器资源", "API接口支持", "技术架构咨询"],
				},
				{
					icon: Users,
					title: "人才交流",
					description: "员工参与创新，实习就业合作",
					examples: ["员工导师计划", "实习生招募", "校招合作"],
				},
				{
					icon: HandHeart,
					title: "品牌合作",
					description: "联合品牌推广，共同市场拓展",
					examples: ["品牌联合营销", "产品合作开发", "渠道资源共享"],
				},
			],
			benefits: [
				"人才储备建设",
				"品牌价值提升",
				"创新文化输入",
				"市场机会拓展",
			],
			successCase: {
				title: "科技公司深度合作",
				description:
					"提供价值50万云资源，20+员工参与项目，显著提升企业创新文化",
			},
		},
		{
			type: "教育机构",
			icon: GraduationCap,
			title: "实践教学与人才培养",
			description: "产学研深度结合，实践教学创新，人才培养升级",
			gradient:
				"from-orange-50 to-orange-100 dark:from-orange-950/50 dark:to-orange-900/30",
			iconColor: "text-orange-600 dark:text-orange-400",
			borderColor: "border-orange-200/50 dark:border-orange-800/50",
			collaborationWays: [
				{
					icon: Users,
					title: "课程合作",
					description: "实践课程设计，产业案例教学",
					examples: ["AI产品实战课程", "创业实践项目", "导师实训营"],
				},
				{
					icon: MapPin,
					title: "实践基地",
					description: "学生实习实践，毕业设计指导",
					examples: ["实习实践基地", "毕业设计合作", "科研项目对接"],
				},
				{
					icon: HandHeart,
					title: "师资交流",
					description: "行业专家授课，师资培训提升",
					examples: ["行业专家讲座", "师资培训项目", "学术交流活动"],
				},
			],
			benefits: [
				"实践教学创新",
				"人才培养升级",
				"产学研结合",
				"就业质量提升",
			],
			successCase: {
				title: "高校产学研合作",
				description:
					"合作开设AI产品课程，指导50+学生项目，90%就业率行业领先",
			},
		},
	];

	const nextSlide = () => {
		setCurrentIndex((prev) => (prev + 1) % partnershipModes.length);
	};

	const prevSlide = () => {
		setCurrentIndex(
			(prev) =>
				(prev - 1 + partnershipModes.length) % partnershipModes.length,
		);
	};

	const currentMode = partnershipModes[currentIndex];
	const Icon = currentMode.icon;

	return (
		<section className="py-16 lg:py-24">
			<div className="container">
				{/* 标题 */}
				<div className="mx-auto mb-12 max-w-3xl text-center">
					<div className="mb-4 inline-block rounded-full bg-primary/10 px-4 py-1 text-sm text-primary">
						合作模式
					</div>
					<h2 className="font-bold text-4xl lg:text-5xl mb-4">
						多样化合作方式
					</h2>
					<p className="text-lg text-muted-foreground">
						我们为不同类型的机构设计了灵活多样的合作模式，实现互利共赢
					</p>
				</div>

				{/* 类型标签 */}
				<div className="flex justify-center mt-8">
					<div className="flex flex-wrap gap-3 justify-center mb-8">
						{partnershipModes.map((mode, index) => {
							const ModeIcon = mode.icon;
							return (
								<button
									key={index}
									onClick={() => setCurrentIndex(index)}
									className={`flex items-center space-x-2 px-4 py-2 rounded-full transition-colors ${
										index === currentIndex
											? "bg-primary text-primary-foreground"
											: "bg-background/60 hover:bg-background/80 backdrop-blur-sm"
									}`}
								>
									<ModeIcon className="w-4 h-4" />
									<span className="text-sm font-medium">
										{mode.type}
									</span>
								</button>
							);
						})}
					</div>
				</div>

				{/* 轮播指示器 */}
				<div className="flex justify-center mb-8">
					<div className="flex space-x-2">
						{partnershipModes.map((_, index) => (
							<button
								key={index}
								onClick={() => setCurrentIndex(index)}
								className={`w-3 h-3 rounded-full transition-colors ${
									index === currentIndex
										? "bg-primary"
										: "bg-primary/20 hover:bg-primary/40"
								}`}
							/>
						))}
					</div>
				</div>

				{/* 轮播卡片 */}
				<div className="relative">
					<div
						className={`bg-gradient-to-br ${currentMode.gradient} rounded-2xl ${currentMode.borderColor} border-2 p-8 transition-all duration-500`}
					>
						{/* 轮播按钮 */}
						<Button
							variant="outline"
							size="icon"
							className="absolute left-1 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm"
							onClick={prevSlide}
						>
							<ChevronLeft className="w-4 h-4" />
						</Button>
						<Button
							variant="outline"
							size="icon"
							className="absolute right-1 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm"
							onClick={nextSlide}
						>
							<ChevronRight className="w-4 h-4" />
						</Button>

						{/* 卡片内容 */}
						<div className="max-w-5xl mx-auto">
							{/* 头部 */}
							<div className="text-center mb-8">
								<div
									className={
										"w-16 h-16 rounded-2xl bg-background/60 backdrop-blur-sm flex items-center justify-center mx-auto mb-4"
									}
								>
									<Icon
										className={`w-8 h-8 ${currentMode.iconColor}`}
									/>
								</div>
								<h3 className="text-2xl font-bold mb-2">
									{currentMode.title}
								</h3>
								<p className="text-muted-foreground">
									{currentMode.description}
								</p>
							</div>

							{/* 合作方式 */}
							<div className="grid md:grid-cols-3 gap-6 mb-8">
								{currentMode.collaborationWays.map(
									(way, index) => {
										const WayIcon = way.icon;
										return (
											<div
												key={index}
												className="bg-background/60 backdrop-blur-sm rounded-xl p-6"
											>
												<div className="flex items-center mb-3">
													<div
														className={
															"w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center mr-3"
														}
													>
														<WayIcon className="w-4 h-4 text-primary" />
													</div>
													<h4 className="font-semibold">
														{way.title}
													</h4>
												</div>
												<p className="text-sm text-muted-foreground mb-3">
													{way.description}
												</p>
												<div className="space-y-1">
													{way.examples.map(
														(example, idx) => (
															<div
																key={idx}
																className="text-xs text-primary bg-primary/10 px-2 py-1 rounded-full inline-block mr-1 mb-1"
															>
																{example}
															</div>
														),
													)}
												</div>
											</div>
										);
									},
								)}
							</div>

							{/* 合作价值和成功案例 */}
							<div className="grid md:grid-cols-2 gap-6">
								{/* 合作价值 */}
								<div className="bg-background/60 backdrop-blur-sm rounded-xl p-6">
									<h4 className="font-semibold mb-3">
										合作价值
									</h4>
									<div className="flex flex-wrap gap-2">
										{currentMode.benefits.map(
											(benefit, index) => (
												<span
													key={index}
													className="text-xs bg-primary/10 text-primary px-3 py-1 rounded-full"
												>
													{benefit}
												</span>
											),
										)}
									</div>
								</div>

								{/* 成功案例 */}
								<div className="bg-background/60 backdrop-blur-sm rounded-xl p-6">
									<h4 className="font-semibold mb-3">
										成功案例
									</h4>
									<div className="mb-2">
										<span className="text-sm font-medium text-primary">
											{currentMode.successCase.title}
										</span>
									</div>
									<p className="text-xs text-muted-foreground">
										{currentMode.successCase.description}
									</p>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}
