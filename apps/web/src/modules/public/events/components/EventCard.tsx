"use client";

import { Card } from "@community/ui/ui/card";
import { SettingsIcon, UsersIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { formatEventDateShort } from "@/modules/shared/lib/format-event-date";
import { registrationStatusStyles } from "@/modules/shared/lib/badge-styles";

export interface EventCardEvent {
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
	photos?: Array<{
		id: string;
		imageUrl: string;
		caption?: string;
	}>;
	tags: string[];
	featured: boolean;
	viewCount: number;
	createdAt: string;
	organizer?: {
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

interface EventCardProps {
	event: EventCardEvent;
	/** Registration status badge for "my events" tab */
	registrationStatus?: string;
	/** URL to manage page for "manage" tab */
	manageUrl?: string;
}

export function getEventTypeLabel(value: string, t: (key: string) => string) {
	const typeLabels: Record<string, string> = {
		MEETUP: t("events.types.meetup"),
		HACKATHON: t("events.types.hackathon"),
	};
	return typeLabels[value] || value;
}

export function getStatusStyle(
	status: string,
): { label: string; className: string } | null {
	const map: Record<string, { label: string; className: string }> = {
		ONGOING: {
			label: "Live",
			className: "text-green-600 bg-green-50 border-green-100",
		},
		REGISTRATION_CLOSED: {
			label: "Closed",
			className: "text-orange-600 bg-orange-50 border-orange-100",
		},
		COMPLETED: {
			label: "Ended",
			className: "text-muted-foreground bg-muted border-border",
		},
		CANCELLED: {
			label: "Cancelled",
			className:
				"text-destructive bg-destructive/10 border-destructive/30",
		},
	};
	return map[status] ?? null;
}

export function EventCard({
	event,
	registrationStatus,
	manageUrl,
}: EventCardProps) {
	const t = useTranslations();
	const locale = useLocale();

	const coverImage = event.coverImage || event.photos?.[0]?.imageUrl;

	const venue = event.isOnline
		? t("events.onlineEvent")
		: event.address || t("events.addressTBD");

	const statusStyle = getStatusStyle(event.status);

	return (
		<Card
			className="group w-full cursor-pointer overflow-hidden rounded-2xl border border-border bg-card p-0 shadow-subtle transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift"
			tabIndex={0}
			role="article"
			aria-label={`${event.title} - ${getEventTypeLabel(event.type, t)}`}
		>
			<Link
				href={`/events/${event.shortId || event.id}`}
				className="flex min-h-[44px] flex-col"
			>
				{/* Cover image */}
				<div className="relative h-32 overflow-hidden border-b border-border/50 bg-muted">
					{coverImage ? (
						<img
							src={coverImage}
							alt={event.title}
							className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
						/>
					) : (
						<div className="h-full w-full bg-muted" />
					)}
					{/* Type badge - bottom left */}
					<div className="absolute bottom-2 left-2 rounded bg-white/90 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-tight text-foreground/80 shadow-sm backdrop-blur border border-border">
						{getEventTypeLabel(event.type, t)}
					</div>
					{/* Featured badge - top left */}
					{event.featured ? (
						<div className="absolute left-2 top-2">
							<span className="rounded-md bg-black/80 px-2 py-0.5 text-[10px] font-bold uppercase tracking-tight text-white shadow-sm backdrop-blur border border-white/10">
								{t("events.featured")}
							</span>
						</div>
					) : null}
					{/* Registration status badge - top right */}
					{registrationStatus ? (
						<span
							className={`absolute right-2 top-2 shrink-0 rounded border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${registrationStatusStyles[registrationStatus] || registrationStatusStyles.CANCELLED}`}
						>
							{registrationStatus}
						</span>
					) : null}
				</div>

				{/* Content */}
				<div className="flex flex-1 flex-col p-3">
					{/* Title + status */}
					<div className="mb-1 flex items-start justify-between gap-2">
						<h3 className="line-clamp-1 font-brand text-base font-bold leading-tight text-foreground transition-colors group-hover:text-foreground/70">
							{event.title}
						</h3>
						{statusStyle ? (
							<span
								className={`shrink-0 rounded border px-1.5 py-0.5 text-[10px] font-bold ${statusStyle.className}`}
							>
								{statusStyle.label}
							</span>
						) : null}
					</div>

					{/* Date + location */}
					<div className="mb-2 text-[11px] font-mono text-muted-foreground">
						{formatEventDateShort(event.startTime, locale)} ·{" "}
						{venue}
					</div>

					{/* Footer */}
					<div className="mt-auto flex items-center justify-between border-t border-border/50 pt-2">
						<span className="truncate text-[10px] font-medium text-muted-foreground">
							{event.organization?.name || event.organizer?.name}
						</span>
						<div className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground">
							<UsersIcon className="h-3 w-3" />
							{event._count.registrations}
						</div>
					</div>
				</div>
			</Link>

			{/* Manage action bar */}
			{manageUrl ? (
				<div className="border-t border-border/50 px-3 py-2">
					<Link
						href={manageUrl}
						className="flex items-center justify-center gap-1.5 rounded-md bg-muted px-3 py-1.5 text-xs font-bold text-foreground transition-colors hover:bg-muted/80"
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
