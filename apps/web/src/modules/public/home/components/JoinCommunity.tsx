import { CalendarIcon, FolderIcon, HeartIcon, UsersIcon } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";

const communityData = {
	totalProjects: 100,
	totalEvents: 200,
	totalMembers: 6000,
};

export function JoinCommunity() {
	const t = useTranslations("joinCommunity");

	return (
		<section className="py-16 md:py-24 bg-background">
			<div className="container px-4 md:px-6">
				{/* Section header */}
				<div className="text-center mb-12 md:mb-16">
					<div className="mb-5 flex justify-center">
						<div className="inline-flex items-center rounded-md bg-accent px-2 py-0.5 border border-border">
							<HeartIcon className="w-3.5 h-3.5 mr-1.5 text-gray-600 dark:text-muted-foreground" />
							<span className="text-gray-600 dark:text-muted-foreground font-bold text-[10px] uppercase tracking-wider">
								{t("badgeText")}
							</span>
						</div>
					</div>

					<h2 className="font-brand text-3xl md:text-5xl font-bold text-foreground tracking-tight mb-4">
						{t("title.part1")}
						<br />
						<span className="text-gray-400 dark:text-muted-foreground">
							{t("title.part2")}
						</span>
					</h2>
					<p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
						{t("subtitle")}
					</p>
				</div>

				{/* Social proof and WeChat section */}
				<div className="max-w-4xl mx-auto">
					<div className="bg-card rounded-lg border border-border shadow-sm">
						<div className="p-5 md:p-6">
							<div className="grid md:grid-cols-2 gap-8 items-center">
								{/* Community stats */}
								<div>
									<h3 className="font-brand text-lg md:text-xl font-bold text-foreground mb-4">
										{t("communityStats.title")}
									</h3>
									<div className="space-y-3">
										<div className="flex items-center gap-3 p-2 rounded-md hover:bg-muted transition-colors">
											<div className="p-1.5 rounded-md bg-accent border border-border">
												<FolderIcon className="w-4 h-4 text-foreground" />
											</div>
											<span className="text-sm text-gray-600 dark:text-muted-foreground">
												{t("communityStats.projects", {
													count: communityData.totalProjects,
												})}
											</span>
										</div>
										<div className="flex items-center gap-3 p-2 rounded-md hover:bg-muted transition-colors">
											<div className="p-1.5 rounded-md bg-accent border border-border">
												<CalendarIcon className="w-4 h-4 text-foreground" />
											</div>
											<span className="text-sm text-gray-600 dark:text-muted-foreground">
												{t("communityStats.events", {
													count: communityData.totalEvents,
												})}
											</span>
										</div>
										<div className="flex items-center gap-3 p-2 rounded-md hover:bg-muted transition-colors">
											<div className="p-1.5 rounded-md bg-accent border border-border">
												<UsersIcon className="w-4 h-4 text-foreground" />
											</div>
											<span className="text-sm text-gray-600 dark:text-muted-foreground">
												{t("communityStats.members", {
													count: communityData.totalMembers,
												})}
											</span>
										</div>
									</div>
								</div>

								{/* WeChat Official Account QR */}
								<div id="wechat" className="text-center">
									<h4 className="font-brand text-base font-bold text-foreground mb-3">
										{t("wechatSection.title")}
									</h4>
									<div className="inline-block p-3 bg-gray-50 dark:bg-white rounded-lg border border-border">
										<div className="w-28 h-28 relative">
											<Image
												src="/images/wechat_official_qr.jpg"
												alt={t("wechatSection.qrAlt")}
												fill
												className="object-contain"
											/>
										</div>
									</div>
									<p className="text-muted-foreground text-xs mt-2 font-mono">
										{t("wechatSection.accountName")}
									</p>
									<p className="text-gray-400 dark:text-[#666] text-[10px] mt-1">
										{t("wechatSection.description")}
									</p>
								</div>
							</div>
						</div>
					</div>
				</div>

				{/* Final encouragement */}
				<div className="text-center mt-10">
					<p className="text-muted-foreground text-base md:text-lg max-w-3xl mx-auto leading-relaxed">
						{t("encouragement.text")}
						<br />
						<span className="font-bold text-foreground">
							{t("encouragement.callToAction")}
						</span>
					</p>
				</div>
			</div>
		</section>
	);
}
