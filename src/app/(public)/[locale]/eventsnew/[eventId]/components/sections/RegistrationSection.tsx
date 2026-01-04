"use client";

import { format } from "date-fns";
import {
	CalendarClock,
	CheckCircle2,
	Clock,
	Contact,
	MoreHorizontal,
	QrCode,
	Share2,
	Ticket,
	Timer,
	XCircle,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";

// Remove SectionCard import since we are custom rendering
// import { SectionCard } from "../common/SectionCard";
import type { EventData } from "../types";

type RegistrationSectionProps = {
	event: EventData;
	locale: string;
	existingRegistration?: EventData["registrations"][number] | null;
	registerLabel: string;
	registerDisabled?: boolean;
	onRegister: () => void;
	onCancel?: () => void;
	onShowQR?: () => void;
	onShowShare?: () => void;
	onShowSuccessInfo?: () => void;
	onContact?: () => void;
	onFeedback?: () => void;
	canContact?: boolean;
	canFeedback?: boolean;
	canCancel?: boolean;
	registrationDisabledReason?: string | null;
	isEventEnded?: boolean;
	isRegistrationClosed?: boolean;
	isEventFull?: boolean;
};

export function RegistrationSection({
	event,
	locale,
	existingRegistration,
	onCancel,
	onShowQR,
	onShowShare,
	onShowSuccessInfo,
	onContact,
	onFeedback,
	canContact = true,
	canFeedback = true,
	canCancel,
}: RegistrationSectionProps) {
	// If not registered, hide this section completely.
	// The Hero and Sticky Bottom Bar handle the registration CTA.
	if (!existingRegistration) {
		return null;
	}

	const canShowCountdownTool =
		locale.startsWith("zh") && Boolean(event.isEventAdmin);
	const hasImportantInfo = Boolean(
		event.registrationSuccessInfo ||
			event.registrationSuccessImage ||
			event.registrationPendingInfo ||
			event.registrationPendingImage,
	);

	const getStatusConfig = (status: string) => {
		switch (status) {
			case "APPROVED":
				return {
					icon: CheckCircle2,
					label: "报名成功",
					description: "你已获得入场资格，请准时参加。",
					color: "text-emerald-600",
					bgColor: "bg-emerald-50",
					borderColor: "border-emerald-100",
				};
			case "PENDING":
				return {
					icon: Clock,
					label: "审核中",
					description: "主办方正在审核你的报名信息，请耐心等待。",
					color: "text-amber-600",
					bgColor: "bg-amber-50",
					borderColor: "border-amber-100",
				};
			case "WAITLISTED":
				return {
					icon: Timer,
					label: "候补中",
					description: "目前名额已满，如有空位将优先通知你。",
					color: "text-blue-600",
					bgColor: "bg-blue-50",
					borderColor: "border-blue-100",
				};
			case "REJECTED":
				return {
					icon: XCircle,
					label: "未通过",
					description: "很抱歉，你的报名未通过审核。",
					color: "text-red-600",
					bgColor: "bg-red-50",
					borderColor: "border-red-100",
				};
			case "CANCELLED":
				return {
					icon: XCircle,
					label: "已取消",
					description: "你已取消本次报名。",
					color: "text-slate-500",
					bgColor: "bg-slate-50",
					borderColor: "border-slate-100",
				};
			default:
				return {
					icon: Ticket,
					label: status,
					description: "报名状态更新中",
					color: "text-slate-600",
					bgColor: "bg-slate-50",
					borderColor: "border-slate-100",
				};
		}
	};

	const statusConfig = getStatusConfig(existingRegistration.status);
	const StatusIcon = statusConfig.icon;
	const ticketCode =
		typeof existingRegistration.id === "string" && existingRegistration.id
			? existingRegistration.id.slice(-6).toUpperCase()
			: null;

	return (
		<div id="registration" className="scroll-mt-28">
			<div className="flex items-center justify-between mb-4 px-1">
				<h2 className="text-xl font-bold tracking-tight">我的票夹</h2>
			</div>

			<div
				className={`z-10 relative overflow-hidden rounded-2xl border ${statusConfig.borderColor} ${statusConfig.bgColor} p-6 shadow-sm transition-all group hover:shadow-md`}
			>
				{/* Decorative Background Pattern */}
				<div className="absolute right-[-40px] top-[-40px] opacity-[0.04] pointer-events-none transition-transform group-hover:scale-110 duration-500 will-change-transform">
					<StatusIcon className="h-64 w-64 rotate-[-15deg]" />
				</div>

				{/* Decorative Ticket Stub Circles (CSS Only) */}
				<div className="absolute left-[-10px] top-1/2 -translate-y-1/2 h-5 w-5 rounded-full bg-slate-50 border border-slate-200 z-10" />
				<div className="absolute right-[-10px] top-1/2 -translate-y-1/2 h-5 w-5 rounded-full bg-slate-50 border border-slate-200 z-10" />

				<div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6 z-20">
					{/* Left: Status Info */}
					<div className="flex items-start gap-5">
						<div
							className={`p-4 rounded-full bg-white shadow-sm ring-4 ring-white/50 ${statusConfig.color}`}
						>
							<StatusIcon className="h-10 w-10" />
						</div>
						<div className="space-y-1.5 pt-1">
							<div className="flex items-center gap-3">
								<h3
									className={`text-xl font-bold tracking-tight ${statusConfig.color}`}
								>
									{statusConfig.label}
								</h3>
								{existingRegistration.status === "APPROVED" ? (
									<Badge
										variant="secondary"
										className="bg-white/80 backdrop-blur-sm text-emerald-700 font-normal border-emerald-100"
									>
										Ticket
										{ticketCode ? ` # ${ticketCode}` : ""}
									</Badge>
								) : null}
							</div>
							<p className="text-base text-slate-600 max-w-md font-medium">
								{statusConfig.description}
							</p>
							{event.registrationDeadline && (
								<p className="text-xs text-slate-500 pt-1 flex items-center gap-1.5 font-medium">
									<CalendarClock className="h-3.5 w-3.5" />
									活动时间：
									{format(
										new Date(event.startTime),
										"M月d日 HH:mm",
									)}
								</p>
							)}
						</div>
					</div>

					{/* Right: Actions */}
					<div className="hidden md:flex flex-col sm:flex-row gap-3 min-w-[200px] w-full sm:w-auto">
						{existingRegistration.status === "APPROVED" &&
						onShowQR ? (
							<Button
								size="lg"
								className="w-full sm:w-auto bg-white hover:bg-slate-50 text-black border border-slate-200 shadow-sm min-w-[140px] font-medium"
								onClick={onShowQR}
							>
								<QrCode className="mr-2 h-5 w-5" />
								出示签到码
							</Button>
						) : null}

						<div className="flex gap-2 w-full sm:w-auto">
							{hasImportantInfo && (
								<Button
									variant="outline"
									size="lg"
									className="flex-1 sm:flex-none border-slate-200 hover:bg-white hover:border-slate-300 bg-white/50 backdrop-blur-sm"
									onClick={onShowSuccessInfo}
								>
									报名须知
								</Button>
							)}
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button
										variant="outline"
										size="icon"
										className="h-11 w-11 shrink-0 border-slate-200 hover:bg-white hover:border-slate-300 bg-white/50 backdrop-blur-sm"
									>
										<MoreHorizontal className="h-5 w-5 text-slate-600" />
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent
									align="end"
									className="w-48"
								>
									{onShowShare && (
										<DropdownMenuItem
											onClick={onShowShare}
											className="py-2.5"
										>
											<Share2 className="mr-2 h-4 w-4" />
											分享活动
										</DropdownMenuItem>
									)}
									{canContact && onContact && (
										<DropdownMenuItem
											onClick={onContact}
											className="py-2.5"
										>
											<Contact className="mr-2 h-4 w-4" />
											联系主办方
										</DropdownMenuItem>
									)}
									{canFeedback && onFeedback && (
										<DropdownMenuItem
											onClick={onFeedback}
											className="py-2.5"
										>
											📝 提交反馈
										</DropdownMenuItem>
									)}
									{canShowCountdownTool && (
										<DropdownMenuItem
											asChild
											className="py-2.5"
										>
											<a
												href={`/${locale}/events/${event.id}/countdown`}
												target="_blank"
												rel="noopener noreferrer"
											>
												<Timer className="mr-2 h-4 w-4" />
												倒计时
											</a>
										</DropdownMenuItem>
									)}
									{canCancel && onCancel && (
										<>
											<Separator className="my-1" />
											<DropdownMenuItem
												className="py-2.5 text-red-600 focus:text-red-700 focus:bg-red-50"
												onClick={onCancel}
											>
												取消报名
											</DropdownMenuItem>
										</>
									)}
								</DropdownMenuContent>
							</DropdownMenu>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
