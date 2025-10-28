import {
	Award,
	Code,
	Coffee,
	Heart,
	Rocket,
	Sparkles,
	Target,
	Zap,
} from "lucide-react";
import Image from "next/image";

export function CommunityShowcase() {
	const stats = [
		{
			number: "6000+",
			label: "活跃创造者",
			description: "来自各行各业的产品创作者",
		},
		{ number: "5+", label: "社区分部", description: "覆盖全国主要城市" },
		{ number: "100+", label: "MVP项目", description: "从0到1的真实产品" },
		{
			number: "200+",
			label: "活动",
			description: "丰富多样的社区活动",
		},
	];

	const coreActivities = [
		{
			icon: Target,
			title: "Demo Show",
			subtitle: "客厅 Demo 局",
			description:
				"创作者带着30%完成度的作品来分享，在支持的基础上给出真诚建议",
			frequency: "每月一次",
			image: "/images/events/demo00001.jpg",
			color: "purple",
		},
		{
			icon: Code,
			title: "迷你黑客松",
			subtitle: "AI工具实战",
			description:
				"使用AI工具，围绕主题在短时间内集中学习并创作有趣的作品",
			frequency: "每月一次",
			image: "/images/events/hack00001.jpg",
			color: "blue",
		},
		{
			icon: Coffee,
			title: "周末共创日/AI小酒馆",
			subtitle: "线下办公/聚会",
			description:
				"带着项目一起办公/聊天，在同伴氛围中提升效率，促进跨界合作",
			frequency: "每两周",
			image: "/images/events/meet00001.jpg",
			color: "orange",
		},
	];

	const communityValues = [
		{
			icon: Heart,
			title: "爱",
			subtitle: "Love",
			description: "构建充满人文关怀的创造者社区",
			color: "text-red-500",
		},
		{
			icon: Sparkles,
			title: "自由",
			subtitle: "Freedom",
			description: "营造开放包容的创新环境",
			color: "text-blue-500",
		},
		{
			icon: Rocket,
			title: "创造",
			subtitle: "Creation",
			description: "崇尚务实的动手实践精神",
			color: "text-purple-500",
		},
	];

	return (
		<section id="community-showcase" className="bg-muted/30 py-16 lg:py-24">
			<div className="container">
				{/* 标题区域 */}
				<div className="mx-auto mb-12 max-w-3xl text-center">
					<div className="mb-4 inline-block rounded-full bg-primary/10 px-4 py-1 text-sm text-primary">
						社区展示
					</div>
					<h2 className="font-bold text-4xl lg:text-5xl mb-4">
						认识周周黑客松
					</h2>
					<p className="text-lg text-muted-foreground">
						一个专注于AI产品创造的社会企业社区，致力于为创造者提供从0到1的全程支持
					</p>
				</div>

				{/* 核心数据展示 */}
				<div className="grid md:grid-cols-4 gap-6 mb-16">
					{stats.map((stat, index) => (
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

				{/* 核心活动 - 带图片的卡片布局 */}
				<div className="mb-16">
					<h3 className="text-2xl font-bold text-center mb-8">
						丰富的社区活动体系
					</h3>
					<div className="grid md:grid-cols-3 gap-6">
						{coreActivities.map((activity, index) => {
							const Icon = activity.icon;
							return (
								<div
									key={index}
									className="bg-background/60 backdrop-blur-sm rounded-xl overflow-hidden border border-border/50 hover:shadow-lg transition-shadow"
								>
									{/* 活动图片 */}
									<div className="relative h-48 w-full">
										<Image
											src={activity.image}
											alt={activity.title}
											fill
											className="object-cover"
											sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 33vw"
										/>
										<div className="absolute top-4 right-4">
											<span className="text-xs bg-white/90 dark:bg-gray-800/90 text-primary px-2 py-1 rounded-full">
												{activity.frequency}
											</span>
										</div>
									</div>

									{/* 活动内容 */}
									<div className="p-6">
										<div className="flex items-center mb-4">
											<div
												className={`w-10 h-10 rounded-lg bg-${activity.color}-100 dark:bg-${activity.color}-900/30 flex items-center justify-center mr-3`}
											>
												<Icon
													className={`w-5 h-5 text-${activity.color}-600 dark:text-${activity.color}-400`}
												/>
											</div>
											<div>
												<h4 className="font-semibold">
													{activity.title}
												</h4>
												<p className="text-sm text-primary">
													{activity.subtitle}
												</p>
											</div>
										</div>
										<p className="text-sm text-muted-foreground">
											{activity.description}
										</p>
									</div>
								</div>
							);
						})}
					</div>
				</div>

				{/* 社区价值观 */}
				<div className="mb-16">
					<div className="text-center mb-8">
						<h3 className="text-2xl font-bold mb-4">
							我们的价值观
						</h3>
						<p className="text-muted-foreground">
							指导社区发展的核心理念
						</p>
					</div>
					<div className="grid md:grid-cols-3 gap-8">
						{communityValues.map((value, index) => {
							const Icon = value.icon;
							return (
								<div key={index} className="text-center">
									<div className="w-16 h-16 rounded-full bg-background/80 backdrop-blur-sm border border-border/50 flex items-center justify-center mx-auto mb-4">
										<Icon
											className={`w-8 h-8 ${value.color}`}
										/>
									</div>
									<h4 className="text-xl font-semibold mb-1">
										{value.title}{" "}
										<span className="text-muted-foreground text-base">
											({value.subtitle})
										</span>
									</h4>
									<p className="text-muted-foreground">
										{value.description}
									</p>
								</div>
							);
						})}
					</div>
				</div>

				{/* 使命愿景 - 简化版 */}
				<div className="grid md:grid-cols-2 gap-8 mb-16">
					<div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/30 dark:to-blue-950/30 rounded-xl p-8 border border-purple-200/50 dark:border-purple-800/50">
						<div className="w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center mb-4">
							<Zap className="w-6 h-6 text-purple-600 dark:text-purple-400" />
						</div>
						<h4 className="text-xl font-semibold mb-3">
							我们的使命
						</h4>
						<p className="text-muted-foreground">
							通过 AI
							加速创意实现，助力千万创作者打造有价值、有意义、有趣的产品
						</p>
					</div>
					<div className="bg-gradient-to-br from-blue-50 to-green-50 dark:from-blue-950/30 dark:to-green-950/30 rounded-xl p-8 border border-blue-200/50 dark:border-blue-800/50">
						<div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center mb-4">
							<Award className="w-6 h-6 text-blue-600 dark:text-blue-400" />
						</div>
						<h4 className="text-xl font-semibold mb-3">
							我们的愿景
						</h4>
						<p className="text-muted-foreground">
							打造充满活力与创造力的AI产品创造者社区，为每一位成员提供温暖与支持
						</p>
					</div>
				</div>

				{/* 口号区域 */}
				<div className="text-center bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/30 dark:to-blue-950/30 rounded-2xl p-8 border border-purple-200/50 dark:border-purple-800/50">
					<div className="text-xl md:text-2xl font-bold mb-2">
						<span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-blue-500">
							"花1周时间，创造1个最小可行产品，解决1个生活痛点，
						</span>
					</div>
					<div className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
						也许就是下1个改变世界的起点"
					</div>
				</div>
			</div>
		</section>
	);
}
