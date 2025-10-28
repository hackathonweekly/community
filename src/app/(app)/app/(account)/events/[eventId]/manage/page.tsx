"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BuildingPublicManagement } from "@/modules/dashboard/events/components/BuildingPublicManagement";
import { HackathonManagement } from "@/modules/dashboard/events/components/HackathonManagement";
import { EventAdminManager } from "@/modules/dashboard/events/components/EventAdminManager";
import { EventCheckIn } from "@/modules/dashboard/events/components/EventCheckIn";
import { EventFeedback } from "@/modules/dashboard/events/components/EventFeedback";
import { EventManageHeader } from "@/modules/dashboard/events/components/EventManageHeader";
import { EventOverviewTab } from "@/modules/dashboard/events/components/EventOverviewTab";
import { EventQRGeneratorModal } from "@/modules/dashboard/events/components/EventQRGeneratorModal";
import { EventQuickStats } from "@/modules/dashboard/events/components/EventQuickStats";
import { EventRegistrationsTab } from "@/modules/dashboard/events/components/EventRegistrationsTab";
import { EventShareModal } from "@/modules/dashboard/events/components/EventShareModal";
import { EventStatusBanner } from "@/modules/dashboard/events/components/EventStatusBanner";
import { QRScanner } from "@/modules/dashboard/events/components/QRScanner";
import { SaveTemplateModal } from "@/modules/dashboard/events/components/SaveTemplateModal";
import { VolunteerManagement } from "@/modules/dashboard/events/components/VolunteerManagement";
import { EventInvitesTab } from "@/modules/dashboard/events/components/EventInvitesTab";
import { useEventManagement } from "@/modules/dashboard/events/hooks/useEventManagement";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useState } from "react";

export default function EventManagePage() {
	const t = useTranslations("events.manage");
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
						href="/app/events"
						className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
					>
						Back to My Events
					</Link>
				</div>
			</div>
		);
	}

	return (
		<div className="container mx-auto px-2 md:px-4 py-4 md:py-8">
			<div className="max-w-6xl mx-auto">
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

				<Tabs value={activeTab} onValueChange={setActiveTab}>
					<TabsList className="w-full h-auto flex flex-wrap md:grid md:grid-cols-7 gap-1 md:gap-0">
						<TabsTrigger
							value="overview"
							className="text-xs md:text-sm px-2 py-2 md:px-3 flex-1 min-w-0"
						>
							<span className="md:hidden">总览</span>
							<span className="hidden md:inline">
								{t("tabs.overview")}
							</span>
						</TabsTrigger>
						<TabsTrigger
							value="registrations"
							className="text-xs md:text-sm px-2 py-2 md:px-3 flex-1 min-w-0"
						>
							<span className="md:hidden">
								报名 ({event._count?.registrations || 0})
							</span>
							<span className="hidden md:inline">
								{t("tabs.registrations")} (
								{event._count?.registrations || 0})
							</span>
						</TabsTrigger>
						{event.type === "BUILDING_PUBLIC" && (
							<TabsTrigger
								value="building-public"
								className="text-xs md:text-sm px-2 py-2 md:px-3 flex-1 min-w-0"
							>
								<span className="md:hidden">
									Build (
									{event._count?.buildingRegistrations || 0})
								</span>
								<span className="hidden md:inline">
									Building Public (
									{event._count?.buildingRegistrations || 0})
								</span>
							</TabsTrigger>
						)}
						{event.type === "HACKATHON" && (
							<TabsTrigger
								value="hackathon"
								className="text-xs md:text-sm px-2 py-2 md:px-3 flex-1 min-w-0"
							>
								<span className="md:hidden">
									黑客松 (
									{event._count?.hackathonProjects || 0})
								</span>
								<span className="hidden md:inline">
									黑客松管理 (
									{event._count?.hackathonProjects || 0})
								</span>
							</TabsTrigger>
						)}
						<TabsTrigger
							value="invites"
							className="text-xs md:text-sm px-2 py-2 md:px-3 flex-1 min-w-0"
						>
							<span className="md:hidden">邀请</span>
							<span className="hidden md:inline">
								{t("tabs.invites")}
							</span>
						</TabsTrigger>
						<TabsTrigger
							value="volunteers"
							className="text-xs md:text-sm px-2 py-2 md:px-3 flex-1 min-w-0"
						>
							<span className="md:hidden">
								志愿 ({event.volunteerRoles?.length || 0})
							</span>
							<span className="hidden md:inline">
								{t("tabs.volunteers")} (
								{event.volunteerRoles?.length || 0})
							</span>
						</TabsTrigger>
						<TabsTrigger
							value="checkin"
							className="text-xs md:text-sm px-2 py-2 md:px-3 flex-1 min-w-0"
						>
							<span className="md:hidden">签到</span>
							<span className="hidden md:inline">
								{t("tabs.checkin")}
							</span>
						</TabsTrigger>
						<TabsTrigger
							value="feedback"
							className="text-xs md:text-sm px-2 py-2 md:px-3 flex-1 min-w-0"
						>
							<span className="md:hidden">
								反馈 ({event._count?.feedbacks || 0}/
								{event._count?.registrations || 0})
							</span>
							<span className="hidden md:inline">
								{t("tabs.feedback")} (
								{event._count?.feedbacks || 0}/
								{event._count?.registrations || 0})
							</span>
						</TabsTrigger>
						<TabsTrigger
							value="admins"
							className="text-xs md:text-sm px-2 py-2 md:px-3 flex-1 min-w-0"
						>
							<span className="md:hidden">管理</span>
							<span className="hidden md:inline">
								{t("tabs.admins")}
							</span>
						</TabsTrigger>
					</TabsList>

					<TabsContent value="overview" className="mt-3 md:mt-6">
						<EventOverviewTab
							event={event}
							confirmedCount={confirmedCount}
						/>
					</TabsContent>

					<TabsContent value="registrations" className="mt-3 md:mt-6">
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

					{event.type === "BUILDING_PUBLIC" && (
						<TabsContent
							value="building-public"
							className="mt-3 md:mt-6"
						>
							<BuildingPublicManagement
								eventId={eventId}
								event={event}
							/>
						</TabsContent>
					)}

					{event.type === "HACKATHON" && (
						<TabsContent value="hackathon" className="mt-3 md:mt-6">
							<HackathonManagement
								eventId={eventId}
								event={event}
							/>
						</TabsContent>
					)}

					<TabsContent value="invites" className="mt-3 md:mt-6">
						<EventInvitesTab eventId={eventId} />
					</TabsContent>

					<TabsContent value="volunteers" className="mt-3 md:mt-6">
						<VolunteerManagement
							eventId={eventId}
							volunteerRoles={event.volunteerRoles || []}
							isOrganizer={true}
							onRefresh={fetchEvent}
						/>
					</TabsContent>

					<TabsContent value="checkin" className="mt-3 md:mt-6">
						<EventCheckIn
							eventId={eventId}
							eventStatus={event.status}
							startTime={event.startTime}
							endTime={event.endTime}
						/>
					</TabsContent>

					<TabsContent value="feedback" className="mt-3 md:mt-6">
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

					<TabsContent value="admins" className="mt-3 md:mt-6">
						<EventAdminManager eventId={eventId} />
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
	);
}
