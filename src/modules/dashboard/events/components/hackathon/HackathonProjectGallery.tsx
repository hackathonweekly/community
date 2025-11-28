"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	Heart,
	ExternalLink,
	Code,
	Presentation,
	Trophy,
	Star,
	Calendar,
	Zap,
	Target,
	Lightbulb,
	ArrowUp,
} from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

interface ProjectSubmission {
	id: string;
	title: string;
	description: string;
	demoUrl?: string;
	sourceCode?: string;
	presentationUrl?: string;
	status: string;
	submittedAt: string;
	judgeScore?: number;
	audienceScore?: number;
	finalScore?: number;
	project: {
		id: string;
		title: string;
		description?: string;
		screenshots: string[];
		githubUrl?: string;
		slidesUrl?: string;
		inspiration?: string;
		challenges?: string;
		learnings?: string;
		nextSteps?: string;
	};
	user: {
		id: string;
		name: string;
		image?: string;
		username?: string;
	};
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

interface HackathonProjectGalleryProps {
	eventId: string;
	currentUserId?: string;
	canVote: boolean;
	config?: {
		voting?: {
			allowPublicVoting: boolean;
			enableJudgeVoting: boolean;
		};
	};
	isVotingOpen?: boolean;
	showResults?: boolean;
}

export function HackathonProjectGallery({
	eventId,
	currentUserId,
	canVote,
	config,
	isVotingOpen = false,
	showResults = false,
}: HackathonProjectGalleryProps) {
	const t = useTranslations("events");
	const [submissions, setSubmissions] = useState<ProjectSubmission[]>([]);
	const [selectedProject, setSelectedProject] =
		useState<ProjectSubmission | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [votedProjects, setVotedProjects] = useState<Set<string>>(new Set());
	const [sortBy, setSortBy] = useState<"recent" | "popular" | "score">(
		"recent",
	);
	const votingStatusMessage = isVotingOpen
		? null
		: t(
				showResults
					? "hackathon.voting.closedMessage"
					: "hackathon.voting.notOpenMessage",
			);

	// Load project submissions
	useEffect(() => {
		const loadSubmissions = async () => {
			try {
				const response = await fetch(
					`/api/events/${eventId}/submissions`,
				);
				if (response.ok) {
					const data = await response.json();
					setSubmissions(data.data || []);
				}
			} catch (error) {
				console.error("Error loading submissions:", error);
			} finally {
				setIsLoading(false);
			}
		};

		loadSubmissions();
	}, [eventId]);

	// Handle voting
	const handleVote = async (submissionId: string) => {
		if (!currentUserId || !canVote || votedProjects.has(submissionId)) {
			return;
		}

		try {
			const response = await fetch(
				`/api/events/${eventId}/submissions/${submissionId}/vote`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						voteType: "AUDIENCE",
					}),
				},
			);

