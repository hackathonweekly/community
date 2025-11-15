"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	Trophy,
	Users,
	Clock,
	Target,
	Zap,
	Lightbulb,
	Code,
	Award,
} from "lucide-react";
import {
	EventDescription,
	EventHero,
	EventInfoCard,
} from "@/modules/public/events/components";
import type { EventDetailsProps } from "../EventDetailsClient";
import { AwardShowcase } from "@/modules/dashboard/events/components/hackathon/AwardShowcase";
import {
	HACKATHON_STAGE_VALUES,
	type HackathonStage,
} from "@/features/hackathon/config";

type EventDetails = EventDetailsProps["event"];
type EventRegistration = NonNullable<EventDetails["registrations"]>[number];

interface HackathonContentProps {
	event: EventDetails & { richContent?: string };
	currentUserId?: string;
	user?: { id: string } | null;
	existingRegistration?: EventRegistration | null;
	canRegister: boolean | null;
	isRegistering: boolean;
	getRegistrationStatusText: () => string;
	handleRegister: (openModal?: () => void) => void;
	handleCancelRegistration: () => void;
	onVolunteerApply: (eventVolunteerRoleId: string) => void;
	onDataRefresh: () => void;
	onFeedbackSubmit?: (feedback: {
		rating: number;
		comment: string;
		suggestions: string;
		wouldRecommend: boolean;
	}) => void;
	projectSubmissions?: any[];
	eventTypeColors: Record<string, string>;
	eventTypeLabels: Record<string, string>;
	isBookmarked: boolean;
	onOpenRegistrationModal: () => void;
	onShowQRGenerator: () => void;
	onShowSuccessInfo: () => void;
	onShowShare: () => void;
	hasSubmittedFeedback?: boolean;
}

