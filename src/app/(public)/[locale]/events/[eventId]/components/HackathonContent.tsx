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
import { AwardShowcase } from "@/modules/dashboard/events/components/hackathon/AwardShowcase";
import {
	EventDescription,
	EventHero,
	EventInfoCard,
} from "@/modules/public/events/components";
import { BookOpen, Code, LayoutGrid, Target, Trophy } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
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
	const pathname = usePathname();
	const currentLocale = pathname?.split("/")?.[1] ?? "zh";

	// 使用 state 来存储当前时间，避免 hydration mismatch
	const [now, setNow] = useState<Date | null>(null);

	useEffect(() => {
		setNow(new Date());
	}, []);

	const config = event.hackathonConfig;
	const votingConfig = config?.voting;
	// 在客户端 mount 前，使用保守的默认值（false），避免 hydration mismatch
	const isEventStarted = now ? now >= new Date(event.startTime) : false;
	const isEventEnded = now
		? now >= new Date(event.endTime) || event.status === "COMPLETED"
		: event.status === "COMPLETED";
	const isRegistrationOpen = event.registrationOpen ?? true;

	const projectSubmissionList = projectSubmissions || [];
	const richContent = event.richContent || event.description || "";
	const publicSubmissionsUrl = `/${currentLocale}/events/${event.id}/submissions`;

	const getSubmissionOwnerId = (submission?: any) =>
		submission?.submitterId ||
		submission?.userId ||
		submission?.user?.id ||
		submission?.submitter?.id ||
		submission?.project?.user?.id ||
		null;

	// 查找当前用户的作品提交
	const userSubmission = projectSubmissions?.find(
		(p) => getSubmissionOwnerId(p) === currentUserId,
	);

	// 根据是否已提交作品，决定跳转URL
	const privateSubmissionUrl = userSubmission
		? `/app/events/${event.id}/submissions/${userSubmission.id}/edit`
		: `/app/events/${event.id}/submissions/new`;

	// Check if user is registered
	const userRegistration = event.registrations?.find(
		(reg) => reg.user.id === currentUserId && reg.status === "APPROVED",
	);
	const isUserRegistered = Boolean(userRegistration);

	const handleRegistrationClick = () => {
		if (isEventStarted || !isRegistrationOpen) {
			return;
		}
		handleRegister(onOpenRegistrationModal);
	};

	const isSubmissionOpen =
		(event.submissionsOpen ?? true) && isEventStarted && !isEventEnded;

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

			{/* Action Buttons */}
			<div className="flex flex-wrap gap-3 mb-8">
				<Link href={publicSubmissionsUrl}>
					<Button variant="outline" className="gap-2">
						<LayoutGrid className="w-4 h-4" />
						作品广场
						{projectSubmissionList.length > 0 && (
							<Badge variant="secondary" className="ml-1">
								{projectSubmissionList.length}
							</Badge>
						)}
					</Button>
				</Link>

				{isSubmissionOpen && (
					<Button asChild className="gap-2">
						<Link href={privateSubmissionUrl}>
							<Target className="w-4 h-4" />
							{userSubmission ? "我的作品" : "提交作品"}
						</Link>
					</Button>
				)}
			</div>

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
