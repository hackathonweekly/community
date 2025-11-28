"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
	ArrowLeft,
	Trophy,
	Users,
	Play,
	Pause,
	Maximize,
	ChevronLeft,
	ChevronRight,
	PartyPopper,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { getEventSubmissions } from "@/features/event-submissions/api";

interface Submission {
	id: string;
	name: string;
	description?: string;
	teamLeader?: { name: string };
	teamMembers?: Array<{ name: string }>;
	coverImage?: string;
	rank: number;
	voteCount: number;
}

interface AwardsCeremonyPageProps {
	params: Promise<{ locale: string; eventId: string }>;
}

export default function AwardsCeremonyPage({
	params,
}: AwardsCeremonyPageProps) {
	const router = useRouter();
	const [locale, setLocale] = useState("");
	const [eventId, setEventId] = useState("");
	const [eventTitle, setEventTitle] = useState("");
	const [topThree, setTopThree] = useState<Submission[]>([]);
	const [currentIndex, setCurrentIndex] = useState(0);
	const [loading, setLoading] = useState(true);
	const [autoPlay, setAutoPlay] = useState(false);
	const [isFullscreen, setIsFullscreen] = useState(false);
	const [showIntro, setShowIntro] = useState(true);

	// Parse params
	useEffect(() => {
		params.then(({ locale: l, eventId: e }) => {
			setLocale(l);
			setEventId(e);
		});
	}, [params]);

	// Fetch top 3 submissions by vote count
	useEffect(() => {
		if (!eventId) return;

		const fetchData = async () => {
			try {
				// Fetch submissions sorted by vote count
				const data = await getEventSubmissions(eventId, {
					sort: "voteCount",
					includeVotes: true,
				});

				if (data) {
					const submissions = data.submissions || [];

					// Sort by vote count (desc), then by createdAt (asc) for tie-breaking
					const sortedSubmissions = submissions.sort(
						(a: any, b: any) => {
							const voteCountDiff =
								(b.voteCount || 0) - (a.voteCount || 0);
							if (voteCountDiff !== 0) return voteCountDiff;
							// If vote counts are equal, earlier submission ranks higher
							return (
								new Date(a.createdAt).getTime() -
								new Date(b.createdAt).getTime()
							);
						},
					);

					// Get exactly top 3 by vote count and assign ranks
					const top3 = sortedSubmissions
						.slice(0, 3)
						.map((sub: any, index: number) => ({
							id: sub.id,
							name: sub.name,
							description: sub.description,
							teamLeader: sub.teamLeader,
							teamMembers: sub.teamMembers,
							coverImage: sub.coverImage,
							rank: index + 1,
							voteCount: sub.voteCount || 0,
						}));

					setTopThree(top3);
					// Start from the last place (3rd place if 3 items, or last item)
					if (top3.length > 0) {
						setCurrentIndex(top3.length - 1);
					}
				}

				// Fetch event title
				const eventResponse = await fetch(`/api/events/${eventId}`);
				if (eventResponse.ok) {
					const eventData = await eventResponse.json();
					setEventTitle(eventData.data?.title || "");
				}
			} catch (error) {
				console.error("Error fetching awards data:", error);
			} finally {
				setLoading(false);
			}
		};

		fetchData();
	}, [eventId]);

	// Auto-play functionality
	useEffect(() => {
		if (!autoPlay || topThree.length === 0 || showIntro) return;

		const interval = setInterval(() => {
			// Go backwards: 3rd -> 2nd -> 1st
			setCurrentIndex((prev) => {
				if (prev <= 0) return topThree.length - 1;
				return prev - 1;
			});
		}, 8000); // Change every 8 seconds

		return () => clearInterval(interval);
	}, [autoPlay, topThree.length, showIntro]);

	// Keyboard navigation
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (showIntro) {
				if (
					e.key === "Enter" ||
					e.key === " " ||
					e.key === "ArrowRight"
				) {
					setShowIntro(false);
				}
				return;
			}

			if (e.key === "ArrowLeft") {
				// Previous means going to lower rank (higher index)
				// e.g. 1st (0) -> 2nd (1)
				setCurrentIndex((prev) =>
					prev < topThree.length - 1 ? prev + 1 : 0,
				);
			} else if (e.key === "ArrowRight") {
				// Next means going to higher rank (lower index)
				// e.g. 3rd (2) -> 2nd (1)
				setCurrentIndex((prev) =>
					prev > 0 ? prev - 1 : topThree.length - 1,
				);
			} else if (e.key === "f" || e.key === "F") {
				toggleFullscreen();
			} else if (e.key === " ") {
				e.preventDefault();
				setAutoPlay((prev) => !prev);
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [topThree.length, showIntro]);

	// Fullscreen toggle
	const toggleFullscreen = () => {
		if (!document.fullscreenElement) {
			document.documentElement.requestFullscreen();
			setIsFullscreen(true);
		} else {
			document.exitFullscreen();
			setIsFullscreen(false);
		}
	};

	const currentWinner = topThree[currentIndex];

	const getLevelColor = (rank: number) => {
		switch (rank) {
			case 1:
				return "from-amber-500 to-yellow-600"; // Gold
			case 2:
				return "from-gray-300 to-gray-500"; // Silver
			case 3:
				return "from-amber-700 to-amber-900"; // Bronze
			default:
				return "from-blue-500 to-purple-600";
		}
	};

	const getLevelBadgeColor = (rank: number) => {
		switch (rank) {
			case 1:
				return "bg-amber-500 text-white";
			case 2:
				return "bg-gray-300 text-gray-800";
			case 3:
				return "bg-amber-700 text-white";
			default:
				return "bg-blue-500 text-white";
		}
	};

	const getAwardName = (rank: number) => {
		switch (rank) {
			case 1:
				return "🥇 人气一等奖";
			case 2:
				return "🥈 人气二等奖";
			case 3:
				return "🥉 人气三等奖";
			default:
				return "🏆 特别奖";
		}
	};

	// Strip HTML tags from description
	const stripHtml = (html?: string) => {
		if (!html) return "";
		return html.replace(/<[^>]*>?/gm, "");
	};

	if (loading) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
				<div className="text-center">
					<Trophy className="w-16 h-16 animate-bounce mx-auto mb-4 text-amber-400" />
					<p className="text-xl text-white">加载中...</p>
				</div>
			</div>
		);
	}

	if (topThree.length === 0) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
				<div className="text-center text-white">
					<Trophy className="w-16 h-16 mx-auto mb-4 text-amber-400" />
					<p className="text-2xl font-bold mb-4">暂无获奖数据</p>
					<p className="text-white/70 mb-6">
						还没有作品获得足够的投票
					</p>
					<Button
						onClick={() => router.back()}
						variant="secondary"
						className="bg-white/10 hover:bg-white/20 text-white"
					>
						<ArrowLeft className="w-4 h-4 mr-2" />
						返回活动
					</Button>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen relative bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 overflow-hidden">
			{/* Animated background pattern */}
			<div className="absolute inset-0 opacity-10">
				<div
					className="absolute inset-0"
					style={{
						backgroundImage:
							'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.4"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
					}}
				/>
			</div>

			{/* Control bar */}
			{!isFullscreen && (
				<div className="relative z-10 flex items-center justify-between p-4 bg-black/30 backdrop-blur-sm border-b border-white/10">
					<Button
						onClick={() => router.back()}
						variant="ghost"
						size="sm"
						className="text-white hover:bg-white/10"
					>
						<ArrowLeft className="w-4 h-4 mr-2" />
						返回
					</Button>
					<h1 className="text-lg font-semibold text-white">
						{eventTitle} - 人气奖颁奖典礼
					</h1>
					<div className="flex items-center gap-2">
						<Button
							onClick={() => setAutoPlay(!autoPlay)}
							variant="ghost"
							size="sm"
							className="text-white hover:bg-white/10"
							disabled={showIntro}
						>
							{autoPlay ? (
								<Pause className="w-4 h-4" />
							) : (
								<Play className="w-4 h-4" />
							)}
						</Button>
						<Button
							onClick={toggleFullscreen}
							variant="ghost"
							size="sm"
							className="text-white hover:bg-white/10"
						>
							<Maximize className="w-4 h-4" />
						</Button>
					</div>
				</div>
			)}

			{/* Main content */}
			<div className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-64px)] p-8">
				<div className="w-full max-w-7xl mx-auto">
					{showIntro ? (
						/* Intro Screen */
						<div className="text-center space-y-12 animate-fade-in">
							<div className="space-y-6">
								<div className="relative inline-block">
									<div className="absolute -inset-4 bg-amber-500/20 blur-xl rounded-full animate-pulse" />
									<Trophy className="w-40 h-40 text-amber-400 relative z-10 mx-auto drop-shadow-[0_0_15px_rgba(251,191,36,0.5)]" />
								</div>

								<div className="space-y-4">
									<h1 className="text-7xl font-bold text-white drop-shadow-2xl tracking-tight">
										颁奖盛典
									</h1>
									<p className="text-3xl text-amber-200 font-light tracking-wide">
										即将揭晓最终结果
									</p>
								</div>
							</div>

							<div className="pt-8">
								<Button
									onClick={() => setShowIntro(false)}
									size="lg"
									className="text-2xl px-12 py-8 rounded-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 border-none shadow-[0_0_30px_rgba(245,158,11,0.3)] transition-all hover:scale-105"
								>
									<PartyPopper className="w-8 h-8 mr-3" />
									开始揭晓
								</Button>
							</div>

							<p className="text-white/40 mt-8">
								按{" "}
								<span className="px-2 py-1 bg-white/10 rounded text-white/80">
									空格
								</span>{" "}
								或{" "}
								<span className="px-2 py-1 bg-white/10 rounded text-white/80">
									→
								</span>{" "}
								开始
							</p>
						</div>
					) : (
						/* Award Slide */
						<div className="animate-slide-up">
							{/* Award header */}
							<div className="text-center mb-12 space-y-6">
								{/* Trophy icon */}
								<div className="flex justify-center mb-6">
									<div
										className={cn(
											"p-8 rounded-full bg-gradient-to-br shadow-2xl transition-all duration-500 transform hover:scale-110",
											getLevelColor(currentWinner.rank),
										)}
									>
										<Trophy className="w-30 h-30 text-white" />
									</div>
								</div>

								{/* Award name */}
								<div className="space-y-4">
									<Badge
										className={cn(
											"text-lg px-6 py-2",
											getLevelBadgeColor(
												currentWinner.rank,
											),
										)}
									>
										{getAwardName(currentWinner.rank)}
									</Badge>
									<h2 className="text-6xl font-bold text-white drop-shadow-lg">
										恭喜获奖！
									</h2>
									<p className="text-3xl text-white/80">
										获得 {currentWinner.voteCount} 票
									</p>
								</div>
							</div>

							{/* Winning submission */}
							<div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 border-2 border-white/20 shadow-2xl">
								<div className="flex items-center gap-8">
									{/* Cover image */}
									{currentWinner.coverImage && (
										<div className="flex-shrink-0">
											<div className="w-48 h-48 rounded-2xl overflow-hidden bg-white/5 border border-white/10">
												<Image
													src={
														currentWinner.coverImage
													}
													alt={currentWinner.name}
													width={192}
													height={192}
													className="w-full h-full object-cover"
												/>
											</div>
										</div>
									)}

									{/* Project info */}
									<div className="flex-1 space-y-4">
										<div className="flex items-center gap-4">
											<Badge className="text-2xl px-4 py-2 bg-amber-500 text-white">
												第 {currentWinner.rank} 名
											</Badge>
											<h3 className="text-4xl font-bold text-white">
												{currentWinner.name}
											</h3>
										</div>

										{/* Description */}
										{currentWinner.description && (
											<p className="text-xl text-white/80 line-clamp-3 leading-relaxed">
												{stripHtml(
													currentWinner.description,
												)}
											</p>
										)}

										{/* Team info */}
										<div className="flex items-start gap-3 text-white/90 pt-2">
											<Users className="w-6 h-6 mt-1 flex-shrink-0" />
											<div className="space-y-2">
												{currentWinner.teamLeader && (
													<p className="text-xl">
														<span className="text-white/60">
															队长：
														</span>
														<span className="font-semibold">
															{
																currentWinner
																	.teamLeader
																	.name
															}
														</span>
													</p>
												)}
												{currentWinner.teamMembers &&
													currentWinner.teamMembers
														.length > 0 && (
														<p className="text-lg">
															<span className="text-white/60">
																队员：
															</span>
															{currentWinner.teamMembers
																.map(
																	(m) =>
																		m.name,
																)
																.join("、")}
														</p>
													)}
											</div>
										</div>
									</div>
								</div>
							</div>

							{/* Navigation */}
							<div className="flex items-center justify-center gap-6 mt-12">
								<Button
									onClick={() =>
										setCurrentIndex((prev) =>
											prev < topThree.length - 1
												? prev + 1
												: 0,
										)
									}
									variant="ghost"
									size="lg"
									className="text-white hover:bg-white/10 text-lg px-6"
								>
									<ChevronLeft className="w-6 h-6 mr-2" />
									上一名
								</Button>

								<div className="flex items-center gap-2">
									{topThree.map((_, index) => (
										<button
											key={index}
											onClick={() =>
												setCurrentIndex(index)
											}
											className={cn(
												"w-3 h-3 rounded-full transition-all",
												index === currentIndex
													? "bg-white w-8"
													: "bg-white/30 hover:bg-white/50",
											)}
										/>
									))}
								</div>

								<Button
									onClick={() =>
										setCurrentIndex((prev) =>
											prev > 0
												? prev - 1
												: topThree.length - 1,
										)
									}
									variant="ghost"
									size="lg"
									className="text-white hover:bg-white/10 text-lg px-6"
								>
									下一名 (更靠前)
									<ChevronRight className="w-6 h-6 ml-2" />
								</Button>
							</div>

							{/* Progress indicator */}
							<div className="text-center mt-8">
								<p className="text-white/50 text-sm">
									{currentIndex + 1} / {topThree.length}
								</p>
								{!isFullscreen && (
									<p className="text-white/40 text-xs mt-2">
										提示：使用 ← → 切换获奖作品 | 空格键
										切换自动播放 | F 键全屏
									</p>
								)}
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
