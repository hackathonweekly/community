"use client";

import { Skeleton } from "@community/ui/ui/skeleton";
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@community/ui/ui/tabs";
import { EventAdminManager } from "@/modules/account/events/components/EventAdminManager";
import { EventCheckIn } from "@/modules/account/events/components/EventCheckIn";
import { EventFeedback } from "@/modules/account/events/components/EventFeedback";
import { EventInvitesTab } from "@/modules/account/events/components/EventInvitesTab";
import { EventManageHeader } from "@/modules/account/events/components/EventManageHeader";
import { EventOverviewTab } from "@/modules/account/events/components/EventOverviewTab";
import { EventQRGeneratorModal } from "@/modules/account/events/components/EventQRGeneratorModal";
import { EventQuickStats } from "@/modules/account/events/components/EventQuickStats";
import { EventRegistrationsTab } from "@/modules/account/events/components/EventRegistrationsTab";
import { EventShareModal } from "@shared/events/components/EventShareModal";
import { EventStatusBanner } from "@/modules/account/events/components/EventStatusBanner";
import { HackathonManagement } from "@/modules/account/events/components/HackathonManagement";
import { QRScanner } from "@/modules/account/events/components/QRScanner";
import { SaveTemplateModal } from "@/modules/account/events/components/SaveTemplateModal";
import { VolunteerManagement } from "@/modules/account/events/components/VolunteerManagement";
import { EventSubmissionsManager } from "@/modules/account/events/components/submissions/EventSubmissionsManager";
import { useEventManagement } from "@/modules/account/events/hooks/useEventManagement";
import { isEventSubmissionsEnabled } from "@/features/event-submissions/utils/is-event-submissions-enabled";
import { MobilePageHeader } from "@/modules/public/shared/components/MobilePageHeader";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

