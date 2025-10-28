"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
	Trophy,
	Medal,
	Award,
	Star,
	Users,
	Crown,
	Gift,
	Zap,
} from "lucide-react";

interface AwardConfig {
	id: string;
	name: string;
	description: string;
	awardType: "JUDGE" | "PUBLIC";
	maxWinners: number;
}

interface AwardWinner {
	id: string;
	submissionId: string;
	title: string;
	user: {
		id: string;
		name: string;
		image?: string;
	};
	project: {
		screenshots: string[];
	};
}

interface AwardShowcaseProps {
	awards: AwardConfig[];
	eventId: string;
}

export function AwardShowcase({ awards, eventId }: AwardShowcaseProps) {
	const t = useTranslations("events");
	const [awardWinners, setAwardWinners] = useState<
		Record<string, AwardWinner[]>
	>({});
	const [isLoading, setIsLoading] = useState(false);

	// Load award winners (this would be implemented when we have the awards assignment system)
	useEffect(() => {
		// For now, we'll just show the award categories
		// In a full implementation, this would fetch actual winners from the API
	}, [eventId]);

	const getAwardIcon = (awardType: string, index: number) => {
		if (awardType === "JUDGE") {
			return <Star className="w-6 h-6 text-blue-500" />;
		}
		return <Users className="w-6 h-6 text-purple-500" />;
	};

	const getAwardColor = (awardType: string) => {
		return awardType === "JUDGE"
			? "from-blue-50 to-indigo-50 border-blue-200"
			: "from-purple-50 to-pink-50 border-purple-200";
	};

	if (awards.length === 0) {
		return (
			<Card>
				<CardContent className="pt-6">
					<div className="text-center py-8">
						<Trophy className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
						<h3 className="text-lg font-medium mb-2">
							{t("hackathon.awards.noAwards")}
						</h3>
						<p className="text-muted-foreground">
							{t("hackathon.awards.noAwardsDesc")}
						</p>
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<div className="space-y-6">
			{/* Awards Overview */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center">
						<Trophy className="w-5 h-5 mr-2" />
						{t("hackathon.awards.title")}
					</CardTitle>
					<CardDescription>
						{t("hackathon.awards.description")}
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="grid gap-6 md:grid-cols-2">
						{awards.map((award, index) => (
							<Card
								key={award.id}
								className={`bg-gradient-to-br ${getAwardColor(award.awardType)}`}
							>
								<CardHeader>
									<div className="flex items-start justify-between">
										<div className="flex items-center space-x-3">
											{getAwardIcon(
												award.awardType,
												index,
											)}
											<div>
												<CardTitle className="text-lg">
													{award.name}
												</CardTitle>
												<Badge
													variant={
														award.awardType ===
														"JUDGE"
															? "default"
															: "secondary"
													}
													className="mt-1"
												>
													{award.awardType === "JUDGE"
														? t(
																"hackathon.awards.judgeAward",
															)
														: t(
																"hackathon.awards.publicAward",
															)}
												</Badge>
											</div>
										</div>

										{/* Winner count */}
										<div className="text-right">
											<div className="text-2xl font-bold text-muted-foreground">
												{award.maxWinners}
											</div>
											<div className="text-xs text-muted-foreground">
												{award.maxWinners === 1
													? t(
															"hackathon.awards.winner",
														)
													: t(
															"hackathon.awards.winners",
														)}
											</div>
										</div>
									</div>
								</CardHeader>
								<CardContent>
									<p className="text-sm text-muted-foreground mb-4">
										{award.description}
									</p>

									{/* Winners Section (placeholder for future implementation) */}
									<div className="space-y-2">
										<h5 className="font-medium text-sm">
											{t(
												"hackathon.awards.currentWinners",
											)}
										</h5>

										{awardWinners[award.id]?.length > 0 ? (
											<div className="space-y-2">
												{awardWinners[award.id].map(
													(winner) => (
														<div
															key={winner.id}
															className="flex items-center space-x-3 p-2 bg-white/50 rounded-lg"
														>
															<div className="w-8 h-8 rounded bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
																{winner.project
																	.screenshots?.[0] ? (
																	<img
																		src={
																			winner
																				.project
																				.screenshots[0]
																		}
																		alt={
																			winner.title
																		}
																		className="w-full h-full object-cover rounded"
																	/>
																) : (
																	<Zap className="w-4 h-4 text-muted-foreground" />
																)}
															</div>
															<div className="flex-1">
																<p className="font-medium text-sm">
																	{
																		winner.title
																	}
																</p>
																<p className="text-xs text-muted-foreground">
																	{
																		winner
																			.user
																			.name
																	}
																</p>
															</div>
														</div>
													),
												)}
											</div>
										) : (
											<div className="p-4 bg-white/30 rounded-lg text-center">
												<Crown className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
												<p className="text-sm text-muted-foreground">
													{t(
														"hackathon.awards.noWinnersYet",
													)}
												</p>
											</div>
										)}
									</div>
								</CardContent>
							</Card>
						))}
					</div>
				</CardContent>
			</Card>

			{/* Award Categories Explanation */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center">
						<Gift className="w-5 h-5 mr-2" />
						{t("hackathon.awards.categories")}
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="grid gap-4 md:grid-cols-2">
						<div className="flex items-start space-x-3">
							<Star className="w-5 h-5 text-blue-500 mt-1" />
							<div>
								<h4 className="font-medium">
									{t("hackathon.awards.judgeAwards")}
								</h4>
								<p className="text-sm text-muted-foreground">
									{t("hackathon.awards.judgeAwardsDesc")}
								</p>
							</div>
						</div>

						<div className="flex items-start space-x-3">
							<Users className="w-5 h-5 text-purple-500 mt-1" />
							<div>
								<h4 className="font-medium">
									{t("hackathon.awards.publicAwards")}
								</h4>
								<p className="text-sm text-muted-foreground">
									{t("hackathon.awards.publicAwardsDesc")}
								</p>
							</div>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Recognition Levels */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center">
						<Medal className="w-5 h-5 mr-2" />
						{t("hackathon.awards.recognition")}
					</CardTitle>
					<CardDescription>
						{t("hackathon.awards.recognitionDesc")}
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="grid gap-4 md:grid-cols-3">
						<div className="text-center p-4 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
							<div className="w-12 h-12 mx-auto mb-3 bg-yellow-500 rounded-full flex items-center justify-center">
								<Crown className="w-6 h-6 text-white" />
							</div>
							<h4 className="font-semibold mb-1">
								{t("hackathon.awards.first")}
							</h4>
							<p className="text-sm text-muted-foreground">
								{t("hackathon.awards.firstDesc")}
							</p>
						</div>

						<div className="text-center p-4 bg-gradient-to-br from-gray-50 to-slate-50 rounded-lg border border-gray-200">
							<div className="w-12 h-12 mx-auto mb-3 bg-gray-400 rounded-full flex items-center justify-center">
								<Medal className="w-6 h-6 text-white" />
							</div>
							<h4 className="font-semibold mb-1">
								{t("hackathon.awards.second")}
							</h4>
							<p className="text-sm text-muted-foreground">
								{t("hackathon.awards.secondDesc")}
							</p>
						</div>

						<div className="text-center p-4 bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg border border-amber-200">
							<div className="w-12 h-12 mx-auto mb-3 bg-amber-600 rounded-full flex items-center justify-center">
								<Award className="w-6 h-6 text-white" />
							</div>
							<h4 className="font-semibold mb-1">
								{t("hackathon.awards.third")}
							</h4>
							<p className="text-sm text-muted-foreground">
								{t("hackathon.awards.thirdDesc")}
							</p>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
