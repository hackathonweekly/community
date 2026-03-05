"use client";

import { format } from "date-fns";
import { enUS, zhCN } from "date-fns/locale";
import {
	Bookmark,
	Calendar,
	Contact,
	Heart,
	Info,
	LayoutDashboard,
	MapPin,
	MessageSquare,
	Monitor,
	MoreHorizontal,
	ScanLine,
	Share2,
	Trophy,
} from "lucide-react";

import { Button } from "@community/ui/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@community/ui/ui/dropdown-menu";
import { cn } from "@community/lib-shared/utils";
import type { EventData } from "./types";

interface EventActionSidebarProps {
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
}

function formatDateRange(start: string, end: string, locale: string) {
	const s = new Date(start);
	const e = new Date(end);
	const loc = locale === "zh" ? zhCN : enUS;
	if (locale === "zh") {
		return `${format(s, "M月d日 HH:mm", { locale: loc })} – ${format(e, "M月d日 HH:mm", { locale: loc })}`;
	}
	return `${format(s, "MMM d, HH:mm", { locale: loc })} – ${format(e, "MMM d, HH:mm", { locale: loc })}`;
}

export function EventActionSidebar({
	event,
	locale,
	registerLabel,
	onRegister,
	onSubmitWork,
	showWorksButton,
	canCancel,
	onCancel,
	onShare,
	onToggleBookmark,
	onToggleLike,
	isBookmarked,
	isLiked,
	registerDisabled,
	isEventAdmin,
	eventId,
	onContact,
	onFeedback,
	onShowSuccessInfo,
	canContact,
	canFeedback,
	hasImportantInfo,
}: EventActionSidebarProps) {
	return (
		<div className="flex flex-col gap-3">
			<div className="rounded-lg border border-border bg-card p-4 shadow-subtle">
				{/* Date & Location */}
				<div className="mb-4 space-y-3">
					<div className="flex items-start gap-2.5">
						<Calendar className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
						<div className="text-sm text-foreground">
							{formatDateRange(
								event.startTime,
								event.endTime,
								locale,
							)}
						</div>
					</div>
					<div className="flex items-start gap-2.5">
						{event.isOnline ? (
							<Monitor className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
						) : (
							<MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
						)}
						<div className="text-sm text-foreground">
							{event.isOnline
								? "线上活动"
								: event.address || "地点待定"}
						</div>
					</div>
				</div>

				<div className="h-px bg-border" />

				{/* Actions */}
				<div className="mt-4 space-y-2">
					<Button
						className="w-full font-bold"
						onClick={onRegister}
						disabled={registerDisabled}
					>
						{registerLabel}
					</Button>

					{showWorksButton ? (
						<Button
							variant="outline"
							className="w-full"
							onClick={() => {
								if (onSubmitWork) {
									onSubmitWork();
									return;
								}
								window.location.assign(
									`/events/${event.shortId || event.id}/submissions`,
								);
							}}
						>
							提交/修改作品
						</Button>
					) : null}
				</div>

				<div className="my-3 h-px bg-border" />

				<div className="flex items-center justify-between">
					<div className="flex items-center gap-1">
						<Button
							variant="ghost"
							size="icon"
							className="h-8 w-8"
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
							className="h-8 w-8"
							onClick={onToggleBookmark}
						>
							<Bookmark
								className={cn(
									"h-4 w-4",
									isBookmarked &&
										"fill-current text-foreground",
								)}
							/>
						</Button>
						<Button
							variant="ghost"
							size="icon"
							className="h-8 w-8"
							onClick={onShare}
						>
							<Share2 className="h-4 w-4" />
						</Button>
					</div>

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
			</div>

			{isEventAdmin ? (
				<div className="rounded-lg border border-border bg-card p-3 shadow-subtle">
					<h4 className="mb-2 font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
						Management
					</h4>
					<div className="grid grid-cols-2 gap-2">
						<Button
							variant="outline"
							size="sm"
							asChild
							className="w-full"
						>
							<a href={`/events/${eventId || event.id}/manage`}>
								<LayoutDashboard className="mr-1 h-3.5 w-3.5" />
								后台管理
							</a>
						</Button>
						<Button
							variant="outline"
							size="sm"
							asChild
							className="w-full"
						>
							<a
								href={`/events/${eventId || event.id}/awards-ceremony`}
							>
								<Trophy className="mr-1 h-3.5 w-3.5" />
								颁奖模式
							</a>
						</Button>
					</div>
				</div>
			) : null}
		</div>
	);
}
