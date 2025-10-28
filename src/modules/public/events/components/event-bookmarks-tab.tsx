"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EventBookmarkButton } from "@/modules/public/events/components/event-bookmark-button";
import {
	CalendarIcon,
	EyeIcon,
	MapPinIcon,
	UsersIcon,
} from "@heroicons/react/24/outline";
import { format } from "date-fns";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useEventBookmarksQuery } from "@/lib/api/api-hooks";

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
	};
}

interface EventBookmark {
	id: string;
	createdAt: string;
	event: Event;
}

const eventTypeColors: Record<string, string> = {
	MEETUP: "bg-green-100 text-green-800",
	HACKATHON: "bg-purple-100 text-purple-800",
	BUILDING_PUBLIC: "bg-orange-100 text-orange-800",
};

const eventTypes = [
	{ value: "MEETUP", label: "常规活动" },
	{ value: "HACKATHON", label: "黑客马拉松" },
	{ value: "BUILDING_PUBLIC", label: "Build In Public" },
];

export function EventBookmarksTab() {
	const t = useTranslations();

	const {
		data: bookmarks = [],
		isLoading: loading,
		error,
		refetch,
	} = useEventBookmarksQuery();

	const handleBookmarkChange = (eventId: string, isBookmarked: boolean) => {
		if (!isBookmarked) {
			// Invalidate and refetch the query to update the list
			refetch();
		}
	};

	const renderEventCard = (bookmark: EventBookmark) => {
		const { event } = bookmark;

		return (
			<div
				key={bookmark.id}
				className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors gap-4"
			>
				<div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 flex-1">
					{event.coverImage && (
						<img
							src={event.coverImage}
							alt={event.title}
							className="w-full h-32 sm:w-16 sm:h-16 object-cover rounded-lg flex-shrink-0"
						/>
					)}
					<div className="flex-1 min-w-0 space-y-2">
						<div className="flex flex-wrap items-center gap-2">
							{event.featured && (
								<Badge className="bg-yellow-500 text-white text-xs">
									⭐
								</Badge>
							)}
							<Badge
								variant="outline"
								className={`text-xs ${
									eventTypeColors[event.type] ||
									eventTypeColors.MEETUP
								}`}
							>
								{eventTypes.find((t) => t.value === event.type)
									?.label || event.type}
							</Badge>
							<Badge
								variant={
									event.status === "PUBLISHED"
										? "default"
										: "secondary"
								}
								className="text-xs"
							>
								{event.status}
							</Badge>
						</div>

						<h3 className="font-semibold text-sm sm:text-base line-clamp-2">
							<Link
								href={`/events/${event.id}`}
								className="hover:text-blue-600 transition-colors"
							>
								{event.title}
							</Link>
						</h3>

						<div className="grid grid-cols-2 sm:flex sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
							<span className="flex items-center gap-1">
								<CalendarIcon className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
								<span className="truncate">
									{format(
										new Date(event.startTime),
										"MMM d, yyyy",
									)}
								</span>
							</span>
							<span className="flex items-center gap-1">
								<UsersIcon className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
								{event._count.registrations}
							</span>
							<span className="flex items-center gap-1">
								<EyeIcon className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
								{event.viewCount}
							</span>
							{!event.isOnline && (
								<span className="flex items-center gap-1 col-span-2 sm:col-span-1">
									<MapPinIcon className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
									<span className="truncate">
										{event.address || "线下"}
									</span>
								</span>
							)}
						</div>
					</div>
				</div>

				<div className="flex items-center justify-between sm:justify-end gap-2 pt-2 sm:pt-0 border-t sm:border-t-0">
					<Button
						asChild
						size="sm"
						variant="outline"
						className="flex-1 sm:flex-none"
					>
						<Link href={`/events/${event.id}`}>查看详情</Link>
					</Button>
					<EventBookmarkButton
						eventId={event.id}
						initialBookmarked={true}
						isLoggedIn={true}
						size="sm"
						onBookmarkChange={handleBookmarkChange}
					/>
				</div>
			</div>
		);
	};

	const renderEmptyState = () => (
		<Card>
			<CardContent className="flex flex-col items-center justify-center py-12">
				<p className="text-muted-foreground text-center">
					还没有收藏的活动
				</p>
				<Button asChild className="mt-4">
					<Link href="/events">探索活动</Link>
				</Button>
			</CardContent>
		</Card>
	);

	if (loading) {
		return (
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
		);
	}

	return (
		<div className="mt-6">
			{bookmarks.length === 0 ? (
				renderEmptyState()
			) : (
				<div className="space-y-3">
					{bookmarks.map((bookmark: EventBookmark) =>
						renderEventCard(bookmark),
					)}
				</div>
			)}
		</div>
	);
}
