"use client";

import { format } from "date-fns";
import { Bookmark, CalendarDays, Heart, MapPin, Share2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { BackToEventsLink } from "@/app/(public)/[locale]/events/[eventId]/components/BackToEventsLink";
import { ManagementButton } from "@/app/(public)/[locale]/events/[eventId]/components/ManagementButton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ParticipantAvatars } from "@/components/ui/participant-avatars";
import { cn } from "@/lib/utils";

import { HeroMeta } from "./common/HeroMeta";
import type { EventData } from "./types";
import { formatTimezoneDisplay, getEventTypeLabels } from "./utils";

interface HeroProps {
	event: EventData;
	locale: string;
	registerLabel: string;
	onRegister: () => void;
	onSubmitWork?: () => void;
	showWorksButton?: boolean;
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
	currentUserId?: string;
	projectSubmissions?: any[];
	isDialogOpen?: boolean;
	onDialogChange?: (open: boolean) => void;
}

export function Hero({
	event,
	locale,
	registerLabel,
	onRegister,
	onSubmitWork,
	showWorksButton = true,
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
	currentUserId,
	projectSubmissions,
	isDialogOpen,
	onDialogChange,
}: HeroProps) {
	const t = useTranslations();
	const eventTypeLabels = getEventTypeLabels(t);
	const timezoneLabel = formatTimezoneDisplay(event.timezone);

	const registrations = event.registrations ?? [];
	const approvedRegs = registrations.filter(
		(reg) => reg.status === "APPROVED",
	);
	const tags = event.tags ?? [];

	return (
		<div className="relative isolate overflow-hidden bg-slate-900 text-white min-h-[400px] flex items-center">
			{/* Background Image with Overlay */}
			<div className="absolute inset-0 z-0">
				{event.coverImage && (
					<div
						className="absolute inset-0 bg-cover bg-center"
						style={{
							backgroundImage: `url(${event.coverImage})`,
						}}
					/>
				)}
				{/* Stronger overlay for mobile readability */}
				<div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/30 backdrop-blur-[2px]" />
			</div>

			<div className="relative container max-w-6xl py-12 space-y-6 z-10">
				<div className="absolute left-4 top-4 sm:left-6 sm:top-6 z-20">
					<BackToEventsLink
						label={t("events.backToEventsList")}
						className="text-white/80 hover:text-white"
					/>
				</div>

				{/* Admin Controls - Keep visible but subtle */}
				{isEventAdmin ? (
					<div className="absolute right-4 top-4 sm:right-6 sm:top-6 flex flex-col items-end gap-2">
						<ManagementButton
							eventId={eventId || event.id}
							isEventAdmin
							variant="secondary"
							size="sm"
							className="bg-white/90 text-indigo-700 border-white/70 hover:bg-white shadow-sm"
						/>
						<Button
							asChild
							variant="secondary"
							size="sm"
							className="bg-white/80 text-indigo-700 border-white/70 hover:bg-white shadow-sm"
						>
							<a
								href={`/${locale}/events/${eventId || event.id}/awards-ceremony`}
							>
								颁奖墙
							</a>
						</Button>
					</div>
				) : null}

				<div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm backdrop-blur-md border border-white/10">
					<span
						className={cn(
							"h-2 w-2 rounded-full",
							event.isOnline ? "bg-emerald-400" : "bg-blue-400",
						)}
					/>
					{event.isOnline ? "线上" : "线下"} ·{" "}
					{eventTypeLabels[event.type] || event.type}
				</div>

				<h1 className="text-3xl font-bold sm:text-4xl md:text-5xl lg:text-6xl leading-tight tracking-tight shadow-md">
					{event.title}
				</h1>

				<div className="flex flex-col items-start gap-4 text-sm sm:text-base text-white/90">
					<div className="flex flex-col items-start gap-3">
						<HeroMeta
							icon={CalendarDays}
							primary={`${format(new Date(event.startTime), "M月d日 HH:mm")} - ${format(new Date(event.endTime), "M月d日 HH:mm")}`}
							secondary={timezoneLabel}
						/>
						<HeroMeta
							icon={MapPin}
							primary={
								event.isOnline
									? "线上"
									: event.address || "待定"
							}
						/>
					</div>

					{/* Participants Avatars */}
					<div className="flex items-center gap-2">
						<ParticipantAvatars
							participants={approvedRegs.map((reg) => ({
								...reg.user,
								status: reg.status,
								registeredAt: reg.registeredAt,
								allowDigitalCardDisplay: (reg as any)
									.allowDigitalCardDisplay,
								user: reg.user,
							}))}
							totalCount={approvedRegs.length}
							eventId={event.id}
							currentUserId={currentUserId}
							showInterestButtons={Boolean(currentUserId)}
							projectSubmissions={projectSubmissions}
							open={isDialogOpen}
							onOpenChange={onDialogChange}
							darkBackground
						/>
					</div>
				</div>

				{tags.length > 0 ? (
					<div className="flex flex-wrap gap-2">
						{tags.map((tag) => (
							<Badge
								key={tag}
								className="bg-white/10 hover:bg-white/20 text-white border-white/20 transition-colors"
							>
								{tag}
							</Badge>
						))}
					</div>
				) : null}

				{/* Buttons Container - HIDDEN on Mobile (md:flex) to avoid dupes with Bottom Bar */}
				<div className="hidden md:flex flex-wrap items-center gap-3 pt-6">
					<Button
						size="lg"
						className="h-12 px-8 text-base font-medium shadow-lg shadow-indigo-500/20"
						onClick={onRegister}
						disabled={registerDisabled}
					>
						{registerLabel}
					</Button>
					{showWorksButton ? (
						<Button
							variant="secondary"
							className="h-12 bg-white/10 text-white border border-white/10 hover:bg-white/20 backdrop-blur-sm"
							onClick={() => {
								if (onSubmitWork) {
									onSubmitWork();
									return;
								}
								window.location.assign(
									`/${locale}/events/${event.id}/submissions`,
								);
							}}
						>
							提交/修改作品
						</Button>
					) : null}
					{canCancel ? (
						<Button
							variant="ghost"
							className="h-12 text-white/70 hover:text-white"
							onClick={onCancel}
						>
							取消报名
						</Button>
					) : null}
					<Button
						variant="ghost"
						className="h-12 text-white/70 hover:text-white"
						onClick={onShare}
					>
						<Share2 className="h-5 w-5 mr-2" />
						分享
					</Button>

					<div className="hidden items-center gap-2 ml-2 border-l border-white/10 pl-4">
						<Button
							variant="ghost"
							size="icon"
							className={cn(
								"h-12 w-12 rounded-full hover:bg-white/10",
								isLiked && "bg-white/10 text-pink-500",
							)}
							onClick={onToggleLike}
							aria-label="点赞"
						>
							<Heart
								className={cn(
									"h-6 w-6",
									isLiked
										? "fill-pink-500 text-pink-500"
										: "text-white/80",
								)}
							/>
						</Button>
						{typeof likeCount === "number" ? (
							<span className="text-sm font-medium">
								{likeCount}
							</span>
						) : null}
						<Button
							variant="ghost"
							size="icon"
							className={cn(
								"h-12 w-12 rounded-full hover:bg-white/10",
								isBookmarked && "bg-white/10 text-yellow-400",
							)}
							onClick={onToggleBookmark}
							aria-label="收藏活动"
						>
							<Bookmark
								className={cn(
									"h-6 w-6",
									isBookmarked
										? "fill-yellow-400 text-yellow-400"
										: "text-white/80",
								)}
							/>
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
}
