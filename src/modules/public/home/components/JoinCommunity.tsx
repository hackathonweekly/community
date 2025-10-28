import { Card, CardContent } from "@/components/ui/card";
import {
	ArrowRightIcon,
	CalendarIcon,
	HeartIcon,
	UsersIcon,
	FolderIcon,
} from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";

// TODO: 集成社区统计API - /api/community-stats
// 参考已有的 CommunityStats 组件实现，移除"在线成员"和"即将开始的活动"字样
// API 返回: totalEvents, totalProjects, totalMembers, onlineMembers, upcomingEvents
const communityData = {
	totalProjects: 100,
	totalEvents: 200,
	totalMembers: 6000,
	// 移除 onlineMembers 显示，不要"在线"标识
	// 移除 upcomingEvents 显示，不要"即将开始"字样
};

export function JoinCommunity() {
	const t = useTranslations("joinCommunity");

	const entryOptions = [
		{
			title: t("entryOptions.register.title"),
			description: t("entryOptions.register.description"),
			cta: t("entryOptions.register.cta"),
			href: "/auth/login",
			priority: "primary" as const,
			icon: ArrowRightIcon,
		},
		{
			title: t("entryOptions.events.title"),
			description: t("entryOptions.events.description"),
			cta: t("entryOptions.events.cta"),
			href: "/events",
			priority: "secondary" as const,
			icon: CalendarIcon,
		},
		{
			title: t("entryOptions.wechat.title"),
			description: t("entryOptions.wechat.description"),
			cta: t("entryOptions.wechat.cta"),
			href: "#wechat",
			priority: "tertiary" as const,
			icon: UsersIcon,
		},
	];

	return (
		<section className="py-16 md:py-24 bg-gray-50/50 dark:bg-gray-950/50">
			<div className="container px-4 md:px-6">
				{/* Section header */}
				<div className="text-center mb-12 md:mb-16">
					<div className="mb-6 flex justify-center">
						<div className="inline-flex items-center rounded-full bg-purple-50 dark:bg-purple-950/30 px-4 py-2 border border-purple-200 dark:border-purple-800">
							<HeartIcon className="w-5 h-5 text-purple-500 mr-2" />
							<span className="text-purple-700 dark:text-purple-300 font-medium">
								{t("badgeText")}
							</span>
						</div>
					</div>

					<h2 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-4">
						{t("title.part1")}
						<br />
						<span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-blue-500">
							{t("title.part2")}
						</span>
					</h2>
					<p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
						{t("subtitle")}
					</p>
				</div>

				{/* Entry options */}
				{/* <div className="grid md:grid-cols-3 gap-6 mb-12">
					{entryOptions.map((option) => (
						<Card
							key={option.title}
							className="group hover:shadow-lg transition-all duration-300 border-0 shadow-md"
						>
							<CardContent className="p-6 text-center">
								<div className="flex justify-center mb-4">
									<div className="p-3 rounded-full bg-gray-100 dark:bg-gray-800 group-hover:bg-purple-100 dark:group-hover:bg-purple-900/30 transition-colors">
										<option.icon className="w-6 h-6 text-gray-600 dark:text-gray-300 group-hover:text-purple-600 dark:group-hover:text-purple-400" />
									</div>
								</div>
								<h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
									{option.title}
								</h3>
								<p className="text-gray-600 dark:text-gray-300 text-sm mb-4 leading-relaxed">
									{option.description}
								</p>
								<Button
									className={
										option.priority === "primary"
											? "bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white w-full"
											: "w-full"
									}
									variant={
										option.priority === "primary"
											? "default"
											: "outline"
									}
									asChild
								>
									<Link href={option.href}>{option.cta}</Link>
								</Button>
							</CardContent>
						</Card>
					))}
				</div> */}

				{/* Social proof and WeChat section */}
				<div className="max-w-4xl mx-auto">
					<Card className="bg-white dark:bg-gray-800 shadow-lg border-0">
						<CardContent className="p-6 md:p-8">
							<div className="grid md:grid-cols-2 gap-8 items-center">
								{/* Community stats */}
								<div>
									<h3 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-6">
										{t("communityStats.title")}
									</h3>
									<div className="space-y-4">
										<div className="flex items-center gap-3">
											<div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
												<FolderIcon className="w-4 h-4 text-purple-600 dark:text-purple-400" />
											</div>
											<span className="text-gray-700 dark:text-gray-300">
												{t("communityStats.projects", {
													count: communityData.totalProjects,
												})}
											</span>
										</div>
										<div className="flex items-center gap-3">
											<div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
												<CalendarIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
											</div>
											<span className="text-gray-700 dark:text-gray-300">
												{t("communityStats.events", {
													count: communityData.totalEvents,
												})}
											</span>
										</div>
										<div className="flex items-center gap-3">
											<div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
												<UsersIcon className="w-4 h-4 text-green-600 dark:text-green-400" />
											</div>
											<span className="text-gray-700 dark:text-gray-300">
												{t("communityStats.members", {
													count: communityData.totalMembers,
												})}
											</span>
										</div>
									</div>
								</div>

								{/* WeChat Official Account QR */}
								<div id="wechat" className="text-center">
									<h4 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
										{t("wechatSection.title")}
									</h4>
									<div className="inline-block p-4 bg-white dark:bg-gray-100 rounded-2xl shadow-inner">
										<div className="w-32 h-32 relative">
											<Image
												src="/images/wechat_official_qr.jpg"
												alt={t("wechatSection.qrAlt")}
												fill
												className="object-contain"
											/>
										</div>
									</div>
									<p className="text-gray-600 dark:text-gray-400 text-sm mt-3">
										{t("wechatSection.accountName")}
									</p>
									<p className="text-gray-500 dark:text-gray-500 text-xs mt-1">
										{t("wechatSection.description")}
									</p>
								</div>
							</div>
						</CardContent>
					</Card>
				</div>

				{/* Final encouragement */}
				<div className="text-center mt-12">
					<p className="text-gray-600 dark:text-gray-400 text-lg md:text-xl max-w-3xl mx-auto leading-relaxed">
						{t("encouragement.text")}
						<br />
						<span className="font-bold text-purple-600 dark:text-purple-400">
							{t("encouragement.callToAction")}
						</span>
					</p>
				</div>
			</div>
		</section>
	);
}
