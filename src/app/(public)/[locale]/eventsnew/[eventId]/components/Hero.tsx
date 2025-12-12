"use client";

import { format } from "date-fns";
import { Bookmark, CalendarDays, Heart, MapPin, Share2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { ManagementButton } from "@/app/(public)/[locale]/events/[eventId]/components/ManagementButton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { HeroMeta } from "./common/HeroMeta";
import { getEventTypeLabels, formatTimezoneDisplay } from "./utils";
import type { EventData } from "./types";

interface HeroProps {
	event: EventData;
	locale: string;
	registerLabel: string;
	onRegister: () => void;
	canCancel: boolean;
	onCancel: () => void;
	onShare: () => void;
	onToggleBookmark: () => void;
	onToggleLike: () => void;
	isBookmarked?: boolean;
	isLiked?: boolean;
	likeCount?: number;
	registerDisabled?: boolean;
	isEventAdmin?: boolean;
	eventId?: string;
}

export function Hero({
	event,
	locale,
	registerLabel,
	onRegister,
	canCancel,
	onCancel,
	onShare,
	onToggleBookmark,
	onToggleLike,
	isBookmarked,
	isLiked,
	likeCount,
	registerDisabled,
	isEventAdmin,
	eventId,
}: HeroProps) {
	const eventTypeLabels = getEventTypeLabels(useTranslations());
	const timezoneLabel = formatTimezoneDisplay(event.timezone);

	return (
		<div className="relative isolate overflow-hidden bg-gradient-to-r from-indigo-600 to-purple-700 text-white">
			<div
				className="absolute inset-0 opacity-40"
				style={{
					backgroundImage: event.coverImage
						? `url(${event.coverImage})`
						: undefined,
					backgroundSize: "cover",
					backgroundPosition: "center",
					filter: "blur(2px)",
					transform: "scale(1.05)",
				}}
			/>
			<div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/40 to-transparent" />
			<div className="relative container max-w-6xl py-12 space-y-4">
				{isEventAdmin ? (
					<div className="absolute right-4 top-4 sm:right-6 sm:top-6">
						<ManagementButton
							eventId={eventId || event.id}
							isEventAdmin
							variant="secondary"
							size="sm"
							className="bg-white/90 text-indigo-700 border-white/70 hover:bg-white shadow-sm"
						/>
					</div>
				) : null}
				<div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm">
					<span className="h-2 w-2 rounded-full bg-emerald-400" />
					{event.isOnline ? "线上" : "线下"} ·{" "}
					{eventTypeLabels[event.type] || event.type}
				</div>
				<h1 className="text-3xl font-bold sm:text-4xl md:text-5xl">
					{event.title}
				</h1>
				<div className="flex flex-wrap gap-2 text-sm text-white/90">
					<HeroMeta
						icon={CalendarDays}
						primary={`${format(new Date(event.startTime), "M月d日 HH:mm")} - ${format(new Date(event.endTime), "M月d日 HH:mm")}`}
						secondary={timezoneLabel}
					/>
					<HeroMeta
						icon={MapPin}
						primary={
							event.isOnline ? "线上" : event.address || "待定"
						}
					/>
				</div>
				{(event.tags || []).length > 0 ? (
					<div className="flex flex-wrap gap-2">
						{event.tags.map((tag) => (
							<Badge key={tag} className="bg-white/20 text-white">
								{tag}
							</Badge>
						))}
					</div>
				) : null}
				<div className="flex flex-wrap items-center gap-3 pt-2">
					<Button
						size="lg"
						className="h-11 px-6"
						onClick={onRegister}
						disabled={registerDisabled}
					>
						{registerLabel}
					</Button>
					<Button
						variant="secondary"
						className="h-11 bg-white text-indigo-700 hover:bg-white/90"
					>
						<a href={`/${locale}/events/${event.id}/submissions`}>
							提交/修改作品
						</a>
					</Button>
					{canCancel ? (
						<Button
							variant="ghost"
							className="h-11 text-white/90 hover:text-white"
							onClick={onCancel}
						>
							取消报名
						</Button>
					) : null}
					<Button
						variant="ghost"
						className="h-11 text-white/90 hover:text-white"
						onClick={onShare}
					>
						<Share2 className="h-4 w-4 mr-2" />
						分享
					</Button>
					<div className="flex items-center gap-2">
						<Button
							variant="ghost"
							size="icon"
							className={cn(
								"h-11 w-11 text-white/90 hover:text-white",
								isLiked && "bg-white/10",
							)}
							onClick={onToggleLike}
							aria-label="点赞"
						>
							<Heart
								className={cn(
									"h-5 w-5",
									isLiked ? "fill-white text-white" : "",
								)}
							/>
						</Button>
						{typeof likeCount === "number" ? (
							<span className="text-sm text-white/80">
								{likeCount}
							</span>
						) : null}
						<Button
							variant="ghost"
							size="icon"
							className={cn(
								"h-11 w-11 text-white/90 hover:text-white",
								isBookmarked && "bg-white/10",
							)}
							onClick={onToggleBookmark}
							aria-label="收藏活动"
						>
							<Bookmark
								className={cn(
									"h-5 w-5",
									isBookmarked ? "fill-white text-white" : "",
								)}
							/>
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
}
