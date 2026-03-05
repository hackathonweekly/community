"use client";

import { Badge } from "@community/ui/ui/badge";
import { EventBookmarkButton } from "@/modules/public/events/components/event-bookmark-button";
import { EventLikeButton } from "@/modules/public/events/components/event-like-button";
import { LinkIcon as ExternalLinkIcon } from "@heroicons/react/24/outline";
import { useTranslations } from "next-intl";

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
	eventTypeLabels,
	isBookmarked,
}: EventHeroProps) {
	const t = useTranslations();
	const shortDesc = getShortDescription(event.shortDescription);

	return (
		<div className="mb-4 space-y-3 pt-2">
			{event.coverImage ? (
				<div className="relative h-52 w-full overflow-hidden rounded-lg border border-border bg-muted sm:h-64">
					<img
						src={event.coverImage}
						alt={event.title}
						className="h-full w-full object-cover"
					/>
					<div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
					<div className="absolute right-3 top-3 z-10 flex gap-2">
						{user ? (
							<>
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
							</>
						) : null}
					</div>
					<div className="absolute bottom-0 left-0 right-0 p-4 text-white">
						<div className="mb-2 flex flex-wrap gap-1.5">
							{event.featured ? (
								<Badge className="bg-white text-black">
									{t("events.card.featured")}
								</Badge>
							) : null}
							<Badge
								variant="outline"
								className="border-white/40 text-white"
							>
								{eventTypeLabels[event.type] || event.type}
							</Badge>
							{event.isExternalEvent ? (
								<Badge
									variant="outline"
									className="border-white/40 text-white"
								>
									<ExternalLinkIcon className="h-3 w-3" />
									{t("events.external")}
								</Badge>
							) : null}
						</div>
						<h1 className="font-brand text-2xl font-bold tracking-tight sm:text-3xl">
							{event.title}
						</h1>
						{shortDesc ? (
							<p className="mt-1 text-sm text-white/90">
								{shortDesc}
							</p>
						) : null}
					</div>
				</div>
			) : (
				<div className="space-y-2">
					<div className="flex flex-wrap gap-1.5">
						{event.featured ? (
							<Badge>{t("events.card.featured")}</Badge>
						) : null}
						<Badge variant="outline">
							{eventTypeLabels[event.type] || event.type}
						</Badge>
						{event.isExternalEvent ? (
							<Badge variant="warning">
								<ExternalLinkIcon className="h-3 w-3" />
								{t("events.external")}
							</Badge>
						) : null}
					</div>
					<h1 className="font-brand text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
						{event.title}
					</h1>
					{shortDesc ? (
						<p className="text-sm text-muted-foreground sm:text-base">
							{shortDesc}
						</p>
					) : null}
				</div>
			)}
		</div>
	);
}