			if (response.ok) {
				setVotedProjects((prev) => new Set([...prev, submissionId]));
				toast.success(t("hackathon.voting.success"));

				// Update the submission in the list
				setSubmissions((prev) =>
					prev.map((sub) =>
						sub.id === submissionId
							? {
									...sub,
									audienceScore:
										(sub.audienceScore || 0) + 0.1,
								}
							: sub,
					),
				);
			} else {
				const error = await response.json();
				toast.error(error.message || t("hackathon.voting.error"));
			}
		} catch (error) {
			console.error("Error voting:", error);
			toast.error(t("hackathon.voting.error"));
		}
	};

	// Sort submissions
	const sortedSubmissions = [...submissions].sort((a, b) => {
		switch (sortBy) {
			case "popular":
				return (b.audienceScore || 0) - (a.audienceScore || 0);
			case "score":
				return (b.finalScore || 0) - (a.finalScore || 0);
			default:
				return (
					new Date(b.submittedAt).getTime() -
					new Date(a.submittedAt).getTime()
				);
		}
	});

	const getInitials = (name: string) => {
		return name
			.split(" ")
			.map((word) => word[0])
			.join("")
			.toUpperCase()
			.slice(0, 2);
	};

	if (isLoading) {
		return (
			<div className="space-y-6">
				<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
					{Array.from({ length: 6 }).map((_, i) => (
						<Card key={i} className="h-[450px]">
							<Skeleton className="h-48 w-full rounded-t-lg" />
							<CardContent className="p-5 space-y-4">
								<Skeleton className="h-6 w-3/4" />
								<Skeleton className="h-4 w-full" />
								<Skeleton className="h-4 w-2/3" />
								<div className="flex justify-between items-center pt-2">
									<Skeleton className="h-9 w-9 rounded-full" />
									<Skeleton className="h-6 w-16" />
								</div>
							</CardContent>
						</Card>
					))}
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Header with Sort Options */}
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
				<div>
					<h2 className="text-xl font-semibold text-slate-900">
						{t("hackathon.gallery.title")} ({submissions.length})
					</h2>
					<p className="text-sm text-slate-600 mt-1">
						探索参赛者的精彩作品
					</p>
				</div>
				<div className="flex items-center space-x-2">
					<Button
						variant={sortBy === "recent" ? "default" : "outline"}
						size="sm"
						onClick={() => setSortBy("recent")}
						className="text-xs"
					>
						<Calendar className="w-4 h-4 mr-1" />
						{t("hackathon.gallery.sortRecent")}
					</Button>
					<Button
						variant={sortBy === "popular" ? "default" : "outline"}
						size="sm"
						onClick={() => setSortBy("popular")}
						className="text-xs"
					>
						<Heart className="w-4 h-4 mr-1" />
						{t("hackathon.gallery.sortPopular")}
					</Button>
					<Button
						variant={sortBy === "score" ? "default" : "outline"}
						size="sm"
						onClick={() => setSortBy("score")}
						className="text-xs"
					>
						<Trophy className="w-4 h-4 mr-1" />
						{t("hackathon.gallery.sortScore")}
					</Button>
				</div>
			</div>

			{votingStatusMessage && (
				<Card className="border-dashed bg-blue-50/50">
					<CardContent className="py-4 text-sm text-blue-700">
						{votingStatusMessage}
					</CardContent>
				</Card>
			)}

			{/* Project Grid */}
			{sortedSubmissions.length === 0 ? (
				<Card className="p-16 text-center">
					<Code className="h-16 w-16 mx-auto mb-6 text-slate-300" />
					<h3 className="text-xl font-semibold text-slate-700 mb-3">
						{t("hackathon.gallery.noProjects")}
					</h3>
					<p className="text-slate-500 max-w-md mx-auto">
						{t("hackathon.gallery.noProjectsDesc")}
					</p>
				</Card>
			) : (
				<div className="grid gap-4 sm:gap-6 lg:gap-8 sm:grid-cols-2 lg:grid-cols-3">
					{sortedSubmissions.map((submission) => (
						<Card
							key={submission.id}
							className="group cursor-pointer hover:shadow-lg transition-all duration-300 border border-slate-200/60 shadow-sm hover:shadow-md overflow-hidden bg-white/80 backdrop-blur-sm"
							onClick={() => setSelectedProject(submission)}
						>
							{/* Project Image Header */}
							<div className="relative h-48 bg-gradient-to-br from-slate-50 to-slate-100 overflow-hidden">
								{submission.project.screenshots?.[0] ? (
									<img
										src={submission.project.screenshots[0]}
										alt={submission.title}
										className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
									/>
								) : (
									<div className="flex items-center justify-center h-full bg-gradient-to-br from-blue-50/50 to-purple-50/50">
										<Code className="h-16 w-16 text-slate-400" />
									</div>
								)}

								{/* Awards Badge - Top Left */}
								{submission.awards.length > 0 && (
									<div className="absolute top-3 left-3">
										<Badge className="bg-gradient-to-r from-amber-400 to-orange-500 text-white border-0 shadow-md font-medium px-2.5 py-1 text-xs">
											<Trophy className="w-3 h-3 mr-1" />
											{submission.awards.length} 奖项
										</Badge>
									</div>
								)}

								{/* Vote Score Badge - Top Right */}
								{submission.audienceScore &&
									submission.audienceScore > 0 && (
										<div className="absolute top-3 right-3">
											<Badge
												variant="secondary"
												className="bg-white/90 backdrop-blur-sm border border-slate-200 shadow-sm px-2.5 py-1 text-xs"
											>
												<Heart className="w-3 h-3 mr-1 text-red-500" />
												{submission.audienceScore.toFixed(
													1,
												)}
											</Badge>
										</div>
									)}
							</div>

							{/* Content Section */}
							<div className="p-4 space-y-3">
								{/* Title Section */}
								<div>
									<h3 className="font-semibold text-base mb-1.5 line-clamp-2 text-slate-900 group-hover:text-blue-600 transition-colors leading-tight">
										{submission.title}
									</h3>
									<p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
										{submission.description}
									</p>
								</div>

								{/* Author and Score Info */}
								<div className="flex items-center justify-between pt-1">
									<div className="flex items-center space-x-2">
										<Avatar className="h-8 w-8 ring-1 ring-slate-100">
											<AvatarImage
												src={submission.user.image}
												alt={submission.user.name}
											/>
											<AvatarFallback className="text-xs font-medium bg-slate-100">
												{getInitials(
													submission.user.name,
												)}
											</AvatarFallback>
										</Avatar>
										<div className="min-w-0 flex-1">
											<p className="text-xs font-medium text-slate-900 truncate">
												{submission.user.name}
											</p>
											<p className="text-xs text-slate-500">
												{new Date(
													submission.submittedAt,
												).toLocaleDateString("zh-CN", {
													month: "numeric",
													day: "numeric",
												})}
											</p>
										</div>
									</div>

									{submission.finalScore && (
										<div className="flex items-center space-x-1 bg-amber-50 px-2 py-1 rounded-full">
											<Star className="w-3 h-3 text-amber-500 fill-current" />
											<span className="text-xs font-bold text-amber-700">
												{submission.finalScore.toFixed(
													1,
												)}
											</span>
										</div>
									)}
								</div>

								{/* Action Links */}
								<div className="flex items-center gap-1.5 pt-2 border-t border-slate-100">
									<div className="flex items-center gap-1 flex-wrap">
										{submission.demoUrl && (
											<Button
												variant="ghost"
												size="sm"
												onClick={(e) => {
													e.stopPropagation();
													window.open(
														submission.demoUrl,
														"_blank",
													);
												}}
												className="h-7 px-2 text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
											>
												<ExternalLink className="w-3 h-3 mr-1" />
												Demo
											</Button>
										)}
										{submission.sourceCode && (
											<Button
												variant="ghost"
												size="sm"
												onClick={(e) => {
													e.stopPropagation();
													window.open(
														submission.sourceCode,
														"_blank",
													);
												}}
												className="h-7 px-2 text-xs font-medium text-slate-600 hover:text-slate-700 hover:bg-slate-50 rounded transition-colors"
											>
												<Code className="w-3 h-3 mr-1" />
												代码
											</Button>
										)}
										{submission.presentationUrl && (
											<Button
												variant="ghost"
												size="sm"
												onClick={(e) => {
													e.stopPropagation();
													window.open(
														submission.presentationUrl,
														"_blank",
													);
												}}
												className="h-7 px-2 text-xs font-medium text-slate-600 hover:text-slate-700 hover:bg-slate-50 rounded transition-colors"
											>
												<Presentation className="w-3 h-3 mr-1" />
												幻灯片
											</Button>
										)}
									</div>

									{/* Vote Button */}
									{canVote &&
										currentUserId !==
											submission.user.id && (
											<Button
												size="sm"
												variant={
													votedProjects.has(
														submission.id,
													)
														? "default"
														: "outline"
												}
												className={`h-7 px-2 text-xs font-medium rounded transition-all flex-shrink-0 ${
													votedProjects.has(
														submission.id,
													)
														? "bg-green-500 hover:bg-green-600 text-white"
														: "hover:bg-green-50 hover:text-green-600 hover:border-green-200"
												}`}
												onClick={(e) => {
													e.stopPropagation();
													handleVote(submission.id);
												}}
												disabled={votedProjects.has(
													submission.id,
												)}
											>
												<ArrowUp className="w-3 h-3 mr-1" />
												{votedProjects.has(
													submission.id,
												)
													? "已投"
													: "投票"}
											</Button>
										)}
								</div>
							</div>
						</Card>
					))}
				</div>
			)}

			{/* Project Detail Modal */}
			{selectedProject && (
				<Dialog
					open={true}
					onOpenChange={() => setSelectedProject(null)}
				>
					<DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
						<DialogHeader>
							<DialogTitle className="flex items-center justify-between">
								<span>{selectedProject.title}</span>
								{selectedProject.awards.length > 0 && (
									<Badge className="bg-gradient-to-r from-amber-400 to-orange-500 text-white">
										<Trophy className="w-4 h-4 mr-1" />
										{t("hackathon.project.winner")}
									</Badge>
								)}
							</DialogTitle>
							<DialogDescription>
								{t("hackathon.project.by")}{" "}
								{selectedProject.user.name}
							</DialogDescription>
						</DialogHeader>

						<div className="space-y-6">
							{/* Project Image */}
							{selectedProject.project.screenshots?.[0] && (
								<img
									src={selectedProject.project.screenshots[0]}
									alt={selectedProject.title}
									className="w-full h-64 object-cover rounded-lg"
								/>
							)}

							{/* Description */}
							<div>
								<h4 className="font-semibold mb-2">
									{t("hackathon.project.description")}
								</h4>
								<p className="text-muted-foreground">
									{selectedProject.description}
								</p>
							</div>

							{/* Links */}
							<div className="flex flex-wrap gap-3">
								{selectedProject.demoUrl && (
									<Button
										variant="outline"
										onClick={() =>
											window.open(
												selectedProject.demoUrl,
												"_blank",
											)
										}
									>
										<ExternalLink className="w-4 h-4 mr-2" />
										{t("hackathon.project.liveDemo")}
									</Button>
								)}
								{selectedProject.sourceCode && (
									<Button
										variant="outline"
										onClick={() =>
											window.open(
												selectedProject.sourceCode,
												"_blank",
											)
										}
									>
										<Code className="w-4 h-4 mr-2" />
										{t("hackathon.project.sourceCode")}
									</Button>
								)}
								{selectedProject.presentationUrl && (
									<Button
										variant="outline"
										onClick={() =>
											window.open(
												selectedProject.presentationUrl,
												"_blank",
											)
										}
									>
										<Presentation className="w-4 h-4 mr-2" />
										{t("hackathon.project.presentation")}
									</Button>
								)}
							</div>

							{/* Hackathon Learning Content */}
							{(selectedProject.project.inspiration ||
								selectedProject.project.challenges ||
								selectedProject.project.learnings ||
								selectedProject.project.nextSteps) && (
								<div className="grid gap-4 md:grid-cols-2">
									{selectedProject.project.inspiration && (
										<Card>
											<CardHeader>
												<CardTitle className="flex items-center text-base">
													<Lightbulb className="w-4 h-4 mr-2" />
													{t(
														"hackathon.project.inspiration",
													)}
												</CardTitle>
											</CardHeader>
											<CardContent>
												<p className="text-sm">
													{
														selectedProject.project
															.inspiration
													}
												</p>
											</CardContent>
										</Card>
									)}

									{selectedProject.project.challenges && (
										<Card>
											<CardHeader>
												<CardTitle className="flex items-center text-base">
													<Zap className="w-4 h-4 mr-2" />
													{t(
														"hackathon.project.challenges",
													)}
												</CardTitle>
											</CardHeader>
											<CardContent>
												<p className="text-sm">
													{
														selectedProject.project
															.challenges
													}
												</p>
											</CardContent>
										</Card>
									)}

									{selectedProject.project.learnings && (
										<Card>
											<CardHeader>
												<CardTitle className="flex items-center text-base">
													<Target className="w-4 h-4 mr-2" />
													{t(
														"hackathon.project.learnings",
													)}
												</CardTitle>
											</CardHeader>
											<CardContent>
												<p className="text-sm">
													{
														selectedProject.project
															.learnings
													}
												</p>
											</CardContent>
										</Card>
									)}

									{selectedProject.project.nextSteps && (
										<Card>
											<CardHeader>
												<CardTitle className="flex items-center text-base">
													<ArrowUp className="w-4 h-4 mr-2" />
													{t(
														"hackathon.project.nextSteps",
													)}
												</CardTitle>
											</CardHeader>
											<CardContent>
												<p className="text-sm">
													{
														selectedProject.project
															.nextSteps
													}
												</p>
											</CardContent>
										</Card>
									)}
								</div>
							)}

							{/* Awards */}
							{selectedProject.awards.length > 0 && (
								<div>
									<h4 className="font-semibold mb-3">
										{t("hackathon.project.awards")}
									</h4>
									<div className="flex flex-wrap gap-2">
										{selectedProject.awards.map((award) => (
											<Badge
												key={award.award.id}
												variant="secondary"
												className="p-2"
											>
												<Trophy className="w-4 h-4 mr-1" />
												{award.award.name}
											</Badge>
										))}
									</div>
								</div>
							)}

							{/* Voting Section */}
							{canVote &&
								currentUserId !== selectedProject.user.id && (
									<div className="flex items-center justify-between p-4 bg-accent rounded-lg">
										<div>
											<p className="font-medium">
												{t(
													"hackathon.voting.likeProject",
												)}
											</p>
											<p className="text-sm text-muted-foreground">
												{t(
													"hackathon.voting.likeProjectDesc",
												)}
											</p>
										</div>
										<Button
											onClick={() =>
												handleVote(selectedProject.id)
											}
											disabled={votedProjects.has(
												selectedProject.id,
											)}
											variant={
												votedProjects.has(
													selectedProject.id,
												)
													? "default"
													: "outline"
											}
										>
											<ArrowUp className="w-4 h-4 mr-2" />
											{t("hackathon.voting.vote")}
										</Button>
									</div>
								)}
						</div>
					</DialogContent>
				</Dialog>
			)}
		</div>
	);
}
