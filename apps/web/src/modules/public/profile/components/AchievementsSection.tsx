import { Award, Trophy } from "lucide-react";
import type { UserProfile } from "../types";
import { getBadgeRarityLabel } from "../types";

interface AchievementsSectionProps {
	user: UserProfile;
	currentUserId?: string;
	t: any;
}

export function AchievementsSection({
	user,
	currentUserId,
	t,
}: AchievementsSectionProps) {
	const hasCertificates = user.certificates && user.certificates.length > 0;
	const hasBadges = user.userBadges && user.userBadges.length > 0;
	const isSelf = currentUserId === user.id;

	// Non-self visitors: hide entirely when empty
	if (!hasCertificates && !hasBadges && !isSelf) {
		return null;
	}

	// Self with nothing: show empty state
	if (!hasCertificates && !hasBadges) {
		return (
			<div id="achievements-section">
				<div className="flex items-center gap-3 mb-4">
					<h3 className="font-brand text-sm font-bold uppercase tracking-wide text-gray-400">
						{t("userProfile.achievements") ?? "成就"}
					</h3>
					<div className="h-px bg-gray-100 flex-1" />
				</div>
				<div className="flex flex-col items-center justify-center py-16 text-center">
					<div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
						<Trophy className="w-6 h-6 text-muted-foreground" />
					</div>
					<p className="text-sm text-muted-foreground">
						你还没有获得任何成就
					</p>
				</div>
			</div>
		);
	}

	const awardLevelLabels: Record<string, string> = {
		FIRST: "一等奖",
		SECOND: "二等奖",
		THIRD: "三等奖",
		EXCELLENCE: "优秀奖",
		PARTICIPATION: "参与奖",
		SPECIAL: "特殊奖",
	};

	const awardLevelColors: Record<string, string> = {
		FIRST: "from-yellow-400 to-yellow-600",
		SECOND: "from-gray-400 to-gray-600",
		THIRD: "from-orange-400 to-orange-600",
		EXCELLENCE: "from-blue-400 to-blue-600",
		PARTICIPATION: "from-green-400 to-green-600",
		SPECIAL: "from-purple-400 to-purple-600",
	};

	const rarityColors: Record<string, string> = {
		COMMON: "from-gray-400 to-gray-600",
		UNCOMMON: "from-green-400 to-green-600",
		RARE: "from-blue-400 to-blue-600",
		EPIC: "from-purple-400 to-purple-600",
		LEGENDARY: "from-yellow-400 to-yellow-600",
	};

	return (
		<div id="achievements-section">
			{/* Section divider */}
			<div className="flex items-center gap-3 mb-4">
				<h3 className="font-brand text-sm font-bold uppercase tracking-wide text-gray-400">
					{t("userProfile.achievements") ?? "成就"}
				</h3>
				<div className="h-px bg-gray-100 flex-1" />
			</div>

			{/* Certificates first - higher value */}
			{hasCertificates && (
				<div className="space-y-3 mb-4">
					{user.certificates.slice(0, 4).map((cert: any) => {
						const bgGradient =
							awardLevelColors[cert.award?.level] ||
							awardLevelColors.PARTICIPATION;
						return (
							<div
								key={cert.id}
								className="bg-white rounded-lg border border-gray-200 p-3 flex items-center hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
							>
								<div
									className={`w-12 h-12 rounded-full bg-gradient-to-br ${bgGradient} flex items-center justify-center mr-3 shadow-sm shrink-0`}
								>
									<Award className="w-6 h-6 text-foreground" />
								</div>
								<div className="flex-1 min-w-0">
									<h4 className="font-brand text-sm font-bold leading-tight line-clamp-1">
										{cert.award?.name}
									</h4>
									<div className="text-[11px] text-gray-500 font-mono mt-0.5">
										{cert.project?.title}
										{cert.event && ` · ${cert.event.title}`}
									</div>
									<div className="flex items-center gap-1.5 mt-1">
										<span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md text-[10px] font-bold uppercase tracking-wider border border-gray-200">
											{awardLevelLabels[
												cert.award?.level
											] || cert.award?.level}
										</span>
										{cert.score && (
											<span className="text-[11px] text-gray-500 font-mono">
												{cert.score.toFixed(1)} 分
											</span>
										)}
									</div>
								</div>
								<div className="text-[11px] text-gray-500 font-mono shrink-0 ml-2">
									{new Date(
										cert.awardedAt,
									).toLocaleDateString("zh-CN")}
								</div>
							</div>
						);
					})}
				</div>
			)}

			{/* Badges - horizontal scroll */}
			{hasBadges && (
				<div className="overflow-x-auto no-scrollbar -mx-1 px-1 pb-1">
					<div className="flex gap-3 min-w-min">
						{user.userBadges.slice(0, 8).map((userBadge: any) => {
							const badge = userBadge.badge;
							const bgGradient =
								rarityColors[badge.rarity] ||
								rarityColors.COMMON;
							return (
								<div
									key={userBadge.id}
									className="bg-white rounded-lg border border-gray-200 p-3 flex flex-col items-center w-28 shrink-0 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
								>
									<div
										className={`w-10 h-10 rounded-full bg-gradient-to-br ${bgGradient} flex items-center justify-center mb-2 shadow-sm`}
									>
										<Trophy className="w-5 h-5 text-foreground" />
									</div>
									<h4 className="font-brand text-xs font-bold text-center line-clamp-1 mb-1">
										{badge.name}
									</h4>
									<p className="text-[10px] text-gray-500 text-center line-clamp-2 mb-1">
										{badge.description}
									</p>
									<span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md text-[10px] font-bold uppercase tracking-wider border border-gray-200">
										{getBadgeRarityLabel(
											badge.rarity,
											(key: string) => t(key),
										)}
									</span>
								</div>
							);
						})}
					</div>
				</div>
			)}
		</div>
	);
}
