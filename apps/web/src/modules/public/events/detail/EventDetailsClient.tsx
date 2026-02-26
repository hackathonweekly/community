"use client";

import {
	type TouchEvent,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { useTranslations } from "next-intl";

import { QRGenerator } from "@shared/events/components/QRGenerator";
import { EventShareModal } from "@shared/events/components/EventShareModal";
import { EventRegistrationModal } from "@/modules/public/events/components";
import ContactOrganizerDialog from "@/modules/public/events/components/ContactOrganizerDialog";
import { SimpleEventFeedbackDialog } from "@/modules/public/events/components/SimpleEventFeedbackDialog";
import { RegistrationSuccessModal } from "@/modules/public/events/components/registration-success-modal";

import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@community/ui/ui/tabs";
import { UserAvatar } from "@community/ui/shared/UserAvatar";
import { Badge } from "@community/ui/ui/badge";
import { EventActionSidebar } from "./components/EventActionSidebar";
import { Hero } from "./components/Hero";
import { OrganizationCard } from "./components/OrganizationCard";
import { OrganizerCard } from "./components/OrganizerCard";
import { MobileCTA } from "./components/common/MobileCTA";
import { getEventTypeLabels } from "./components/utils";
import { AlbumSection } from "./components/sections/AlbumSection";
import { AwardsSection } from "./components/sections/AwardsSection";
import { HostsSection } from "./components/sections/HostsSection";
import { IntroSection } from "./components/sections/IntroSection";
import { ParticipantsSection } from "./components/sections/ParticipantsSection";
import { VolunteersSection } from "./components/sections/VolunteersSection";
import { WorksSection } from "./components/sections/WorksSection";
import { SectionCard } from "./components/common/SectionCard";
import type { EventData } from "./components/types";
import { useEventDetailsState } from "./hooks/useEventDetailsState";
import { useEventActions } from "./hooks/useEventActions";

export interface EventDetailsProps {
	event: EventData;
}

type EventDetailsClientProps = {
	event: EventData;
	locale?: string;
};

const TAB_TRIGGER_CLASS =
	"relative flex-none !rounded-none !border-none !bg-transparent !shadow-none px-2 py-3.5 text-[15px] sm:text-sm font-medium text-muted-foreground hover:text-foreground data-[state=active]:text-foreground data-[state=active]:font-bold transition-colors after:absolute after:bottom-0 after:left-2 after:right-2 after:h-[2px] after:bg-foreground after:scale-x-0 data-[state=active]:after:scale-x-100 after:transition-transform after:origin-center";
const SWIPE_MIN_DISTANCE = 48;
const SWIPE_MAX_VERTICAL_OFFSET = 72;
const SWIPE_IGNORE_SELECTOR =
	"input, textarea, select, button, a, [role='button'], [data-slot='tabs-list'], [data-swipe-ignore='true']";

export function EventDetailsClient({
	event,
	locale = "zh",
}: EventDetailsClientProps) {
	const t = useTranslations();
	const eventIdentifier = event.shortId || event.id;
	const state = useEventDetailsState(event, locale);
	const actions = useEventActions(event, state);
	const [showShareModal, setShowShareModal] = useState(false);

	const {
		user,
		showWorks,
		projectSubmissions,
		photos,
		isBookmarked,
		isLiked,
		likeCount,
		userFeedback,
		hasSubmittedFeedback,
		existingRegistration,
		// Modal state
		showRegistrationForm,
		setShowRegistrationForm,
		showSuccessInfo,
		setShowSuccessInfo,
		showQRGenerator,
		setShowQRGenerator,
		isContactDialogOpen,
		setIsContactDialogOpen,
		isFeedbackDialogOpen,
		setIsFeedbackDialogOpen,
		inviteCode,
		latestRegistration,
		setLatestRegistration,
		activeTab,
		setActiveTab,
		tabsRef,
		// Derived
		hasImportantInfo,
		registerLabelDisplay,
		registerDisabledDisplay,
		awards,
		resourcesGroups,
		volunteerRoles,
		volunteerStatuses,
		hasVolunteerSection,
		canCancel,
		canContactOrganizer,
		canShowFeedback,
		// Helpers
		redirectToLogin,
	} = state;

	const {
		handleRegister,
		handleSubmitWork,
		handleRegistrationComplete,
		handleShowSuccessInfo,
		handleCancelRegistration,
		handleVolunteerApply,
		handleFeedbackSubmit,
		handleBookmark,
		handleLike,
		handleOpenContact,
		handleOpenFeedback,
		handleViewParticipants,
		handleShareCopyLink,
	} = actions;

	// Participant data for header meta row
	const eventTypeLabels = getEventTypeLabels(t);
	const approvedRegs = (event.registrations ?? []).filter(
		(reg) => reg.status === "APPROVED",
	);
	const participantCount = approvedRegs.length;
	const displayAvatars = approvedRegs.slice(0, 4);
	const remainingParticipants = Math.max(
		0,
		participantCount - displayAvatars.length,
	);
	const remainingSeats = event.maxAttendees
		? Math.max(0, event.maxAttendees - participantCount)
		: null;
	const tags = event.tags ?? [];
	const tabsHeaderRef = useRef<HTMLDivElement | null>(null);
	const touchStartRef = useRef<{ x: number; y: number } | null>(null);
	const touchStartTabRef = useRef(activeTab);
	const tabOrder = useMemo(() => {
		const orderedTabs = ["intro"];
		if (showWorks) {
			orderedTabs.push("works");
		}
		orderedTabs.push("participants", "organizer", "disclaimer");
		return orderedTabs;
	}, [showWorks]);

	useEffect(() => {
		touchStartTabRef.current = activeTab;
	}, [activeTab]);

	useEffect(() => {
		const activeTrigger = tabsHeaderRef.current?.querySelector<HTMLElement>(
			'[role="tab"][data-state="active"]',
		);
		activeTrigger?.scrollIntoView({
			behavior: "smooth",
			inline: "center",
			block: "nearest",
		});
	}, [activeTab]);

	const shouldIgnoreSwipeTarget = useCallback(
		(target: EventTarget | null) => {
			if (!(target instanceof HTMLElement)) {
				return false;
			}

			if (target.closest(SWIPE_IGNORE_SELECTOR)) {
				return true;
			}

			let node: HTMLElement | null = target;
			while (node) {
				const style = window.getComputedStyle(node);
				const canScrollHorizontally =
					(style.overflowX === "auto" ||
						style.overflowX === "scroll") &&
					node.scrollWidth > node.clientWidth + 1;

				if (canScrollHorizontally) {
					return true;
				}

				node = node.parentElement;
			}

			return false;
		},
		[],
	);

	const handleContentTouchStart = useCallback(
		(event: TouchEvent<HTMLDivElement>) => {
			if (
				event.touches.length !== 1 ||
				shouldIgnoreSwipeTarget(event.target)
			) {
				touchStartRef.current = null;
				return;
			}

			const touch = event.touches[0];
			touchStartRef.current = { x: touch.clientX, y: touch.clientY };
			touchStartTabRef.current = activeTab;
		},
		[activeTab, shouldIgnoreSwipeTarget],
	);

	const handleContentTouchEnd = useCallback(
		(event: TouchEvent<HTMLDivElement>) => {
			if (event.changedTouches.length !== 1 || !touchStartRef.current) {
				return;
			}

			const { x, y } = touchStartRef.current;
			touchStartRef.current = null;

			const touch = event.changedTouches[0];
			const deltaX = touch.clientX - x;
			const deltaY = touch.clientY - y;

			if (
				Math.abs(deltaX) < SWIPE_MIN_DISTANCE ||
				Math.abs(deltaY) > SWIPE_MAX_VERTICAL_OFFSET ||
				Math.abs(deltaX) <= Math.abs(deltaY)
			) {
				return;
			}

			const currentIndex = tabOrder.indexOf(touchStartTabRef.current);
			if (currentIndex === -1) {
				return;
			}

			const direction = deltaX > 0 ? -1 : 1;
			const nextIndex = currentIndex + direction;
			if (nextIndex < 0 || nextIndex >= tabOrder.length) {
				return;
			}

			setActiveTab(tabOrder[nextIndex]);
		},
		[setActiveTab, tabOrder],
	);

	return (
		<div className="min-h-screen bg-background pb-20 lg:pb-0">
			<Hero
				event={event}
				locale={locale}
				registerLabel={registerLabelDisplay}
				onRegister={handleRegister}
				canCancel={canCancel}
				onCancel={handleCancelRegistration}
				onShare={() => setShowShareModal(true)}
				onToggleBookmark={handleBookmark}
				onToggleLike={handleLike}
				isBookmarked={isBookmarked}
				isLiked={isLiked}
				likeCount={likeCount}
				registerDisabled={registerDisabledDisplay}
				isEventAdmin={event.isEventAdmin}
				eventId={eventIdentifier}
				onContact={handleOpenContact}
				onFeedback={handleOpenFeedback}
				onShowSuccessInfo={handleShowSuccessInfo}
				canContact={canContactOrganizer}
				canFeedback={canShowFeedback}
				hasImportantInfo={hasImportantInfo}
			/>

			<div className="mx-auto max-w-7xl px-4 py-6 lg:px-8">
				<div className="relative grid grid-cols-1 gap-8 lg:grid-cols-12">
					{/* Left Column: Header + Content */}
					<div className="lg:col-span-8 space-y-3 lg:space-y-4">
						{/* Header: Badges + Title + Description */}
						<div className="pb-4 border-b border-border/40">
							<div className="mb-2 flex flex-wrap items-center gap-2">
								<Badge
									variant={
										event.isOnline ? "info" : "secondary"
									}
								>
									{event.isOnline ? "线上" : "线下"}
								</Badge>
								<Badge variant="outline">
									{eventTypeLabels[event.type] || event.type}
								</Badge>
								{tags.map((tag) => (
									<Badge key={tag} variant="outline">
										{tag}
									</Badge>
								))}
							</div>
							<h1 className="mb-2 mt-2 font-brand text-2xl sm:text-3xl font-bold leading-tight tracking-tight text-foreground lg:text-4xl">
								{event.title}
							</h1>
							{event.description ? (
								<p className="max-w-2xl text-base leading-relaxed text-muted-foreground line-clamp-3">
									{event.description
										.replace(/<[^>]*>/g, "")
										.slice(0, 200)}
								</p>
							) : null}
						</div>

						{/* Banner Image */}
						{event.coverImage ? (
							<div className="overflow-hidden rounded-xl border border-border shadow-sm">
								<img
									src={event.coverImage}
									alt={event.title}
									className="h-48 w-full object-cover lg:h-72"
								/>
							</div>
						) : null}

						{/* Meta Row: Organizer + Participants */}
						<div className="flex items-center gap-3 rounded-lg border border-border/40 bg-muted/20 p-2.5">
							<UserAvatar
								name={event.organizer?.name ?? ""}
								avatarUrl={
									event.organizer?.image ??
									event.organization?.logo
								}
								className="h-10 w-10 border border-border"
							/>
							<div className="flex-1">
								<div className="text-sm font-bold text-foreground">
									{event.organization?.name ||
										event.organizer?.name}
								</div>
								<div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
									{t("events.organizer")}
								</div>
							</div>
							<button
								type="button"
								onClick={handleViewParticipants}
								className="flex items-center gap-2 transition-opacity hover:opacity-80"
							>
								{displayAvatars.length > 0 ? (
									<div className="flex -space-x-2">
										{displayAvatars.map((reg, index) => (
											<div
												key={reg.id}
												className="relative"
												style={{
													zIndex:
														displayAvatars.length -
														index,
												}}
											>
												<UserAvatar
													name={reg.user.name}
													avatarUrl={reg.user.image}
													className="h-8 w-8 border-2 border-background"
													fallbackClassName="bg-muted text-foreground"
												/>
											</div>
										))}
										{remainingParticipants > 0 ? (
											<div className="relative z-0 flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-muted text-[9px] font-bold text-muted-foreground">
												+{remainingParticipants}
											</div>
										) : null}
									</div>
								) : null}
								<div className="hidden text-right sm:block">
									<div className="text-xs font-bold text-foreground">
										{participantCount} 人已报名
									</div>
									{remainingSeats !== null ? (
										<div className="text-[10px] text-muted-foreground">
											剩余 {remainingSeats} 个名额
										</div>
									) : null}
								</div>
							</button>
						</div>

						{/* Tabs + Content */}
						<div
							ref={tabsRef}
							className="scroll-mt-24 min-h-[100vh]"
						>
							<Tabs
								value={activeTab}
								onValueChange={setActiveTab}
								className="w-full"
							>
								<div
									ref={tabsHeaderRef}
									className="sticky top-12 z-30 -mx-4 bg-background/95 px-4 pt-2 pb-0 backdrop-blur md:mx-0 md:px-0 md:pt-2 border-b border-border/30"
								>
									<TabsList className="w-full justify-start overflow-x-auto overflow-y-hidden rounded-none bg-transparent p-0 border-none gap-4 md:gap-6 md:w-full h-auto">
										<TabsTrigger
											value="intro"
											className={TAB_TRIGGER_CLASS}
										>
											介绍
										</TabsTrigger>
										{showWorks && (
											<TabsTrigger
												value="works"
												className={TAB_TRIGGER_CLASS}
											>
												作品
												{projectSubmissions?.length ? (
													<span className="ml-1.5 rounded-full bg-foreground px-2 py-0.5 text-[10px] leading-none text-background">
														{
															projectSubmissions.length
														}
													</span>
												) : null}
											</TabsTrigger>
										)}
										<TabsTrigger
											value="participants"
											className={TAB_TRIGGER_CLASS}
										>
											报名者
										</TabsTrigger>
										<TabsTrigger
											value="organizer"
											className={TAB_TRIGGER_CLASS}
										>
											主办方
										</TabsTrigger>
										<TabsTrigger
											value="disclaimer"
											className={TAB_TRIGGER_CLASS}
										>
											免责声明
										</TabsTrigger>
									</TabsList>
								</div>

								<div
									className="touch-pan-y"
									onTouchStart={handleContentTouchStart}
									onTouchEnd={handleContentTouchEnd}
								>
									<TabsContent
										value="intro"
										className="space-y-8 focus:outline-none mt-2 md:mt-4"
									>
										<IntroSection event={event} />

										{(awards.length > 0 ||
											resourcesGroups.length > 0) && (
											<AwardsSection
												awards={awards}
												resourcesGroups={
													resourcesGroups
												}
											/>
										)}

										{photos.length > 0 && (
											<AlbumSection
												photos={photos}
												locale={locale}
												eventId={eventIdentifier}
											/>
										)}
									</TabsContent>

									{showWorks && (
										<TabsContent
											value="works"
											className="focus:outline-none mt-2 md:mt-4"
										>
											<WorksSection
												projectSubmissions={
													projectSubmissions
												}
												locale={locale}
												eventId={eventIdentifier}
												userId={user?.id}
												onRequireLogin={redirectToLogin}
												onSubmitWork={handleSubmitWork}
												enabled={showWorks}
											/>
										</TabsContent>
									)}

									{hasVolunteerSection && (
										<TabsContent
											value="volunteers"
											className="focus:outline-none mt-2 md:mt-4"
										>
											<VolunteersSection
												event={event}
												volunteerRoles={volunteerRoles}
												volunteerStatuses={
													volunteerStatuses
												}
												onApply={handleVolunteerApply}
											/>
										</TabsContent>
									)}

									<TabsContent
										value="participants"
										className="focus:outline-none mt-2 md:mt-4"
									>
										<ParticipantsSection
											event={event}
											currentUserId={user?.id}
											onRequireLogin={() =>
												redirectToLogin()
											}
										/>
									</TabsContent>

									<TabsContent
										value="organizer"
										className="focus:outline-none mt-2 md:mt-4"
									>
										<HostsSection
											event={event}
											canContactOrganizer={
												canContactOrganizer
											}
										/>
									</TabsContent>

									<TabsContent
										value="disclaimer"
										className="focus:outline-none mt-2 md:mt-4"
									>
										<SectionCard
											id="disclaimer"
											title="免责声明"
										>
											<div className="space-y-4 text-sm leading-6 text-muted-foreground">
												<p>
													参加周周黑客松组织的活动，即表示您进入了一个可能会进行摄影、音频和视频直播和/或录制的区域。
												</p>
												<p>
													您参加和出席此类活动即表示您同意被拍照、摄像（包括现场直播）和/或以其他方式录制，并同意出于与周周黑客松社区倡议有关的任何目的，发布、出版、展示或复制任何及所有录制有您的外表、声音和姓名的媒体。
												</p>
												<p>
													参加该活动即表示您放弃并解除与在活动中使用您的此类媒体相关的任何权利主张。
												</p>
												<p>
													如不希望被拍摄，请在活动开始前提前与主办方沟通说明。
												</p>
											</div>
										</SectionCard>
									</TabsContent>
								</div>
							</Tabs>
						</div>
					</div>

					{/* Right Column: Sticky Sidebar */}
					<div className="hidden lg:col-span-4 lg:block relative">
						<div className="sticky top-16 flex flex-col gap-6 max-h-[calc(100vh-5rem)] overflow-y-auto">
							<EventActionSidebar
								event={event}
								locale={locale}
								registerLabel={registerLabelDisplay}
								onRegister={() => handleRegister()}
								onSubmitWork={handleSubmitWork}
								showWorksButton={
									showWorks &&
									existingRegistration?.status === "APPROVED"
								}
								canCancel={canCancel}
								onCancel={handleCancelRegistration}
								onShare={() => setShowShareModal(true)}
								onToggleBookmark={handleBookmark}
								onToggleLike={handleLike}
								isBookmarked={isBookmarked}
								isLiked={isLiked}
								likeCount={likeCount}
								registerDisabled={registerDisabledDisplay}
								isEventAdmin={event.isEventAdmin}
								eventId={eventIdentifier}
								onContact={handleOpenContact}
								onFeedback={handleOpenFeedback}
								onShowSuccessInfo={handleShowSuccessInfo}
								canContact={canContactOrganizer}
								canFeedback={canShowFeedback}
								hasImportantInfo={hasImportantInfo}
							/>
							{event.organization ? (
								<>
									<OrganizationCard
										title={t("events.organization")}
										organization={event.organization}
									/>
									<OrganizerCard
										title={t("events.organizer")}
										organizer={event.organizer}
										showSubscription={false}
									/>
								</>
							) : (
								<OrganizerCard
									title={t("events.organizer")}
									organizer={event.organizer}
								/>
							)}
						</div>
					</div>
				</div>
			</div>

			<MobileCTA
				locale={locale}
				eventId={eventIdentifier}
				isEventAdmin={event.isEventAdmin}
				submissionsEnabled={showWorks}
				registerLabel={registerLabelDisplay}
				onRegister={() =>
					handleRegister(() => setShowRegistrationForm(true))
				}
				onShowSuccessInfo={handleShowSuccessInfo}
				onCancel={handleCancelRegistration}
				onShare={() => setShowShareModal(true)}
				onFeedback={handleOpenFeedback}
				onContact={handleOpenContact}
				onShowQR={() => setShowQRGenerator(true)}
				canCancel={canCancel}
				hasPhotos={photos.length > 0}
				registerDisabled={registerDisabledDisplay}
				canShowQr={existingRegistration?.status === "APPROVED"}
				canContact={canContactOrganizer}
				canFeedback={canShowFeedback}
				hasImportantInfo={hasImportantInfo}
			/>

			{showQRGenerator && user && existingRegistration && (
				<QRGenerator
					isOpen={showQRGenerator}
					onClose={() => setShowQRGenerator(false)}
					eventId={eventIdentifier}
					userId={user.id}
					eventTitle={event.title}
					userName={user.name || "Unknown User"}
				/>
			)}

			{showSuccessInfo && (
				<RegistrationSuccessModal
					isOpen={showSuccessInfo}
					onClose={() => {
						setShowSuccessInfo(false);
						setLatestRegistration(null);
					}}
					eventTitle={event.title}
					successInfo={event.registrationSuccessInfo}
					successImage={event.registrationSuccessImage}
					requireApproval={event.requireApproval}
					registrationStatus={
						latestRegistration?.status ||
						existingRegistration?.status
					}
					pendingInfo={event.registrationPendingInfo}
					pendingImage={event.registrationPendingImage}
					onShowQR={() => setShowQRGenerator(true)}
					eventInfo={{
						startTime: event.startTime,
						endTime: event.endTime,
						isOnline: event.isOnline,
						address: event.address,
					}}
				/>
			)}

			{showRegistrationForm && (
				<EventRegistrationModal
					isOpen={showRegistrationForm}
					onClose={() => setShowRegistrationForm(false)}
					event={event}
					inviteCode={inviteCode ?? undefined}
					onRegistrationComplete={handleRegistrationComplete}
				/>
			)}

			{canContactOrganizer && (
				<ContactOrganizerDialog
					open={isContactDialogOpen}
					onOpenChange={setIsContactDialogOpen}
					organizerName={event.organizer?.name}
					organizerUsername={event.organizer?.username}
					email={
						event.organizerContact
							? undefined
							: event.organizer?.email
					}
					contact={event.organizerContact}
					wechatQr={undefined}
				/>
			)}

			{canShowFeedback && (
				<SimpleEventFeedbackDialog
					open={isFeedbackDialogOpen}
					onOpenChange={setIsFeedbackDialogOpen}
					eventTitle={event.title}
					eventId={eventIdentifier}
					onSubmit={handleFeedbackSubmit}
					existingFeedback={userFeedback}
					isEditing={hasSubmittedFeedback}
				/>
			)}

			<EventShareModal
				isOpen={showShareModal}
				onClose={() => setShowShareModal(false)}
				eventId={eventIdentifier}
				eventTitle={event.title}
				event={{
					startTime: event.startTime,
					endTime: event.endTime,
					address: event.address ?? undefined,
					isOnline: event.isOnline,
					onlineUrl: event.onlineUrl ?? undefined,
					coverImage: event.coverImage ?? undefined,
					richContent: event.richContent,
				}}
			/>
		</div>
	);
}