export default function EventManagePage() {
	const t = useTranslations("events.manage");
	const searchParams = useSearchParams();
	const tabTriggerClass =
		"!flex-none min-w-[76px] px-3 py-2 text-xs font-medium touch-manipulation lg:min-w-0 lg:px-2.5 lg:py-2 lg:text-sm";
	const {
		event,
		registrations,
		loading,
		registrationsLoading,
		activeTab,
		statusFilter,
		eventId,
		confirmedCount,
		pendingCount,
		setActiveTab,
		setStatusFilter,
		fetchEvent,
		updateRegistrationStatus,
		cancelRegistration,
		exportRegistrations,
		handleQRScanSuccess,
		deleteEvent,
		toggleRegistrationStatus,
	} = useEventManagement();

	// Modal states
	const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);
	const [isEventQRGeneratorOpen, setIsEventQRGeneratorOpen] = useState(false);
	const [isShareModalOpen, setIsShareModalOpen] = useState(false);
	const [isSaveTemplateOpen, setIsSaveTemplateOpen] = useState(false);

	// 初始化：根据 URL hash 设置当前 Tab，便于通过链接直接定位
	useEffect(() => {
		if (!event) return;
		if (typeof window === "undefined") return;
		const hash = window.location.hash.replace("#", "");
		if (hash) {
			setActiveTab(hash);
		}
	}, [event, setActiveTab]);

	// Auto-open QR scanner when navigated with ?scan=1
	useEffect(() => {
		if (!event) return;
		if (searchParams.get("scan") === "1") {
			setIsQRScannerOpen(true);
		}
	}, [event, searchParams]);

	if (loading) {
		return (
			<div className="container mx-auto px-4 py-8">
				<div className="max-w-6xl mx-auto">
					<Skeleton className="h-8 w-1/3 mb-2" />
					<Skeleton className="h-4 w-2/3 mb-8" />
					<div className="space-y-4">
						{[...Array(3)].map((_, i) => (
							<div key={i} className="border rounded-lg p-6">
								<Skeleton className="h-6 w-1/2 mb-4" />
								<Skeleton className="h-4 w-full mb-2" />
								<Skeleton className="h-4 w-3/4" />
							</div>
						))}
					</div>
				</div>
			</div>
		);
	}

	if (!event) {
		return (
			<div className="container mx-auto px-4 py-8">
				<div className="max-w-6xl mx-auto text-center">
					<h1 className="text-2xl font-bold mb-4">Event not found</h1>
					<Link
						href="/events"
						className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
					>
						Back to My Events
					</Link>
				</div>
			</div>
		);
	}

	const hasHackathonTab = event.type === "HACKATHON";
	const hasSubmissionTab = isEventSubmissionsEnabled(event as any);
	const desktopTabCount =
		7 + Number(hasHackathonTab) + Number(hasSubmissionTab);

	return (
		<>
			<MobilePageHeader title={t("title")} />
			<div className="container mx-auto px-3 py-3 lg:px-4 lg:py-8">
				<div className="mx-auto max-w-6xl">
					<EventManageHeader
						event={event}
						onQRScannerOpen={() => setIsQRScannerOpen(true)}
						onEventQRGeneratorOpen={() =>
							setIsEventQRGeneratorOpen(true)
						}
						onShareOpen={() => setIsShareModalOpen(true)}
						onRefresh={fetchEvent}
						onDelete={deleteEvent}
						onToggleRegistration={toggleRegistrationStatus}
					/>

					<EventStatusBanner event={event} />

					<EventQuickStats
						event={event}
						confirmedCount={confirmedCount}
						pendingCount={pendingCount}
					/>

					{/* 根据 URL hash 初始化 Tab，并在切换时写入 hash 以便分享链接直接定位 */}
					<Tabs
						value={activeTab}
						onValueChange={(value) => {
							setActiveTab(value);
							if (typeof window !== "undefined") {
								window.history.replaceState(
									null,
									"",
									`#${value}`,
								);
							}
						}}
					>
						<TabsList
							className="-mx-1 h-auto w-[calc(100%+8px)] flex-nowrap gap-1 overflow-x-auto rounded-xl border border-border/60 bg-muted/40 p-1.5 no-scrollbar lg:mx-0 lg:w-full lg:grid lg:gap-1"
							style={{
								gridTemplateColumns: `repeat(${desktopTabCount}, minmax(0, 1fr))`,
							}}
						>
							<TabsTrigger
								value="overview"
								className={tabTriggerClass}
							>
								<span className="lg:hidden">总览</span>
								<span className="hidden lg:inline">
									{t("tabs.overview")}
								</span>
							</TabsTrigger>
							<TabsTrigger
								value="registrations"
								className={tabTriggerClass}
							>
								<span className="lg:hidden">报名</span>
								<span className="hidden lg:inline">
									{t("tabs.registrations")} (
									{event._count?.registrations || 0})
								</span>
							</TabsTrigger>
							{hasHackathonTab && (
								<TabsTrigger
									value="hackathon"
									className={tabTriggerClass}
								>
									<span className="lg:hidden">黑客松</span>
									<span className="hidden lg:inline">
										黑客松管理 (
										{event._count?.hackathonProjects || 0})
									</span>
								</TabsTrigger>
							)}
							{hasSubmissionTab && (
								<TabsTrigger
									value="submissions"
									className={tabTriggerClass}
								>
									<span className="lg:hidden">作品</span>
									<span className="hidden lg:inline">
										作品管理
									</span>
								</TabsTrigger>
							)}
							<TabsTrigger
								value="invites"
								className={tabTriggerClass}
							>
								<span className="lg:hidden">邀请</span>
								<span className="hidden lg:inline">
									{t("tabs.invites")}
								</span>
							</TabsTrigger>
							<TabsTrigger
								value="volunteers"
								className={tabTriggerClass}
							>
								<span className="lg:hidden">志愿者</span>
								<span className="hidden lg:inline">
									{t("tabs.volunteers")} (
									{event.volunteerRoles?.length || 0})
								</span>
							</TabsTrigger>
							<TabsTrigger
								value="checkin"
								className={tabTriggerClass}
							>
								<span className="lg:hidden">签到</span>
								<span className="hidden lg:inline">
									{t("tabs.checkin")}
								</span>
							</TabsTrigger>
							<TabsTrigger
								value="feedback"
								className={tabTriggerClass}
							>
								<span className="lg:hidden">反馈</span>
								<span className="hidden lg:inline">
									{t("tabs.feedback")} (
									{event._count?.feedbacks || 0}/
									{event._count?.registrations || 0})
								</span>
							</TabsTrigger>
							<TabsTrigger
								value="admins"
								className={tabTriggerClass}
							>
								<span className="lg:hidden">管理员</span>
								<span className="hidden lg:inline">
									{t("tabs.admins")}
								</span>
							</TabsTrigger>
						</TabsList>

						<TabsContent value="overview" className="mt-3 lg:mt-6">
							<EventOverviewTab
								event={event}
								confirmedCount={confirmedCount}
							/>
						</TabsContent>

						<TabsContent
							value="registrations"
							className="mt-3 lg:mt-6"
						>
							<EventRegistrationsTab
								registrations={registrations}
								loading={registrationsLoading}
								statusFilter={statusFilter}
								requireProjectSubmission={
									event.requireProjectSubmission
								}
								eventQuestions={event.questions}
								onStatusFilterChange={setStatusFilter}
								onUpdateRegistrationStatus={
									updateRegistrationStatus
								}
								onCancelRegistration={cancelRegistration}
								onExportRegistrations={exportRegistrations}
							/>
						</TabsContent>

						{hasHackathonTab && (
							<TabsContent
								value="hackathon"
								className="mt-3 lg:mt-6"
							>
								<HackathonManagement
									eventId={eventId}
									event={event}
								/>
							</TabsContent>
						)}

						{hasSubmissionTab && (
							<TabsContent
								value="submissions"
								className="mt-3 lg:mt-6"
							>
								<EventSubmissionsManager
									eventId={eventId}
									eventTitle={event.title}
									submissionFormConfig={
										event.submissionFormConfig
									}
								/>
							</TabsContent>
						)}

						<TabsContent value="invites" className="mt-3 lg:mt-6">
							<EventInvitesTab eventId={eventId} />
						</TabsContent>

						<TabsContent
							value="volunteers"
							className="mt-3 lg:mt-6"
						>
							<VolunteerManagement
								eventId={eventId}
								volunteerRoles={event.volunteerRoles || []}
								isOrganizer={true}
								onRefresh={fetchEvent}
							/>
						</TabsContent>

						<TabsContent value="checkin" className="mt-3 lg:mt-6">
							<EventCheckIn
								eventId={eventId}
								eventStatus={event.status}
								startTime={event.startTime}
								endTime={event.endTime}
								registrationsCount={
									event._count?.registrations || 0
								}
							/>
						</TabsContent>

						<TabsContent value="feedback" className="mt-3 lg:mt-6">
							<EventFeedback
								eventId={eventId}
								eventStatus={event.status}
								userRegistration={undefined}
								isEventPast={
									new Date(event.endTime) < new Date() ||
									event.status === "COMPLETED"
								}
								adminView={true}
								isOrganizer={true}
							/>
						</TabsContent>

						<TabsContent value="admins" className="mt-3 lg:mt-6">
							<EventAdminManager eventId={event.id} />
						</TabsContent>
					</Tabs>
				</div>

				<QRScanner
					isOpen={isQRScannerOpen}
					onClose={() => setIsQRScannerOpen(false)}
					onScanSuccess={handleQRScanSuccess}
					eventId={eventId}
				/>

				<EventQRGeneratorModal
					isOpen={isEventQRGeneratorOpen}
					onClose={() => setIsEventQRGeneratorOpen(false)}
					eventId={eventId}
				/>

				<EventShareModal
					isOpen={isShareModalOpen}
					onClose={() => setIsShareModalOpen(false)}
					eventId={eventId}
					eventTitle={event.title}
					event={{
						startTime: event.startTime,
						endTime: event.endTime,
						address: event.address,
						isOnline: event.isOnline,
						onlineUrl: event.onlineUrl,
						coverImage: event.coverImage,
						richContent: event.richContent,
					}}
				/>

				<SaveTemplateModal
					isOpen={isSaveTemplateOpen}
					onClose={() => setIsSaveTemplateOpen(false)}
					eventId={eventId}
				/>
			</div>
		</>
	);
}
