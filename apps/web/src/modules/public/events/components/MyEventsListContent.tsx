"use client";

import { Card, CardContent } from "@community/ui/ui/card";
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@community/ui/ui/tabs";
import { CalendarIcon } from "@heroicons/react/24/outline";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import {
	useUserRegistrationsQuery,
	useUserEventsQuery,
} from "@community/lib-client/api/api-hooks";
import { EventCard } from "./EventCard";
import type { EventCardEvent } from "./EventCard";
import { EventCardCompact } from "./EventCardCompact";
import { CardSkeleton } from "@/modules/public/shared/components/CardSkeleton";

interface Event {
	id: string;
	shortId?: string;
	title: string;
	description: string;
	type: string;
	status: string;
	startTime: string;
	endTime: string;
	isOnline: boolean;
	address?: string;
	isExternalEvent: boolean;
	externalUrl?: string;
	coverImage?: string;
	tags: string[];
	featured: boolean;
	viewCount: number;
	createdAt: string;
	organizer: {
		id: string;
		name: string;
		image?: string;
		username?: string;
	};
	organization?: {
		id: string;
		name: string;
		slug: string;
		logo?: string;
	};
	_count: {
		registrations: number;
		checkIns?: number;
	};
}

interface Registration {
	id: string;
	status: "PENDING" | "APPROVED" | "WAITLISTED" | "REJECTED" | "CANCELLED";
	registeredAt: string;
	note?: string;
	reviewNote?: string;
	event: Event;
}

interface MyEventsListContentProps {
	defaultTab?: "organized" | "registered";
	showTabs?: boolean;
}

function LoadingSkeleton() {
	return (
		<CardSkeleton
			count={6}
			className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
		/>
	);
}

export function MyEventsListContent({
	defaultTab = "organized",
	showTabs = true,
}: MyEventsListContentProps) {
	const t = useTranslations();
	const [activeTab, setActiveTab] = useState<string>(defaultTab);

	const { data: registrations = [], isLoading: registrationsLoading } =
		useUserRegistrationsQuery();

	const { data: organizedEvents = [], isLoading: organizedEventsLoading } =
		useUserEventsQuery();

	useEffect(() => {
		if (!showTabs) {
			setActiveTab(defaultTab);
			return;
		}

		const hash = window.location.hash.replace("#", "");
		if (hash === "registered") {
			setActiveTab("registered");
		} else if (hash === "organized") {
			setActiveTab("organized");
		} else {
			setActiveTab(defaultTab);
		}
	}, [defaultTab, showTabs]);

	const handleTabChange = (value: string) => {
		setActiveTab(value);
		if (!showTabs) {
			return;
		}
		const newHash = value === "organized" ? "organized" : "registered";
		window.history.pushState(null, "", `#${newHash}`);
	};

	const isLoading = registrationsLoading || organizedEventsLoading;

	const renderEmptyState = (type: "registered" | "organized") => (
		<Card className="border-dashed">
			<CardContent className="p-8 sm:p-12 text-center">
				<div className="max-w-md mx-auto">
					<div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
						<CalendarIcon className="w-8 h-8 text-muted-foreground" />
					</div>
					<h3 className="text-lg font-medium mb-2">
						{t("eventManagement.noEvents")}
					</h3>
					<p className="text-muted-foreground mb-6 text-sm sm:text-base leading-relaxed">
						{type === "registered"
							? t("eventManagement.noRegisteredEvents")
							: t("eventManagement.noOrganizedEvents")}
					</p>
				</div>
			</CardContent>
		</Card>
	);

	const renderEventGrid = (
		events: EventCardEvent[],
		options?: {
			registrationStatusMap?: Record<string, string>;
			showManage?: boolean;
		},
	) => {
		if (events.length === 0) return null;
		return (
			<>
				{/* Desktop: grid cards */}
				<div className="hidden sm:grid grid-cols-2 gap-4 lg:grid-cols-3">
					{events.map((event) => (
						<EventCard
							key={event.id}
							event={event}
							registrationStatus={
								options?.registrationStatusMap?.[event.id]
							}
							manageUrl={
								options?.showManage
									? `/events/${event.shortId || event.id}/manage`
									: undefined
							}
						/>
					))}
				</div>
				{/* Mobile: compact list */}
				<div className="flex flex-col gap-3 sm:hidden">
					{events.map((event) => (
						<EventCardCompact
							key={event.id}
							event={event}
							registrationStatus={
								options?.registrationStatusMap?.[event.id]
							}
							manageUrl={
								options?.showManage
									? `/events/${event.shortId || event.id}/manage`
									: undefined
							}
						/>
					))}
				</div>
			</>
		);
	};

	// Build registration status map: eventId -> registrationStatus
	const registrationStatusMap: Record<string, string> = {};
	const registeredEvents: EventCardEvent[] = registrations.map(
		(reg: Registration) => {
			registrationStatusMap[reg.event.id] = reg.status;
			return reg.event as EventCardEvent;
		},
	);

	return (
		<div className="w-full">
			<Tabs
				value={activeTab}
				onValueChange={handleTabChange}
				className="w-full"
			>
				{showTabs && (
					<TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-6">
						<TabsTrigger
							value="organized"
							id="organized"
							className="text-sm"
						>
							我管理的活动
							{organizedEvents.length > 0 && (
								<span className="ml-2 text-xs bg-primary/20 px-1.5 py-0.5 rounded">
									{organizedEvents.length}
								</span>
							)}
						</TabsTrigger>
						<TabsTrigger
							value="registered"
							id="registered"
							className="text-sm"
						>
							我参与的活动
							{registrations.length > 0 && (
								<span className="ml-2 text-xs bg-primary/20 px-1.5 py-0.5 rounded">
									{registrations.length}
								</span>
							)}
						</TabsTrigger>
					</TabsList>
				)}

				{isLoading ? (
					<div className="mt-6">
						<LoadingSkeleton />
					</div>
				) : (
					<>
						<TabsContent value="organized" className="mt-0">
							{organizedEvents.length > 0
								? renderEventGrid(
										organizedEvents as EventCardEvent[],
										{ showManage: true },
									)
								: renderEmptyState("organized")}
						</TabsContent>

						<TabsContent value="registered" className="mt-0">
							{registeredEvents.length > 0
								? renderEventGrid(registeredEvents, {
										registrationStatusMap,
									})
								: renderEmptyState("registered")}
						</TabsContent>
					</>
				)}
			</Tabs>
		</div>
	);
}
