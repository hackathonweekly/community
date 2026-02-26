"use client";

import { Card } from "@community/ui/ui/card";
import Link from "next/link";
import {
	CalendarIcon,
	MapPinIcon,
	SettingsIcon,
	UsersIcon,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import type { EventCardEvent } from "./EventCard";
import { getEventTypeLabel, getStatusStyle } from "./EventCard";
import { formatEventDateShort } from "@/modules/shared/lib/format-event-date";
import { registrationStatusStyles } from "@/modules/shared/lib/badge-styles";

interface EventCardCompactProps {
	event: EventCardEvent;
	/** Registration status badge for "my events" tab */
	registrationStatus?: string;
	/** URL to manage page for "manage" tab */
	manageUrl?: string;
}

export function EventCardCompact({
	event,
	registrationStatus,
	manageUrl,
}: EventCardCompactProps) {
	const t = useTranslations();
	const locale = useLocale();

	const coverImage = event.coverImage || event.photos?.[0]?.imageUrl;

	const venue = event.isOnline
		? t("events.onlineEvent")
		: event.address || t("events.addressTBD");

	const statusStyle = getStatusStyle(event.status);

	return (
		<Card className="group w-full overflow-hidden rounded-2xl border border-border bg-card p-0 shadow-subtle transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift">
			<Link
				href={`/events/${event.shortId || event.id}`}
				className="block min-h-[44px]"
			>
				<div className="flex items-start gap-3 p-3">
					<div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border border-border bg-muted">
						{coverImage ? (
							<img
								src={coverImage}
								alt={event.title}
								className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
							/>
						) : null}
						{event.featured ? (
							<span className="absolute left-0.5 top-0.5 rounded bg-black/80 px-1 py-0.5 text-[8px] font-bold uppercase text-white backdrop-blur">
								Top
							</span>
						) : null}
					</div>

					<div className="min-w-0 flex-1 space-y-1">
						{/* Badges row */}
						<div className="flex flex-wrap items-center gap-1">
							<span className="rounded bg-white/90 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-tight text-foreground/80 border border-border">
								{getEventTypeLabel(event.type, t)}
							</span>
							{statusStyle ? (
								<span
									className={`rounded border px-1.5 py-0.5 text-[10px] font-bold ${statusStyle.className}`}
								>
									{statusStyle.label}
								</span>
							) : null}
							{registrationStatus ? (
								<span
									className={`rounded border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${registrationStatusStyles[registrationStatus] || registrationStatusStyles.CANCELLED}`}
								>
									{registrationStatus}
								</span>
							) : null}
						</div>

						{/* Title */}
						<h3 className="line-clamp-1 font-brand text-sm font-bold leading-tight text-foreground">
							{event.title}
						</h3>

						{/* Meta */}
						<div className="flex items-center gap-3 font-mono text-[11px] text-muted-foreground">
							<span className="flex items-center gap-1">
								<CalendarIcon className="h-3 w-3" />
								<span className="truncate">
									{formatEventDateShort(
										event.startTime,
										locale,
									)}
								</span>
							</span>
							<span className="flex items-center gap-1">
								<MapPinIcon className="h-3 w-3" />
								<span className="truncate max-w-[120px]">
									{venue}
								</span>
							</span>
						</div>

						{/* Footer */}
						<div className="flex items-center justify-between border-t border-border/50 pt-1">
							<span className="truncate text-[10px] font-medium text-muted-foreground">
								{event.organization?.name ||
									event.organizer?.name}
							</span>
							<span className="flex items-center gap-1 font-mono text-[10px] font-bold text-muted-foreground">
								<UsersIcon className="h-3 w-3" />
								{event._count.registrations}
							</span>
						</div>
					</div>
				</div>
			</Link>

			{/* Manage action bar */}
			{manageUrl ? (
				<div className="border-t border-border/50 px-3 py-1.5">
					<Link
						href={manageUrl}
						className="flex items-center justify-center gap-1.5 rounded-md bg-muted px-3 py-1 text-xs font-bold text-foreground transition-colors hover:bg-muted/80"
						onClick={(e) => e.stopPropagation()}
					>
						<SettingsIcon className="h-3 w-3" />
						{t("eventManagement.manage")}
					</Link>
				</div>
			) : null}
		</Card>
	);
}
