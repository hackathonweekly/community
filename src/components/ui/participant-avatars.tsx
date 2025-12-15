"use client";

import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ParticipantInterestButton } from "@/modules/public/events/components/participant-interest-button";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { UserSlideDeckModal } from "@/modules/public/shared/components/UserSlideDeck";
import {
	createParticipantSlideDeckUser,
	type ParticipantUser,
	type ProjectSubmission,
} from "@/modules/public/shared/components/UserSlideDeckUtils";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import {
	PresentationChartBarIcon,
	IdentificationIcon,
} from "@heroicons/react/24/outline";
import { DigitalBusinessCardGallery } from "@/components/ui/digital-business-card-gallery";
import type { DigitalBusinessCardData } from "@/components/ui/digital-business-card";
import { Badge } from "@/components/ui/badge";
import { UsersIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import Image from "next/image";

interface Participant extends ParticipantUser {
	status: string;
	registeredAt: string;
	allowDigitalCardDisplay?: boolean;
	user: ParticipantUser;
}

interface ParticipantAvatarsProps {
	participants: Participant[];
	totalCount: number;
	eventId?: string; // 新增：活动ID，用于感兴趣功能
	currentUserId?: string; // 新增：当前用户ID，用于感兴趣功能
	showInterestButtons?: boolean; // 新增：是否显示感兴趣按钮
	projectSubmissions?: ProjectSubmission[]; // 新增：项目提交数据
	requireAuth?: boolean;
	onRequireAuth?: () => void;
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
}

export function ParticipantAvatars({
	participants,
	totalCount,
	eventId,
	currentUserId,
	showInterestButtons = false,
	projectSubmissions = [],
	requireAuth = false,
	onRequireAuth,
	open,
	onOpenChange,
}: ParticipantAvatarsProps) {
	const t = useTranslations();
	const [isDialogOpen, setIsDialogOpen] = useState(open ?? false);
	const [isSlideOpen, setIsSlideOpen] = useState(false);
	const [isCardGalleryOpen, setIsCardGalleryOpen] = useState(false);
	const [checkedInUserIds, setCheckedInUserIds] = useState<Set<string>>(
		new Set(),
	);
	const [currentPage, setCurrentPage] = useState(1);
	const [viewType, setViewType] = useState<"participants" | "projects">(
		"participants",
	); // 新增：视图类型状态
	const [searchTerm, setSearchTerm] = useState(""); // 新增：搜索关键词状态
	const ITEMS_PER_PAGE = 12; // 增加每页显示数量

	const confirmedParticipants = participants.filter(
		(reg) => reg.status === "APPROVED",
	);

	useEffect(() => {
		if (typeof open === "boolean") {
			setIsDialogOpen(open);
		}
	}, [open]);

	// 重置搜索和分页状态
	const handleDialogChange = (openState: boolean) => {
		if (openState && requireAuth && !currentUserId) {
			onRequireAuth?.();
			onOpenChange?.(false);
			return;
		}
		if (openState) {
			setSearchTerm(""); // 打开弹窗时重置搜索
			setCurrentPage(1); // 重置到第一页
		}
		if (typeof open !== "boolean") {
			setIsDialogOpen(openState);
		}
		onOpenChange?.(openState);
	};

	useEffect(() => {
		if (!isSlideOpen || !eventId) {
			return;
		}

		let cancelled = false;
		setCheckedInUserIds(new Set());

		const loadCheckIns = async () => {
			try {
				const response = await fetch(`/api/events/${eventId}/checkin`, {
					credentials: "include",
				});
				if (!response.ok) {
					throw new Error("Failed to fetch event check-ins");
				}
				const result = await response.json();
				const ids = new Set<string>();
				if (Array.isArray(result.data)) {
					for (const entry of result.data) {
						const userId = entry?.user?.id;
						if (userId) {
							ids.add(userId);
						}
					}
				}
				if (!cancelled) {
					setCheckedInUserIds(ids);
				}
			} catch (error) {
				console.error("Failed to load event check-ins", error);
				if (!cancelled) {
					setCheckedInUserIds(new Set());
				}
			}
		};

		void loadCheckIns();

		return () => {
			cancelled = true;
		};
	}, [isSlideOpen, eventId]);

	// 搜索过滤逻辑
	const filteredParticipants = useMemo(() => {
		if (!searchTerm.trim()) {
			return confirmedParticipants;
		}

		const searchLower = searchTerm.toLowerCase();
		return confirmedParticipants.filter((participant) => {
			const name = participant.user.name?.toLowerCase() || "";
			const username = participant.user.username?.toLowerCase() || "";
			const bio = participant.user.bio?.toLowerCase() || "";
			const userRoleString =
				participant.user.userRoleString?.toLowerCase() || "";
			const currentWorkOn =
				participant.user.currentWorkOn?.toLowerCase() || "";

			return (
				name.includes(searchLower) ||
				username.includes(searchLower) ||
				bio.includes(searchLower) ||
				userRoleString.includes(searchLower) ||
				currentWorkOn.includes(searchLower)
			);
		});
	}, [confirmedParticipants, searchTerm]);

	// 分页逻辑
	const { totalPages, currentPageData } = useMemo(() => {
		const total = Math.ceil(filteredParticipants.length / ITEMS_PER_PAGE);
		const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
		const endIndex = startIndex + ITEMS_PER_PAGE;
		const data = filteredParticipants.slice(startIndex, endIndex);

		return {
			totalPages: total,
			currentPageData: data,
		};
	}, [filteredParticipants, currentPage]);

	// Show first 5 avatars
	const displayAvatars = confirmedParticipants.slice(0, 5);
	const remainingCount = Math.max(0, confirmedParticipants.length - 5);

	const slideUsers = useMemo(() => {
		const filtered = confirmedParticipants
			// Only include users who explicitly allowed their digital card to be displayed
			.filter((participant) => {
				// Only include users who explicitly agreed to screen display (allowDigitalCardDisplay === true)
				// If allowDigitalCardDisplay is null/undefined (not asked) or false (declined), exclude the user
				return participant.allowDigitalCardDisplay === true;
			});

		return filtered.map((participant) => {
			// 创建带有签到状态的用户对象
			const userWithCheckIn: ParticipantUser = {
				...participant.user,
				checkedIn: checkedInUserIds.has(participant.user.id),
			};

			return createParticipantSlideDeckUser(
				userWithCheckIn,
				projectSubmissions,
			);
		});
	}, [confirmedParticipants, checkedInUserIds, projectSubmissions]);

	// Prepare digital business card users
	const cardUsers = useMemo(() => {
		return confirmedParticipants.map(
			(participant): DigitalBusinessCardData => ({
				id: participant.user.id,
				name: participant.user.name,
				username: participant.user.username,
				image: participant.user.image,
				userRoleString: participant.user.userRoleString,
				currentWorkOn: participant.user.currentWorkOn,
				lifeStatus: participant.user.lifeStatus,
				region: participant.user.region,
			}),
		);
	}, [confirmedParticipants]);

	if (confirmedParticipants.length === 0) {
		return null;
	}

	return (
		<div className="pt-2 border-t">
			<div className="mt-2 flex items-center gap-2">
				<div className="flex -space-x-2">
					{displayAvatars.map((participant, index) => (
						<div
							key={participant.user.id}
							className="relative"
							style={{ zIndex: displayAvatars.length - index }}
						>
							<UserAvatar
								name={participant.user.name}
								avatarUrl={participant.user.image}
								className="h-8 w-8 border border-gray-200 ring-2 ring-white"
							/>
						</div>
					))}
					{remainingCount > 0 && (
						<div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-gray-100 text-xs font-medium text-gray-600">
							+{remainingCount}
						</div>
					)}
				</div>

				<div className="flex gap-2">
					<Dialog
						open={isDialogOpen}
						onOpenChange={handleDialogChange}
					>
						<DialogTrigger asChild>
							<Button
								variant="outline"
								size="sm"
								className="ml-2 text-xs"
								onClick={() => setViewType("participants")}
							>
								{t("events.viewAll")}
							</Button>
						</DialogTrigger>
						{projectSubmissions.length > 0 && (
							<DialogTrigger asChild>
								<Button
									variant="outline"
									size="sm"
									className="text-xs"
									onClick={() => setViewType("projects")}
								>
									{t("events.viewParticipantProjects")}
								</Button>
							</DialogTrigger>
						)}

						<DialogContent
							className={
								viewType === "projects"
									? "max-w-4xl max-h-[80vh] overflow-y-auto"
									: "max-w-2xl max-h-[85vh] overflow-hidden flex flex-col"
							}
							onOpenAutoFocus={(e) => e.preventDefault()}
						>
							<DialogHeader>
								<DialogTitle>
									{viewType === "participants"
										? `${t("events.participants")} (${totalCount || confirmedParticipants.length})`
										: t("events.participantProjects")}
								</DialogTitle>
							</DialogHeader>

							{viewType === "participants" ? (
								<>
									{/* 搜索框 */}
									<div className="mb-4 sticky top-0 bg-background z-20 pb-2">
										<div className="relative">
											<MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
											<Input
												placeholder="搜索成员姓名、简介、技能等..."
												value={searchTerm}
												onChange={(e) => {
													setSearchTerm(
														e.target.value,
													);
													setCurrentPage(1); // 重置到第一页
												}}
												className="pl-10"
											/>
										</div>
										{searchTerm && (
											<div className="mt-2 text-sm text-muted-foreground">
												找到{" "}
												{filteredParticipants.length}{" "}
												位成员
											</div>
										)}
									</div>

									<div className="flex-1 overflow-y-auto">
										<div className="sticky top-0 z-10 bg-background pb-3">
											<div className="flex items-center justify-between gap-3 rounded-lg border border-dashed border-primary/40 bg-primary/10 p-3">
												<div className="min-w-0">
													<p className="text-sm font-medium text-primary">
														查看数字名片集
													</p>
													<p className="mt-1 text-xs text-primary/80">
														快速认识伙伴，组队做
														MVP！
													</p>
												</div>
												<div className="flex gap-2">
													<Button
														variant="outline"
														size="sm"
														onClick={() => {
															setIsCardGalleryOpen(
																true,
															);
															handleDialogChange(
																false,
															);
														}}
													>
														<IdentificationIcon className="mr-1 h-4 w-4" />
														查看数字名片集
													</Button>
													<Button
														variant="outline"
														size="sm"
														onClick={() => {
															setIsSlideOpen(
																true,
															);
															handleDialogChange(
																false,
															);
														}}
														className="hidden md:flex"
													>
														<PresentationChartBarIcon className="mr-1 h-4 w-4" />
														PPT 模式
													</Button>
												</div>
											</div>
										</div>

										<div className="mt-4 space-y-3 pr-1">
											{currentPageData.map(
												(participant) => (
													<div
														key={
															participant.user.id
														}
														className="group relative flex items-center gap-3 rounded-lg border p-3 transition-all hover:bg-blue-50/50 hover:border-blue-200 hover:shadow-sm cursor-pointer"
														onClick={() => {
															window.open(
																`/u/${participant.user.username || participant.user.id}`,
																"_blank",
															);
														}}
														title={`查看 ${participant.user.name} 的个人主页`}
													>
														<div className="flex-shrink-0">
															<UserAvatar
																name={
																	participant
																		.user
																		.name
																}
																avatarUrl={
																	participant
																		.user
																		.image
																}
																className="h-10 w-10 transition-all group-hover:ring-2 group-hover:ring-blue-300"
															/>
														</div>

														<div className="min-w-0 flex-1">
															<h4 className="truncate text-sm font-medium group-hover:text-blue-600 transition-colors">
																{
																	participant
																		.user
																		.name
																}
															</h4>
															<div className="truncate text-xs text-muted-foreground">
																{participant
																	.user
																	.userRoleString && (
																	<span>
																		{
																			participant
																				.user
																				.userRoleString
																		}
																	</span>
																)}
																{participant
																	.user
																	.userRoleString &&
																	participant
																		.user
																		.currentWorkOn && (
																		<span>
																			{
																				" · "
																			}
																		</span>
																	)}
																{participant
																	.user
																	.currentWorkOn && (
																	<span>
																		{
																			participant
																				.user
																				.currentWorkOn
																		}
																	</span>
																)}
															</div>
															{participant.user
																.bio && (
																<div className="mt-1 line-clamp-2 text-xs text-muted-foreground">
																	{
																		participant
																			.user
																			.bio
																	}
																</div>
															)}
														</div>

														{showInterestButtons &&
															eventId &&
															currentUserId &&
															participant.user
																.id !==
																currentUserId && (
																<div
																	className="flex-shrink-0 relative"
																	onClick={(
																		e,
																	) =>
																		e.stopPropagation()
																	}
																>
																	<ParticipantInterestButton
																		eventId={
																			eventId
																		}
																		targetUserId={
																			participant
																				.user
																				.id
																		}
																		size="sm"
																	/>
																</div>
															)}
													</div>
												),
											)}
										</div>
									</div>

									{totalPages > 1 && (
										<div className="flex items-center justify-between border-t pt-4">
											<div className="text-sm text-muted-foreground">
												第 {currentPage} 页，共{" "}
												{totalPages} 页
											</div>
											<div className="flex gap-2">
												<Button
													variant="outline"
													size="sm"
													disabled={currentPage === 1}
													onClick={() =>
														setCurrentPage(
															(prev) => prev - 1,
														)
													}
												>
													上一页
												</Button>
												<Button
													variant="outline"
													size="sm"
													disabled={
														currentPage ===
														totalPages
													}
													onClick={() =>
														setCurrentPage(
															(prev) => prev + 1,
														)
													}
												>
													下一页
												</Button>
											</div>
										</div>
									)}
								</>
							) : (
								<div className="space-y-4">
									{projectSubmissions.map((submission) => (
										<ProjectCard
											key={submission.id}
											submission={submission}
										/>
									))}
								</div>
							)}
						</DialogContent>
					</Dialog>
				</div>
			</div>

			<UserSlideDeckModal
				open={isSlideOpen}
				onOpenChange={setIsSlideOpen}
				users={slideUsers}
				headerLabel="活动参与者 · Slide 模式"
				closingNote="活动参与者介绍完成"
				closingSubNote="感谢观看，欢迎继续和现场的伙伴交流"
				enableCheckInFilter={Boolean(eventId)}
			/>

			<DigitalBusinessCardGallery
				users={cardUsers}
				open={isCardGalleryOpen}
				onOpenChange={setIsCardGalleryOpen}
			/>
		</div>
	);
}

function ProjectCard({ submission }: { submission: ProjectSubmission }) {
	const t = useTranslations();
	const { project } = submission;

	const getStageColor = (stage: string) => {
		switch (stage) {
			case "IDEA_VALIDATION":
				return "bg-yellow-100 text-yellow-800";
			case "PROTOTYPING":
				return "bg-blue-100 text-blue-800";
			case "MVP":
				return "bg-purple-100 text-purple-800";
			case "LAUNCHED":
				return "bg-green-100 text-green-800";
			case "GROWTH":
				return "bg-indigo-100 text-indigo-800";
			default:
				return "bg-gray-100 text-gray-800";
		}
	};

	const getStageText = (stage: string) => {
		switch (stage) {
			case "DEVELOPMENT":
				return t("projects.stage.development");
			case "IDEA_VALIDATION":
				return t("projects.stage.ideaValidation");
			case "PROTOTYPING":
				return t("projects.stage.prototyping");
			case "MVP":
				return t("projects.stage.mvp");
			case "LAUNCHED":
				return t("projects.stage.launched");
			case "GROWTH":
				return t("projects.stage.growth");
			default:
				return stage;
		}
	};

	return (
		<div
			className="group relative flex items-center gap-2 sm:gap-3 rounded-lg border p-2 sm:p-3 transition-all hover:bg-blue-50/50 hover:border-blue-200 hover:shadow-sm cursor-pointer w-full min-w-0"
			onClick={() => window.open(`/projects/${project.id}`, "_blank")}
			title={`查看 ${project.title} 详情`}
		>
			{/* Project thumbnail */}
			<div className="flex-shrink-0">
				{project.screenshots && project.screenshots.length > 0 ? (
					<div className="relative w-12 h-9 sm:w-16 sm:h-12 bg-muted rounded-lg overflow-hidden group-hover:ring-2 group-hover:ring-blue-200 transition-all">
						<Image
							src={project.screenshots[0]}
							alt={project.title}
							fill
							className="object-cover"
						/>
					</div>
				) : (
					<div className="w-12 h-9 sm:w-16 sm:h-12 bg-muted rounded-lg flex items-center justify-center group-hover:ring-2 group-hover:ring-blue-200 transition-all">
						<UsersIcon className="w-4 h-4 sm:w-6 sm:h-6 text-muted-foreground" />
					</div>
				)}
			</div>

			{/* Project content */}
			<div className="min-w-0 flex-1 overflow-hidden">
				{/* Title and subtitle */}
				<div className="mb-1">
					<h3 className="font-medium text-sm line-clamp-1 mb-0.5 leading-tight group-hover:text-blue-600 transition-colors">
						{project.title}
					</h3>
					{project.subtitle && (
						<p className="text-xs text-muted-foreground line-clamp-1 leading-tight">
							{project.subtitle}
						</p>
					)}
				</div>

				{/* Creator and stage info - mobile optimized */}
				<div className="flex items-center justify-between gap-1 sm:gap-2">
					<div className="flex items-center gap-1 sm:gap-2 min-w-0 flex-1">
						<div className="flex items-center gap-1">
							{project.user.image ? (
								<Image
									src={project.user.image}
									alt={project.user.name}
									width={14}
									height={14}
									className="rounded-full"
								/>
							) : (
								<div className="w-3.5 h-3.5 rounded-full bg-muted flex items-center justify-center text-[8px] font-medium">
									{project.user.name.charAt(0).toUpperCase()}
								</div>
							)}
							<span className="text-xs text-muted-foreground truncate">
								{project.user.name}
							</span>
						</div>
						<Badge
							variant="secondary"
							className={`text-xs px-1 py-0.5 flex-shrink-0 ${getStageColor(project.stage)}`}
						>
							{getStageText(project.stage)}
						</Badge>
					</div>

					{/* Action button - mobile optimized */}
					<Button
						variant="ghost"
						size="sm"
						onClick={(e) => {
							e.stopPropagation();
							window.open(`/projects/${project.id}`, "_blank");
						}}
						className="text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 h-6 px-1.5 sm:px-2 flex-shrink-0 ml-1"
					>
						<span className="hidden sm:inline">
							{t("projects.viewProject")}
						</span>
						<span className="sm:hidden">查看</span>
					</Button>
				</div>
			</div>
		</div>
	);
}