export function HackathonContent({
	event,
	currentUserId,
	user,
	existingRegistration,
	canRegister,
	isRegistering,
	getRegistrationStatusText,
	handleRegister,
	handleCancelRegistration,
	onVolunteerApply,
	onDataRefresh,
	onFeedbackSubmit,
	projectSubmissions,
	eventTypeColors,
	eventTypeLabels,
	isBookmarked,
	onOpenRegistrationModal,
	onShowQRGenerator,
	onShowSuccessInfo,
	onShowShare,
	hasSubmittedFeedback,
}: HackathonContentProps) {
	const t = useTranslations("events");
	const [activeTab, setActiveTab] = useState("overview");
	const pathname = usePathname();
	const currentLocale = pathname?.split("/")?.[1] ?? "zh";

	const config = event.hackathonConfig;
	const votingConfig = config?.voting;
	const isEventStarted = new Date() >= new Date(event.startTime);
	// 双重状态判断：时间判断 + 状态判断
	const isEventEnded =
		new Date() >= new Date(event.endTime) || event.status === "COMPLETED";
	const stageOrder = HACKATHON_STAGE_VALUES;
	const rawStage = config?.stage?.current;
	const fallbackStage: HackathonStage = !isEventStarted
		? "REGISTRATION"
		: !isEventEnded
			? "DEVELOPMENT"
			: "RESULTS";
	const currentStage: HackathonStage = stageOrder.includes(
		rawStage as HackathonStage,
	)
		? (rawStage as HackathonStage)
		: fallbackStage;
	const allowSubmissionStages: HackathonStage[] = [
		"DEVELOPMENT",
		"SUBMISSION",
	];
	const isSubmissionWindow = allowSubmissionStages.includes(currentStage);
	const isVotingWindow = currentStage === "VOTING";
	const isResultsStage = currentStage === "RESULTS";
	const stageStatusKeyMap: Record<HackathonStage, string> = {
		REGISTRATION: "hackathon.status.registrationOpen",
		DEVELOPMENT: "hackathon.status.inProgress",
		SUBMISSION: "hackathon.status.submissionOpen",
		VOTING: "hackathon.status.voting",
		RESULTS: "hackathon.status.resultsPublished",
	};
	const projectSubmissionList = projectSubmissions || [];
	const richContent = event.richContent || event.description || "";
	const publicSubmissionsUrl = `/${currentLocale}/events/${event.id}/submissions`;
	const privateSubmissionUrl = `/app/events/${event.id}/submissions/new`;
	const audienceVotingEnabled = Boolean(
		isVotingWindow && votingConfig?.allowPublicVoting,
	);
	const registrationOpen = Boolean(
		canRegister && currentStage === "REGISTRATION",
	);

	// Check if user is registered
	const userRegistration = event.registrations?.find(
		(reg) => reg.user.id === currentUserId && reg.status === "APPROVED",
	);
	const isUserRegistered = Boolean(userRegistration);
	const canCurrentUserVote = (() => {
		if (!audienceVotingEnabled || !user?.id) {
			return false;
		}
		const scope = votingConfig?.publicVotingScope ?? "PARTICIPANTS";
		if (scope === "PARTICIPANTS") {
			return isUserRegistered;
		}
		// SCOPE === "REGISTERED" | "ALL" -> any authenticated viewer can vote
		return true;
	})();

	useEffect(() => {
		if (currentStage === "RESULTS" && activeTab === "overview") {
			setActiveTab("results");
		}
	}, [currentStage, activeTab]);

	const stageStatusMessage = t(stageStatusKeyMap[currentStage]);

	const handleRegistrationClick = () => {
		if (!registrationOpen) {
			return;
		}
		handleRegister(onOpenRegistrationModal);
	};
	const registrationStatusMessage =
		currentStage === "REGISTRATION"
			? getRegistrationStatusText()
			: t("hackathon.registration.stageClosed");

	const renderStageIcon = (stage: HackathonStage) => {
		switch (stage) {
			case "REGISTRATION":
				return <Users className="w-4 h-4" />;
			case "DEVELOPMENT":
				return <Code className="w-4 h-4" />;
			case "SUBMISSION":
				return <Target className="w-4 h-4" />;
			case "VOTING":
				return <Trophy className="w-4 h-4" />;
			case "RESULTS":
				return <Award className="w-4 h-4" />;
			default:
				return null;
		}
	};

	return (
		<>
			{/* Core event hero + info, reusing standard event components */}
			<EventHero
				event={event}
				user={user}
				eventTypeColors={eventTypeColors}
				eventTypeLabels={eventTypeLabels}
				isBookmarked={isBookmarked}
			/>

			<EventInfoCard
				event={event}
				currentUserId={user?.id}
				projectSubmissions={projectSubmissionList}
			/>

			{/* Event Stage Indicator */}
			<div className="mb-8">
				<div className="flex items-center justify-between mb-4">
					<div className="flex flex-wrap items-center gap-2">
						{stageOrder.map((stage) => {
							const position = stageOrder.indexOf(stage);
							const variant =
								stage === currentStage
									? "default"
									: position <
											stageOrder.indexOf(currentStage)
										? "outline"
										: "secondary";
							return (
								<Badge
									key={stage}
									variant={variant}
									className="flex items-center gap-1 text-xs"
								>
									{renderStageIcon(stage)}
									<span>
										{t(
											`hackathon.phases.${stage.toLowerCase()}`,
										)}
									</span>
								</Badge>
							);
						})}
					</div>
					<div className="flex items-center space-x-2 text-sm text-muted-foreground">
						<Clock className="w-4 h-4" />
						<span>{stageStatusMessage}</span>
					</div>
				</div>
			</div>

			{/* Main Content Tabs */}
			<Tabs
				value={activeTab}
				onValueChange={setActiveTab}
				className="w-full"
			>
				<TabsList className="grid w-full grid-cols-5">
					<TabsTrigger value="overview">
						{t("hackathon.tabs.overview")}
					</TabsTrigger>
					<TabsTrigger value="projects">
						{t("hackathon.tabs.projects")}
					</TabsTrigger>
					<TabsTrigger value="resources">
						{t("hackathon.tabs.resources")}
					</TabsTrigger>
					<TabsTrigger value="awards">
						{t("hackathon.tabs.awards")}
					</TabsTrigger>
					<TabsTrigger value="results">
						{t("hackathon.tabs.results")}
					</TabsTrigger>
				</TabsList>

				{/* Overview Tab */}
				<TabsContent value="overview" className="space-y-6">
					<EventDescription richContent={richContent} />

					{/* Hackathon Features */}
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center">
								<Zap className="w-5 h-5 mr-2" />
								{t("hackathon.features.title")}
							</CardTitle>
						</CardHeader>
						<CardContent className="grid gap-4 md:grid-cols-2">
							<div className="flex items-start space-x-3">
								<Users className="w-5 h-5 text-blue-500 mt-1" />
								<div>
									<h4 className="font-medium">
										{t("hackathon.features.teamwork")}
									</h4>
									<p className="text-sm text-muted-foreground">
										{config?.settings.allowSolo
											? t(
													"hackathon.features.soloOrTeam",
													{
														max: config.settings
															.maxTeamSize,
													},
												)
											: t("hackathon.features.teamOnly", {
													max:
														config?.settings
															.maxTeamSize || 5,
												})}
									</p>
								</div>
							</div>
							<div className="flex items-start space-x-3">
								<Target className="w-5 h-5 text-green-500 mt-1" />
								<div>
									<h4 className="font-medium">
										{t("hackathon.features.learning")}
									</h4>
									<p className="text-sm text-muted-foreground">
										{t("hackathon.features.learningDesc")}
									</p>
								</div>
							</div>
							<div className="flex items-start space-x-3">
								<Lightbulb className="w-5 h-5 text-yellow-500 mt-1" />
								<div>
									<h4 className="font-medium">
										{t("hackathon.features.innovation")}
									</h4>
									<p className="text-sm text-muted-foreground">
										{t("hackathon.features.innovationDesc")}
									</p>
								</div>
							</div>
							<div className="flex items-start space-x-3">
								<Award className="w-5 h-5 text-purple-500 mt-1" />
								<div>
									<h4 className="font-medium">
										{t("hackathon.features.recognition")}
									</h4>
									<p className="text-sm text-muted-foreground">
										{t(
											"hackathon.features.recognitionDesc",
										)}
									</p>
								</div>
							</div>
						</CardContent>
					</Card>

					{/* Quick Submit Button for Registered Users */}
					{isUserRegistered && isSubmissionWindow && (
						<Card>
							<CardContent className="pt-6">
								<Button asChild className="w-full">
									<Link href={privateSubmissionUrl}>
										{t("hackathon.actions.submitProject")}
									</Link>
								</Button>
							</CardContent>
						</Card>
					)}
				</TabsContent>

				{/* Projects Tab */}
				<TabsContent value="projects" className="space-y-6">
					<Card>
						<CardHeader>
							<CardTitle>作品提交与投票</CardTitle>
							<CardDescription>
								集中查看本次活动的所有参赛作品，并为你喜爱的团队投票
							</CardDescription>
						</CardHeader>
						<CardContent className="flex flex-col md:flex-row gap-4">
							<Button asChild className="flex-1">
								<Link href={publicSubmissionsUrl}>
									查看作品与实时票数
								</Link>
							</Button>
							<Button
								asChild
								variant="secondary"
								className="flex-1"
								disabled={!isUserRegistered}
							>
								<Link href={privateSubmissionUrl}>
									{isUserRegistered
										? "提交我的作品"
										: "报名后可提交作品"}
								</Link>
							</Button>
						</CardContent>
					</Card>
				</TabsContent>

				{/* Resources Tab */}
				<TabsContent value="resources" className="space-y-6">
					{config?.resources ? (
						<div className="grid gap-6 md:grid-cols-3">
							{/* Tutorials */}
							{config.resources.tutorials.length > 0 && (
								<Card>
									<CardHeader>
										<CardTitle>
											{t("hackathon.resources.tutorials")}
										</CardTitle>
										<CardDescription>
											{t(
												"hackathon.resources.tutorialsDesc",
											)}
										</CardDescription>
									</CardHeader>
									<CardContent className="space-y-3">
										{config.resources.tutorials.map(
											(tutorial: any, index: number) => (
												<a
													key={index}
													href={tutorial.url}
													target="_blank"
													rel="noopener noreferrer"
													className="block p-3 rounded-lg border hover:bg-accent transition-colors"
												>
													<h4 className="font-medium">
														{tutorial.title}
													</h4>
													{tutorial.description && (
														<p className="text-sm text-muted-foreground mt-1">
															{
																tutorial.description
															}
														</p>
													)}
												</a>
											),
										)}
									</CardContent>
								</Card>
							)}

							{/* Tools */}
							{config.resources.tools.length > 0 && (
								<Card>
									<CardHeader>
										<CardTitle>
											{t("hackathon.resources.tools")}
										</CardTitle>
										<CardDescription>
											{t("hackathon.resources.toolsDesc")}
										</CardDescription>
									</CardHeader>
									<CardContent className="space-y-3">
										{config.resources.tools.map(
											(tool: any, index: number) => (
												<a
													key={index}
													href={tool.url}
													target="_blank"
													rel="noopener noreferrer"
													className="block p-3 rounded-lg border hover:bg-accent transition-colors"
												>
													<h4 className="font-medium">
														{tool.name}
													</h4>
													{tool.description && (
														<p className="text-sm text-muted-foreground mt-1">
															{tool.description}
														</p>
													)}
												</a>
											),
										)}
									</CardContent>
								</Card>
							)}

							{/* Examples */}
							{config.resources.examples.length > 0 && (
								<Card>
									<CardHeader>
										<CardTitle>
											{t("hackathon.resources.examples")}
										</CardTitle>
										<CardDescription>
											{t(
												"hackathon.resources.examplesDesc",
											)}
										</CardDescription>
									</CardHeader>
									<CardContent className="space-y-3">
										{config.resources.examples.map(
											(example: any, index: number) => (
												<a
													key={index}
													href={example.url}
													target="_blank"
													rel="noopener noreferrer"
													className="block p-3 rounded-lg border hover:bg-accent transition-colors"
												>
													<h4 className="font-medium">
														{example.title}
													</h4>
													{example.description && (
														<p className="text-sm text-muted-foreground mt-1">
															{
																example.description
															}
														</p>
													)}
												</a>
											),
										)}
									</CardContent>
								</Card>
							)}
						</div>
					) : (
						<Card>
							<CardContent className="pt-6">
								<p className="text-center text-muted-foreground">
									{t("hackathon.resources.noResources")}
								</p>
							</CardContent>
						</Card>
					)}
				</TabsContent>

				{/* Awards Tab */}
				<TabsContent value="awards" className="space-y-6">
					<AwardShowcase
						awards={config?.awards || []}
						eventId={event.id}
					/>
				</TabsContent>

				{/* Results Tab */}
				<TabsContent value="results" className="space-y-6">
					<Card>
						<CardHeader>
							<CardTitle>实时投票结果</CardTitle>
							<CardDescription>
								打开作品广场查看最新票数、排行榜以及作品详情
							</CardDescription>
						</CardHeader>
						<CardContent className="flex justify-center">
							<Button asChild>
								<Link href={publicSubmissionsUrl}>
									前往作品广场
								</Link>
							</Button>
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>
		</>
	);
}
