"use client";

import { Badge } from "@/components/ui/badge";
import { EventBookmarkButton } from "@/modules/public/events/components/event-bookmark-button";
import { EventLikeButton } from "@/modules/public/events/components/event-like-button";
import { LinkIcon as ExternalLinkIcon } from "@heroicons/react/24/outline";
import { useTranslations } from "next-intl";

// Helper function to get shortDescription only
function getShortDescription(shortDescription?: string): string {
	return shortDescription?.trim() || "";
}

interface EventHeroProps {
	event: {
		id: string;
		title: string;
		description: string;
		shortDescription?: string;
		type: string;
		featured: boolean;
		coverImage?: string;
		isExternalEvent: boolean;
		organizer: {
			id: string;
		};
	};
	user?: {
		id: string;
	} | null;
	eventTypeColors: Record<string, string>;
	eventTypeLabels: Record<string, string>;
	isBookmarked?: boolean;
	onBookmarkChange?: (bookmarked: boolean) => void;
}

export function EventHero({
	event,
	user,
	eventTypeColors,
	eventTypeLabels,
	isBookmarked,
	onBookmarkChange,
}: EventHeroProps) {
	const t = useTranslations();
	const shortDesc = getShortDescription(event.shortDescription);

	return (
		<div className="mb-3 pt-4">
			{event.coverImage && (
				<div className="relative w-full h-48 sm:h-56 lg:h-48 xl:h-52 mb-3 rounded-lg overflow-hidden">
					<img
						src={event.coverImage}
						alt={event.title}
						className="w-full h-full object-cover"
					/>
					{/* Bookmark and Like buttons in top-right corner */}
					{user && (
						<div className="absolute top-4 right-4 z-10 flex gap-2">
							<EventLikeButton
								eventId={event.id}
								userId={user.id}
								isLoggedIn={true}
								variant="outline"
								showText={false}
								showCount={true}
							/>
							<EventBookmarkButton
								eventId={event.id}
								initialBookmarked={isBookmarked || false}
								isLoggedIn={true}
								variant="floating"
								showLabel={false}
							/>
						</div>
					)}
					<div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end">
						<div className="p-6 text-white w-full">
							<div className="flex-1">
								<h1 className="mb-2 font-bold text-2xl sm:text-3xl md:text-4xl break-words text-white drop-shadow-lg [text-shadow:_2px_2px_4px_rgb(0_0_0_/_0.8)]">
									{event.title}
								</h1>
								<div className="flex items-center gap-2 flex-wrap">
									{event.featured && (
										<Badge className="bg-yellow-500 text-yellow-900">
											{t("events.card.featured")}
										</Badge>
									)}
									<Badge
										className={`${eventTypeColors[event.type]} border-0`}
									>
										{eventTypeLabels[event.type] ||
											event.type}
									</Badge>
								</div>
							</div>
						</div>
					</div>
				</div>
			)}

			{!event.coverImage && (
				<div className="text-center mb-3">
					{/* Bookmark and Like buttons for no-cover-image layout */}
					{user && (
						<div className="absolute top-4 right-4 z-10 flex gap-2">
							<EventLikeButton
								eventId={event.id}
								userId={user.id}
								isLoggedIn={true}
								showCount={true}
							/>
							<EventBookmarkButton
								eventId={event.id}
								initialBookmarked={isBookmarked || false}
								isLoggedIn={true}
							/>
						</div>
					)}
					<div className="flex-1 text-center sm:text-left">
						<h1 className="mb-2 font-bold text-3xl sm:text-4xl md:text-5xl break-words">
							{event.title}
						</h1>
						{shortDesc && (
							<p className="text-lg opacity-50">{shortDesc}</p>
						)}
						<div className="flex items-center justify-center sm:justify-start gap-2 mt-4 flex-wrap">
							{event.featured && (
								<Badge
									variant="secondary"
									className="bg-yellow-100 text-yellow-800"
								>
									{t("events.card.featured")}
								</Badge>
							)}
							<Badge className={eventTypeColors[event.type]}>
								{eventTypeLabels[event.type] || event.type}
							</Badge>
							{event.isExternalEvent && (
								<Badge
									variant="outline"
									className="flex items-center gap-1"
								>
									<ExternalLinkIcon className="w-3 h-3" />
									外部平台
								</Badge>
							)}
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
