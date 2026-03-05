"use client";

import {
	ArrowLeft,
	Bookmark,
	Contact,
	Heart,
	Info,
	MessageSquare,
	MoreHorizontal,
	ScanLine,
	Share2,
} from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";

import { ManagementButton } from "./ManagementButton";
import { Button } from "@community/ui/ui/button";
import { cn } from "@community/lib-shared/utils";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@community/ui/ui/dropdown-menu";
import type { EventData } from "./types";

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
	onContact?: () => void;
	onFeedback?: () => void;
	onShowSuccessInfo?: () => void;
	canContact?: boolean;
	canFeedback?: boolean;
	hasImportantInfo?: boolean;
	onViewParticipants?: () => void;
}

export function Hero({
	event,
	canCancel,
	onCancel,
	onShare,
	onToggleBookmark,
	onToggleLike,
	isBookmarked,
	isLiked,
	likeCount,
	isEventAdmin,
	eventId,
	onContact,
	onFeedback,
	onShowSuccessInfo,
	canContact,
	canFeedback,
	hasImportantInfo,
}: HeroProps) {
	const t = useTranslations();

	return (
		<nav className="sticky top-0 z-50 flex h-12 items-center justify-between border-b border-border bg-background/95 px-4 backdrop-blur lg:px-8">
			<div className="flex items-center gap-3">
				<Link
					href="/events"
					className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-accent"
					aria-label={t("events.backToEventsList")}
				>
					<ArrowLeft className="h-4 w-4" />
				</Link>
				<span className="max-w-[180px] truncate text-sm font-semibold text-foreground sm:max-w-xs">
					{event.title}
				</span>
			</div>

			<div className="flex items-center gap-1">
				{/* Desktop: Admin buttons */}
				{isEventAdmin ? (
					<>
						<Button
							asChild
							variant="ghost"
							size="sm"
							className="hidden sm:inline-flex lg:hidden"
						>
							<a
								href={`/events/${eventId || event.id}/awards-ceremony`}
							>
								颁奖墙
							</a>
						</Button>
						<ManagementButton
							eventId={eventId || event.id}
							isEventAdmin
							variant="ghost"
							size="sm"
							className="hidden sm:inline-flex lg:hidden"
						/>
					</>
				) : null}

				{/* Desktop: Full action buttons */}
				<div className="hidden lg:flex lg:items-center lg:gap-1">
					<Button
						variant="ghost"
						size="sm"
						className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
						onClick={onToggleLike}
					>
						<Heart
							className={cn(
								"h-3.5 w-3.5",
								isLiked && "fill-current text-foreground",
							)}
						/>
						<span>
							{typeof likeCount === "number"
								? likeCount
								: t("common.like")}
						</span>
					</Button>
					<Button
						variant="ghost"
						size="sm"
						className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
						onClick={onToggleBookmark}
					>
						<Bookmark
							className={cn(
								"h-3.5 w-3.5",
								isBookmarked && "fill-current text-foreground",
							)}
						/>
						<span>{t("common.save")}</span>
					</Button>
					<Button
						variant="ghost"
						size="sm"
						className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
						onClick={onShare}
					>
						<Share2 className="h-3.5 w-3.5" />
						<span>{t("common.share")}</span>
					</Button>

					{/* Desktop: More menu */}
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button
								variant="ghost"
								size="icon"
								className="h-8 w-8"
							>
								<MoreHorizontal className="h-4 w-4" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end" className="w-52">
							{isEventAdmin ? (
								<DropdownMenuItem
									onClick={() =>
										window.location.assign(
											`/events/${eventId || event.id}/manage?scan=1`,
										)
									}
								>
									<ScanLine className="mr-2 h-4 w-4" />
									扫码验票
								</DropdownMenuItem>
							) : null}
							{hasImportantInfo && onShowSuccessInfo ? (
								<DropdownMenuItem onClick={onShowSuccessInfo}>
									<Info className="mr-2 h-4 w-4" />
									查看须知
								</DropdownMenuItem>
							) : null}
							{canContact && onContact ? (
								<DropdownMenuItem onClick={onContact}>
									<Contact className="mr-2 h-4 w-4" />
									联系主办方
								</DropdownMenuItem>
							) : null}
							{canFeedback && onFeedback ? (
								<DropdownMenuItem onClick={onFeedback}>
									<MessageSquare className="mr-2 h-4 w-4" />
									提交反馈
								</DropdownMenuItem>
							) : null}
							{canCancel ? (
								<>
									<DropdownMenuSeparator />
									<DropdownMenuItem
										onClick={onCancel}
										className="text-destructive"
									>
										取消报名
									</DropdownMenuItem>
								</>
							) : null}
						</DropdownMenuContent>
					</DropdownMenu>
				</div>

				{/* Mobile: Compact icon buttons - only like and bookmark, rest in bottom CTA */}
				<div className="flex items-center gap-0.5 lg:hidden">
					<Button
						variant="ghost"
						size="icon"
						className="h-8 w-8 text-muted-foreground hover:text-foreground"
						onClick={onToggleLike}
					>
						<Heart
							className={cn(
								"h-4 w-4",
								isLiked && "fill-current text-foreground",
							)}
						/>
					</Button>
					<Button
						variant="ghost"
						size="icon"
						className="h-8 w-8 text-muted-foreground hover:text-foreground"
						onClick={onToggleBookmark}
					>
						<Bookmark
							className={cn(
								"h-4 w-4",
								isBookmarked && "fill-current text-foreground",
							)}
						/>
					</Button>
				</div>
			</div>
		</nav>
	);
}
