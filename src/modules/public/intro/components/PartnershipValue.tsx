import { Award, TrendingUp, Users, Zap } from "lucide-react";

export function PartnershipValue() {
	const partnerSuccessStories = [
		{
			type: "政府合作",
			title: "深圳科技园区合作",
			description: "为社区提供常驻办公场地，成功孵化15个优质AI产品项目",
			image: "/images/events/ai00005.jpg",
			results: ["15个项目孵化", "50+创业者受益", "政府创新典型案例"],
		},
		{
			type: "投资合作",
			title: "知名孵化器投资",
			description: "为社区优质项目提供种子资金，3个项目获得后续A轮融资",
			image: "/images/events/gdc00003.jpg",
			results: ["种子资金100万+", "3个A轮项目", "投资回报率300%"],
		},
		{
			type: "企业赞助",
			title: "科技公司深度合作",
			description: "提供云服务资源和技术支持，员工参与获得创新启发",
			image: "/images/events/hack00003.jpg",
			results: ["云资源50万+", "20+员工参与", "企业创新文化提升"],
		},
	];

	const partnershipValues = [
		{
			icon: Users,
			title: "人才价值",
			description: "接触5000+优质AI产品创造者，建立人才储备和合作网络",
			color: "blue",
		},
		{
			icon: Zap,
			title: "创新价值",
			description: "参与前沿AI产品孵化，获得创新项目的优先接触机会",
			color: "purple",
		},
		{
			icon: Award,
			title: "品牌价值",
			description: "展示社会责任形象，获得创新生态建设的行业认可",
			color: "green",
		},
		{
			icon: TrendingUp,
			title: "商业价值",
			description: "发现潜力项目投资机会，实现商业合作与共同发展",
			color: "orange",
		},
	];

	return (
		<section id="partnership-value" className="py-16 lg:py-24">
			<div className="container">
				{/* 标题 */}
				<div className="mx-auto mb-12 max-w-3xl text-center">
					<div className="mb-4 inline-block rounded-full bg-primary/10 px-4 py-1 text-sm text-primary">
						合作价值
					</div>
					<h2 className="font-bold text-4xl lg:text-5xl mb-4">
						共创价值，互利共赢
					</h2>
					<p className="text-lg text-muted-foreground">
						我们的合作伙伴不仅是资源提供者，更是共同价值创造者
					</p>
				</div>

				{/* 合作价值点 */}
				<div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
					{partnershipValues.map((value, index) => {
						const Icon = value.icon;
						return (
							<div
								key={index}
								className="text-center bg-background/60 backdrop-blur-sm rounded-xl p-6 border border-border/50 hover:shadow-lg transition-shadow"
							>
								<div
									className={`w-12 h-12 rounded-lg bg-${value.color}-100 dark:bg-${value.color}-900/30 flex items-center justify-center mx-auto mb-4`}
								>
									<Icon
										className={`w-6 h-6 text-${value.color}-600 dark:text-${value.color}-400`}
									/>
								</div>
								<h3 className="font-semibold mb-2">
									{value.title}
								</h3>
								<p className="text-sm text-muted-foreground">
									{value.description}
								</p>
							</div>
						);
					})}
				</div>

				{/* 成功案例 */}
				{/* 				
				<div className="mb-16">
					<h3 className="text-2xl font-bold text-center mb-8">
						合作成功案例
					</h3>
					<div className="grid lg:grid-cols-3 gap-8">
						{partnerSuccessStories.map((story, index) => (
							<div
								key={index}
								className="bg-background/60 backdrop-blur-sm rounded-xl overflow-hidden border border-border/50 hover:shadow-lg transition-shadow"
							>
								<div className="relative h-48 w-full">
									<Image
										src={story.image}
										alt={story.title}
										fill
										className="object-cover"
										sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
									/>
									<div className="absolute top-4 left-4">
										<span className="text-xs bg-primary/90 text-primary-foreground px-2 py-1 rounded-full">
											{story.type}
										</span>
									</div>
								</div>

								<div className="p-6">
									<h4 className="font-semibold text-lg mb-2">
										{story.title}
									</h4>
									<p className="text-sm text-muted-foreground mb-4">
										{story.description}
									</p>

									<div className="space-y-2">
										<h5 className="text-sm font-medium text-primary">
											合作成果：
										</h5>
										<div className="flex flex-wrap gap-1">
											{story.results.map(
												(result, idx) => (
													<span
														key={idx}
														className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full"
													>
														{result}
													</span>
												),
											)}
										</div>
									</div>
								</div>
							</div>
						))}
					</div>
				</div> */}

				{/* CTA区域 - 简化版 */}
				{/* 				
				<div className="text-center bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/30 dark:to-blue-950/30 rounded-2xl p-8 md:p-12 border border-purple-200/50 dark:border-purple-800/50">
					<div className="grid md:grid-cols-3 gap-6 mb-8">
						<div className="flex flex-col items-center">
							<Star className="w-12 h-12 text-yellow-500 mb-3" />
							<div className="font-semibold">典型合作案例</div>
							<div className="text-sm text-muted-foreground">
								政企学研多方协作
							</div>
						</div>
						<div className="flex flex-col items-center">
							<Target className="w-12 h-12 text-green-500 mb-3" />
							<div className="font-semibold">合作效果验证</div>
							<div className="text-sm text-muted-foreground">
								可量化的价值回报
							</div>
						</div>
						<div className="flex flex-col items-center">
							<Handshake className="w-12 h-12 text-blue-500 mb-3" />
							<div className="font-semibold">模式可复制</div>
							<div className="text-sm text-muted-foreground">
								标准化合作流程
							</div>
						</div>
					</div>
					<Button
						size="lg"
						className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
						asChild
					>
						<Link href="mailto:contact@hackathonweekly.com?subject=合作案例咨询">
							获取详细合作案例
							<ArrowRight className="ml-2 size-4" />
						</Link>
					</Button>
				</div> */}
			</div>
		</section>
	);
}
