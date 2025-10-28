"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	CalendarIcon,
	CheckCircleIcon,
	ClockIcon,
	ExclamationTriangleIcon,
	PlusIcon,
	CogIcon as SettingsIcon,
	UsersIcon,
	XCircleIcon,
} from "@heroicons/react/24/outline";
import { format } from "date-fns";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
	useUserRegistrationsQuery,
	useUserEventsQuery,
} from "@/lib/api/api-hooks";

interface Event {
	id: string;
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

const eventTypes = [
	{ value: "MEETUP", label: "常规活动" },
	{ value: "HACKATHON", label: "黑客马拉松" },
	{ value: "BUILDING_PUBLIC", label: "Build In Public" },
];

const eventTypeColors: Record<string, string> = {
	MEETUP: "bg-green-100 text-green-800",
	HACKATHON: "bg-purple-100 text-purple-800",
	BUILDING_PUBLIC: "bg-orange-100 text-orange-800",
};

const registrationStatusColors: Record<
	string,
	{ bg: string; text: string; icon: any }
> = {
	APPROVED: {
		bg: "bg-green-100",
		text: "text-green-800",
		icon: CheckCircleIcon,
	},
	PENDING: { bg: "bg-yellow-100", text: "text-yellow-800", icon: ClockIcon },
	WAITLISTED: {
		bg: "bg-blue-100",
		text: "text-blue-800",
		icon: ExclamationTriangleIcon,
	},
	REJECTED: { bg: "bg-red-100", text: "text-red-800", icon: XCircleIcon },
	CANCELLED: { bg: "bg-gray-100", text: "text-gray-800", icon: XCircleIcon },
};

export default function MyEventsPage() {
	const t = useTranslations();
	const locale = useLocale();
	const router = useRouter();
	const [activeTab, setActiveTab] = useState<string>("organized");

	// Use TanStack Query hooks
	const {
		data: registrations = [],
		isLoading: registrationsLoading,
		error: registrationsError,
	} = useUserRegistrationsQuery();

	const {
		data: organizedEvents = [],
		isLoading: organizedEventsLoading,
		error: organizedEventsError,
	} = useUserEventsQuery();

	// 根据 URL hash 设置活动标签
	useEffect(() => {
		const hash = window.location.hash.replace("#", "");
		if (hash === "registered") {
			setActiveTab("registered");
		} else if (hash === "organized") {
			setActiveTab("organized");
		} else {
			setActiveTab("organized");
		}
	}, []);

	// 更新 URL hash 当标签改变
	const handleTabChange = (value: string) => {
		setActiveTab(value);
		const newHash = value === "organized" ? "organized" : "registered";
		window.history.pushState(null, "", `#${newHash}`);
	};

	const isLoading = registrationsLoading || organizedEventsLoading;

	const renderRegistrationCard = (registration: Registration) => {
		const { event } = registration;
		const statusInfo = registrationStatusColors[registration.status];
		const StatusIcon = statusInfo.icon;

		return (
			<div
				key={registration.id}
				className="flex items-center justify-between p-5 border rounded-xl hover:bg-muted/50 hover:border-muted-foreground/20 transition-all duration-200 shadow-sm"
			>
				<div className="flex items-center gap-4 flex-1">
					{event.coverImage && (
						<img
							src={event.coverImage}
							alt={event.title}
							className="w-16 h-16 object-cover rounded-xl border border-muted"
						/>
					)}
					<div className="flex-1 min-w-0">
						<div className="flex items-center gap-2 mb-2 flex-wrap">
							<Badge
								variant="outline"
								className={
									eventTypeColors[event.type] ||
									eventTypeColors.MEETUP
								}
							>
								{eventTypes.find((t) => t.value === event.type)
									?.label || event.type}
							</Badge>
							<Badge
								variant="outline"
								className={`${statusInfo.bg} ${statusInfo.text} flex items-center gap-1`}
							>
								<StatusIcon className="w-3 h-3" />
								{registration.status}
							</Badge>
						</div>

						<h3 className="font-semibold mb-2 line-clamp-1">
							<Link
								href={`/events/${event.id}`}
								className="hover:text-foreground/80 transition-colors"
							>
								{event.title}
							</Link>
						</h3>

						<div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
							<span className="flex items-center gap-1">
								<CalendarIcon className="w-4 h-4" />
								{format(
									new Date(event.startTime),
									"MMM d, yyyy",
								)}
							</span>
						</div>
					</div>
				</div>

				<Button asChild size="sm" variant="outline">
					<Link href={`/events/${event.id}`}>
						{t("eventManagement.viewEvent")}
					</Link>
				</Button>
			</div>
		);
	};

	const renderOrganizedEventCard = (event: Event) => {
		return (
			<div
				key={event.id}
				className="flex flex-col sm:flex-row sm:items-start justify-between p-5 border rounded-xl hover:bg-muted/50 hover:border-muted-foreground/20 transition-all duration-200 gap-4 shadow-sm"
			>
				<div className="flex items-center gap-4 flex-1">
					{event.coverImage && (
						<img
							src={event.coverImage}
							alt={event.title}
							className="w-16 h-16 object-cover rounded-xl border border-muted"
						/>
					)}
					<div className="flex-1 min-w-0">
						<div className="flex items-center gap-2 mb-2 flex-wrap">
							{event.featured && (
								<Badge
									variant="secondary"
									className="bg-yellow-100 text-yellow-800"
								>
									{t("events.card.featured")}
								</Badge>
							)}
							<Badge
								variant="outline"
								className={
									eventTypeColors[event.type] ||
									eventTypeColors.MEETUP
								}
							>
								{eventTypes.find((t) => t.value === event.type)
									?.label || event.type}
							</Badge>
							<Badge
								variant={
									event.status === "PUBLISHED"
										? "secondary"
										: "outline"
								}
								className={
									event.status === "PUBLISHED"
										? "bg-green-100 text-green-800"
										: ""
								}
							>
								{t(
									`events.status.${event.status.toLowerCase()}`,
								)}
							</Badge>
						</div>

						<h3 className="font-semibold mb-2 line-clamp-1">
							<Link
								href={`/events/${event.id}`}
								className="hover:text-blue-600 transition-colors"
							>
								{event.title}
							</Link>
						</h3>

						<div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
							<span className="flex items-center gap-1">
								<CalendarIcon className="w-4 h-4" />
								{format(
									new Date(event.startTime),
									"MMM d, yyyy",
								)}
							</span>
							<span className="flex items-center gap-1">
								<UsersIcon className="w-4 h-4" />
								{event._count.registrations}
							</span>
						</div>
					</div>
				</div>

				<div className="flex flex-col gap-2 w-full sm:w-auto min-w-[140px]">
					<Button
						asChild
						size="sm"
						variant="secondary"
						className="w-full justify-center"
					>
						<Link href={`/app/events/${event.id}`}>
							<SettingsIcon className="w-4 h-4 mr-2" />
							{t("eventManagement.manage")}
						</Link>
					</Button>
					<Button
						asChild
						size="sm"
						variant="outline"
						className="w-full justify-center"
					>
						<Link href={`/events/${event.id}`}>
							{t("eventManagement.viewEvent")}
						</Link>
					</Button>
				</div>
			</div>
		);
	};

	const renderEmptyState = (type: "registered" | "organized") => (
		<Card className="border-dashed">
			<CardContent className="p-8 sm:p-12 text-center">
				<div className="max-w-md mx-auto">
					<div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
						<CalendarIcon className="w-8 h-8 text-muted-foreground" />
					</div>
					<h3 className="text-lg font-medium mb-2">
						{type === "registered"
							? t("eventManagement.noEvents")
							: t("eventManagement.noEvents")}
					</h3>
					<p className="text-muted-foreground mb-6 text-sm sm:text-base leading-relaxed">
						{type === "registered"
							? t("eventManagement.noRegisteredEvents")
							: t("eventManagement.noOrganizedEvents")}
					</p>
					<Button asChild className="w-full sm:w-auto">
						<Link
							href={
								type === "registered"
									? "/events"
									: "/app/events/create"
							}
						>
							<PlusIcon className="w-4 h-4 mr-2" />
							{type === "registered"
								? t("eventManagement.exploreEvents")
								: t("eventManagement.createEvent")}
						</Link>
					</Button>
				</div>
			</CardContent>
		</Card>
	);

	return (
		<div className="px-2 md:px-0">
			<div className="max-w-6xl mx-auto">
				{/* Header */}
				<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
					<div>
						<h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
							{t("eventManagement.myEvents")}
						</h1>
						<p className="text-muted-foreground mt-2">
							{t("eventManagement.myEventsDescription")}
						</p>
					</div>
					<div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
						<Button
							variant="outline"
							asChild
							className="w-full sm:w-auto"
						>
							<Link href={`/${locale}/events`}>
								{t("eventManagement.exploreEvents")}
							</Link>
						</Button>
						<Button asChild className="w-full sm:w-auto">
							<Link href="/app/events/create">
								<PlusIcon className="w-4 h-4 mr-2" />
								{t("eventManagement.createEvent")}
							</Link>
						</Button>
					</div>
				</div>

				{/* Events List with Tabs */}
				<Tabs
					value={activeTab}
					onValueChange={handleTabChange}
					className="w-full"
				>
					<TabsList className="grid w-full max-w-md grid-cols-2">
						<TabsTrigger value="registered" id="registered">
							我参与的活动
							{registrations.length > 0 && (
								<span className="ml-2 text-xs bg-primary/20 px-1.5 py-0.5 rounded">
									{registrations.length}
								</span>
							)}
						</TabsTrigger>
						<TabsTrigger value="organized" id="organized">
							我管理的活动
							{organizedEvents.length > 0 && (
								<span className="ml-2 text-xs bg-primary/20 px-1.5 py-0.5 rounded">
									{organizedEvents.length}
								</span>
							)}
						</TabsTrigger>
					</TabsList>

					{isLoading ? (
						<div className="space-y-4 mt-6">
							{[...Array(3)].map((_, i) => (
								<Card key={i}>
									<CardContent className="p-4 sm:p-6">
										<div className="space-y-4">
											<div className="flex flex-col sm:flex-row gap-4">
												<Skeleton className="h-32 sm:h-20 w-full sm:w-20 rounded-lg" />
												<div className="flex-1 space-y-2">
													<Skeleton className="h-6 w-2/3" />
													<Skeleton className="h-4 w-full" />
													<Skeleton className="h-4 w-3/4" />
												</div>
											</div>
										</div>
									</CardContent>
								</Card>
							))}
						</div>
					) : (
						<>
							<TabsContent value="organized" className="mt-6">
								{organizedEvents.length > 0 ? (
									<div className="space-y-3">
										{organizedEvents.map((event: Event) =>
											renderOrganizedEventCard(event),
										)}
									</div>
								) : (
									renderEmptyState("organized")
								)}
							</TabsContent>

							<TabsContent value="registered" className="mt-6">
								{registrations.length > 0 ? (
									<div className="space-y-3">
										{registrations.map(
											(registration: Registration) =>
												renderRegistrationCard(
													registration,
												),
										)}
									</div>
								) : (
									renderEmptyState("registered")
								)}
							</TabsContent>
						</>
					)}
				</Tabs>
			</div>
		</div>
	);
}
