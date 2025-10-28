import { CheckCircle, Sparkles } from "lucide-react";
import Image from "next/image";

export function ExistingPartners() {
	const partners = [
		{
			name: "706青年空间",
			type: "场地合作伙伴",
			description: "提供联合办公空间和活动场地支持",
			logo: "/images/partners/706.jpg",
			cooperation: ["场地支持", "活动协办", "资源共享"],
		},
		{
			name: "OpenBuild",
			type: "技术合作伙伴",
			description: "Web3开发者社区，提供技术资源和开发者网络",
			logo: "/images/partners/OpenBuild.png",
			cooperation: ["技术资源", "开发者网络", "项目孵化"],
		},
		{
			name: "深港澳台青年创新创业基地",
			type: "孵化合作伙伴",
			description: "提供创业指导和孵化服务支持",
			logo: "/images/partners/bays-future.png",
			cooperation: ["创业指导", "资源对接", "投资推荐"],
		},
		{
			name: "Trae",
			type: "技术赞助商",
			description: "AI 原生 IDE，为社区成员提供工具赞助和技术支持",
			logo: "/images/partners/trae.png",
			cooperation: ["工具赞助", "技术支持", "产品合作"],
		},
		{
			name: "DeepTech",
			type: "媒体合作伙伴",
			description: "科技媒体平台，提供宣传推广支持",
			logo: "/images/partners/deeptech.jpg",
			cooperation: ["媒体宣传", "内容合作", "活动推广"],
		},
	];

	const partnershipStats = [
		{
			number: "5+",
			label: "长期合作伙伴",
			description: "深度战略合作关系",
		},
		{
			number: "50+",
			label: "资源对接次数",
			description: "成功的资源匹配",
		},
		{
			number: "100%",
			label: "合作满意度",
			description: "所有伙伴续约合作",
		},
		{
			number: "100+",
			label: "联合举办活动",
			description: "共同打造品牌活动",
		},
	];

	return (
		<section className="bg-muted/30 py-16 lg:py-24">
			<div className="container">
				{/* 标题 */}
				<div className="mx-auto mb-12 max-w-3xl text-center">
					<div className="mb-4 inline-block rounded-full bg-primary/10 px-4 py-1 text-sm text-primary">
						现有合作伙伴
					</div>
					<h2 className="font-bold text-4xl lg:text-5xl mb-4">
						值得信赖的合作伙伴
					</h2>
					<p className="text-lg text-muted-foreground">
						我们已与多家优质机构建立了深度合作关系，共同推动AI创新生态发展
					</p>
				</div>

				{/* 合作数据 */}
				<div className="grid md:grid-cols-4 gap-6 mb-16">
					{partnershipStats.map((stat, index) => (
						<div
							key={index}
							className="text-center bg-background/60 backdrop-blur-sm rounded-xl p-6 border border-border/50"
						>
							<div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-blue-500 mb-2">
								{stat.number}
							</div>
							<h3 className="font-semibold mb-1">{stat.label}</h3>
							<p className="text-sm text-muted-foreground">
								{stat.description}
							</p>
						</div>
					))}
				</div>

				{/* 合作伙伴展示 */}
				<div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
					{partners.map((partner, index) => (
						<div
							key={index}
							className="bg-background/60 backdrop-blur-sm rounded-xl border border-border/50 overflow-hidden hover:shadow-lg transition-shadow group"
						>
							{/* 合作伙伴Logo */}
							<div className="h-32 bg-white dark:bg-gray-800 flex items-center justify-center p-6">
								<div className="relative w-24 h-16">
									<Image
										src={partner.logo}
										alt={partner.name}
										fill
										className="object-contain group-hover:scale-105 transition-transform"
										sizes="96px"
									/>
								</div>
							</div>

							{/* 合作伙伴信息 */}
							<div className="p-6">
								<div className="flex items-center justify-between mb-2">
									<h3 className="font-semibold text-lg">
										{partner.name}
									</h3>
									<span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
										{partner.type}
									</span>
								</div>
								<p className="text-sm text-muted-foreground mb-4">
									{partner.description}
								</p>

								{/* 合作形式 */}
								<div className="space-y-2">
									<h4 className="text-sm font-medium flex items-center">
										<CheckCircle className="w-4 h-4 mr-2 text-green-500" />
										合作形式
									</h4>
									<div className="flex flex-wrap gap-1">
										{partner.cooperation.map(
											(coop, idx) => (
												<span
													key={idx}
													className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full"
												>
													{coop}
												</span>
											),
										)}
									</div>
								</div>
							</div>
						</div>
					))}
				</div>

				{/* 合作伙伴证言区域 */}
				<div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/30 dark:to-blue-950/30 rounded-2xl p-8 md:p-12 border border-purple-200/50 dark:border-purple-800/50">
					<div className="text-center">
						<Sparkles className="w-16 h-16 text-primary mx-auto mb-6" />
						<h3 className="text-2xl md:text-3xl font-bold mb-6">
							合作伙伴评价
						</h3>
						<div className="grid md:grid-cols-2 gap-8">
							<div className="bg-background/60 backdrop-blur-sm rounded-xl p-6">
								<p className="text-muted-foreground mb-4 italic">
									"周周黑客松社区的活力和专业度让我们印象深刻，与他们合作让我们接触到了很多优秀的AI项目和人才。"
								</p>
								<div className="flex items-center">
									<div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mr-3">
										<span className="text-sm font-semibold text-primary">
											706
										</span>
									</div>
									<div>
										<div className="font-medium">
											706青年空间
										</div>
										<div className="text-sm text-muted-foreground">
											场地合作伙伴
										</div>
									</div>
								</div>
							</div>
							<div className="bg-background/60 backdrop-blur-sm rounded-xl p-6">
								<p className="text-muted-foreground mb-4 italic">
									"这里有真正在做产品的创造者，我们从合作中发现了多个有潜力的投资项目。"
								</p>
								<div className="flex items-center">
									<div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mr-3">
										<span className="text-sm font-semibold text-primary">
											BC
										</span>
									</div>
									<div>
										<div className="font-medium">
											深港澳台青年创新创业基地
										</div>
										<div className="text-sm text-muted-foreground">
											孵化合作伙伴
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}
