import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
	CalendarIcon,
	CheckCircleIcon,
	ClockIcon,
	ExclamationTriangleIcon,
	UsersIcon,
	XCircleIcon,
} from "@heroicons/react/24/outline";
import { format } from "date-fns";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { MyEventsTabsClient } from "./MyEventsTabsClient";

interface MyEventsServerContentProps {
	userRegistrations: any[];
	userEvents: any[];
	initialSubTab: string;
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

export async function MyEventsServerContent({
	userRegistrations,
	userEvents,
	initialSubTab,
}: MyEventsServerContentProps) {
	const t = await getTranslations();

	const renderRegistrationCard = (registration: any) => {
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

	const renderOrganizedEventCard = (event: any) => {
		return (
			<div
				key={event.id}
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

				<Button asChild size="sm" variant="outline">
					<Link href={`/events/${event.id}`}>
						{t("eventManagement.viewEvent")}
					</Link>
				</Button>
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
				</div>
			</CardContent>
		</Card>
	);

	return (
		<div className="w-full">
			<MyEventsTabsClient
				initialSubTab={initialSubTab}
				organizedEvents={userEvents}
				registrations={userRegistrations}
				organizedContent={
					userEvents.length > 0 ? (
						<div className="space-y-3">
							{userEvents.map((event: any) =>
								renderOrganizedEventCard(event),
							)}
						</div>
					) : (
						renderEmptyState("organized")
					)
				}
				registeredContent={
					userRegistrations.length > 0 ? (
						<div className="space-y-3">
							{userRegistrations.map((registration: any) =>
								renderRegistrationCard(registration),
							)}
						</div>
					) : (
						renderEmptyState("registered")
					)
				}
			/>
		</div>
	);
}
