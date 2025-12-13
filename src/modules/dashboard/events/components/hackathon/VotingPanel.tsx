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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
	Trophy,
	Medal,
	Award,
	Star,
	Users,
	Zap,
	Heart,
	Crown,
	TrendingUp,
} from "lucide-react";

interface VotingResult {
	id: string;
	projectId: string;
	title: string;
	description: string;
	project: {
		id: string;
		title: string;
		description?: string;
		screenshots: string[];
	};
	user: {
		id: string;
		name: string;
		image?: string;
		username?: string;
	};
	judgeScore?: number;
	audienceScore?: number;
	finalScore?: number;
	weightedScore: number;
	rank: number;
	awards: Array<{
		award: {
			id: string;
			name: string;
			description: string;
			level: string;
			iconUrl?: string;
			badgeUrl?: string;
		};
	}>;
}

interface VotingPanelProps {
	eventId: string;
	currentUserId?: string;
	canVote: boolean;
	config?: {
		voting?: {
			allowPublicVoting: boolean;
			enableJudgeVoting: boolean;
			judgeWeight: number;
			publicWeight: number;
		};
	};
	isVotingOpen?: boolean;
	showResults?: boolean;
}

export function VotingPanel({
	eventId,
	currentUserId,
	canVote,
	config,
	isVotingOpen = false,
	showResults = false,
}: VotingPanelProps) {
	const t = useTranslations("events");
	const [results, setResults] = useState<VotingResult[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [votingConfig, setVotingConfig] = useState<any>({});
	const votingPhaseMessage = isVotingOpen
		? t("hackathon.voting.liveMessage")
		: showResults
			? t("hackathon.voting.closedMessage")
			: t("hackathon.voting.notOpenMessage");

	useEffect(() => {
		const loadVotingResults = async () => {
			try {
				const response = await fetch(
					`/api/events/${eventId}/voting-results`,
				);
				if (response.ok) {
					const data = await response.json();
					setResults(data.data?.submissions || []);
					setVotingConfig(data.data?.config || {});
				}
			} catch (error) {
				console.error("Error loading voting results:", error);
			} finally {
				setIsLoading(false);
			}
		};

		loadVotingResults();
	}, [eventId]);

	const getInitials = (name: string) => {
		return name
			.split(" ")
			.map((word) => word[0])
			.join("")
			.toUpperCase()
			.slice(0, 2);
	};

	const getRankIcon = (rank: number) => {
		switch (rank) {
			case 1:
				return <Crown className="w-5 h-5 text-yellow-500" />;
			case 2:
				return <Medal className="w-5 h-5 text-gray-400" />;
			case 3:
				return <Award className="w-5 h-5 text-amber-600" />;
			default:
				return <Trophy className="w-5 h-5 text-muted-foreground" />;
		}
	};

	const getRankBadgeVariant = (rank: number) => {
		switch (rank) {
			case 1:
				return "default";
			case 2:
				return "secondary";
			case 3:
				return "outline";
			default:
				return "outline";
		}
	};

	if (isLoading) {
		return (
			<div className="space-y-6">
				<Card>
					<CardHeader>
						<Skeleton className="h-6 w-48" />
						<Skeleton className="h-4 w-64" />
					</CardHeader>
					<CardContent className="space-y-4">
						{Array.from({ length: 5 }).map((_, i) => (
							<div
								key={i}
								className="flex items-center space-x-4 p-4 border rounded-lg"
							>
								<Skeleton className="h-8 w-8" />
								<div className="flex-1 space-y-2">
									<Skeleton className="h-4 w-48" />
									<Skeleton className="h-3 w-32" />
								</div>
								<Skeleton className="h-6 w-16" />
							</div>
						))}
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Voting Configuration Info */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center">
						<TrendingUp className="w-5 h-5 mr-2" />
						{t("hackathon.voting.configuration")}
					</CardTitle>
					<CardDescription>
						{t("hackathon.voting.configurationDesc")}
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="grid gap-4 md:grid-cols-2">
						{votingConfig.enableJudgeVoting && (
							<div className="flex items-center space-x-3">
								<Star className="w-5 h-5 text-blue-500" />
								<div>
									<p className="font-medium">
										{t("hackathon.voting.judgeVoting")}
									</p>
									<p className="text-sm text-muted-foreground">
										{t("hackathon.voting.weight", {
											weight: Math.round(
												(votingConfig.judgeWeight ??
													0) * 100,
											),
										})}
									</p>
								</div>
							</div>
						)}

						{votingConfig.allowPublicVoting && (
							<div className="flex items-center space-x-3">
								<Heart className="w-5 h-5 text-red-500" />
								<div>
									<p className="font-medium">
										{t("hackathon.voting.publicVoting")}
									</p>
									<p className="text-sm text-muted-foreground">
										{t("hackathon.voting.weight", {
											weight: Math.round(
												(votingConfig.publicWeight ??
													1) * 100,
											),
										})}
									</p>
								</div>
							</div>
						)}
					</div>
				</CardContent>
			</Card>

			{/* Results */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center">
						<Trophy className="w-5 h-5 mr-2" />
						{t("hackathon.voting.results")} ({results.length})
					</CardTitle>
					<CardDescription className="space-y-1">
						<span>{t("hackathon.voting.resultsDesc")}</span>
						{votingPhaseMessage && (
							<span className="block text-muted-foreground">
								{votingPhaseMessage}
							</span>
						)}
					</CardDescription>
				</CardHeader>
				<CardContent>
					{results.length === 0 ? (
						<div className="text-center py-8">
							<Trophy className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
							<h3 className="text-lg font-medium mb-2">
								{t("hackathon.voting.noResults")}
							</h3>
							<p className="text-muted-foreground">
								{t("hackathon.voting.noResultsDesc")}
							</p>
						</div>
					) : (
						<div className="space-y-4">
							{results.map((result) => (
								<div
									key={result.id}
									className={`relative p-4 rounded-lg border transition-colors ${
										result.rank <= 3
											? "bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200"
											: "bg-card hover:bg-accent"
									}`}
								>
									<div className="flex items-start space-x-4">
										{/* Rank */}
										<div className="flex flex-col items-center">
											<Badge
												variant={getRankBadgeVariant(
													result.rank,
												)}
												className="mb-2"
											>
												#{result.rank}
											</Badge>
											{getRankIcon(result.rank)}
										</div>

										{/* Project Image */}
										<div className="w-16 h-16 rounded-lg overflow-hidden bg-gradient-to-br from-blue-50 to-purple-50 flex-shrink-0">
											{result.project.screenshots?.[0] ? (
												<img
													src={
														result.project
															.screenshots[0]
													}
													alt={result.title}
													className="w-full h-full object-cover"
												/>
											) : (
												<div className="flex items-center justify-center h-full">
													<Zap className="h-6 w-6 text-muted-foreground" />
												</div>
											)}
										</div>

										{/* Project Info */}
										<div className="flex-1 min-w-0">
											<div className="flex items-start justify-between">
												<div className="flex-1 min-w-0 mr-4">
													<h3 className="font-semibold text-lg mb-1 truncate">
														{result.title}
													</h3>
													<p className="text-sm text-muted-foreground line-clamp-2 mb-2">
														{result.description}
													</p>

													{/* Author */}
													<div className="flex items-center space-x-2">
														<Avatar className="h-6 w-6">
															<AvatarImage
																src={
																	result.user
																		.image
																}
																alt={
																	result.user
																		.name
																}
															/>
															<AvatarFallback className="text-xs">
																{getInitials(
																	result.user
																		.name,
																)}
															</AvatarFallback>
														</Avatar>
														<span className="text-sm font-medium">
															{result.user.name}
														</span>
													</div>
												</div>

												{/* Scores */}
												<div className="flex flex-col items-end space-y-2">
													{result.finalScore && (
														<div className="flex items-center space-x-1">
															<Star className="w-4 h-4 text-yellow-500" />
															<span className="font-semibold text-lg">
																{result.finalScore.toFixed(
																	1,
																)}
															</span>
														</div>
													)}

													<div className="text-right space-y-1">
														{result.judgeScore && (
															<div className="flex items-center space-x-1 text-sm">
																<Star className="w-3 h-3 text-blue-500" />
																<span>
																	{t(
																		"hackathon.voting.judge",
																	)}
																	:{" "}
																	{result.judgeScore.toFixed(
																		1,
																	)}
																</span>
															</div>
														)}
														{result.audienceScore && (
															<div className="flex items-center space-x-1 text-sm">
																<Heart className="w-3 h-3 text-red-500" />
																<span>
																	{t(
																		"hackathon.voting.audience",
																	)}
																	:{" "}
																	{result.audienceScore.toFixed(
																		1,
																	)}
																</span>
															</div>
														)}
													</div>
												</div>
											</div>

											{/* Awards */}
											{result.awards.length > 0 && (
												<div className="mt-3 flex flex-wrap gap-2">
													{result.awards.map(
														(award) => (
															<Badge
																key={
																	award.award
																		.id
																}
																className="bg-yellow-500 text-white"
															>
																<Trophy className="w-3 h-3 mr-1" />
																{
																	award.award
																		.name
																}
															</Badge>
														),
													)}
												</div>
											)}
										</div>
									</div>

									{/* Top 3 Special Effects */}
									{result.rank === 1 && (
										<div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg">
											🥇
										</div>
									)}
									{result.rank === 2 && (
										<div className="absolute -top-2 -right-2 w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg">
											🥈
										</div>
									)}
									{result.rank === 3 && (
										<div className="absolute -top-2 -right-2 w-8 h-8 bg-amber-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg">
											🥉
										</div>
									)}
								</div>
							))}
						</div>
					)}
				</CardContent>
			</Card>

			{/* Voting Instructions */}
			{canVote && (
				<Card className="border-blue-200 bg-blue-50">
					<CardContent className="pt-6">
						<div className="flex items-start space-x-3">
							<Users className="w-5 h-5 text-blue-600 mt-1" />
							<div>
								<p className="font-medium text-blue-900">
									{t("hackathon.voting.instructions")}
								</p>
								<p className="text-sm text-blue-700 mt-1">
									{t("hackathon.voting.instructionsDesc")}
								</p>
							</div>
						</div>
					</CardContent>
				</Card>
			)}
		</div>
	);
}
