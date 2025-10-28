import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy } from "lucide-react";
import type { UserProfile } from "../types";
import { getBadgeRarityLabel } from "../types";

interface BadgesSectionProps {
	user: UserProfile;
	currentUserId?: string;
	userProfileT: (key: string) => string;
}

export function BadgesSection({
	user,
	currentUserId,
	userProfileT,
}: BadgesSectionProps) {
	return (
		<Card className="mb-8" id="badges-section">
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<Trophy className="h-5 w-5" />
					{userProfileT("badgesSection")} (
					{user.userBadges?.length || 0})
				</CardTitle>
			</CardHeader>
			<CardContent>
				{user.userBadges && user.userBadges.length > 0 ? (
					<>
						<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
							{user.userBadges
								.slice(0, 8)
								.map((userBadge: any) => {
									const badge = userBadge.badge;
									const rarityColors: Record<string, string> =
										{
											COMMON: "from-gray-400 to-gray-600",
											UNCOMMON:
												"from-green-400 to-green-600",
											RARE: "from-blue-400 to-blue-600",
											EPIC: "from-purple-400 to-purple-600",
											LEGENDARY:
												"from-yellow-400 to-yellow-600",
										};
									const bgGradient =
										rarityColors[badge.rarity] ||
										rarityColors.COMMON;

									return (
										<div
											key={userBadge.id}
											className="flex flex-col items-center p-4 border rounded-lg hover:shadow-md transition-shadow bg-gradient-to-br from-background to-muted/30"
										>
											<div
												className={`w-16 h-16 rounded-full bg-gradient-to-br ${bgGradient} flex items-center justify-center mb-3 shadow-lg`}
											>
												<Trophy className="w-8 h-8 text-white" />
											</div>
											<h4 className="font-semibold text-center text-sm mb-1">
												{badge.name}
											</h4>
											<p className="text-xs text-muted-foreground text-center mb-2 line-clamp-2">
												{badge.description}
											</p>
											<Badge
												variant="outline"
												className="text-xs"
												style={{
													backgroundColor:
														badge.color ||
														undefined,
													color: badge.color
														? "white"
														: undefined,
													borderColor:
														badge.color ||
														undefined,
												}}
											>
												{getBadgeRarityLabel(
													badge.rarity,
													userProfileT,
												)}
											</Badge>
											{userBadge.reason && (
												<p className="text-xs text-muted-foreground text-center mt-2">
													{userProfileT(
														"badgeReason",
													)}{" "}
													{userBadge.reason}
												</p>
											)}
											<p className="text-xs text-muted-foreground text-center mt-1">
												{new Date(
													userBadge.awardedAt,
												).toLocaleDateString("zh-CN")}
											</p>
										</div>
									);
								})}
						</div>
						{user.userBadges && user.userBadges.length > 8 && (
							<div className="mt-4 text-center">
								<p className="text-sm text-muted-foreground">
									还有 {user.userBadges.length - 8}{" "}
									个徽章未显示
								</p>
							</div>
						)}
					</>
				) : (
					<div className="text-center py-8 text-muted-foreground">
						<div className="mb-2">🎖️</div>
						<p className="text-sm">
							{currentUserId === user.id
								? "你还没有获得任何徽章"
								: "该用户还没有获得任何徽章"}
						</p>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
