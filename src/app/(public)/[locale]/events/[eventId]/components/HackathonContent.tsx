"use client";

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
	HACKATHON_STAGE_VALUES,
	type HackathonStage,
} from "@/features/hackathon/config";
import { AwardShowcase } from "@/modules/dashboard/events/components/hackathon/AwardShowcase";
import {
	EventDescription,
	EventHero,
	EventInfoCard,
} from "@/modules/public/events/components";
import {
	Award,
	BookOpen,
	Clock,
	Code,
	Info,
	LayoutGrid,
	Settings,
	Target,
	Trophy,
	Users,
} from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { EventDetailsProps } from "../EventDetailsClient";

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
	canManageEvent?: boolean; // 新增：是否可以管理活动
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
	canManageEvent = false,
}: HackathonContentProps) {
	const t = useTranslations("events");
	const pathname = usePathname();
	const currentLocale = pathname?.split("/")?.[1] ?? "zh";

	const config = event.hackathonConfig;
	const votingConfig = config?.voting;
	const isEventStarted = new Date() >= new Date(event.startTime);
	// 双重状态判断：时间判断 + 状态判断
	const isEventEnded =
		new Date() >= new Date(event.endTime) || event.status === "COMPLETED";

	// 获取当前阶段
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

	// 根据阶段判断窗口期
	const isSubmissionWindow =
		(currentStage === "DEVELOPMENT" || currentStage === "SUBMISSION") &&
		isEventStarted &&
		!isEventEnded;
	const isVotingWindow = currentStage === "VOTING";
	const isResultsStage = currentStage === "RESULTS";

	// 阶段状态映射 - 使用5个阶段
	const stageStatusKeyMap: Record<HackathonStage, string> = {
		REGISTRATION: "hackathon.status.registration",
		DEVELOPMENT: "hackathon.status.development",
		SUBMISSION: "hackathon.status.submission",
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
		canRegister && !isEventStarted && currentStage === "REGISTRATION",
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

	const stageStatusMessage = t(stageStatusKeyMap[currentStage]);

	const handleRegistrationClick = () => {
		if (!registrationOpen) {
			return;
		}
		handleRegister(onOpenRegistrationModal);
	};
	const registrationStatusMessage = !isEventStarted
		? getRegistrationStatusText()
		: t("hackathon.registration.stageClosed");

	// 阶段显示图标
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
			{/* 管理员阶段控制 Sticky Bar */}
			{canManageEvent && (
				<div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b mb-6">
					<div className="flex items-center justify-between py-3 px-4">
						<div className="flex items-center gap-2 text-sm">
							<Settings className="w-4 h-4" />
							<span className="font-medium">管理</span>
						</div>
						<div className="flex items-center gap-3">
							<Link
								href={`/${currentLocale}/events/${event.id}/countdown`}
								target="_blank"
							>
								<Button variant="outline" size="sm">
									<Clock className="w-4 h-4 mr-2" />
									倒计时大屏
								</Button>
							</Link>
							<Link
								href={`/${currentLocale}/events/${event.id}/awards-ceremony`}
								target="_blank"
							>
								<Button variant="outline" size="sm">
									<Trophy className="w-4 h-4 mr-2" />
									颁奖墙
								</Button>
							</Link>
							<Link href={`/app/events/${event.id}/edit`}>
								<Button variant="outline" size="sm">
									高级设置
								</Button>
							</Link>
						</div>
					</div>
				</div>
			)}

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

			{/* Event Stage Indicator & Status - 优化后的赛事进程卡片 */}
			<Card className="mb-8 border-none shadow-none bg-muted/30">
				<CardContent className="pt-6 pb-6">
					<div className="flex flex-col space-y-6">
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-2">
								<div className="h-8 w-1 bg-primary rounded-full" />
								<h3 className="text-lg font-semibold">
									赛事进程
								</h3>
							</div>

							{/* 作品广场入口 */}
							<Link href={publicSubmissionsUrl}>
								<Button
									variant="outline"
									size="sm"
									className="gap-2 h-8 bg-background"
								>
									<LayoutGrid className="w-3.5 h-3.5" />
									作品广场
									{projectSubmissionList.length > 0 && (
										<Badge
											variant="secondary"
											className="ml-1 h-4 min-w-4 px-1 text-[10px]"
										>
											{projectSubmissionList.length}
										</Badge>
									)}
								</Button>
							</Link>
						</div>

						{/* 简化的步骤条 */}
						<div className="relative">
							<div className="flex items-center justify-between w-full">
								{HACKATHON_STAGE_VALUES.map((stage, index) => {
									const isActive = stage === currentStage;
									const isPast =
										HACKATHON_STAGE_VALUES.indexOf(stage) <
										HACKATHON_STAGE_VALUES.indexOf(
											currentStage,
										);
									const isLast =
										index ===
										HACKATHON_STAGE_VALUES.length - 1;

									return (
										<div
											key={stage}
											className="flex-1 flex items-center relative group"
										>
											{/* 节点 */}
											<div className="flex flex-col items-center gap-2 relative z-10">
												<div
													className={`
														w-8 h-8 rounded-full flex items-center justify-center border transition-all duration-300
														${isActive ? "bg-primary text-primary-foreground border-primary shadow-md scale-110" : ""}
														${isPast ? "bg-primary/20 text-primary border-primary/20" : ""}
														${!isActive && !isPast ? "bg-background text-muted-foreground border-border" : ""}
													`}
												>
													{renderStageIcon(stage)}
												</div>
												<span
													className={`
														absolute top-10 text-xs font-medium whitespace-nowrap transition-colors duration-300
														${isActive ? "text-primary font-bold" : "text-muted-foreground"}
													`}
												>
													{t(
														`hackathon.phases.${stage.toLowerCase()}`,
													)}
												</span>
											</div>

											{/* 连接线 */}
											{!isLast && (
												<div className="flex-1 h-[2px] mx-2 bg-border relative -top-4">
													{(isPast || isActive) && (
														<div
															className="absolute left-0 top-0 h-full bg-primary transition-all duration-500"
															style={{
																width: isPast
																	? "100%"
																	: "50%",
															}}
														/>
													)}
												</div>
											)}
										</div>
									);
								})}
							</div>
							{/* 占位，防止文字被切 */}
							<div className="h-6" />
						</div>

						{/* 当前阶段状态提示 - 更加简洁的设计 */}
						<div className="bg-background rounded-lg p-4 border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
							<div className="flex items-start gap-3">
								<Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
								<div className="space-y-1">
									<p className="text-sm text-muted-foreground leading-relaxed">
										{stageStatusMessage}
									</p>
								</div>
							</div>

							{/* 阶段性操作按钮 */}
							{isSubmissionWindow && (
								<Button
									asChild
									size="sm"
									className="gap-2 shrink-0"
								>
									<Link href={privateSubmissionUrl}>
										<Target className="w-4 h-4" />
										{projectSubmissions?.find(
											(p) =>
												p.submitterId === currentUserId,
										)
											? "编辑作品"
											: "提交作品"}
									</Link>
								</Button>
							)}
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Main Content Section */}
			<div className="space-y-10 animate-in fade-in-50 duration-300">
				{/* Overview / Description - 直接展示，不再包含在 Tab 中 */}
				<div className="space-y-4">
					<div className="flex items-center gap-2 border-b pb-2 mb-6">
						<BookOpen className="w-5 h-5 text-primary" />
						<h2 className="text-xl font-semibold">活动详情</h2>
					</div>
					<EventDescription richContent={richContent} />
				</div>

				{/* Tabs Section for Awards & Resources - Only show if content exists */}
				{((config?.awards && config.awards.length > 0) ||
					(config?.resources?.tutorials &&
						config.resources.tutorials.length > 0) ||
					(config?.resources?.tools &&
						config.resources.tools.length > 0) ||
					(config?.resources?.examples &&
						config.resources.examples.length > 0)) && (
					<Tabs
						defaultValue={
							config?.awards && config.awards.length > 0
								? "awards"
								: "resources"
						}
						className="w-full space-y-6"
					>
						<TabsList className="w-full justify-start h-auto p-0 bg-transparent border-b rounded-none gap-6">
							{config?.awards && config.awards.length > 0 && (
								<TabsTrigger
									value="awards"
									className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-2 py-3 text-base font-semibold flex items-center gap-2"
								>
									<Trophy className="w-4 h-4" />
									奖项设置
								</TabsTrigger>
							)}

							{((config?.resources?.tutorials &&
								config.resources.tutorials.length > 0) ||
								(config?.resources?.tools &&
									config.resources.tools.length > 0) ||
								(config?.resources?.examples &&
									config.resources.examples.length > 0)) && (
								<TabsTrigger
									value="resources"
									className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-2 py-3 text-base font-semibold flex items-center gap-2"
								>
									<BookOpen className="w-4 h-4" />
									学习资源
								</TabsTrigger>
							)}
						</TabsList>

						{/* Awards Tab */}
						{config?.awards && config.awards.length > 0 && (
							<TabsContent value="awards" className="mt-0">
								<AwardShowcase
									awards={config?.awards || []}
									eventId={event.id}
								/>
							</TabsContent>
						)}

						{/* Resources Tab */}
						{((config?.resources?.tutorials &&
							config.resources.tutorials.length > 0) ||
							(config?.resources?.tools &&
								config.resources.tools.length > 0) ||
							(config?.resources?.examples &&
								config.resources.examples.length > 0)) && (
							<TabsContent value="resources" className="mt-0">
								<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
									{/* Tutorials */}
									{config?.resources?.tutorials &&
										config.resources.tutorials.length >
											0 && (
											<Card className="h-full hover:shadow-md transition-shadow">
												<CardHeader>
													<CardTitle className="text-lg flex items-center gap-2">
														<BookOpen className="w-4 h-4 text-primary" />
														{t(
															"hackathon.resources.tutorials",
														)}
													</CardTitle>
													<CardDescription>
														{t(
															"hackathon.resources.tutorialsDesc",
														)}
													</CardDescription>
												</CardHeader>
												<CardContent className="space-y-3">
													{config.resources.tutorials.map(
														(
															tutorial: any,
															index: number,
														) => (
															<a
																key={index}
																href={
																	tutorial.url
																}
																target="_blank"
																rel="noopener noreferrer"
																className="block p-3 rounded-lg border bg-muted/30 hover:bg-accent transition-colors group"
															>
																<h4 className="font-medium text-sm group-hover:text-primary transition-colors">
																	{
																		tutorial.title
																	}
																</h4>
																{tutorial.description && (
																	<p className="text-xs text-muted-foreground mt-1 line-clamp-2">
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
									{config?.resources?.tools &&
										config.resources.tools.length > 0 && (
											<Card className="h-full hover:shadow-md transition-shadow">
												<CardHeader>
													<CardTitle className="text-lg flex items-center gap-2">
														<Code className="w-4 h-4 text-primary" />
														{t(
															"hackathon.resources.tools",
														)}
													</CardTitle>
													<CardDescription>
														{t(
															"hackathon.resources.toolsDesc",
														)}
													</CardDescription>
												</CardHeader>
												<CardContent className="space-y-3">
													{config.resources.tools.map(
														(
															tool: any,
															index: number,
														) => (
															<a
																key={index}
																href={tool.url}
																target="_blank"
																rel="noopener noreferrer"
																className="block p-3 rounded-lg border bg-muted/30 hover:bg-accent transition-colors group"
															>
																<h4 className="font-medium text-sm group-hover:text-primary transition-colors">
																	{tool.name}
																</h4>
																{tool.description && (
																	<p className="text-xs text-muted-foreground mt-1 line-clamp-2">
																		{
																			tool.description
																		}
																	</p>
																)}
															</a>
														),
													)}
												</CardContent>
											</Card>
										)}

									{/* Examples */}
									{config?.resources?.examples &&
										config.resources.examples.length >
											0 && (
											<Card className="h-full hover:shadow-md transition-shadow">
												<CardHeader>
													<CardTitle className="text-lg flex items-center gap-2">
														<LayoutGrid className="w-4 h-4 text-primary" />
														{t(
															"hackathon.resources.examples",
														)}
													</CardTitle>
													<CardDescription>
														{t(
															"hackathon.resources.examplesDesc",
														)}
													</CardDescription>
												</CardHeader>
												<CardContent className="space-y-3">
													{config.resources.examples.map(
														(
															example: any,
															index: number,
														) => (
															<a
																key={index}
																href={
																	example.url
																}
																target="_blank"
																rel="noopener noreferrer"
																className="block p-3 rounded-lg border bg-muted/30 hover:bg-accent transition-colors group"
															>
																<h4 className="font-medium text-sm group-hover:text-primary transition-colors">
																	{
																		example.title
																	}
																</h4>
																{example.description && (
																	<p className="text-xs text-muted-foreground mt-1 line-clamp-2">
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
							</TabsContent>
						)}
					</Tabs>
				)}
			</div>
		</>
	);
}
